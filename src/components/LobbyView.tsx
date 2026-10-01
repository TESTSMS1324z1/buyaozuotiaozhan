import React, { useState } from 'react';
import { Player, GameSettings } from '../types/game';
import { Crown, Check, Copy, Play, Plus, Trash2, Volume2, VolumeX, Share2, BookOpen } from 'lucide-react';
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
  onLeaveRoom?: () => void;
  onOpenRules?: () => void;
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
  onLeaveRoom,
  onOpenRules,
}) => {
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customType, setCustomType] = useState<'ACTION' | 'WORD'>('ACTION');

  const myPlayer = players?.find((p) => p.id === myPlayerId);
  const nonHostPlayers = players?.filter((p) => !p.isHost) || [];
  const readyCount = nonHostPlayers.filter((p) => p.isReady).length;
  
  // Can start if host is ready and non-hosts are ready (supports single-player test or multi-player)
  const canStart = (players?.length || 0) >= 1 && (nonHostPlayers.length === 0 || nonHostPlayers.every((p) => p.isReady));

  const currentLives = typeof settings?.initialLives === 'number' ? settings.initialLives : 3;
  const currentCategories = (Array.isArray(settings?.deckCategories) && settings.deckCategories.length > 0)
    ? settings.deckCategories
    : ['daily', 'chat'];

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

  const handleUpdateLives = (lives: number) => {
    if (!isHost) return;
    sounds.playDing();
    onUpdateSettings({
      ...settings,
      initialLives: lives,
      deckCategories: currentCategories,
    });
  };

  const toggleCategory = (cat: string) => {
    if (!isHost) return;
    sounds.playDing();
    const current = new Set(currentCategories);
    if (current.has(cat)) {
      if (current.size > 1) {
        current.delete(cat);
      }
    } else {
      current.add(cat);
    }
    onUpdateSettings({
      ...settings,
      initialLives: currentLives,
      deckCategories: Array.from(current),
    });
  };

  // Build 8-seat array
  const totalSeats = 8;
  const seatList = Array.from({ length: totalSeats }).map((_, index) => {
    return players && players[index] ? players[index] : null;
  });

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 gap-3 sm:gap-4 overflow-hidden select-none">
      {/* 房間頂部：房號 + 人數 + 操作 */}
      <header className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="w-10 h-10 rounded-full bg-white border-3 border-[#2b2118] flex items-center justify-center font-black text-lg shadow-[0_4px_0_rgba(43,33,24,0.18)] hover:bg-[#ffe9c7] transition-transform active:scale-90 cursor-pointer"
              title="返回首頁"
            >
              ←
            </button>
          )}

          <div
            onClick={handleCopy}
            className="flex flex-col items-center bg-[#9b5de5] text-white border-3 border-[#2b2118] rounded-2xl px-4 py-1 shadow-[0_4px_0_rgba(43,33,24,0.18)] cursor-pointer hover:brightness-105 active:translate-y-0.5 transition-all"
            title="點擊複製邀請連結"
          >
            <span className="text-[10px] font-bold opacity-90 tracking-widest uppercase">
              {copied ? '已複製連結！' : '房間代碼 (點擊複製)'}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black tracking-widest leading-tight flex items-center gap-1.5">
              <span>{roomId}</span>
              {copied ? <Check className="w-4 h-4 text-[#ffd23f]" /> : <Copy className="w-3.5 h-3.5 opacity-80" />}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black bg-white border-3 border-[#2b2118] rounded-full px-3.5 py-1.5 shadow-[0_4px_0_rgba(43,33,24,0.18)]">
            {players?.length || 0} / 8 人
          </span>

          {onOpenRules && (
            <button
              onClick={onOpenRules}
              className="w-10 h-10 rounded-full bg-white border-3 border-[#2b2118] flex items-center justify-center font-bold shadow-[0_4px_0_rgba(43,33,24,0.18)] hover:bg-[#ffe9c7] transition-transform active:scale-90 cursor-pointer text-sm"
              title="查看規則指南"
            >
              📖
            </button>
          )}

          <button
            onClick={handleCopy}
            className="hidden sm:flex items-center gap-1.5 btn-cartoon btn-cartoon-orange px-3.5 py-1.5 text-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? '已複製' : '邀請好友'}</span>
          </button>
        </div>
      </header>

      {/* 房間主體：8 人座位格 + 房間設定面板 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0 overflow-y-auto">
        {/* 8 人座位網格 */}
        <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 p-1">
          {seatList.map((player, index) => {
            if (player) {
              const isMe = player.id === myPlayerId;
              return (
                <div
                  key={player.id}
                  className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl border-3 border-[#2b2118] p-2 shadow-[0_5px_0_rgba(43,33,24,0.18)] transition-all ${
                    player.isHost ? 'bg-[#fff3d6] border-[#ff9f1c]' : 'bg-white'
                  }`}
                >
                  <div className="text-3xl sm:text-4xl leading-none">
                    {player.avatar}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[#2b2118] truncate max-w-[80px]">
                    {player.name} {isMe && '(你)'}
                  </div>

                  {player.isHost ? (
                    <span className="text-[10px] font-black rounded-full px-2 py-0.2 bg-[#ff9f1c] text-white border-2 border-[#2b2118]">
                      房主
                    </span>
                  ) : player.isReady ? (
                    <span className="text-[10px] font-black rounded-full px-2 py-0.2 bg-[#2ec27e] text-white border-2 border-[#2b2118]">
                      已準備
                    </span>
                  ) : (
                    <span className="text-[10px] font-black rounded-full px-2 py-0.2 bg-[#ffd23f] text-[#2b2118] border-2 border-[#2b2118]">
                      等待中
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={`empty-${index}`}
                onClick={handleCopy}
                className="flex flex-col items-center justify-center gap-0.5 rounded-2xl border-3 border-dashed border-[#e8ddcb] bg-white/40 p-2 cursor-pointer hover:bg-white/60 transition-colors"
                title="點擊複製邀請連結"
              >
                <div className="text-2xl font-black text-[#c9bda9] leading-none">
                  ＋
                </div>
                <div className="text-[11px] font-bold text-[#c9bda9]">
                  空位
                </div>
              </div>
            );
          })}
        </div>

        {/* 房間設定面板 (右側) */}
        <aside className="w-full lg:w-72 bg-white border-3 border-[#2b2118] rounded-2xl p-3 sm:p-4 shadow-[0_5px_0_rgba(43,33,24,0.18)] flex flex-col gap-3 shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#e8ddcb] pb-2">
            <h3 className="font-black text-sm text-[#2b2118]">遊戲設定</h3>
            {!isHost && <span className="text-[10px] font-bold text-[#7a6a58]">僅房主可修改</span>}
          </div>

          {/* 生命值設定 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-black text-[#7a6a58]">生命值 (愛心 ❤️)</span>
            <div className="flex gap-2">
              {[3, 4, 5].map((lives) => (
                <button
                  key={lives}
                  type="button"
                  disabled={!isHost}
                  onClick={() => handleUpdateLives(lives)}
                  className={`cartoon-chip flex-1 py-1 text-xs ${currentLives === lives ? 'is-on' : ''}`}
                >
                  {lives} 顆
                </button>
              ))}
            </div>
          </div>

          {/* 牌庫類型設定 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-black text-[#7a6a58]">牌庫類型（可多選）</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'daily', name: '日常動作' },
                { id: 'chat', name: '聊天陷阱' },
                { id: 'body', name: '搞怪肢體' },
                { id: 'hardcore', name: '綜藝高難' },
              ].map((cat) => {
                const isSelected = currentCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={!isHost}
                    onClick={() => toggleCategory(cat.id)}
                    className={`cartoon-chip py-1 px-2 text-xs truncate ${isSelected ? 'is-on' : ''}`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 自訂卡牌 */}
          <form onSubmit={handleAddCard} className="flex flex-col gap-1.5 pt-2 border-t-2 border-dashed border-[#e8ddcb]">
            <span className="text-xs font-black text-[#7a6a58]">新增自訂爆笑牌</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCustomType('ACTION')}
                className={`flex-1 py-0.5 rounded-full text-[10px] font-black border-2 border-[#2b2118] ${
                  customType === 'ACTION' ? 'bg-[#ff9f1c] text-white' : 'bg-white text-[#2b2118]'
                }`}
              >
                動作
              </button>
              <button
                type="button"
                onClick={() => setCustomType('WORD')}
                className={`flex-1 py-0.5 rounded-full text-[10px] font-black border-2 border-[#2b2118] ${
                  customType === 'WORD' ? 'bg-[#ff5d8f] text-white' : 'bg-white text-[#2b2118]'
                }`}
              >
                禁詞
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="自訂小動作或口頭禪..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={18}
                className="flex-1 px-2.5 py-1 text-xs bg-[#fff7e6] border-2 border-[#2b2118] rounded-xl text-[#2b2118] placeholder-[#7a6a58]/60 focus:outline-none font-bold"
              />
              <button
                type="submit"
                disabled={!customText.trim()}
                className="btn-cartoon btn-cartoon-orange px-3 py-1 text-xs cursor-pointer disabled:opacity-40"
              >
                新增
              </button>
            </div>

            {settings?.customCards && settings.customCards.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
                {settings.customCards.map((c, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff7e6] border-2 border-[#2b2118] flex items-center gap-1"
                  >
                    <span>{c.type === 'ACTION' ? '動' : '詞'}:{c.content}</span>
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = (settings.customCards || []).filter((_, i) => i !== idx);
                          onUpdateSettings({ ...settings, customCards: filtered });
                        }}
                        className="hover:text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </form>
        </aside>
      </div>

      {/* 房間底部：開始按鈕與提示 */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 border-t-2 border-dashed border-[#e8ddcb] shrink-0">
        <p className="text-xs font-bold text-[#7a6a58] text-center sm:text-left">
          {(players?.length || 0) < 2
            ? '💡 可單人測試，或點擊「邀請好友」發送房間連結同樂！'
            : canStart
            ? '全員準備就緒，隨時可以開戰！'
            : `等待隊友準備中... (${readyCount} / ${nonHostPlayers.length})`}
        </p>

        {isHost ? (
          <button
            disabled={!canStart}
            onClick={() => {
              sounds.playSuccess();
              onStartGame();
            }}
            className="btn-cartoon btn-cartoon-orange py-2 sm:py-2.5 px-6 sm:px-8 text-sm sm:text-base cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            ▶ 開始遊戲
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playDing();
              onToggleReady();
            }}
            className={`btn-cartoon ${
              myPlayer?.isReady ? 'btn-cartoon-white' : 'btn-cartoon-green'
            } py-2 sm:py-2.5 px-6 sm:px-8 text-sm sm:text-base cursor-pointer w-full sm:w-auto`}
          >
            {myPlayer?.isReady ? '取消準備' : '✔ 準備就緒'}
          </button>
        )}
      </footer>
    </div>
  );
};
