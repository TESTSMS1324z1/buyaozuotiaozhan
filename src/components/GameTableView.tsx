import React, { useState, useEffect, useRef } from 'react';
import { Player, ViolationEvent, ChatMessage } from '../types/game';
import { Eye, Sparkles, MessageSquare, X, Send } from 'lucide-react';
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

const PRESET_QUICK_CHATS = [
  '你在引誘我吧？😏',
  '哈哈抓到了！🔨',
  '這局太難猜了！🤔',
  '快換個話題！🔥',
  '好險沒中招！😮',
];

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
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [showViolationBanner, setShowViolationBanner] = useState<ViolationEvent | null>(null);

  const lastViolationTimeRef = useRef<number>(0);
  const bannerTimerRef = useRef<any>(null);

  const myPlayer = players?.find((p) => p.id === myPlayerId);
  const opponents = players?.filter((p) => p.id !== myPlayerId) || [];

  // Watch violation events for dramatic full-screen flash animation
  useEffect(() => {
    if (!activeViolation) {
      setShowViolationBanner(null);
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
      return;
    }

    const now = Date.now();
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
    setGuessModalOpen(false);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const handleQuickChat = (text: string) => {
    onSendChat(text);
    sounds.playDing();
  };

  // Card color cycle
  const cardColorClasses = [
    'bg-[#ff5d8f] rotate-[-2deg]',
    'bg-[#4dabff] rotate-[2deg]',
    'bg-[#9b5de5] rotate-[-3deg]',
    'bg-[#ff9f1c] rotate-[1.5deg]',
  ];

  return (
    <div className="relative flex-1 flex flex-col p-3 sm:p-4 justify-between overflow-hidden select-none">
      {/* 全螢幕違規暴扣閃光回饋 (Flash Overlay) */}
      {showViolationBanner && (
        <div
          onClick={() => setShowViolationBanner(null)}
          className="flash-overlay bg-[#ff3b3b]/95 text-white cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="text-center space-y-2 p-6 rounded-3xl bg-[#2b2118]/40 border-4 border-white max-w-sm w-full mx-4 shadow-2xl animate-bounce"
          >
            <div className="text-6xl drop-shadow-md">🔨</div>
            <div className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
              抓到了！犯規！
            </div>
            <div className="text-lg font-black text-[#ffd23f]">
              {showViolationBanner.targetPlayerName} 違規！
            </div>
            <div className="inline-block px-3 py-1 rounded-xl bg-white text-[#2b2118] text-xs font-black">
              {showViolationBanner.violatedRule || '禁忌動作或禁詞被抓包！'}
            </div>
            <div className="text-xs font-bold text-white/90 pt-1">
              檢舉人: {showViolationBanner.reporterName || '隊友'} · 生命扣除 1 ❤
            </div>
            <button
              onClick={() => setShowViolationBanner(null)}
              className="mt-2 btn-cartoon btn-cartoon-white px-5 py-1 text-xs cursor-pointer"
            >
              知道了 (點擊關閉)
            </button>
          </div>
        </div>
      )}

      {/* 1. 遊戲頂部 HUD */}
      <header className="flex items-center justify-between gap-2 shrink-0 z-10">
        {/* 左側：綜藝話題卡 */}
        <div className="flex items-center gap-2 bg-white border-3 border-[#2b2118] rounded-2xl px-3 py-1 shadow-[0_4px_0_rgba(43,33,24,0.18)] max-w-xs sm:max-w-md truncate">
          <span className="text-base sm:text-lg shrink-0">🔥</span>
          <div className="truncate">
            <span className="text-[10px] font-bold text-[#7a6a58] block leading-none">綜藝引導話題</span>
            <span className="text-xs sm:text-sm font-black text-[#ff9f1c] truncate block">
              {currentTopic}
            </span>
          </div>
        </div>

        {/* 中央：對決回合 pill */}
        <div className="bg-[#9b5de5] text-white border-3 border-[#2b2118] rounded-full px-4 py-1.5 font-black text-xs sm:text-sm shadow-[0_4px_0_rgba(43,33,24,0.18)] whitespace-nowrap hidden xs:block">
          激烈對決中 ⚡
        </div>

        {/* 右側：我的生命值 ❤ */}
        <div className="flex items-center gap-1 bg-white border-3 border-[#2b2118] rounded-2xl px-3 py-1.5 shadow-[0_4px_0_rgba(43,33,24,0.18)]">
          <span className="text-[10px] font-black text-[#7a6a58] mr-1 hidden sm:inline">生命:</span>
          {Array.from({ length: myPlayer?.maxLives || 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-lg sm:text-xl leading-none transition-transform ${
                i < (myPlayer?.lives || 0) ? 'text-[#ff3b3b]' : 'text-[#d8cfc4] scale-90'
              }`}
            >
              ❤
            </span>
          ))}
        </div>
      </header>

      {/* 2. 遊戲主舞台：對手環繞四周 + 中央自己的神秘牌 */}
      <main className="relative flex-1 my-2 min-h-0 flex items-center justify-center">
        {/* 對手列表 (分佈在四周) */}
        {opponents.length === 0 ? (
          <div className="absolute top-2 left-2 text-xs font-bold text-[#7a6a58] bg-white/70 px-3 py-1 rounded-full border-2 border-[#2b2118]">
            目前為單人測試模式，可點擊下方「偷瞄模式」揭牌！
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none">
            {opponents.map((player, idx) => {
              const colorClass = cardColorClasses[idx % cardColorClasses.length];
              const isEliminated = player.isEliminated;

              // Position based on index
              const posClasses = [
                'top-0 left-2 sm:left-4',
                'top-0 right-2 sm:right-4',
                'bottom-2 left-2 sm:left-4',
                'bottom-2 right-2 sm:right-4',
                'top-1/2 -translate-y-1/2 left-2',
                'top-1/2 -translate-y-1/2 right-2',
              ];
              const pos = posClasses[idx % posClasses.length];

              return (
                <div
                  key={player.id}
                  className={`absolute pointer-events-auto flex flex-col items-center gap-1 transition-all ${pos} ${
                    isEliminated ? 'opacity-40 grayscale' : 'animate-float'
                  }`}
                  style={{ animationDelay: `${idx * 0.4}s` }}
                >
                  {/* 對手頭像 */}
                  <div className="relative">
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#ffd23f] border-3 border-[#2b2118] flex items-center justify-center text-2xl sm:text-3xl shadow-[0_4px_0_rgba(43,33,24,0.18)]">
                      {player.avatar}
                    </div>
                    {isEliminated && (
                      <span className="absolute -top-1 -right-1 text-[9px] font-black bg-red-600 text-white rounded-full px-1 py-0.2 border border-white">
                        OUT
                      </span>
                    )}
                  </div>

                  {/* 對手的額頭牌：看得見內容！ */}
                  <div
                    className={`${colorClass} text-white border-3 border-[#2b2118] rounded-xl px-2.5 py-1 text-center shadow-[0_4px_0_rgba(43,33,24,0.18)] min-w-[120px] max-w-[150px]`}
                  >
                    <span className="block text-[9px] font-black opacity-90 tracking-wider">
                      {player.forbiddenCard?.type === 'ACTION' ? '🚫 不可以做' : '💬 不可以說'}
                    </span>
                    <span className="block text-xs sm:text-sm font-black truncate drop-shadow-sm">
                      {player.forbiddenCard?.content || '摸頭髮'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-[#2b2118] bg-white border-2 border-[#2b2118] rounded-full px-2 py-0.2">
                      {player.name}
                    </span>

                    {/* 暴扣槌按鈕 */}
                    <button
                      disabled={isEliminated}
                      onClick={() => handleBuzzer(player.id)}
                      className="btn-cartoon btn-cartoon-rose px-2 py-0.5 text-[10px] flex items-center gap-0.5 cursor-pointer disabled:opacity-40"
                      title="抓到了！氣槌扣除愛心"
                    >
                      <span>🔨</span>
                      <span>抓到!</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 中央：自己的狀態 + 神秘問號牌 */}
        <div className="relative z-10 flex flex-col items-center text-center gap-1.5">
          <div className="relative animate-float">
            {/* 我的圓形大頭像 */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ff9f1c] border-4 border-[#2b2118] flex items-center justify-center text-3xl sm:text-4xl shadow-[0_5px_0_rgba(43,33,24,0.18)]">
              {myPlayer?.avatar}
            </div>

            {/* 自己的神秘牌：黑色問號牌，保密看不見！ */}
            <div
              className={`absolute -top-3 -right-4 w-11 h-11 sm:w-13 sm:h-13 rounded-xl border-3 border-white flex flex-col items-center justify-center shadow-[0_4px_0_rgba(43,33,24,0.2)] rotate-8 transition-transform cursor-pointer ${
                selfPeekUnlocked ? 'bg-[#ff9f1c]' : 'bg-[#2b2118]'
              }`}
              onClick={() => {
                sounds.playDing();
                setSelfPeekUnlocked(!selfPeekUnlocked);
              }}
              title="點擊切換偷瞄模式"
            >
              {!selfPeekUnlocked ? (
                <span className="text-xl sm:text-2xl font-black text-[#ffd23f] leading-none">
                  ?
                </span>
              ) : (
                <span className="text-[9px] font-black text-white p-0.5 leading-tight text-center">
                  {myPlayer?.forbiddenCard?.content || '未知'}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm font-black text-[#2b2118] leading-tight">
            你的禁忌牌是秘密 🤫
          </p>
          <p className="text-[11px] font-bold text-[#7a6a58] -mt-0.5">
            只能看別人的牌，小心別被誘惑！
          </p>

          <button
            type="button"
            onClick={() => {
              sounds.playDing();
              setSelfPeekUnlocked(!selfPeekUnlocked);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-[#7a6a58] hover:text-[#2b2118] bg-white/70 border border-[#2b2118]/30 rounded-full px-2.5 py-0.5 cursor-pointer mt-0.5"
          >
            <Eye className="w-3 h-3" />
            <span>{selfPeekUnlocked ? '隱藏我的牌' : '偷瞄模式 (單人測試)'}</span>
          </button>
        </div>
      </main>

      {/* 3. 遊戲底部控制列 */}
      <footer className="flex items-center justify-center gap-2 sm:gap-3 shrink-0 z-10 pt-1">
        <button
          onClick={handleNextTopic}
          className="btn-cartoon btn-cartoon-white px-3 sm:px-4 py-1.5 text-xs font-black cursor-pointer flex items-center gap-1"
        >
          <span>🎲</span>
          <span>換一張</span>
        </button>

        <button
          disabled={myPlayer?.isEliminated}
          onClick={() => setGuessModalOpen(true)}
          className="btn-cartoon btn-cartoon-orange px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-black cursor-pointer disabled:opacity-40 flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>破咒自救！我猜到了</span>
        </button>

        <button
          onClick={() => setChatDrawerOpen(!chatDrawerOpen)}
          className={`btn-cartoon ${
            chatDrawerOpen ? 'btn-cartoon-purple' : 'btn-cartoon-white'
          } px-3 sm:px-4 py-1.5 text-xs font-black cursor-pointer flex items-center gap-1`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>聊天室</span>
        </button>

        {isHost && (
          <button
            onClick={onResetGame}
            className="btn-cartoon btn-cartoon-white px-2.5 py-1.5 text-xs font-black cursor-pointer text-[#7a6a58] hover:text-[#2b2118]"
            title="重置回大廳"
          >
            回大廳
          </button>
        )}
      </footer>

      {/* 彈出式即時聊天與戰況播報 (Chat Drawer) */}
      {chatDrawerOpen && (
        <div className="absolute inset-x-3 bottom-12 top-14 z-40 bg-[#fff7e6] border-4 border-[#2b2118] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
          <div className="p-2.5 bg-[#ffe9c7] border-b-3 border-[#2b2118] flex items-center justify-between">
            <span className="text-xs font-black text-[#2b2118] flex items-center gap-1">
              <span>💬 房間實時動態 & 聊天誘惑</span>
            </span>
            <button
              onClick={() => setChatDrawerOpen(false)}
              className="w-6 h-6 rounded-full bg-white border-2 border-[#2b2118] flex items-center justify-center text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* System combat logs */}
            {historyLog?.slice(-8).map((log) => (
              <div
                key={log.id}
                className="text-[11px] font-bold p-1.5 rounded-xl bg-white border-2 border-[#2b2118] text-[#7a6a58]"
              >
                {log.text}
              </div>
            ))}

            {/* Chat messages */}
            {messages?.map((msg) => {
              const isMine = msg.senderId === myPlayerId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-bold text-[#7a6a58]">
                    {msg.avatar} {msg.senderName}
                  </span>
                  <div
                    className={`max-w-[80%] px-3 py-1 rounded-xl text-xs font-black border-2 border-[#2b2118] ${
                      isMine ? 'bg-[#ff9f1c] text-white' : 'bg-white text-[#2b2118]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick chips */}
          <div className="px-2 py-1 flex gap-1 overflow-x-auto border-t-2 border-[#e8ddcb]">
            {PRESET_QUICK_CHATS.map((c) => (
              <button
                key={c}
                onClick={() => handleQuickChat(c)}
                className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#2b2118] cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSendChatMessage} className="p-2 border-t-2 border-[#2b2118] flex gap-1.5 bg-white">
            <input
              type="text"
              placeholder="輸入文字誘惑對手..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-1 text-xs bg-[#fff7e6] border-2 border-[#2b2118] rounded-xl text-[#2b2118] font-bold focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="btn-cartoon btn-cartoon-orange px-3 py-1 text-xs cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 破咒自猜對話框 (Guess Modal) */}
      {guessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2b2118]/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#fff7e6] to-[#ffe9c7] border-4 border-[#2b2118] rounded-[28px] p-5 shadow-2xl text-[#2b2118] space-y-3">
            <div className="text-center space-y-1">
              <span className="text-3xl">✨</span>
              <h3 className="text-lg font-black text-[#2b2118]">破咒自救：猜測自己的牌面！</h3>
              <p className="text-xs font-bold text-[#7a6a58]">
                剛才對手一直在聊什麼、誘惑你做什麼小動作？
              </p>
            </div>

            <form onSubmit={handleSubmitGuess} className="space-y-3 pt-1">
              <input
                type="text"
                autoFocus
                placeholder="輸入猜測動作或禁詞 (例: 摸頭髮、說好)"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border-3 border-[#2b2118] rounded-xl text-[#2b2118] font-bold focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuessModalOpen(false)}
                  className="btn-cartoon btn-cartoon-white px-3 py-1.5 text-xs cursor-pointer"
                >
                  再想想
                </button>
                <button
                  type="submit"
                  disabled={!guessInput.trim()}
                  className="btn-cartoon btn-cartoon-orange px-4 py-1.5 text-xs cursor-pointer disabled:opacity-40"
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
