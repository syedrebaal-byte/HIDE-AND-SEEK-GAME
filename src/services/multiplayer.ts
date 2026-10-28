import { GameRoom, PlayerState, GamePhase, Vector3D, RoundResult } from '../types/game';
import { getMapById } from '../game/maps';

const USER_ID_KEY = 'shadowseek_user_id';
const USER_NAME_KEY = 'shadowseek_user_name';

export function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = 'op_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getStoredUserName(): string {
  return localStorage.getItem(USER_NAME_KEY) || '';
}

export function setStoredUserName(name: string) {
  localStorage.setItem(USER_NAME_KEY, name);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Local BroadcastChannel & storage relay store
class LocalRelayStore {
  private channels: Map<string, BroadcastChannel> = new Map();

  private getChannel(roomCode: string): BroadcastChannel {
    let chan = this.channels.get(roomCode);
    if (!chan && typeof BroadcastChannel !== 'undefined') {
      chan = new BroadcastChannel(`shadowseek_room_${roomCode}`);
      this.channels.set(roomCode, chan);
    }
    return chan!;
  }

  public getRoom(roomCode: string): GameRoom | null {
    try {
      const data = localStorage.getItem(`shadowseek_room_${roomCode}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveRoom(room: GameRoom) {
    try {
      localStorage.setItem(`shadowseek_room_${room.code}`, JSON.stringify(room));
      const chan = this.getChannel(room.code);
      if (chan) {
        chan.postMessage({ type: 'ROOM_UPDATE', room });
      }
    } catch (err) {
      console.error('Failed to save room in local relay:', err);
    }
  }

  public broadcastPos(roomCode: string, playerId: string, pos: Vector3D, rotY: number, pitch: number, isCrouched: boolean, isFlashlightOn: boolean) {
    const chan = this.getChannel(roomCode);
    if (chan) {
      chan.postMessage({
        type: 'PLAYER_MOVE',
        playerId,
        pos,
        rotY,
        pitch,
        isCrouched,
        isFlashlightOn
      });
    }
  }

  public subscribe(
    roomCode: string,
    onRoomUpdate: (room: GameRoom) => void,
    onPlayerMove?: (playerId: string, pos: Vector3D, rotY: number, pitch: number, isCrouched: boolean, isFlashlightOn: boolean) => void
  ): () => void {
    const chan = this.getChannel(roomCode);
    const handleMsg = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'ROOM_UPDATE' && e.data.room?.code === roomCode) {
        onRoomUpdate(e.data.room);
      } else if (e.data.type === 'PLAYER_MOVE' && onPlayerMove) {
        onPlayerMove(
          e.data.playerId,
          e.data.pos,
          e.data.rotY,
          e.data.pitch,
          e.data.isCrouched,
          e.data.isFlashlightOn
        );
      }
    };
    if (chan) {
      chan.addEventListener('message', handleMsg);
    }

    const interval = setInterval(() => {
      const current = this.getRoom(roomCode);
      if (current) onRoomUpdate(current);
    }, 1000);

    return () => {
      if (chan) chan.removeEventListener('message', handleMsg);
      clearInterval(interval);
    };
  }
}

export const localRelay = new LocalRelayStore();

/**
 * Create a new 3D Hide & Seek Room
 */
export async function createRoom(
  hostName: string,
  mapId: string,
  totalRounds: number = 3
): Promise<GameRoom> {
  const hostId = getOrCreateUserId();
  setStoredUserName(hostName);
  const code = generateRoomCode();
  const mapData = getMapById(mapId);

  const initialHostState: PlayerState = {
    id: hostId,
    name: hostName,
    isHost: true,
    score: 0,
    position: mapData.hiderSpawn,
    rotationY: 0,
    pitch: 0,
    isCrouched: false,
    isSprinting: false,
    isFlashlightOn: true,
    isTagged: false,
    isConnected: true,
    lastActive: Date.now()
  };

  const newRoom: GameRoom = {
    code,
    hostId,
    selectedMapId: mapId,
    totalRounds,
    currentRound: 1,
    phase: 'lobby',
    phaseStartTime: Date.now(),
    phaseDuration: 0,
    hiderId: hostId,
    seekerId: '',
    players: {
      [hostId]: initialHostState
    },
    roundResults: [],
    isSoloBotMatch: false,
    lastUpdated: Date.now()
  };

  localRelay.saveRoom(newRoom);
  return newRoom;
}

/**
 * Join Room
 */
export async function joinRoom(roomCode: string, guestName: string): Promise<GameRoom> {
  const guestId = getOrCreateUserId();
  setStoredUserName(guestName);

  const room = localRelay.getRoom(roomCode);
  if (!room) {
    throw new Error('Room not found. Please verify the 6-character room code.');
  }

  const existingPlayerKeys = Object.keys(room.players);
  if (existingPlayerKeys.length >= 2 && !room.players[guestId]) {
    throw new Error('Room is full (maximum 2 players).');
  }

  const mapData = getMapById(room.selectedMapId);

  room.guestId = guestId;
  room.players[guestId] = {
    id: guestId,
    name: guestName,
    isHost: false,
    score: room.players[guestId]?.score || 0,
    position: mapData.seekerSpawn,
    rotationY: 0,
    pitch: 0,
    isCrouched: false,
    isSprinting: false,
    isFlashlightOn: true,
    isTagged: false,
    isConnected: true,
    lastActive: Date.now()
  };
  room.lastUpdated = Date.now();

  localRelay.saveRoom(room);
  return room;
}

/**
 * Start Game: initializes round 1 with 30s Hiding Countdown
 */
export async function startGame(room: GameRoom, isSoloBot = false): Promise<GameRoom> {
  const playerIds = Object.keys(room.players);
  const hostId = room.hostId;
  const guestId = isSoloBot ? 'ai_bot' : playerIds.find((id) => id !== hostId) || hostId;

  const mapData = getMapById(room.selectedMapId);

  // Round 1: Host hides, Guest/Bot seeks
  room.hiderId = hostId;
  room.seekerId = guestId;
  room.currentRound = 1;
  room.phase = 'hiding_countdown';
  room.phaseStartTime = Date.now();
  room.phaseDuration = 30; // 30s for hider to take position
  room.isSoloBotMatch = isSoloBot;

  if (room.players[hostId]) {
    room.players[hostId].position = { ...mapData.hiderSpawn };
    room.players[hostId].isTagged = false;
  }

  if (isSoloBot) {
    room.players['ai_bot'] = {
      id: 'ai_bot',
      name: 'Cyber Sentinel (AI)',
      isHost: false,
      score: 0,
      position: { ...mapData.seekerSpawn },
      rotationY: 0,
      pitch: 0,
      isCrouched: false,
      isSprinting: false,
      isFlashlightOn: true,
      isTagged: false,
      isConnected: true,
      lastActive: Date.now()
    };
  } else if (room.players[guestId]) {
    room.players[guestId].position = { ...mapData.seekerSpawn };
    room.players[guestId].isTagged = false;
  }

  room.lastUpdated = Date.now();
  localRelay.saveRoom(room);
  return room;
}

/**
 * Start Seeking Phase (after 30s hiding countdown completes)
 */
export async function startSeekingPhase(room: GameRoom): Promise<GameRoom> {
  room.phase = 'seeking';
  room.phaseStartTime = Date.now();
  room.phaseDuration = 120; // 2 minutes to seek
  room.lastUpdated = Date.now();
  localRelay.saveRoom(room);
  return room;
}

/**
 * Tag / Spot Action: Seeker catches Hider!
 */
export async function tagPlayer(room: GameRoom, timeRemaining: number): Promise<GameRoom> {
  if (room.phase !== 'seeking') return room;

  room.phase = 'round_end';
  const duration = Math.max(1, 120 - timeRemaining);

  // Seeker caught the hider: earns points based on speed
  const seekerScore = Math.max(200, Math.round(1000 - duration * 5));
  const hiderScore = Math.round(duration * 2);

  if (room.players[room.seekerId]) {
    room.players[room.seekerId].score += seekerScore;
  }
  if (room.players[room.hiderId]) {
    room.players[room.hiderId].score += hiderScore;
    room.players[room.hiderId].isTagged = true;
  }

  const result: RoundResult = {
    roundNumber: room.currentRound,
    mapId: room.selectedMapId,
    hiderId: room.hiderId,
    seekerId: room.seekerId,
    found: true,
    timeRemaining,
    durationSeconds: duration,
    hiderScoreEarned: hiderScore,
    seekerScoreEarned: seekerScore
  };
  room.roundResults.push(result);
  room.lastUpdated = Date.now();

  localRelay.saveRoom(room);
  return room;
}

/**
 * Timer expired without seeker finding hider: Hider wins!
 */
export async function expireRound(room: GameRoom): Promise<GameRoom> {
  if (room.phase !== 'seeking') return room;

  room.phase = 'round_end';
  const hiderScore = 1200; // Big bonus for full survival!
  const seekerScore = 150;

  if (room.players[room.hiderId]) {
    room.players[room.hiderId].score += hiderScore;
  }
  if (room.players[room.seekerId]) {
    room.players[room.seekerId].score += seekerScore;
  }

  const result: RoundResult = {
    roundNumber: room.currentRound,
    mapId: room.selectedMapId,
    hiderId: room.hiderId,
    seekerId: room.seekerId,
    found: false,
    timeRemaining: 0,
    durationSeconds: 120,
    hiderScoreEarned: hiderScore,
    seekerScoreEarned: seekerScore
  };
  room.roundResults.push(result);
  room.lastUpdated = Date.now();

  localRelay.saveRoom(room);
  return room;
}

/**
 * Advance to Next Round (Swap Roles) or Game Over
 */
export async function advanceNextRound(room: GameRoom): Promise<GameRoom> {
  if (room.currentRound >= room.totalRounds) {
    room.phase = 'game_over';
    room.lastUpdated = Date.now();
    localRelay.saveRoom(room);
    return room;
  }

  // Swap Hider and Seeker roles
  const prevHider = room.hiderId;
  const prevSeeker = room.seekerId;
  room.hiderId = prevSeeker;
  room.seekerId = prevHider;

  room.currentRound += 1;
  room.phase = 'hiding_countdown';
  room.phaseStartTime = Date.now();
  room.phaseDuration = 30;

  const mapData = getMapById(room.selectedMapId);
  if (room.players[room.hiderId]) {
    room.players[room.hiderId].position = { ...mapData.hiderSpawn };
    room.players[room.hiderId].isTagged = false;
  }
  if (room.players[room.seekerId]) {
    room.players[room.seekerId].position = { ...mapData.seekerSpawn };
    room.players[room.seekerId].isTagged = false;
  }

  room.lastUpdated = Date.now();
  localRelay.saveRoom(room);
  return room;
}
