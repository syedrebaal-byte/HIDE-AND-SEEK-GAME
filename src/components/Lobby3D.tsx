import React, { useState } from 'react';
import { GameRoom } from '../types/game';
import { MAPS, getMapById } from '../game/maps';
import { sound } from '../services/sound';
import {
  Compass,
  Copy,
  Check,
  Play,
  Users,
  ShieldCheck,
  Bot,
  MapPin,
  Flame,
  Globe2,
  Terminal,
  ArrowRight,
  Eye
} from 'lucide-react';

interface Lobby3DProps {
  room: GameRoom | null;
  myPlayerId: string;
  onCreateRoom: (hostName: string, mapId: string, rounds: number) => void;
  onJoinRoom: (roomCode: string, guestName: string) => void;
  onStartGame: (isSoloBot?: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

export const Lobby3D: React.FC<Lobby3DProps> = ({
  room,
  myPlayerId,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  isLoading,
  error
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [userName, setUserName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedMapId, setSelectedMapId] = useState('cyberpunk_sector');
  const [rounds, setRounds] = useState(3);
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedMap = getMapById(selectedMapId);

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sound.playFlashlightClick(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // If already in a room and in lobby phase: show live waiting room
  if (room && room.phase === 'lobby') {
    const playersList = Object.values(room.players);
    const isHost = room.hostId === myPlayerId;
    const hasTwoPlayers = playersList.length >= 2;
    const currentMap = getMapById(room.selectedMapId);

    return (
      <div className="w-full max-w-xl mx-auto p-6 bg-neutral-900/90 border border-neutral-800 rounded-3xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 shadow-inner">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Staging Area: Room {room.code}</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Opponents are linking neural transceivers. Prepare to enter the 3D sector.
          </p>
        </div>

        {/* Room Code & Copy Shareable Link */}
        <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Sector Code</span>
            <div className="text-2xl font-mono font-extrabold tracking-widest text-cyan-400">
              {room.code}
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-700/60 shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Shareable Link</span>
              </>
            )}
          </button>
        </div>

        {/* Sector Map Info */}
        <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {currentMap.name}
            </span>
            <span className="text-[10px] font-mono uppercase text-neutral-400">
              {room.totalRounds} Rounds Total
            </span>
          </div>
          <p className="text-xs text-neutral-400">{currentMap.tagline}</p>
        </div>

        {/* Live Players Check-in */}
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
            <span>OPERATIVES READY</span>
            <span>{playersList.length} / 2</span>
          </div>

          {playersList.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                <div className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  {p.name}
                  {p.isHost && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      HOST
                    </span>
                  )}
                  {p.id === myPlayerId && (
                    <span className="text-[10px] font-mono text-neutral-500">(You)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>READY</span>
              </div>
            </div>
          ))}

          {!hasTwoPlayers && (
            <div className="flex items-center justify-between p-3.5 bg-neutral-950/30 border border-dashed border-neutral-800 rounded-xl text-neutral-500">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700 animate-pulse" />
                <span className="text-xs font-mono">Awaiting second operative to connect...</span>
              </div>
              <span className="text-xs font-mono animate-pulse">WAITING</span>
            </div>
          )}
        </div>

        {/* Start Game Action */}
        <div className="space-y-2.5">
          {isHost ? (
            <button
              onClick={() => onStartGame(false)}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{hasTwoPlayers ? 'Launch Sector Match' : 'Start (Solo / Waiting Mode)'}</span>
            </button>
          ) : (
            <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl text-center">
              <span className="text-xs font-mono text-neutral-400 animate-pulse">
                Waiting for the host operative to launch the sector...
              </span>
            </div>
          )}

          <button
            onClick={() => onStartGame(true)}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-neutral-700/60 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Launch with Cyber Sentinel AI Opponent</span>
          </button>
        </div>
      </div>
    );
  }

  // Create or Join View
  return (
    <div className="w-full max-w-xl mx-auto p-6 sm:p-8 bg-neutral-900/90 border border-neutral-800/90 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 shadow-inner">
          <Eye className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          SHADOWSEEK 3D
        </h1>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          3D First-Person Hide & Seek. Navigate immersive sectors with flashlight, crouch in stealth, and hunt with tactical sonar radar.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 bg-neutral-950/80 rounded-2xl border border-neutral-800 mb-6">
        <button
          onClick={() => {
            setTab('create');
            sound.playFlashlightClick(true);
          }}
          className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === 'create' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Deploy Room
        </button>
        <button
          onClick={() => {
            setTab('join');
            sound.playFlashlightClick(true);
          }}
          className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === 'join' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Join Sector
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {tab === 'create' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
              Operative Call-Sign
            </label>
            <input
              type="text"
              placeholder="e.g. Hunter-One"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
            />
          </div>

          {/* 4 Distinct Maps Grid */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-2">
              Select 3D Sector (4 Maps Available)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MAPS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMapId(m.id);
                    sound.playFlashlightClick(true);
                  }}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedMapId === m.id
                      ? 'bg-cyan-500/10 border-cyan-500/60 shadow-lg text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    <span className="text-[10px] font-mono uppercase text-cyan-400">
                      {m.theme}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                    {m.tagline}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Rounds */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase text-neutral-400">
                Match Length
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">{rounds} Rounds</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRounds(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    rounds === r
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Create Room Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                const name = userName.trim() || 'Operative-1';
                onCreateRoom(name, selectedMapId, rounds);
              }}
              disabled={isLoading}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              <span>Create Multiplayer Room</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const name = userName.trim() || 'Operative (You)';
                onCreateRoom(name, selectedMapId, rounds);
                setTimeout(() => onStartGame(true), 100);
              }}
              className="w-full py-3 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-neutral-700/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Instant Solo Match vs Cyber Sentinel AI</span>
            </button>
          </div>
        </div>
      ) : (
        /* Join Room Tab */
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
              Operative Call-Sign
            </label>
            <input
              type="text"
              placeholder="e.g. Shadow-Two"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
              6-Character Sector Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. AB12CD"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-lg font-mono font-bold tracking-widest text-cyan-300 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 transition-colors text-center"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const name = userName.trim() || 'Operative-2';
              const code = roomCodeInput.trim().toUpperCase();
              if (code) {
                onJoinRoom(code, name);
              }
            }}
            disabled={!roomCodeInput.trim() || isLoading}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Infiltrate Sector</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
