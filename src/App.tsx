/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameRoom, PlayerRole } from './types/game';
import {
  getOrCreateUserId,
  getStoredUserName,
  createRoom,
  joinRoom,
  startGame,
  startSeekingPhase,
  tagPlayer,
  expireRound,
  advanceNextRound,
  localRelay
} from './services/multiplayer';
import { sound } from './services/sound';

import { GameCanvas3D } from './components/GameCanvas3D';
import { TacticalHUD } from './components/TacticalHUD';
import { Lobby3D } from './components/Lobby3D';
import { RoundEndModal } from './components/RoundEndModal';

export default function App() {
  const [myPlayerId] = useState<string>(() => getOrCreateUserId());
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time HUD states
  const [distanceToOpponent, setDistanceToOpponent] = useState<number>(30);
  const [stealthLevel, setStealthLevel] = useState<number>(50);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(true);
  const [sonarTrigger, setSonarTrigger] = useState<number>(0);

  // URL Room code auto-join
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomCode = urlParams.get('room');

    if (urlRoomCode && !room) {
      const storedName = getStoredUserName();
      if (storedName) {
        joinRoom(urlRoomCode.toUpperCase(), storedName)
          .then((joined) => setRoom(joined))
          .catch((err) => setError(err?.message || 'Could not join room.'));
      }
    }
  }, []);

  // Subscribe to Room updates
  useEffect(() => {
    if (!room?.code) return;

    const unsub = localRelay.subscribe(room.code, (updatedRoom) => {
      setRoom(updatedRoom);
    });

    return () => unsub();
  }, [room?.code]);

  // Phase Countdown & Expiration Watchdog
  useEffect(() => {
    if (!room) return;

    if (room.phase === 'hiding_countdown') {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - room.phaseStartTime) / 1000);
        if (elapsed >= room.phaseDuration) {
          // 30s countdown expired: release seeker
          startSeekingPhase(room).then(setRoom);
          sound.playSonarPing(25);
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    if (room.phase === 'seeking') {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - room.phaseStartTime) / 1000);
        if (elapsed >= room.phaseDuration) {
          // Seeker ran out of time: Hider wins!
          expireRound(room).then(setRoom);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [room?.phase, room?.phaseStartTime, room?.phaseDuration]);

  // My Role derivation
  const myRole: PlayerRole = useMemo(() => {
    if (!room) return 'hider';
    return room.hiderId === myPlayerId ? 'hider' : 'seeker';
  }, [room, myPlayerId]);

  // Actions
  const handleCreateRoom = async (hostName: string, mapId: string, rounds: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const newRoom = await createRoom(hostName, mapId, rounds);
      setRoom(newRoom);
      const newUrl = `${window.location.pathname}?room=${newRoom.code}`;
      window.history.pushState({}, '', newUrl);
      sound.playFlashlightClick(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to create room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (code: string, guestName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const joined = await joinRoom(code, guestName);
      setRoom(joined);
      const newUrl = `${window.location.pathname}?room=${joined.code}`;
      window.history.pushState({}, '', newUrl);
      sound.playFlashlightClick(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to join room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async (isSoloBot = false) => {
    if (!room) return;
    try {
      const started = await startGame(room, isSoloBot);
      setRoom(started);
      sound.playFlashlightClick(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to start game.');
    }
  };

  const handleTagSuccess = async () => {
    if (!room || room.phase !== 'seeking') return;
    const elapsed = Math.floor((Date.now() - room.phaseStartTime) / 1000);
    const remaining = Math.max(0, room.phaseDuration - elapsed);
    const updated = await tagPlayer(room, remaining);
    setRoom(updated);
  };

  const handleNextRound = async () => {
    if (!room) return;
    const updated = await advanceNextRound(room);
    setRoom(updated);
    sound.playFlashlightClick(true);
  };

  const handlePlayAgain = () => {
    setRoom(null);
    const cleanUrl = window.location.pathname;
    window.history.pushState({}, '', cleanUrl);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* LOBBY / WAITING ROOM */}
      {(!room || room.phase === 'lobby') && (
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4 overflow-y-auto">
          {/* Ambient Cyberpunk Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          <Lobby3D
            room={room}
            myPlayerId={myPlayerId}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartGame={handleStartGame}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}

      {/* ACTIVE 3D FIRST PERSON GAMEPLAY */}
      {room && room.phase !== 'lobby' && (
        <div className="relative w-full h-full">
          {/* 3D Scene Viewport */}
          <GameCanvas3D
            room={room}
            myPlayerId={myPlayerId}
            myRole={myRole}
            onTagSuccess={handleTagSuccess}
            onDistanceUpdate={setDistanceToOpponent}
            onStealthUpdate={setStealthLevel}
            onFlashlightChange={setIsFlashlightOn}
            sonarTrigger={sonarTrigger}
          />

          {/* Tactical HUD */}
          <TacticalHUD
            room={room}
            myRole={myRole}
            distanceToOpponent={distanceToOpponent}
            stealthLevel={stealthLevel}
            isFlashlightOn={isFlashlightOn}
            onTriggerSonar={() => setSonarTrigger((prev) => prev + 1)}
            onAttemptTag={handleTagSuccess}
          />

          {/* Hider Headstart Locked Overlay for Seeker */}
          {room.phase === 'hiding_countdown' && myRole === 'seeker' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-none text-center">
              <div className="p-6 bg-neutral-950/90 border border-neutral-800 rounded-3xl max-w-sm">
                <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider block mb-2">
                  STAGING LOCKDOWN
                </span>
                <h3 className="text-xl font-black text-white mb-2">
                  Hider is Taking Position
                </h3>
                <p className="text-xs text-neutral-400">
                  You are contained in the infiltration bay. Sensors will release in seconds. Plan your search vector.
                </p>
              </div>
            </div>
          )}

          {/* Round End & Victory Modal */}
          {(room.phase === 'round_end' || room.phase === 'game_over') && (
            <RoundEndModal
              room={room}
              myPlayerId={myPlayerId}
              onNextRound={handleNextRound}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
      )}
    </div>
  );
}
