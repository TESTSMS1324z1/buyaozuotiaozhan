import React, { useState } from 'react';
import { Player, GameSettings } from '../types/game';
import { Crown, Check, Copy, Play, Plus, Trash2, Sliders, Sparkles, Heart } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LobbyViewProps {
  roomId: string;
  myPlayerId: string;
  players: Player[];
  isHost: boolean;
  settings: GameSettings;
  onToggleReady: () => void;
  onStartGame: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onAddCustomCard: (type: 'ACTION' | 'WORD', content: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomId,
  myPlayerId,
  players,
  isHost,
  settings,
  onToggleReady,
  onStartGame,
  onUpdateSettings,
  onAddCustomCard,
}) => {
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customType, setCustomType] = useState<'ACTION' | 'WORD'>('ACTION');

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const allReady = players.length >= 2 ? players.filter((p) => !p.isHost).every((p) => p.isReady) : true;

  const handleCopy = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      sounds.playDing();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onAddCustomCard(customType, customText.trim());
    setCustomText('');
    sounds.playDing();
  };

  const toggleCategory = (cat: string) => {
    if (!isHost) return;
    const current = new Set(settings.deckCategories);
    if (current.has(cat)) {
      if (current.size > 1) {
        current.delete(cat);
      }
    } else {
      current.add(cat);
    }
    onUpdateSettings({ deckCategories: Array.from(current) });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8 animate-in fade-in duration-300">
      {/* Hero Invitation Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 shadow-2xl p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>房間等待中 · 邀請好友入局</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              不要做挑戰 · 爆笑心理戰
            </h1>
            <p className="text-sm text-slate-400 max-w-lg">
              把神秘卡牌貼在額頭，自己絕對不能看！引誘好友說出禁詞、做出禁忌動作，按下槌子暴扣！
            </p>
          </div>

          {/* Room Code & Copy Card */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 backdrop-blur-sm">
            <div className="text-center sm:text-left px-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                房間邀請碼
              </span>
              <span className="font-mono text-2xl font-black text-amber-400 tracking-wider">
                {roomId}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已複製房間連結！' : '複製邀請連結'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>在線玩家名單</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {players.length} 人
              </span>
            </h2>
            <span className="text-xs text-slate-400">
              {players.length < 2 ? '（建議 2 人以上遊玩更刺激）' : '全員準備好即可開戰'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((player) => {
              const isMe = player.id === myPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-slate-900/90 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-2xl shadow-inner">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate max-w-[120px]">
                          {player.name}
                        </span>
                        {player.isHost && (
                          <span
                            title="房主"
                            className="p-0.5 rounded bg-amber-500/10 text-amber-400"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[10px] font-semibold text-amber-400/90">
                            (你)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        初始生命: {settings.initialLives}
                      </span>
                    </div>
                  </div>

                  <div>
                    {player.isHost ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        房主
                      </span>
                    ) : player.isReady ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> 已準備
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-400">
                        等待中
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {!isHost && (
              <button
                onClick={() => {
                  sounds.playDing();
                  onToggleReady();
                }}
                className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                  myPlayer?.isReady
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-900/20'
                }`}
              >
                {myPlayer?.isReady ? '取消準備' : '準備完成 ✋'}
              </button>
            )}

            {isHost && (
              <button
                onClick={() => {
                  sounds.playDing();
                  onStartGame();
                }}
                className="w-full py-3 px-6 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-400 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>立即開始不要做挑戰！</span>
              </button>
            )}
          </div>
          {isHost && !allReady && players.length >= 2 && (
            <p className="text-xs text-amber-400/80 text-center">
              提示：尚有玩家未準備，但房主仍可直接發牌開始遊戲
            </p>
          )}
        </div>

        {/* Right Column: Settings & Custom Cards */}
        <div className="lg:col-span-5 space-y-5">
          {/* Deck Settings */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>牌庫分類設定</span>
              </h3>
              {!isHost && <span className="text-xs text-slate-500">（僅房主可修改）</span>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'daily', label: '🎭 經典日常動作', desc: '喝水、摸頭髮、看手機' },
                { id: 'chat', label: '💬 聊天陷阱禁詞', desc: '說「我」、說「真的嗎」' },
                { id: 'body', label: '🤸‍♂️ 身體搞怪動作', desc: '托腮、點頭兩次、摸鼻' },
                { id: 'hardcore', label: '🔥 綜藝高難度篇', desc: '誇人、叫名字、抱胸' },
              ].map((cat) => {
                const active = settings.deckCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={!isHost}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      active
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-60'
                    } ${isHost ? 'hover:border-amber-400/80 cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="font-bold text-xs block text-slate-200">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{cat.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Lives Selection */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">每位玩家初始生命</span>
              <div className="flex items-center gap-1">
                {[3, 5, 8].map((num) => (
                  <button
                    key={num}
                    disabled={!isHost}
                    onClick={() => onUpdateSettings({ initialLives: num })}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                      settings.initialLives === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    } ${!isHost && 'cursor-default'}`}
                  >
                    {num} 顆❤️
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Cards Addition */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>自訂搞怪禁止牌</span>
            </h3>
            <p className="text-xs text-slate-400">
              所有人都可以出題！輸入你們朋友圈專屬的私密動作或口頭禪：
            </p>

            <form onSubmit={handleAddCard} className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as 'ACTION' | 'WORD')}
                  className="px-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="ACTION">禁止動作</option>
                  <option value="WORD">禁止詞彙</option>
                </select>

                <input
                  type="text"
                  placeholder={customType === 'ACTION' ? '例如：推眼鏡、喝奶茶' : '例如：說「笑死」、講台語'}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={25}
                  className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  disabled={!customText.trim()}
                  className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>加入</span>
                </button>
              </div>
            </form>

            {settings.customCards.length > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-1.5 pt-2">
                <span className="text-[11px] font-medium text-slate-400 block">
                  已加入的自訂牌 ({settings.customCards.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {settings.customCards.map((c, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/60 text-slate-300 flex items-center gap-1"
                    >
                      <span className="text-[10px] text-amber-400 font-semibold">
                        {c.type === 'ACTION' ? '動作' : '禁詞'}
                      </span>
                      <span>{c.content}</span>
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = settings.customCards.filter((_, i) => i !== idx);
                            onUpdateSettings({ customCards: filtered });
                          }}
                          className="hover:text-rose-400 ml-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
