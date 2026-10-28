import React, { useState, useEffect } from 'react';
import { GameRoom, PlayerRole } from '../types/game';
import { getMapById } from '../game/maps';
import { sound } from '../services/sound';
import {
  Compass,
  Flashlight,
  FlashlightOff,
  Radio,
  Crosshair,
  Clock,
  Eye,
  Shield,
  Volume2,
  VolumeX,
  Target,
  Zap,
  Info
} from 'lucide-react';

interface TacticalHUDProps {
  room: GameRoom;
  myRole: PlayerRole;
  distanceToOpponent: number;
  stealthLevel: number;
  isFlashlightOn: boolean;
  onTriggerSonar: () => void;
  onAttemptTag: () => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  room,
  myRole,
  distanceToOpponent,
  stealthLevel,
  isFlashlightOn,
  onTriggerSonar,
  onAttemptTag
}) => {
  const mapData = getMapById(room.selectedMapId);
  const [muted, setMuted] = useState(sound.isMuted);
  const [showHelp, setShowHelp] = useState(false);

  // Time remaining calculation
  const elapsed = Math.floor((Date.now() - room.phaseStartTime) / 1000);
  const remaining = Math.max(0, room.phaseDuration - elapsed);

  const isHider = myRole === 'hider';
  const isSeeker = myRole === 'seeker';
  const isCountdown = room.phase === 'hiding_countdown';
  const isSeeking = room.phase === 'seeking';

  // Tick sound when time is low
  useEffect(() => {
    if (remaining <= 5 && remaining > 0) {
      sound.playTick(true);
    }
  }, [remaining]);

  const handleToggleMute = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isTagReady = isSeeker && isSeeking && distanceToOpponent <= 4.2;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* 1. TOP HEADER & COMPASS */}
      <div className="flex items-start justify-between gap-3">
        {/* Left Mission Identity */}
        <div className="pointer-events-auto bg-neutral-950/85 border border-neutral-800/80 rounded-2xl px-4 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Round {room.currentRound} / {room.totalRounds} · {mapData.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${
                  isHider
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}
              >
                ROLE: {myRole}
              </span>
            </div>
          </div>
        </div>

        {/* Center Mission Clock / Phase Alert */}
        <div className="pointer-events-auto bg-neutral-950/90 border border-neutral-800/90 rounded-2xl px-5 py-2.5 backdrop-blur-md shadow-2xl text-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center justify-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${remaining <= 10 ? 'text-red-400 animate-pulse' : 'text-neutral-400'}`} />
            <span>{isCountdown ? 'HIDER HEAD-START' : 'MISSION CLOCK'}</span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-mono font-black tracking-wider tabular-nums ${
              remaining <= 10 ? 'text-red-400' : 'text-white'
            }`}
          >
            {isCountdown ? `${remaining}s` : formatTimer(remaining)}
          </div>
        </div>

        {/* Right Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2.5 rounded-xl bg-neutral-950/85 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 backdrop-blur-md transition-colors cursor-pointer"
            title="Controls & Objective Guide"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl bg-neutral-950/85 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 backdrop-blur-md transition-colors cursor-pointer"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. CENTER RETICLE / CROSSHAIR */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Ring */}
          <div
            className={`w-10 h-10 rounded-full border border-dashed transition-all duration-200 ${
              isTagReady
                ? 'border-red-400 scale-125 animate-pulse'
                : 'border-white/20'
            }`}
          />
          {/* Center Point */}
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isTagReady ? 'bg-red-400 shadow-[0_0_8px_#f87171]' : 'bg-white/70'
            }`}
          />

          {/* Tag Notification Prompt when in range */}
          {isTagReady && (
            <div className="absolute -bottom-8 whitespace-nowrap bg-red-950/90 text-red-200 text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/50 shadow-lg">
              TARGET IN RANGE [E / CLICK TO TAG]
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM HUD PANELS */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-3">
        {/* Left Operative Status: Stealth Meter or Flashlight */}
        <div className="pointer-events-auto bg-neutral-950/85 border border-neutral-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl max-w-xs w-full">
          {isHider ? (
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  STEALTH CAMOUFLAGE
                </span>
                <span className="font-bold text-white tabular-nums">{stealthLevel}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                  style={{ width: `${stealthLevel}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-2">
                Crouch [C] in shadowed alcoves or behind containers to maximize stealth rating.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                SEEKER DIRECTIVE
              </div>
              <p className="text-xs text-neutral-300">
                Search the sector with your tactical flashlight. Fire Sonar Pings to zero in on the hider's position.
              </p>
            </div>
          )}
        </div>

        {/* Right Sonar Radar Scanner Widget */}
        <div className="pointer-events-auto bg-neutral-950/85 border border-neutral-800/80 rounded-2xl p-3.5 backdrop-blur-md shadow-2xl max-w-xs w-full">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              PROXIMITY SENSOR
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Flashlight: <strong className="text-white">{isFlashlightOn ? 'ON [F]' : 'OFF [F]'}</strong>
            </span>
          </div>

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-neutral-500">Opponent Range</span>
            <span className="text-xl font-mono font-black text-white tabular-nums">
              {isCountdown && isSeeker ? 'LOCKED IN SPAWN' : `${distanceToOpponent.toFixed(1)} m`}
            </span>
          </div>

          <button
            onClick={isTagReady ? onAttemptTag : onTriggerSonar}
            className={`w-full py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isTagReady
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/30 animate-bounce'
                : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-cyan-500/20'
            }`}
          >
            {isTagReady ? (
              <>
                <Target className="w-4 h-4" />
                <span>TAG OPERATIVE [E]</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Trigger Sonar Ping [E]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Controls Hint Strip at very bottom */}
      <div className="pointer-events-none mx-auto hidden md:flex items-center gap-4 bg-neutral-950/70 border border-neutral-800/60 px-4 py-1.5 rounded-full text-[11px] font-mono text-neutral-400 backdrop-blur-md">
        <span>WASD: Move</span>
        <span>·</span>
        <span>Shift: Sprint</span>
        <span>·</span>
        <span>C: Crouch</span>
        <span>·</span>
        <span>Space: Jump</span>
        <span>·</span>
        <span>F: Flashlight</span>
        <span>·</span>
        <span>E / Click: Action</span>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-left">
            <h3 className="text-lg font-black text-white mb-2">Tactical Guide</h3>
            <div className="space-y-3 text-xs text-neutral-300">
              <p>
                <strong>Hider</strong>: You have 30 seconds to sprint, explore hiding alcoves, and crouch in deep shadow. If you remain undiscovered until the mission clock runs out, you claim victory!
              </p>
              <p>
                <strong>Seeker</strong>: After the head-start ends, explore the sector. Use your flashlight [F] and trigger Sonar Pings [E] to read straight-line proximity distance. Look directly at the hider and tag them within 4 meters to win!
              </p>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[11px] space-y-1">
                <div>W, A, S, D — Move & Strafe</div>
                <div>Shift — Sprint</div>
                <div>C / Ctrl — Crouch (increases stealth)</div>
                <div>Space — Jump</div>
                <div>F — Toggle Flashlight</div>
                <div>E / Left-Click — Sonar Radar Ping / Tag</div>
                <div>Click Viewport — Lock Mouse Aim</div>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Resume Mission
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
