import * as THREE from 'three';
import { CollisionBox, Vector3D } from '../types/game';
import { sound } from '../services/sound';

export interface ControlsInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
  action: boolean; // E or Click (Sonar Ping / Spot)
}

export class FirstPersonController {
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;

  // Position and Physics
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.6, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0;
  public pitch: number = 0;

  public isGrounded: boolean = true;
  public isCrouched: boolean = false;
  public isSprinting: boolean = false;
  public isFlashlightOn: boolean = true;

  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;

  private headBobTimer: number = 0;
  private currentEyeHeight: number = 1.6;
  private readonly standingEyeHeight = 1.6;
  private readonly crouchedEyeHeight = 0.9;
  private readonly playerRadius = 0.45;

  private collisionBoxes: CollisionBox[] = [];

  // Input states
  public input: ControlsInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false,
    action: false
  };

  private isPointerLocked: boolean = false;
  private onActionCallback?: () => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, initialPos: Vector3D) {
    this.camera = camera;
    this.domElement = domElement;
    this.position.set(initialPos.x, initialPos.y, initialPos.z);
    this.camera.position.copy(this.position);

    // Setup Flashlight
    this.flashlight = new THREE.SpotLight(0xffffff, 4, 30, Math.PI / 6, 0.4, 1.2);
    this.flashlight.castShadow = true;
    this.flashlight.position.set(0, 0, 0);

    this.flashlightTarget = new THREE.Object3D();
    this.flashlight.target = this.flashlightTarget;

    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlightTarget.position.set(0, 0, -5);

    this.setupEventListeners();
  }

  public setCollisionBoxes(boxes: CollisionBox[]) {
    this.collisionBoxes = boxes;
  }

  public setActionCallback(cb: () => void) {
    this.onActionCallback = cb;
  }

  public toggleFlashlight(): boolean {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.visible = this.isFlashlightOn;
    sound.playFlashlightClick(this.isFlashlightOn);
    return this.isFlashlightOn;
  }

  private setupEventListeners() {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mouse Lock & Move
    this.domElement.addEventListener('click', this.requestPointerLock);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.domElement.removeEventListener('click', this.requestPointerLock);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  private requestPointerLock = () => {
    if (!this.isPointerLocked) {
      this.domElement.requestPointerLock().catch(() => {});
    }
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    const sensitivity = 0.0022;
    this.yaw -= e.movementX * sensitivity;
    this.pitch -= e.movementY * sensitivity;

    // Clamp pitch between -85 and +85 degrees
    const maxPitch = (85 * Math.PI) / 180;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Ignore input if typing in chat/input
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = true;
        break;
      case 'Space':
        this.input.jump = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = true;
        break;
      case 'KeyC':
      case 'ControlLeft':
        this.isCrouched = !this.isCrouched;
        this.input.crouch = this.isCrouched;
        break;
      case 'KeyF':
        this.toggleFlashlight();
        break;
      case 'KeyE':
        this.onActionCallback?.();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = false;
        break;
      case 'Space':
        this.input.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = false;
        break;
    }
  };

  /**
   * Update controller physics and camera per frame
   */
  public update(dt: number) {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Smooth Crouch Eye Level Transition
    const targetEyeH = this.isCrouched ? this.crouchedEyeHeight : this.standingEyeHeight;
    this.currentEyeHeight += (targetEyeH - this.currentEyeHeight) * 12 * clampedDt;

    // 2. Compute Desired Speed
    let speed = 5.2; // Base walk
    if (this.isCrouched) speed = 2.4;
    else if (this.input.sprint && this.input.forward) speed = 8.5;

    this.isSprinting = this.input.sprint && this.input.forward && !this.isCrouched;

    // 3. Movement Direction relative to camera yaw
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    let moveX = 0;
    let moveZ = 0;

    if (this.input.forward) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    if (this.input.backward) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    if (this.input.left) {
      moveX -= rightX;
      moveZ -= rightZ;
    }
    if (this.input.right) {
      moveX += rightX;
      moveZ += rightZ;
    }

    const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLen > 0.001) {
      moveX = (moveX / moveLen) * speed;
      moveZ = (moveZ / moveLen) * speed;

      // Footsteps
      if (this.isGrounded) {
        sound.playFootstep(this.isSprinting, this.isCrouched);
      }
    }

    // Smooth acceleration & friction
    const accel = this.isGrounded ? 14 : 4;
    this.velocity.x += (moveX - this.velocity.x) * accel * clampedDt;
    this.velocity.z += (moveZ - this.velocity.z) * accel * clampedDt;

    // 4. Gravity & Jump
    const gravity = 22;
    if (this.isGrounded) {
      if (this.input.jump && !this.isCrouched) {
        this.velocity.y = 7.0;
        this.isGrounded = false;
        sound.playJump();
      } else {
        this.velocity.y = 0;
      }
    } else {
      this.velocity.y -= gravity * clampedDt;
    }

    // 5. Collision Detection & Wall Sliding
    const newPos = this.position.clone();
    const deltaX = this.velocity.x * clampedDt;
    const deltaY = this.velocity.y * clampedDt;
    const deltaZ = this.velocity.z * clampedDt;

    // Test X motion
    newPos.x += deltaX;
    if (this.checkCollision(newPos)) {
      newPos.x = this.position.x;
      this.velocity.x = 0;
    }

    // Test Z motion
    newPos.z += deltaZ;
    if (this.checkCollision(newPos)) {
      newPos.z = this.position.z;
      this.velocity.z = 0;
    }

    // Test Y motion (Ground check)
    newPos.y += deltaY;
    if (newPos.y <= this.currentEyeHeight) {
      if (!this.isGrounded && this.velocity.y < -3) {
        sound.playLand();
      }
      newPos.y = this.currentEyeHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.position.copy(newPos);

    // 6. Head Bobbing
    let bobY = 0;
    let bobX = 0;
    if (moveLen > 0.1 && this.isGrounded) {
      const bobSpeed = this.isSprinting ? 14 : this.isCrouched ? 8 : 10;
      this.headBobTimer += clampedDt * bobSpeed;
      bobY = Math.sin(this.headBobTimer) * (this.isSprinting ? 0.05 : 0.025);
      bobX = Math.cos(this.headBobTimer * 0.5) * (this.isSprinting ? 0.03 : 0.015);
    } else {
      this.headBobTimer = 0;
    }

    // 7. Update Camera Transform
    this.camera.position.set(this.position.x + bobX, this.position.y + bobY, this.position.z);

    // Apply rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }

  /**
   * Simple AABB cylinder check against registered collision obstacles
   */
  private checkCollision(testPos: THREE.Vector3): boolean {
    const r = this.playerRadius;
    const playerMinX = testPos.x - r;
    const playerMaxX = testPos.x + r;
    const playerMinZ = testPos.z - r;
    const playerMaxZ = testPos.z + r;
    const playerHeight = this.isCrouched ? 1.0 : 1.8;

    for (const box of this.collisionBoxes) {
      // Overlap test
      if (
        playerMaxX > box.min.x &&
        playerMinX < box.max.x &&
        playerMaxZ > box.min.z &&
        playerMinZ < box.max.z &&
        testPos.y > box.min.y &&
        testPos.y - playerHeight < box.max.y
      ) {
        return true;
      }
    }
    return false;
  }
}
