import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameRoom, PlayerRole, Vector3D } from '../types/game';
import { getMapById, buildMapEnvironment } from '../game/maps';
import { createOperativeModel } from '../game/character';
import { FirstPersonController } from '../game/FirstPersonControls';
import { BotAI } from '../game/botAI';
import { sound } from '../services/sound';
import { localRelay } from '../services/multiplayer';

interface GameCanvas3DProps {
  room: GameRoom;
  myPlayerId: string;
  myRole: PlayerRole;
  onTagSuccess: () => void;
  onDistanceUpdate: (distMeters: number) => void;
  onStealthUpdate: (stealthPct: number) => void;
  onFlashlightChange: (isOn: boolean) => void;
  sonarTrigger: number; // Increment to trigger sonar pulse
}

// Module-scope reusable math helpers
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export const GameCanvas3D: React.FC<GameCanvas3DProps> = ({
  room,
  myPlayerId,
  myRole,
  onTagSuccess,
  onDistanceUpdate,
  onStealthUpdate,
  onFlashlightChange,
  sonarTrigger
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<FirstPersonController | null>(null);
  const opponentMeshRef = useRef<THREE.Group | null>(null);
  const botAiRef = useRef<BotAI | null>(null);

  const opponentTargetPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const opponentTargetRotY = useRef<number>(0);
  const opponentTargetPitch = useRef<number>(0);

  const [mapData] = useState(() => getMapById(room.selectedMapId));

  // Sonar Trigger effect from HUD
  useEffect(() => {
    if (sonarTrigger > 0 && controllerRef.current) {
      const myPos = controllerRef.current.position;
      const oppPos = opponentTargetPos.current;
      const dist = myPos.distanceTo(oppPos);
      sound.playSonarPing(dist);
      onDistanceUpdate(dist);
    }
  }, [sonarTrigger, onDistanceUpdate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as mandated
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mapData.skyColor);
    scene.fog = new THREE.FogExp2(mapData.fogColor, mapData.fogDensity);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(mapData.ambientColor, 0x080b12, mapData.ambientIntensity);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(mapData.keyLightColor, mapData.keyLightIntensity);
    keyLight.position.set(15, 25, 15);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // 4. Build Procedural Map Environment & Collisions
    const { collisionBoxes, hidingSpots } = buildMapEnvironment(scene, mapData);

    // 5. Initialize First Person Controller
    const spawnPos = myRole === 'hider' ? mapData.hiderSpawn : mapData.seekerSpawn;
    const controller = new FirstPersonController(camera, renderer.domElement, spawnPos);
    controller.setCollisionBoxes(collisionBoxes);
    controllerRef.current = controller;

    // Action Callback: Tag attempt or Sonar Ping
    controller.setActionCallback(() => {
      const myPos = controller.position;
      const oppPos = opponentTargetPos.current;
      const dist = myPos.distanceTo(oppPos);

      if (myRole === 'seeker') {
        // Tag attempt
        if (dist <= 4.2 && room.phase === 'seeking') {
          sound.playTagHit();
          onTagSuccess();
        } else {
          // Sonar Ping scan
          sound.playSonarPing(dist);
          onDistanceUpdate(dist);
        }
      } else {
        // Hider: Check proximity or blend in
        sound.playSonarPing(dist);
        onDistanceUpdate(dist);
      }
    });

    // 6. Spawn Opponent 3D Character Model
    const opponentRole: PlayerRole = myRole === 'hider' ? 'seeker' : 'hider';
    const opponentModel = createOperativeModel(opponentRole);
    const oppSpawn = opponentRole === 'hider' ? mapData.hiderSpawn : mapData.seekerSpawn;
    opponentModel.position.set(oppSpawn.x, oppSpawn.y, oppSpawn.z);
    scene.add(opponentModel);
    opponentMeshRef.current = opponentModel;
    opponentTargetPos.current.set(oppSpawn.x, oppSpawn.y, oppSpawn.z);

    // If Solo Bot match: initialize Bot AI
    if (room.isSoloBotMatch) {
      botAiRef.current = new BotAI(opponentRole, mapData);
    }

    // 7. Subscribe to Opponent Movement Broadcasts
    const unsubscribeMoves = localRelay.subscribe(
      room.code,
      () => {},
      (pId, pos, rotY, pitch, isCrouched, isFlashlight) => {
        if (pId !== myPlayerId) {
          opponentTargetPos.current.set(pos.x, pos.y, pos.z);
          opponentTargetRotY.current = rotY;
          opponentTargetPitch.current = pitch;

          if (opponentMeshRef.current) {
            opponentMeshRef.current.scale.set(1, isCrouched ? 0.75 : 1, 1);
          }
        }
      }
    );

    // 8. Animation & Game Loop
    let animId = 0;
    let lastTime = performance.now();
    let broadcastTimer = 0;
    let heartbeatCooldown = 0;

    const clock = new THREE.Clock();

    const tick = () => {
      const now = performance.now();
      const dt = clock.getDelta();

      // Update First Person Physics
      controller.update(dt);
      onFlashlightChange(controller.isFlashlightOn);

      // Solo Bot Logic
      if (room.isSoloBotMatch && botAiRef.current) {
        botAiRef.current.update(
          dt,
          room.phase,
          controller.position,
          () => {
            // Bot seeker tagged player hider!
            sound.playTagHit();
            onTagSuccess();
          },
          (pingDist) => {
            sound.playSonarPing(pingDist);
          }
        );

        opponentTargetPos.current.copy(botAiRef.current.position);
        opponentTargetRotY.current = botAiRef.current.rotationY;
      }

      // Smoothly interpolate Opponent 3D Model position & yaw
      if (opponentMeshRef.current) {
        opponentMeshRef.current.position.lerp(opponentTargetPos.current, 14 * dt);
        opponentMeshRef.current.rotation.y = THREE.MathUtils.damp(
          opponentMeshRef.current.rotation.y,
          opponentTargetRotY.current,
          12,
          dt
        );
      }

      // Proximity & Stealth evaluation
      const distToOpponent = controller.position.distanceTo(opponentTargetPos.current);
      onDistanceUpdate(distToOpponent);

      // Stealth level calculation (0 to 100%)
      if (myRole === 'hider') {
        let stealth = controller.isCrouched ? 70 : 40;
        if (!controller.isFlashlightOn) stealth += 20;

        // Check if inside any hiding spot
        for (const spot of hidingSpots) {
          _v1.set(spot.position.x, 0, spot.position.z);
          if (controller.position.distanceTo(_v1) < 2.5) {
            stealth = Math.min(100, stealth + Math.round(spot.stealthBonus * 35));
            break;
          }
        }
        onStealthUpdate(stealth);

        // Heartbeat warning if Seeker is very close (< 8 meters)
        heartbeatCooldown -= dt;
        if (distToOpponent < 8.0 && heartbeatCooldown <= 0) {
          sound.playHeartbeat();
          heartbeatCooldown = Math.max(0.4, distToOpponent * 0.15); // Faster pulse when closer
        }
      }

      // Broadcast position to peer/Firestore at 20 Hz (every 50ms)
      broadcastTimer += dt;
      if (broadcastTimer >= 0.05) {
        broadcastTimer = 0;
        localRelay.broadcastPos(
          room.code,
          myPlayerId,
          { x: controller.position.x, y: controller.position.y, z: controller.position.z },
          controller.yaw,
          controller.pitch,
          controller.isCrouched,
          controller.isFlashlightOn
        );
      }

      // Render frame
      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      unsubscribeMoves();
      controller.destroy();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mapData, myRole, myPlayerId, room.code, room.isSoloBotMatch, room.phase, onTagSuccess, onDistanceUpdate, onStealthUpdate, onFlashlightChange]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black cursor-crosshair">
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
