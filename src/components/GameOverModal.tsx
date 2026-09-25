import React, { useEffect } from 'react';
import { Player } from '../types/game';
import confetti from 'canvas-confetti';
import { RotateCcw, Heart, Award } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  players: Player[];
  isHost: boolean;
  onResetGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ players, isHost, onResetGame }) => {
  useEffect(() => {
    sounds.playCheer();
    // Fire confetti cannons
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // Determine winner(s)
  const survivors = players?.filter((p) => !p.isEliminated) || [];
  const winner =
    survivors.length > 0
      ? survivors.sort((a, b) => b.lives - a.lives)[0]
      : [...(players || [])].sort((a, b) => a.penaltyCount - b.penaltyCount)[0];

  // Most penalized player
  const penaltyKing = [...(players || [])].sort((a, b) => b.penaltyCount - a.penaltyCount)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Trophy Header */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2 shadow-2xl shadow-amber-500/20">
            <img
              src="/src/assets/images/winner_party_trophy_1790299617923.jpg"
              alt="Winner Party Trophy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest">
            🎉 遊戲結束 · 榮耀頒獎典禮
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
            {winner ? `恭喜 ${winner.name} 奪冠！` : '派對對決結束！'}
          </h2>
          <p className="text-xs text-slate-400">在全員的唇槍舌戰中成功存活，堪稱心機破局之王！</p>
        </div>

        {/* Highlight Awards */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>👑 終極倖存冠軍</span>
            </span>
            <div className="text-sm font-black text-white truncate">
              {winner?.avatar} {winner?.name}
            </div>
            <span className="text-[11px] text-amber-300/80 block">
              剩餘生命: {winner?.lives} ❤️ · 犯規: {winner?.penaltyCount} 次
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>🔨 綜藝犯規王</span>
            </span>
            <div className="text-sm font-black text-white truncate">
              {penaltyKing?.avatar} {penaltyKing?.name}
            </div>
            <span className="text-[11px] text-rose-300/80 block">
              累計犯規被敲 {penaltyKing?.penaltyCount} 次！
            </span>
          </div>
        </div>

        {/* All Players Cards Revealed */}
        <div className="space-y-2 text-left">
          <h4 className="text-xs font-bold text-slate-300">本局所有人額頭卡牌真相大公開：</h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {players?.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">{p.avatar}</span>
                  <span className="font-bold text-white truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                    {p.forbiddenCard?.type === 'ACTION' ? '動作' : '禁詞'}:{' '}
                    {p.forbiddenCard?.content || '未知'}
                  </span>
                  <span className="text-slate-400 font-mono flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    {p.lives}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play Again Controls */}
        <div className="pt-2">
          {isHost ? (
            <button
              onClick={() => {
                sounds.playDing();
                onResetGame();
              }}
              className="w-full py-3.5 px-6 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-400 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再來一局！重返大廳發牌</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400">等待房主重新發牌開始下一局...</p>
          )}
        </div>
      </div>
    </div>
  );
};
