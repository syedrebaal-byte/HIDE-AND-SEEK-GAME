import * as THREE from 'three';
import { PlayerRole, Vector3D, MapData, GamePhase } from '../types/game';

export class BotAI {
  public position: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;
  public pitch: number = 0;
  public role: PlayerRole;
  public isCrouched: boolean = false;
  public isSprinting: boolean = false;
  public isFlashlightOn: boolean = true;

  private targetWaypoint: THREE.Vector3 = new THREE.Vector3();
  private waypoints: THREE.Vector3[] = [];
  private currentWaypointIdx: number = 0;
  private stateTimer: number = 0;
  private scanCooldown: number = 0;

  constructor(role: PlayerRole, mapData: MapData) {
    this.role = role;

    if (role === 'hider') {
      this.position.set(mapData.hiderSpawn.x, mapData.hiderSpawn.y, mapData.hiderSpawn.z);
      // Pick a hiding spot
      if (mapData.hidingSpots.length > 0) {
        const spot = mapData.hidingSpots[Math.floor(Math.random() * mapData.hidingSpots.length)];
        this.targetWaypoint.set(spot.position.x, 0.9, spot.position.z);
      } else {
        this.targetWaypoint.set(12, 0.9, -10);
      }
    } else {
      this.position.set(mapData.seekerSpawn.x, mapData.seekerSpawn.y, mapData.seekerSpawn.z);
      // Waypoints to patrol
      this.waypoints = [
        new THREE.Vector3(0, 1.6, 0),
        new THREE.Vector3(12, 1.6, -10),
        new THREE.Vector3(-12, 1.6, 12),
        new THREE.Vector3(15, 1.6, 15),
        new THREE.Vector3(-15, 1.6, -15)
      ];
      this.targetWaypoint.copy(this.waypoints[0]);
    }
  }

  public update(
    dt: number,
    phase: GamePhase,
    opponentPos: THREE.Vector3,
    onBotTagOpponent?: () => void,
    onBotPing?: (distance: number) => void
  ) {
    this.stateTimer += dt;
    this.scanCooldown -= dt;

    if (this.role === 'hider') {
      this.updateHiderBehavior(dt, opponentPos);
    } else {
      this.updateSeekerBehavior(dt, phase, opponentPos, onBotTagOpponent, onBotPing);
    }
  }

  // AI Hider behavior: sprint to hiding spot, crouch, freeze
  private updateHiderBehavior(dt: number, opponentPos: THREE.Vector3) {
    const distToSpot = this.position.distanceTo(this.targetWaypoint);

    if (distToSpot > 1.2) {
      // Running to hide spot
      this.isSprinting = true;
      this.isCrouched = false;
      this.isFlashlightOn = false;

      const dir = new THREE.Vector3().subVectors(this.targetWaypoint, this.position).normalize();
      this.rotationY = Math.atan2(-dir.x, -dir.z);

      this.position.x += dir.x * 6.5 * dt;
      this.position.z += dir.z * 6.5 * dt;
    } else {
      // Arrived at spot: duck down and freeze
      this.isSprinting = false;
      this.isCrouched = true;
      this.isFlashlightOn = false;

      // Rotate away from center to face wall/blind spot
      this.rotationY = Math.PI / 4;
    }
  }

  // AI Seeker behavior: patrols waypoints, pings radar, chases player if spotted
  private updateSeekerBehavior(
    dt: number,
    phase: GamePhase,
    opponentPos: THREE.Vector3,
    onBotTagOpponent?: () => void,
    onBotPing?: (dist: number) => void
  ) {
    if (phase === 'hiding_countdown') {
      // Seeker is held in spawn during countdown
      return;
    }

    const distToOpponent = this.position.distanceTo(opponentPos);

    // Periodic radar ping
    if (this.scanCooldown <= 0) {
      this.scanCooldown = 8.0;
      onBotPing?.(distToOpponent);
    }

    // Direct sight/chase check
    if (distToOpponent < 14) {
      // In range: pursue directly
      const dir = new THREE.Vector3().subVectors(opponentPos, this.position).normalize();
      this.rotationY = Math.atan2(-dir.x, -dir.z);

      this.isSprinting = true;
      this.position.x += dir.x * 6.8 * dt;
      this.position.z += dir.z * 6.8 * dt;

      // If close enough: tag player!
      if (distToOpponent < 3.2) {
        onBotTagOpponent?.();
      }
    } else {
      // Normal Patrol between waypoints
      this.isSprinting = false;
      const distToWp = this.position.distanceTo(this.targetWaypoint);

      if (distToWp < 2.0) {
        this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
        this.targetWaypoint.copy(this.waypoints[this.currentWaypointIdx]);
      }

      const dir = new THREE.Vector3().subVectors(this.targetWaypoint, this.position).normalize();
      this.rotationY = Math.atan2(-dir.x, -dir.z);

      this.position.x += dir.x * 4.2 * dt;
      this.position.z += dir.z * 4.2 * dt;
    }
  }
}
