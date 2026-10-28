import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameRoom, RoundResult } from '../types/game';
import { sound } from '../services/sound';
import {
  Trophy,
  Target,
  Clock,
  ArrowRight,
  RotateCcw,
  Medal,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

interface RoundEndModalProps {
  room: GameRoom;
  myPlayerId: string;
  onNextRound: () => void;
  onPlayAgain: () => void;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  room,
  myPlayerId,
  onNextRound,
  onPlayAgain
}) => {
  const isGameOver = room.phase === 'game_over';
  const latestResult: RoundResult | undefined = room.roundResults[room.roundResults.length - 1];

  const wasFound = latestResult?.found ?? false;
  const isHider = room.hiderId === myPlayerId;
  const isSeeker = room.seekerId === myPlayerId;

  // Did I win this round?
  const isWinner = (isSeeker && wasFound) || (isHider && !wasFound);

  useEffect(() => {
    sound.playVictory();
    if (isWinner || isGameOver) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isWinner, isGameOver]);

  const playersList = Object.values(room.players).sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col font-sans">
        {/* Header Icon */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 shadow-inner">
            {isGameOver ? (
              <Trophy className="w-8 h-8 text-amber-400" />
            ) : wasFound ? (
              <Target className="w-8 h-8 text-red-400 animate-bounce" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-400 animate-bounce" />
            )}
          </div>

          <h2 className="text-2xl font-black text-white">
            {isGameOver
              ? 'Mission Complete: Final Standings'
              : wasFound
              ? 'Target Operative Captured!'
              : 'Stealth Operative Evaded Capture!'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {isGameOver
              ? `All ${room.totalRounds} sector engagements concluded.`
              : wasFound
              ? `Seeker intercepted the hider in ${latestResult?.durationSeconds || 0} seconds.`
              : 'Hider remained undiscovered throughout the entire mission duration.'}
          </p>
        </div>

        {/* Round Performance Cards */}
        {!isGameOver && latestResult && (
          <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Mission Time</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                {latestResult.durationSeconds}s
              </span>
            </div>
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Hider Score</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                +{latestResult.hiderScoreEarned}
              </span>
            </div>
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Seeker Score</span>
              <span className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                +{latestResult.seekerScoreEarned}
              </span>
            </div>
          </div>
        )}

        {/* Scoreboard Leaderboard */}
        <div className="mb-6">
          <div className="text-[10px] font-mono uppercase text-neutral-400 mb-2 px-1 flex items-center gap-1.5">
            <Medal className="w-3.5 h-3.5 text-amber-400" />
            <span>Sector Leaderboard</span>
          </div>

          <div className="space-y-2">
            {playersList.map((player, rank) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  rank === 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-neutral-950/50 border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-mono font-bold flex items-center justify-center">
                    #{rank + 1}
                  </span>
                  <span className="text-xs font-bold">
                    {player.name} {player.id === myPlayerId ? '(You)' : ''}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold">
                  {player.score.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Round Action */}
        <div>
          {isGameOver ? (
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Deploy New Sector Match</span>
            </button>
          ) : (
            <button
              onClick={onNextRound}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Next Engagement (Swap Roles)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
