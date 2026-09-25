/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RoomState, ServerMessage, ClientAction } from './types/game';
import { Navbar } from './components/Navbar';
import { RulesGuideModal } from './components/RulesGuideModal';
import { LobbyView } from './components/LobbyView';
import { GameTableView } from './components/GameTableView';
import { GameOverModal } from './components/GameOverModal';
import { sounds } from './utils/audio';
import { Users, Sparkles, ArrowRight, ShieldCheck, Flame, Laugh } from 'lucide-react';

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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check URL parameters for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomInput(roomFromUrl.toUpperCase());
    }
  }, []);

  // Send message over WebSocket
  const sendAction = useCallback((action: ClientAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  // Connect to WebSocket server
  const connectAndJoin = (targetRoomId: string, name: string, avatar: string) => {
    setIsJoining(true);
    setErrorMsg('');

    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      // Send JOIN_ROOM action
      const joinAction: ClientAction = {
        type: 'JOIN_ROOM',
        roomId: targetRoomId,
        playerName: name || `玩家${Math.floor(Math.random() * 900 + 100)}`,
        avatar,
      };
      socket.send(JSON.stringify(joinAction));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        switch (msg.type) {
          case 'INIT_STATE': {
            setRoom(msg.room);
            setMyPlayerId(msg.yourPlayerId);
            setIsJoining(false);

            // Update URL without reload
            const url = new URL(window.location.href);
            url.searchParams.set('room', msg.room.roomId);
            window.history.replaceState({}, '', url.toString());
            break;
          }

          case 'ROOM_UPDATE': {
            setRoom(msg.room);
            break;
          }

          case 'SOUND_EFFECT': {
            switch (msg.sound) {
              case 'hammer':
                sounds.playHammer();
                break;
              case 'buzzer':
                sounds.playBuzzer();
                break;
              case 'success':
                sounds.playSuccess();
                break;
              case 'cheer':
                sounds.playCheer();
                break;
              case 'ding':
                sounds.playDing();
                break;
            }
            break;
          }

          case 'ERROR': {
            setErrorMsg(msg.message);
            setIsJoining(false);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse server message:', err);
      }
    };

    socket.onerror = () => {
      setErrorMsg('連線伺服器時發生問題，請稍候重試');
      setIsJoining(false);
    };

    socket.onclose = () => {
      // If we were in a room, attempt reconnect in 3s
      if (room) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (room) {
            connectAndJoin(room.roomId, playerName, selectedAvatar);
          }
        }, 3000);
      }
    };
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    connectAndJoin('', playerName, selectedAvatar);
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) {
      setErrorMsg('請輸入房間代碼');
      return;
    }
    connectAndJoin(roomInput.trim().toUpperCase(), playerName, selectedAvatar);
  };

  // Actions passed to components
  const handleToggleReady = () => sendAction({ type: 'TOGGLE_READY' });
  const handleStartGame = () => sendAction({ type: 'START_GAME' });
  const handleNextTopic = () => sendAction({ type: 'NEXT_TOPIC' });
  const handleReportViolation = (targetPlayerId: string) =>
    sendAction({ type: 'REPORT_VIOLATION', targetPlayerId });
  const handleGuessOwnCard = (guess: string) => sendAction({ type: 'GUESS_OWN_CARD', guess });
  const handleSendChat = (text: string) => sendAction({ type: 'SEND_CHAT', text });
  const handleResetGame = () => sendAction({ type: 'RESET_GAME' });
  const handleUpdateSettings = (settings: Record<string, unknown>) =>
    sendAction({ type: 'UPDATE_SETTINGS', settings });
  const handleAddCustomCard = (cardType: 'ACTION' | 'WORD', content: string) =>
    sendAction({ type: 'ADD_CUSTOM_CARD', cardType, content });

  const isHost = room?.hostId === myPlayerId;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        roomId={room?.roomId}
        onOpenRules={() => setRulesOpen(true)}
      />

      <main className="flex-1">
        {!room ? (
          /* Landing Screen: Create or Join Room */
          <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 space-y-12 animate-in fade-in duration-300">
            {/* Hero Title Lockup */}
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
