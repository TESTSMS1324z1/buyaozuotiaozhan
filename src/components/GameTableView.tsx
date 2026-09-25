import React, { useState, useEffect, useRef } from 'react';
import { Player, ViolationEvent, ChatMessage } from '../types/game';
import { RefreshCw, Send, Eye, ShieldAlert, Sparkles, AlertCircle, Heart, MessageSquare, X } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameTableViewProps {
  roomId: string;
  myPlayerId: string;
  players: Player[];
  isHost: boolean;
  currentTopic: string;
  activeViolation: ViolationEvent | null | undefined;
  messages: ChatMessage[];
  historyLog: Array<{ id: string; text: string; type: string; timestamp: number }>;
  onNextTopic: () => void;
  onReportViolation: (targetPlayerId: string) => void;
  onGuessOwnCard: (guess: string) => void;
  onSendChat: (text: string) => void;
  onResetGame: () => void;
}

export const GameTableView: React.FC<GameTableViewProps> = ({
  myPlayerId,
  players,
  isHost,
  currentTopic,
  activeViolation,
  messages,
  historyLog,
  onNextTopic,
  onReportViolation,
  onGuessOwnCard,
  onSendChat,
  onResetGame,
}) => {
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [selfPeekUnlocked, setSelfPeekUnlocked] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showViolationBanner, setShowViolationBanner] = useState<ViolationEvent | null>(null);
  
  // Use refs to track violation timestamps and timer to prevent re-render cleanup cycles
  const lastViolationTimeRef = useRef<number>(0);
  const bannerTimerRef = useRef<any>(null);

  const myPlayer = players?.find((p) => p.id === myPlayerId);

  // Watch violation events for dramatic banner animation
  useEffect(() => {
    if (!activeViolation) {
      setShowViolationBanner(null);
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
      return;
    }

    const now = Date.now();
    // Only trigger if:
    // 1. It is a new violation event we haven't displayed yet
    // 2. It occurred recently (within last 8 seconds) so stale data on page refresh won't pop up!
    if (activeViolation.timestamp > lastViolationTimeRef.current) {
      lastViolationTimeRef.current = activeViolation.timestamp;

      if (now - activeViolation.timestamp < 8000) {
        setShowViolationBanner(activeViolation);

        if (bannerTimerRef.current) {
          clearTimeout(bannerTimerRef.current);
        }

        // Auto close after 2.2 seconds
        bannerTimerRef.current = setTimeout(() => {
          setShowViolationBanner(null);
        }, 2200);
      }
    }
  }, [activeViolation]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  const handleNextTopic = () => {
    sounds.playDing();
    onNextTopic();
  };

  const handleBuzzer = (targetId: string) => {
    sounds.playHammer();
    onReportViolation(targetId);
  };

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    onGuessOwnCard(guessInput.trim());
    setGuessInput('');
    // Modal will be closed by the parent if needed or keep it open if we want to show result
    setGuessModalOpen(false);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 opacity-100">
      {/* Violation Drama Overlay */}
      {showViolationBanner && (
        <div
          onClick={() => setShowViolationBanner(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative pointer-events-auto max-w-md w-full p-6 rounded-2xl bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-2 border-rose-500 shadow-2xl text-center space-y-4 cursor-default animate-bounce"
          >
            {/* Close button in corner */}
            <button
              onClick={() => setShowViolationBanner(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="關閉"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/40">
              <img
                src="/src/assets/images/penalty_toy_hammer_1790299607800.jpg"
                alt="Penalty Toy Hammer"
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-contain drop-shadow"
              />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-black text-rose-400 block mb-1">
                🚨 抓到了！違規暴扣！
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {showViolationBanner.targetPlayerName || '有玩家'} 犯規！
              </h2>
              <div className="mt-2 inline-block px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-amber-300 text-sm font-bold">
                {showViolationBanner.violatedRule || '禁忌動作或禁詞被抓包！'}
              </div>
            </div>
            <p className="text-xs text-rose-200">
              檢舉人：<strong className="text-white">{showViolationBanner.reporterName || '隊友'}</strong> · 生命扣除 1 ❤️
            </p>

            <div className="pt-2">
              <button
                onClick={() => setShowViolationBanner(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                知道了 (點擊關閉)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variety Show Topic Stage */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-amber-950/30 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>綜藝話題引導 · 誘惑對手說出禁詞</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {currentTopic}
            </h2>
            <p className="text-xs text-slate-400">
              ⚠️ 規則提醒：聊天越熱烈，對手越容易露出破綻！保持安靜或消極聊天小心被全員圍剿喔！
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleNextTopic}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>換個辛辣話題</span>
            </button>
            {isHost && (
              <button
                onClick={onResetGame}
                className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
              >
                重置回大廳
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Playing Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Players Forehead Cards Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>全員額頭牌位</span>
              <span className="text-xs text-slate-400 font-normal">
                （你只能看別人的牌，自己的牌絕對保密！）
              </span>
            </h3>
            <span className="text-xs text-amber-400 font-medium">
              存活人數: {players?.filter((p) => !p.isEliminated).length || 0} / {players?.length || 0}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {players?.map((player) => {
              const isMe = player.id === myPlayerId;
              const isEliminated = player.isEliminated;

              return (
                <div
                  key={player.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                    isEliminated
                      ? 'bg-slate-950/60 border-slate-900 opacity-60 grayscale'
                      : isMe
                      ? 'bg-gradient-to-b from-indigo-950/30 to-slate-900/90 border-indigo-500/40 shadow-xl'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg'
                  }`}
                >
                  {/* Player Profile Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                          {player.avatar}
                        </div>
                        {isEliminated && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-rose-600 text-[10px] font-black text-white">
                            OUT
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-white truncate max-w-[110px]">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              你自己
                            </span>
                          )}
                        </div>
                        {/* Lives & Penalty */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center text-xs">
                            {Array.from({ length: player.maxLives || 3 }).map((_, i) => (
                              <Heart
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < player.lives
                                    ? 'text-rose-500 fill-rose-500'
                                    : 'text-slate-700 fill-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            犯規: {player.penaltyCount} 次
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOREHEAD CARD DISPLAY */}
                  <div className="my-2">
                    {isMe ? (
                      /* MY OWN FOREHEAD CARD: MYSTERIOUS & HIDDEN */
                      <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 p-4 text-center min-h-[120px] flex flex-col items-center justify-center shadow-inner">
                        {!selfPeekUnlocked ? (
                          <>
                            <div className="w-10 h-10 mb-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                              <ShieldAlert className="w-5 h-5 animate-pulse" />
                            </div>
                            <span className="text-xs font-black tracking-wide text-indigo-300 block">
                              ??? 你的神秘禁止項 ???
                            </span>
                            <span className="text-[11px] text-indigo-400/80 block mt-0.5">
                              （其他玩家看得一清二楚，你絕對不能看！）
                            </span>
                          </>
                        ) : (
                          /* Cheating / Peek Mode activated */
                          <div className="space-y-1 animate-in fade-in duration-200">
                            <span className="text-[10px] uppercase font-bold text-amber-400 block">
                              ⚠️ 偷看模式（已揭曉）
                            </span>
                            <span className="text-base font-black text-white block">
                              {player.forbiddenCard?.type === 'ACTION' ? '【動作】' : '【禁詞】'}
                              {player.forbiddenCard?.content}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* OTHER PLAYERS' FOREHEAD CARDS: CLEARLY VISIBLE! */
                      <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-rose-950/10 p-4 text-center min-h-[120px] flex flex-col justify-center">
                        <div className="inline-flex items-center justify-center gap-1 mx-auto px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase mb-1.5">
                          {player.forbiddenCard?.type === 'ACTION' ? '🚫 絕對禁止動作' : '💬 絕對禁止詞彙'}
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-sm">
                          {player.forbiddenCard?.content || '摸頭髮'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          💡 陷阱誘餌：快引導他做出這件事！
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {isMe ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isEliminated}
                          onClick={() => setGuessModalOpen(true)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-indigo-900/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>我猜到了！破咒推理</span>
                        </button>

                        <button
                          onClick={() => {
                            sounds.playDing();
                            setSelfPeekUnlocked(!selfPeekUnlocked);
                          }}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                          title={selfPeekUnlocked ? '隱藏我的牌' : '偷瞄我的牌（單人測試或揭曉）'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Buzzer to smack opponent! */
                      <button
                        disabled={isEliminated}
                        onClick={() => handleBuzzer(player.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-40 text-white font-black text-xs shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <span className="text-base">🔨</span>
                        <span>抓到了！犯規暴扣 (-1❤️)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Room Live Chat & Real-Time Event Feed */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden h-[620px]">
          {/* Tabs / Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>房間實時動態 & 聊天室</span>
            </div>
            <span className="text-[11px] text-slate-400">文字陷阱也是戰術！</span>
          </div>

          {/* Feed & Chat List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {/* System Events & Messages combined in chronological order */}
            {historyLog?.slice(-15).map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded-lg text-xs leading-relaxed ${
                  log.type === 'penalty'
                    ? 'bg-rose-950/40 border border-rose-900/60 text-rose-200'
                    : log.type === 'guess_correct'
                    ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-200'
                    : log.type === 'guess_wrong'
                    ? 'bg-amber-950/40 border border-amber-900/60 text-amber-200'
                    : 'bg-slate-950/40 border border-slate-800/80 text-slate-300'
                }`}
              >
                {log.text}
              </div>
            ))}

            {messages?.map((msg) => {
              const isMine = msg.senderId === myPlayerId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5">
                    {msg.avatar} {msg.senderName}
                  </span>
                  <div
                    className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs font-medium ${
                      isMine
                        ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendChatMessage}
            className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="發送訊息引誘對手..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Deduction Guess Modal */}
      {guessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">破咒推理：猜測自己的牌！</h3>
                <p className="text-xs text-slate-400">你覺得剛才大家一直在引誘你做什麼？</p>
              </div>
            </div>

            <form onSubmit={handleSubmitGuess} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  placeholder="輸入你猜測的禁止動作或詞彙 (如: 摸頭髮、說真的嗎)"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
                <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  提示：猜對可回血+換新牌；猜錯會扣 1 顆生命 ❤️ 喔！
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGuessModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  再想想
                </button>
                <button
                  type="submit"
                  disabled={!guessInput.trim()}
                  className="px-5 py-2 text-xs font-bold text-white rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
                >
                  確認猜測！
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
