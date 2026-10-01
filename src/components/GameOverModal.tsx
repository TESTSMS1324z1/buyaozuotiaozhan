import React, { useEffect } from 'react';
import { Player } from '../types/game';
import confetti from 'canvas-confetti';
import { RotateCcw, Award, Crown } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  players: Player[];
  isHost: boolean;
  onResetGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ players, isHost, onResetGame }) => {
  useEffect(() => {
    sounds.playCheer();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
    const timer = setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const survivors = players?.filter((p) => !p.isEliminated) || [];
  const winner =
    survivors.length > 0
      ? survivors.sort((a, b) => b.lives - a.lives)[0]
      : [...(players || [])].sort((a, b) => a.penaltyCount - b.penaltyCount)[0];

  const penaltyKing = [...(players || [])].sort((a, b) => b.penaltyCount - a.penaltyCount)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2b2118]/85 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-[#fff7e6] to-[#ffe9c7] border-4 border-[#2b2118] rounded-[28px] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-4">
        {/* 獎盃榮耀標題 */}
        <div>
          <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#ffd23f] border-4 border-[#2b2118] flex items-center justify-center text-4xl shadow-[0_5px_0_rgba(43,33,24,0.2)]">
            🏆
          </div>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ff9f1c] text-white border-2 border-[#2b2118] text-xs font-black uppercase tracking-wider shadow-[0_3px_0_rgba(43,33,24,0.15)]">
            <Crown className="w-3.5 h-3.5" />
            <span>對決結算 · 頒獎典禮</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#2b2118] mt-1 tracking-tight">
            {winner ? `恭喜 ${winner.name} 奪得冠軍！` : '派對對決精彩落幕！'}
          </h2>
          <p className="text-xs font-bold text-[#7a6a58]">
            成功識破對手陷阱並存活，堪稱心理戰大師！
          </p>
        </div>

        {/* 雙重點：MVP 倖存者 & 綜藝犯規王 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          <div className="p-3 rounded-2xl bg-white border-3 border-[#2b2118] space-y-1 shadow-[0_4px_0_rgba(43,33,24,0.1)]">
            <span className="text-[10px] font-black text-[#ff9f1c] flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>👑 終極倖存者 (MVP)</span>
            </span>
            <div className="text-sm font-black text-[#2b2118] truncate flex items-center gap-1.5">
              <span className="text-2xl">{winner?.avatar}</span>
              <span>{winner?.name}</span>
            </div>
            <span className="text-[11px] font-bold text-[#7a6a58] block">
              剩餘生命: {winner?.lives} ❤️ · 犯規僅 {winner?.penaltyCount} 次
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white border-3 border-[#2b2118] space-y-1 shadow-[0_4px_0_rgba(43,33,24,0.1)]">
            <span className="text-[10px] font-black text-[#ff5d8f] flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>🔨 綜藝人氣犯規王</span>
            </span>
            <div className="text-sm font-black text-[#2b2118] truncate flex items-center gap-1.5">
              <span className="text-2xl">{penaltyKing?.avatar}</span>
              <span>{penaltyKing?.name}</span>
            </div>
            <span className="text-[11px] font-bold text-[#7a6a58] block">
              被氣槌暴扣高達 {penaltyKing?.penaltyCount} 次！全場笑點！
            </span>
          </div>
        </div>

        {/* 全員額頭卡牌真相大公開 */}
        <div className="space-y-1.5 text-left">
          <h4 className="text-xs font-black text-[#2b2118]">
            🔍 全員神秘額頭牌真相揭曉：
          </h4>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {players?.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white border-2 border-[#2b2118] text-xs font-bold"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xl">{p.avatar}</span>
                  <span className="font-black text-[#2b2118] truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffe9c7] text-[#2b2118] font-black border border-[#2b2118]">
                    {p.forbiddenCard?.type === 'ACTION' ? '動作' : '禁詞'}:{' '}
                    {p.forbiddenCard?.content || '神秘牌面'}
                  </span>
                  <span className="text-xs font-mono font-black text-[#ff3b3b]">
                    ❤️ {p.lives}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 重新開始控制列 */}
        <div className="pt-1">
          {isHost ? (
            <button
              onClick={() => {
                sounds.playDing();
                onResetGame();
              }}
              className="btn-cartoon btn-cartoon-orange w-full py-2.5 sm:py-3 px-6 text-sm sm:text-base font-black flex items-center justify-center gap-2 cursor-pointer shadow-[0_5px_0_rgba(43,33,24,0.25)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再來一局！重返大廳重新發牌</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-white border-2 border-[#2b2118] text-xs font-bold text-[#7a6a58]">
              等待主持房主重新發牌開戰...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
