export type PlayerRole = 'hider' | 'seeker';

export type GamePhase =
  | 'lobby'          // In lobby selecting map and waiting for players
  | 'hiding_countdown' // Hider has 30s head-start to hide, seeker is locked
  | 'seeking'        // Seeker is released to find the hider
  | 'round_end'      // Hider found or time ran out
  | 'game_over';     // Match complete, final scores

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  position: Vector3D;
  rotationY: number; // yaw
  pitch: number;     // camera pitch
  isCrouched: boolean;
  isSprinting: boolean;
  isFlashlightOn: boolean;
  isTagged: boolean;
  isConnected: boolean;
  lastActive: number;
}

export interface CollisionBox {
  min: Vector3D;
  max: Vector3D;
  type?: 'wall' | 'obstacle' | 'hiding_spot';
}

export interface HidingSpot {
  id: string;
  name: string;
  position: Vector3D;
  description: string;
  stealthBonus: number; // 0 to 1
}

export interface MapData {
  id: string;
  name: string;
  tagline: string;
  theme: 'cyberpunk' | 'temple' | 'space_station' | 'canyon';
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  ambientIntensity: number;
  keyLightColor: number;
  keyLightIntensity: number;
  hiderSpawn: Vector3D;
  seekerSpawn: Vector3D;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  hidingSpots: HidingSpot[];
}

export interface RoundResult {
  roundNumber: number;
  mapId: string;
  hiderId: string;
  seekerId: string;
  found: boolean;
  timeRemaining: number;
  durationSeconds: number;
  hiderScoreEarned: number;
  seekerScoreEarned: number;
}

export interface GameRoom {
  code: string;
  hostId: string;
  guestId?: string;
  selectedMapId: string;
  totalRounds: number;
  currentRound: number;
  phase: GamePhase;
  phaseStartTime: number;
  phaseDuration: number; // In seconds (e.g. 30s hide, 120s seek)
  hiderId: string;
  seekerId: string;
  players: Record<string, PlayerState>;
  roundResults: RoundResult[];
  lastPingDistance?: number;
  lastPingTime?: number;
  isSoloBotMatch: boolean;
  lastUpdated: number;
}
