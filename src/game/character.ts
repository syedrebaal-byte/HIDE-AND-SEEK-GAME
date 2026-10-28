import * as THREE from 'three';
import { PlayerRole } from '../types/game';

/**
 * Creates a composite 3D Tactical Operative model as a THREE.Group (3–12 parts)
 * across three silhouette scales:
 * 1. Primary silhouette: Torso, pelvis, head
 * 2. Secondary read: Helmet, visor, tactical backpack, limb segments
 * 3. Accent detail: Glowing antenna node, shoulder pads, boots
 */
export function createOperativeModel(role: PlayerRole = 'hider'): THREE.Group {
  const root = new THREE.Group();

  const isHider = role === 'hider';
  const primaryColor = isHider ? 0x1e293b : 0x0f172a;
  const accentColor = isHider ? 0x10b981 : 0x06b6d4; // Emerald vs Cyan
  const visorColor = isHider ? 0x34d399 : 0x38bdf8;

  // Materials with physical roughness/metalness differences
  const armorMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.35,
    metalness: 0.75
  });

  const suitMat = new THREE.MeshStandardMaterial({
    color: 0x0f1117,
    roughness: 0.8,
    metalness: 0.15
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.3,
    metalness: 0.85
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: visorColor,
    emissive: visorColor,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    metalness: 0.9
  });

  // 1. Torso & Chest Rig
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.75, 0.45);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  // Chest plate accent
  const chestPlateGeo = new THREE.BoxGeometry(0.55, 0.4, 0.08);
  const chestPlate = new THREE.Mesh(chestPlateGeo, accentMat);
  chestPlate.position.set(0, 1.25, 0.24);
  root.add(chestPlate);

  // 2. Head & Tactical Helmet
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.72, 0);

  const helmetGeo = new THREE.BoxGeometry(0.42, 0.44, 0.44);
  const helmet = new THREE.Mesh(helmetGeo, armorMat);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Glowing Cyber Visor
  const visorGeo = new THREE.BoxGeometry(0.36, 0.12, 0.1);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.02, 0.23);
  headGroup.add(visor);

  root.add(headGroup);

  // 3. Tactical Backpack with Comm Beacon
  const packGeo = new THREE.BoxGeometry(0.5, 0.6, 0.22);
  const pack = new THREE.Mesh(packGeo, armorMat);
  pack.position.set(0, 1.2, -0.32);
  pack.castShadow = true;
  root.add(pack);

  // Glowing backpack node / antenna
  const beaconGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
  const beacon = new THREE.Mesh(beaconGeo, visorMat);
  beacon.position.set(0.16, 1.62, -0.32);
  root.add(beacon);

  // 4. Arms & Shoulders
  const shoulderGeo = new THREE.BoxGeometry(0.24, 0.22, 0.28);
  const leftShoulder = new THREE.Mesh(shoulderGeo, accentMat);
  leftShoulder.position.set(-0.48, 1.38, 0);
  root.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, accentMat);
  rightShoulder.position.set(0.48, 1.38, 0);
  root.add(rightShoulder);

  const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.48, 0.95, 0);
  leftArm.castShadow = true;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, suitMat);
  rightArm.position.set(0.48, 0.95, 0);
  rightArm.castShadow = true;
  root.add(rightArm);

  // 5. Legs & Boots
  const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.26);
  const leftLeg = new THREE.Mesh(legGeo, suitMat);
  leftLeg.position.set(-0.2, 0.42, 0);
  leftLeg.castShadow = true;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, suitMat);
  rightLeg.position.set(0.2, 0.42, 0);
  rightLeg.castShadow = true;
  root.add(rightLeg);

  // Armored Boots
  const bootGeo = new THREE.BoxGeometry(0.26, 0.2, 0.35);
  const leftBoot = new THREE.Mesh(bootGeo, armorMat);
  leftBoot.position.set(-0.2, 0.1, 0.05);
  root.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, armorMat);
  rightBoot.position.set(0.2, 0.1, 0.05);
  root.add(rightBoot);

  // 6. Ground Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.65, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  // Name Tag / Role Beacon Billboard
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.roundRect(4, 4, 248, 56, 12);
  ctx.fill();
  ctx.strokeStyle = isHider ? '#10b981' : '#06b6d4';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isHider ? 'TARGET (HIDER)' : 'HUNTER (SEEKER)', 128, 32);

  const nameTexture = new THREE.CanvasTexture(canvas);
  const tagMat = new THREE.SpriteMaterial({ map: nameTexture, transparent: true });
  const nameSprite = new THREE.Sprite(tagMat);
  nameSprite.position.set(0, 2.3, 0);
  nameSprite.scale.set(1.5, 0.4, 1);
  nameSprite.name = 'nameTag';
  root.add(nameSprite);

  return root;
}
