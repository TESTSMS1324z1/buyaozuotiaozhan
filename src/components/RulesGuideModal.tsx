import React from 'react';
import { X, HelpCircle, AlertTriangle, ShieldCheck, Flame, Users } from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">「不要做挑戰」怎麼玩？</h2>
            <p className="text-xs text-slate-400">源自韓國綜藝《Running Man》與經典派對的超爆笑心理戰！</p>
          </div>
        </div>

        <div className="space-y-5 text-sm">
          {/* Rule 1 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">1. 額頭貼牌：只有你看不到！</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                遊戲開始後，每位玩家會隨機被分配一個「禁止動作」或「禁止詞彙」。
                <strong className="text-amber-400">其他所有人都看得到你的牌，唯獨你自己看不見！</strong>
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">2. 設下圈套：引誘對手犯規</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                圍繞中央的「綜藝話題」展開激烈聊天！如果對方的禁止詞是「說真的嗎」，你可以分享一件超離譜的八卦引他質疑；若他是「摸頭髮」，可以誇他今天造型好看！
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">3. 抓到了！槌子伺候扣愛心</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                一旦看見有玩家做出禁止動作或說出禁詞，任何玩家都能按下對方的「抓到了！🔨」按鈕！玩具氣槌暴扣，扣除一顆生命 ❤️！
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">4. 逆風翻盤：破咒自猜！</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                如果你從對話蛛絲馬跡中猜出自己額頭上的牌，點擊「我猜到了！」，猜中可回復愛心並更換新牌！但若猜錯，也會被扣一顆愛心喔！
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
          >
            我懂了，開始開玩！
          </button>
        </div>
      </div>
    </div>
  );
};
