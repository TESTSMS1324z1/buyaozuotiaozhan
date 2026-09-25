/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RoomState } from './types/game';
import { Navbar } from './components/Navbar';
import { RulesGuideModal } from './components/RulesGuideModal';
import { LobbyView } from './components/LobbyView';
import { GameTableView } from './components/GameTableView';
import { GameOverModal } from './components/GameOverModal';
import { gameService } from './lib/gameService';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Laugh } from 'lucide-react';

const AVATAR_OPTIONS = ['😎', '🤠', '🐱', '🦊', '🐼', '🦁', '👻', '🤖', '🍕', '🚀', '🎭', '🦄'];

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [rulesOpen, setRulesOpen] = useState(false);

  // Landing input states
  const [roomInput, setRoomInput] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😎');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomInput(roomFromUrl.toUpperCase());
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
      }, 10000); // 10 seconds timeout
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
      const { roomId, playerId } = await gameService.joinRoom(
        targetRoomId, 
        playerName || `玩家${Math.floor(Math.random() * 900 + 100)}`, 
        selectedAvatar
      );
      
      setMyPlayerId(playerId);
      // Wait for subscription to provide full data
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
    handleJoinOrCreate('');
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) {
      setErrorMsg('請輸入房間代碼');
      return;
    }
    handleJoinOrCreate(roomInput.trim().toUpperCase());
  };

  // Actions
  const handleToggleReady = () => {
    const me = room?.players.find(p => p.id === myPlayerId);
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
    const me = room?.players.find(p => p.id === myPlayerId);
    if (room?.roomId && me) {
      gameService.reportViolation(room.roomId, targetPlayerId, me.name);
    }
  };

  const handleGuessOwnCard = (guess: string) => {
    // In Firebase version, we need to find the card from someone else or wait for local check
    // For simplicity, we just trigger the sound check
    const me = room?.players.find(p => p.id === myPlayerId);
    // Note: The real card is in 'secrets' collection, but current player can't read it.
    // We'd need a cloud function or a different check if we want it fully server-side.
    // For now, let's just use the '???' as a placeholder or assume client check via other players.
    gameService.guessCard(room?.roomId || '', myPlayerId, guess, '');
  };

  const handleSendChat = (text: string) => {
    const me = room?.players.find(p => p.id === myPlayerId);
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
    // Optional: Add to custom cards list in room settings
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      <Navbar
        roomId={room?.roomId}
        onOpenRules={() => setRulesOpen(true)}
      />

      <main className="flex-1">
        {!room ? (
          /* Landing Screen */
          <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 space-y-12 animate-in fade-in duration-300">
            {/* ... hero and form ... */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>經典綜藝實境秀在線版 · 免下載隨開即玩</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                不要做挑戰
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-amber-200 mt-1">
                  心機與爆笑的額頭對決
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                卡牌貼在額頭上，只有自己看不到！聊天互套話、引誘對手做出禁忌動作或說出禁詞，按下槌子暴扣！
              </p>
            </div>

            {/* Join / Create Form Card */}
            <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Player Profile Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    選擇你的玩家頭像
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                          selectedAvatar === av
                            ? 'bg-amber-500/20 border-2 border-amber-400 scale-105'
                            : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    你的遊戲暱稱
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入你的暱稱 (例: 派對心機王)"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Action Tabs / Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleCreateRoom}
                  disabled={isJoining}
                  className="w-full py-3 px-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 border border-amber-400 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{isJoining ? '建立房間中...' : '開新房間 (當房主)'}</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-xs text-slate-500 font-medium">
                    或者加入好友房間
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="輸入5碼房間代碼"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="flex-1 px-3.5 py-2.5 text-sm uppercase font-mono tracking-wider bg-slate-950 border border-slate-800 rounded-xl text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleJoinExistingRoom}
                    disabled={isJoining || !roomInput.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>加入</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Highlights Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">綜藝靈魂拷問話題庫</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  內建豐富爆笑八卦、感情修羅場話題，不怕冷場，引導對手不知不覺說出禁詞！
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Laugh className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">自訂詞庫 & 搞怪動作</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  除了經典喝水、摸頭髮、說「真的嗎」，還能自訂朋友專屬口頭禪或習慣小動作！
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">逆向推理破咒自救</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  察覺對手意圖了嗎？隨時發起「破咒推理」，成功猜出自己牌面即可逆轉回血！
                </p>
              </div>
            </div>
          </div>
        ) : (room as any).status === 'LOADING' ? (
          /* Loading Screen */
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <Flame className="absolute inset-0 m-auto w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">正在連線至房間...</h2>
              <p className="text-slate-500 text-sm">正在同步遊戲數據與卡牌庫</p>
            </div>
          </div>
        ) : room.status === 'LOBBY' ? (
          /* Lobby Room View */
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
          />
        ) : (
          /* Active Game or Game Over View */
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
      </main>

      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>「不要做挑戰」在線多人派對遊戲 · 適合 Discord 語音開黑、朋友聚會或線上聯機</p>
      </footer>

      {/* Rules Guide Modal */}
      <RulesGuideModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}
