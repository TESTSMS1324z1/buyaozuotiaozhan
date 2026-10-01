import React from 'react';
import { X, HelpCircle, AlertTriangle, ShieldCheck, Flame, Users } from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2b2118]/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#fff7e6] to-[#ffe9c7] border-4 border-[#2b2118] rounded-[28px] p-5 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.4)] text-[#2b2118]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border-3 border-[#2b2118] flex items-center justify-center text-lg font-black hover:bg-[#ffe9c7] transition-transform active:scale-90 cursor-pointer shadow-[0_3px_0_rgba(43,33,24,0.2)]"
          aria-label="關閉"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#ffd23f] border-3 border-[#2b2118] flex items-center justify-center text-2xl shadow-[0_4px_0_rgba(43,33,24,0.2)]">
            🙅
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#2b2118]">「不要做挑戰」怎麼玩？</h2>
            <p className="text-xs font-bold text-[#7a6a58]">經典實境秀！你看不到自己的禁忌牌，只能看別人的！</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs font-bold text-[#2b2118]">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border-3 border-[#2b2118] shadow-[0_4px_0_rgba(43,33,24,0.12)]">
            <div className="w-8 h-8 rounded-xl bg-[#ff5d8f] text-white flex items-center justify-center text-sm shrink-0 border-2 border-[#2b2118]">
              1
            </div>
            <div>
              <h3 className="font-black text-sm text-[#2b2118] mb-0.5">額頭神秘牌：只有你看不到！</h3>
              <p className="text-xs text-[#7a6a58] leading-relaxed">
                每位玩家額頭會貼上一張「禁止動作」或「禁止詞彙」。其他所有人都看得一清二楚，唯獨你自己看不見！
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border-3 border-[#2b2118] shadow-[0_4px_0_rgba(43,33,24,0.12)]">
            <div className="w-8 h-8 rounded-xl bg-[#ffd23f] text-[#2b2118] flex items-center justify-center text-sm shrink-0 border-2 border-[#2b2118]">
              2
            </div>
            <div>
              <h3 className="font-black text-sm text-[#2b2118] mb-0.5">設下圈套：誘惑對手踩雷犯規</h3>
              <p className="text-xs text-[#7a6a58] leading-relaxed">
                圍繞正中央的「綜藝話題」展開激烈聊天！例如對手的禁止詞是「說真的嗎」，你就分享離譜八卦引誘他說出口！
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border-3 border-[#2b2118] shadow-[0_4px_0_rgba(43,33,24,0.12)]">
            <div className="w-8 h-8 rounded-xl bg-[#4dabff] text-white flex items-center justify-center text-sm shrink-0 border-2 border-[#2b2118]">
              3
            </div>
            <div>
              <h3 className="font-black text-sm text-[#2b2118] mb-0.5">抓到了！槌子伺候扣愛心 🔨</h3>
              <p className="text-xs text-[#7a6a58] leading-relaxed">
                一旦抓到對手做了禁止動作或說了禁詞，按下「抓到了！🔨」，氣槌暴扣扣除 1 顆生命 ❤️！
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border-3 border-[#2b2118] shadow-[0_4px_0_rgba(43,33,24,0.12)]">
            <div className="w-8 h-8 rounded-xl bg-[#2ec27e] text-white flex items-center justify-center text-sm shrink-0 border-2 border-[#2b2118]">
              4
            </div>
            <div>
              <h3 className="font-black text-sm text-[#2b2118] mb-0.5">逆向推理：破咒自救猜中加分</h3>
              <p className="text-xs text-[#7a6a58] leading-relaxed">
                察覺對手意圖了嗎？點擊「破咒推理」，成功猜出自己牌面即可回復愛心並更換新牌！
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e8ddcb] flex justify-end">
          <button
            onClick={onClose}
            className="btn-cartoon btn-cartoon-orange py-2 px-6 text-sm cursor-pointer"
          >
            我懂了，開始遊戲！
          </button>
        </div>
      </div>
    </div>
  );
};
