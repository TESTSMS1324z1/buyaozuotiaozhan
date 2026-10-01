/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RoomState } from './types/game';
import { RulesGuideModal } from './components/RulesGuideModal';
import { LobbyView } from './components/LobbyView';
import { GameTableView } from './components/GameTableView';
import { GameOverModal } from './components/GameOverModal';
import { gameService } from './lib/gameService';
import { sounds } from './utils/audio';

const AVATAR_OPTIONS = ['🦊', '🐼', '🐸', '🐵', '🐱', '🦁', '😎', '🤠', '👻', '🤖', '🍕', '🚀'];

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);

  // Landing input states
  const [roomInput, setRoomInput] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomInput(roomFromUrl.toUpperCase());
      setShowJoinInput(true);
    }
  }, []);

  // Loading Timeout Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (room?.status === 'LOADING') {
      timeout = setTimeout(() => {
        setErrorMsg('連線超時，請檢查網絡或房間代碼是否正確');
        setRoom(null);
        setIsJoining(false);
      }, 10000);
    }
    return () => clearTimeout(timeout);
  }, [room?.status]);

  // Firebase Subscription
  useEffect(() => {
    if (room?.roomId && myPlayerId) {
      const unsub = gameService.subscribeToRoom(room.roomId, myPlayerId, (updatedRoom) => {
        setRoom(updatedRoom);
      });
      return () => unsub();
    }
  }, [room?.roomId, myPlayerId]);

  const handleJoinOrCreate = async (targetRoomId: string) => {
    setIsJoining(true);
    setErrorMsg('');
    try {
      const defaultName = `玩家${Math.floor(Math.random() * 900 + 100)}`;
      const { roomId, playerId } = await gameService.joinRoom(
        targetRoomId, 
        playerName || defaultName, 
        selectedAvatar
      );
      
      setMyPlayerId(playerId);
      setRoom({ roomId, status: 'LOADING' } as any);
      
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      window.history.replaceState({}, '', url.toString());
    } catch (err: any) {
      setErrorMsg(err.message || '加入房間失敗');
      setIsJoining(false);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playDing();
    handleJoinOrCreate('');
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) {
      setErrorMsg('請輸入房間代碼');
      return;
    }
    sounds.playDing();
    handleJoinOrCreate(roomInput.trim().toUpperCase());
  };

  const handleLeaveRoom = () => {
    setRoom(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  // Actions
  const handleToggleReady = () => {
    const me = room?.players?.find(p => p.id === myPlayerId);
    if (me && room?.roomId) {
      gameService.toggleReady(room.roomId, myPlayerId, !me.isReady);
    }
  };

  const handleStartGame = () => {
    if (room?.roomId && room.players) {
      gameService.startGame(room.roomId, room.players);
    }
  };

  const handleReportViolation = (targetPlayerId: string) => {
    const me = room?.players?.find(p => p.id === myPlayerId);
    if (room?.roomId && me) {
      gameService.reportViolation(room.roomId, targetPlayerId, me.name);
    }
  };

  const handleGuessOwnCard = async (guess: string) => {
    if (room?.roomId) {
      const isCorrect = await gameService.guessCard(room.roomId, myPlayerId, guess);
      if (isCorrect) {
        handleSendChat(`💡 我猜對了！我的卡牌真的是「${guess}」！`);
      }
    }
  };

  const handleSendChat = (text: string) => {
    const me = room?.players?.find(p => p.id === myPlayerId);
    if (room?.roomId && me) {
      gameService.sendChat(room.roomId, myPlayerId, me.name, text);
    }
  };

  const handleUpdateSettings = (settings: Record<string, unknown>) => {
    if (room?.roomId) {
      gameService.updateSettings(room.roomId, settings);
    }
  };

  const handleAddCustomCard = (cardType: 'ACTION' | 'WORD', content: string) => {
    if (room?.roomId && room.settings) {
      const currentCards = room.settings.customCards || [];
      const updated = [...currentCards, { type: cardType, content }];
      gameService.updateSettings(room.roomId, { customCards: updated });
    }
  };

  const handleNextTopic = () => {
    if (room?.roomId) {
      gameService.nextTopic(room.roomId, room.topicIndex || 0);
    }
  };

  const handleResetGame = () => {
    if (room?.roomId) {
      gameService.resetGame(room.roomId);
    }
  };

  const isHost = room?.hostId === myPlayerId;

  return (
    <div className="min-h-screen bg-[#2b2118] text-[#2b2118] flex items-center justify-center p-0 sm:p-3 overflow-hidden select-none font-sans">
      {/* 橫向手遊外框 (.game-phone-frame) */}
      <div className="game-phone-frame">
        {/* 背景裝飾泡泡 (全部頁面共用) */}
        <div className="absolute rounded-full pointer-events-none opacity-35 -top-16 -left-12 w-64 h-64 bg-[#ffd23f] blur-xs" />
        <div className="absolute rounded-full pointer-events-none opacity-35 -bottom-16 -right-10 w-56 h-56 bg-[#ff5d8f] blur-xs" />
        <div className="absolute rounded-full pointer-events-none opacity-25 top-28 -right-8 w-44 h-44 bg-[#4dabff] blur-xs" />

        {!room ? (
          /* ==========================================================
             頁面 1：開始畫面 (Screen Start)
             ========================================================== */
          <section className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-lg text-center">
              
              {/* Logo Lockup */}
              <div className="animate-float">
                <div className="text-6xl sm:text-7xl leading-none drop-shadow-[0_5px_0_rgba(43,33,24,0.18)]">
                  🙅
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-[#2b2118] tracking-tight mt-1 drop-shadow-[3px_3px_0_#fff]">
                  不要做挑戰
                </h1>
                <p className="text-[11px] font-black tracking-[0.35em] text-[#7a6a58] uppercase mt-0.5">
                  DON'T DO CHALLENGE
                </p>
              </div>

              {/* Start Tagline */}
              <p className="text-xs sm:text-sm font-bold text-[#7a6a58] leading-relaxed bg-white border-3 border-dashed border-[#ff9f1c] rounded-2xl px-4 py-2 shadow-[0_3px_0_rgba(43,33,24,0.1)]">
                你看不到自己的禁忌牌，<br className="sm:hidden" />只能看到別人的——小心別踩雷！
              </p>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-[#ff3b3b] text-white text-xs font-black border-2 border-[#2b2118] shadow-md">
                  {errorMsg}
                </div>
              )}

              {/* 玩家個人資訊設定（頭像 + 暱稱） */}
              <div className="w-full bg-white/80 border-3 border-[#2b2118] rounded-2xl p-3 shadow-[0_4px_0_rgba(43,33,24,0.15)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#7a6a58]">選擇頭像</span>
                  <input
                    type="text"
                    placeholder="輸入暱稱 (選填)..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={10}
                    className="px-2.5 py-1 text-xs bg-[#fff7e6] border-2 border-[#2b2118] rounded-xl text-[#2b2118] placeholder-[#7a6a58]/60 font-bold focus:outline-none w-36 sm:w-44 text-center"
                  />
                </div>

                <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        sounds.playDing();
                        setSelectedAvatar(av);
                      }}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-transform cursor-pointer border-2 ${
                        selectedAvatar === av
                          ? 'bg-[#ffd23f] border-[#2b2118] scale-110 shadow-[0_3px_0_rgba(43,33,24,0.2)]'
                          : 'bg-white border-[#e8ddcb] hover:border-[#2b2118]'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center pt-1">
                <button
                  onClick={handleCreateRoom}
                  disabled={isJoining}
                  className="btn-cartoon btn-cartoon-orange py-2.5 sm:py-3 px-8 text-sm sm:text-base font-black cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                >
                  {isJoining ? '建立中...' : '🏠 建立房間'}
                </button>

                {!showJoinInput ? (
                  <button
                    onClick={() => {
                      sounds.playDing();
                      setShowJoinInput(true);
                    }}
                    className="btn-cartoon btn-cartoon-white py-2.5 sm:py-3 px-8 text-sm sm:text-base font-black cursor-pointer w-full sm:w-auto"
                  >
                    🎮 快速加入
                  </button>
                ) : (
                  <form onSubmit={handleJoinExistingRoom} className="flex items-center gap-1.5 w-full sm:w-auto">
                    <input
                      type="text"
                      autoFocus
                      placeholder="房號 (如 B7K2)"
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="px-3 py-2 text-xs sm:text-sm uppercase font-mono font-black tracking-widest bg-white border-3 border-[#2b2118] rounded-full text-[#9b5de5] placeholder-[#7a6a58]/50 focus:outline-none w-32 sm:w-36 text-center"
                    />
                    <button
                      type="submit"
                      disabled={isJoining || !roomInput.trim()}
                      className="btn-cartoon btn-cartoon-purple py-2 px-4 text-xs font-black cursor-pointer disabled:opacity-40"
                    >
                      加入
                    </button>
                  </form>
                )}
              </div>

              {/* Start Footer */}
              <div className="flex items-center gap-3 text-[11px] font-bold text-[#7a6a58] pt-1">
                <span className="bg-white border-2 border-[#e8ddcb] rounded-full px-2.5 py-0.5">
                  v1.0 橫向手遊版
                </span>
                <span>🟢 派對隨時開局</span>
                <button
                  onClick={() => setRulesOpen(true)}
                  className="underline hover:text-[#2b2118] cursor-pointer"
                >
                  玩法規則
                </button>
              </div>

            </div>
          </section>
        ) : (room as any).status === 'LOADING' ? (
          /* 連線載入中畫面 */
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-5xl animate-bounce">
              ⏳
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#2b2118]">正在進入房間...</h2>
              <p className="text-xs font-bold text-[#7a6a58]">同步牌庫與房間數據</p>
            </div>
          </div>
        ) : room.status === 'LOBBY' ? (
          /* ==========================================================
             頁面 2：房主房間畫面 (Screen Room / 8人座位格)
             ========================================================== */
          <LobbyView
            roomId={room.roomId}
            myPlayerId={myPlayerId}
            players={room.players}
            isHost={isHost}
            settings={room.settings}
            onToggleReady={handleToggleReady}
            onStartGame={handleStartGame}
            onUpdateSettings={handleUpdateSettings}
            onAddCustomCard={handleAddCustomCard}
            onLeaveRoom={handleLeaveRoom}
            onOpenRules={() => setRulesOpen(true)}
          />
        ) : (
          /* ==========================================================
             頁面 3：遊戲畫面 (Screen Game / 環繞對手與中央神秘牌)
             ========================================================== */
          <>
            <GameTableView
              roomId={room.roomId}
              myPlayerId={myPlayerId}
              players={room.players}
              isHost={isHost}
              currentTopic={room.currentTopic}
              activeViolation={room.activeViolation}
              messages={room.messages}
              historyLog={room.historyLog}
              onNextTopic={handleNextTopic}
              onReportViolation={handleReportViolation}
              onGuessOwnCard={handleGuessOwnCard}
              onSendChat={handleSendChat}
              onResetGame={handleResetGame}
            />

            {room.status === 'GAME_OVER' && (
              <GameOverModal
                players={room.players}
                isHost={isHost}
                onResetGame={handleResetGame}
              />
            )}
          </>
        )}
      </div>

      {/* Rules Guide Modal */}
      <RulesGuideModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}
