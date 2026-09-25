import http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomState, Player, ClientAction, ServerMessage, ViolationEvent } from './src/types/game.js';
import { PRESET_CARDS, VARIETY_TOPICS } from './src/data/defaultCards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;
const isDev = process.env.NODE_ENV !== 'production';

// In-memory room store
const rooms = new Map<string, RoomState>();
// Map WebSocket connections to { roomId, playerId }
const clientSessions = new Map<WebSocket, { roomId: string; playerId: string }>();

// Helper to broadcast to all clients in a specific room
function broadcastToRoom(roomId: string, message: ServerMessage) {
  const json = JSON.stringify(message);
  for (const [ws, session] of clientSessions.entries()) {
    if (session.roomId === roomId && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate unique 5-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create initial room state
function createInitialRoom(roomId: string, hostId: string, hostPlayer: Player): RoomState {
  return {
    roomId,
    hostId,
    status: 'LOBBY',
    settings: {
      initialLives: 3,
      deckCategories: ['daily', 'chat', 'body', 'hardcore'],
      enableDeductionGuess: true,
      roundDurationMinutes: 0,
      customCards: [],
    },
    players: [hostPlayer],
    currentTopic: VARIETY_TOPICS[Math.floor(Math.random() * VARIETY_TOPICS.length)],
    topicIndex: 0,
    historyLog: [
      {
        id: `log-${Date.now()}`,
        text: `房間 ${roomId} 已創建，等待好友加入！`,
        type: 'join',
        timestamp: Date.now(),
      },
    ],
    messages: [],
  };
}

// Deal forbidden cards to all players in the room
function dealCardsToPlayers(room: RoomState) {
  // Filter presets based on selected categories
  const categories = new Set(room.settings.deckCategories);
  const eligiblePresets = PRESET_CARDS.filter((card) => categories.has(card.category));

  // Merge with custom cards
  const allCardPool: Array<{ id: string; type: 'ACTION' | 'WORD'; content: string }> = [
    ...eligiblePresets.map((c) => ({ id: c.id, type: c.type, content: c.content })),
    ...room.settings.customCards.map((c, i) => ({ id: `custom-${i}-${Date.now()}`, type: c.type, content: c.content })),
  ];

  const shuffledPool = shuffle(allCardPool);

  room.players.forEach((player, idx) => {
    const card = shuffledPool[idx % shuffledPool.length];
    player.forbiddenCard = {
      id: card.id,
      type: card.type,
      content: card.content,
    };
    player.lives = room.settings.initialLives;
    player.maxLives = room.settings.initialLives;
    player.penaltyCount = 0;
    player.isEliminated = false;
    player.hasGuessed = false;
  });
}

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (raw: string) => {
    try {
      const action = JSON.parse(raw.toString()) as ClientAction;

      switch (action.type) {
        case 'JOIN_ROOM': {
          let roomId = action.roomId.trim().toUpperCase();
          if (!roomId) {
            roomId = generateRoomCode();
          }

          let room = rooms.get(roomId);
          const playerId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const isHost = !room || room.players.length === 0;

          const newPlayer: Player = {
            id: playerId,
            name: action.playerName.trim() || `玩家${Math.floor(Math.random() * 900 + 100)}`,
            avatar: action.avatar || '😎',
            isHost,
            isReady: isHost, // Host is ready by default
            lives: 3,
            maxLives: 3,
            penaltyCount: 0,
            isEliminated: false,
          };

          if (!room) {
            room = createInitialRoom(roomId, playerId, newPlayer);
            rooms.set(roomId, room);
          } else {
            // Check if player name exists, if so append a number
            if (room.players.some((p) => p.name === newPlayer.name)) {
              newPlayer.name = `${newPlayer.name}_${room.players.length + 1}`;
            }
            room.players.push(newPlayer);
            room.historyLog.push({
              id: `log-${Date.now()}`,
              text: `✨ ${newPlayer.avatar} ${newPlayer.name} 加入了房間！`,
              type: 'join',
              timestamp: Date.now(),
            });
          }

          clientSessions.set(ws, { roomId, playerId });

          // Send initial state to the connecting client
          const initMsg: ServerMessage = {
            type: 'INIT_STATE',
            room,
            yourPlayerId: playerId,
          };
          ws.send(JSON.stringify(initMsg));

          // Broadcast room update to everyone
          broadcastToRoom(roomId, {
            type: 'ROOM_UPDATE',
            room,
          });
          break;
        }

        case 'TOGGLE_READY': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room) return;

          const player = room.players.find((p) => p.id === session.playerId);
          if (player) {
            player.isReady = !player.isReady;
            broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          }
          break;
        }

        case 'UPDATE_SETTINGS': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room || room.hostId !== session.playerId) return;

          room.settings = { ...room.settings, ...action.settings };
          broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          break;
        }

        case 'ADD_CUSTOM_CARD': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room) return;

          if (action.content.trim()) {
            room.settings.customCards.push({
              type: action.cardType,
              content: action.content.trim(),
            });
            broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          }
          break;
        }

        case 'START_GAME': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room || room.hostId !== session.playerId) return;

          // Check minimum players (at least 2 is standard, but allow 1+ for preview testing)
          dealCardsToPlayers(room);
          room.status = 'PLAYING';
          room.roundStartTime = Date.now();
          room.currentTopic = VARIETY_TOPICS[Math.floor(Math.random() * VARIETY_TOPICS.length)];
          room.historyLog.push({
            id: `log-${Date.now()}`,
            text: `🎮 遊戲開始！每位玩家的額頭上已佩戴神秘卡牌，絕對不要看自己的牌！`,
            type: 'topic',
            timestamp: Date.now(),
          });

          broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          broadcastToRoom(session.roomId, { type: 'SOUND_EFFECT', sound: 'ding' });
          break;
        }

        case 'NEXT_TOPIC': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room) return;

          room.topicIndex = (room.topicIndex + 1) % VARIETY_TOPICS.length;
          room.currentTopic = VARIETY_TOPICS[room.topicIndex];
          room.historyLog.push({
            id: `log-${Date.now()}`,
            text: `💬 綜藝話題更新：${room.currentTopic}`,
            type: 'topic',
            timestamp: Date.now(),
          });

          broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          broadcastToRoom(session.roomId, { type: 'SOUND_EFFECT', sound: 'ding' });
          break;
        }

        case 'REPORT_VIOLATION': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room || room.status !== 'PLAYING') return;

          const reporter = room.players.find((p) => p.id === session.playerId);
          const target = room.players.find((p) => p.id === action.targetPlayerId);

          if (!target || target.isEliminated || !target.forbiddenCard) return;

          // Deduct life
          target.lives = Math.max(0, target.lives - 1);
          target.penaltyCount += 1;

          const isEliminatedNow = target.lives === 0;
          if (isEliminatedNow) {
            target.isEliminated = true;
          }

          const violationEvent: ViolationEvent = {
            id: `v-${Date.now()}`,
            targetPlayerId: target.id,
            targetPlayerName: target.name,
            reporterId: reporter ? reporter.id : 'system',
            reporterName: reporter ? reporter.name : '大家',
            violatedRule: `【${target.forbiddenCard.type === 'ACTION' ? '動作' : '禁詞'}】${target.forbiddenCard.content}`,
            timestamp: Date.now(),
            confirmed: true,
          };

          room.activeViolation = violationEvent;

          room.historyLog.push({
            id: `log-${Date.now()}`,
            text: `🔨 ${reporter ? reporter.name : '大家'} 抓到了 ${target.name}！犯規：${violationEvent.violatedRule} (-1❤️)`,
            type: 'penalty',
            timestamp: Date.now(),
          });

          if (isEliminatedNow) {
            room.historyLog.push({
              id: `log-${Date.now()}-elim`,
              text: `💀 ${target.name} 生命歸零，慘遭淘汰出局！`,
              type: 'penalty',
              timestamp: Date.now(),
            });
          }

          // Check game over condition:
          // If total active players >= 2 and only 1 survivor left
          const activeSurvivors = room.players.filter((p) => !p.isEliminated);
          if (room.players.length >= 2 && activeSurvivors.length <= 1) {
            room.status = 'GAME_OVER';
            room.historyLog.push({
              id: `log-${Date.now()}-over`,
              text: `🏆 遊戲結束！最終倖存者誕生！`,
              type: 'topic',
              timestamp: Date.now(),
            });
            broadcastToRoom(session.roomId, { type: 'SOUND_EFFECT', sound: 'cheer' });
          } else {
            broadcastToRoom(session.roomId, { type: 'SOUND_EFFECT', sound: 'hammer' });
          }

          broadcastToRoom(session.roomId, {
            type: 'VIOLATION_TRIGGERED',
            violation: violationEvent,
          });
          broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          break;
        }

        case 'GUESS_OWN_CARD': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room || room.status !== 'PLAYING') return;

          const player = room.players.find((p) => p.id === session.playerId);
          if (!player || player.isEliminated || !player.forbiddenCard) return;

          const rawGuess = action.guess.trim().toLowerCase();
          const cardContent = player.forbiddenCard.content.toLowerCase();

          // Fuzzy match or substring match
          // Remove punctuation/spaces
          const cleanGuess = rawGuess.replace(/[\s、/，,「」()（）]/g, '');
          const cleanTarget = cardContent.replace(/[\s、/，,「」()（）]/g, '');

          // Check match: e.g. "摸頭髮" in "抓頭/摸頭髮", or "真的" in "真的嗎"
          const isCorrect =
            cleanGuess.length >= 2 &&
            (cleanTarget.includes(cleanGuess) || cleanGuess.includes(cleanTarget));

          if (isCorrect) {
            // Reward: clear 1 penalty count or gain 1 life back, and deal a new card
            player.penaltyCount = Math.max(0, player.penaltyCount - 1);
            player.lives = Math.min(player.maxLives, player.lives + 1);
            player.hasGuessed = true;

            const oldCard = player.forbiddenCard.content;
            // Draw a new card
            const categories = new Set(room.settings.deckCategories);
            const pool = PRESET_CARDS.filter((c) => categories.has(c.category) && c.content !== oldCard);
            const newCard = pool[Math.floor(Math.random() * pool.length)];
            player.forbiddenCard = {
              id: newCard ? newCard.id : `c-${Date.now()}`,
              type: newCard ? newCard.type : 'WORD',
              content: newCard ? newCard.content : '說「好」',
            };

            room.historyLog.push({
              id: `log-${Date.now()}`,
              text: `🎯 奇蹟！${player.name} 成功猜中了自己額頭上的「${oldCard}」！獲得免死金牌並更換新牌！`,
              type: 'guess_correct',
              timestamp: Date.now(),
            });

            broadcastToRoom(session.roomId, { type: 'SOUND_EFFECT', sound: 'success' });
          } else {
            // Penalty for false guess
            player.lives = Math.max(0, player.lives - 1);
            player.penaltyCount += 1;
            if (player.lives === 0) {
              player.isEliminated = true;
            }

            room.historyLog.push({
              id: `log-${Date.now()}`,
              text: `❌ ${player.name} 猜測「${action.guess}」錯誤！猜錯懲罰 (-1❤️)`,
              type: 'guess_wrong',
              timestamp: Date.now(),
            });

            broadcastToRoom(session.roomId, { type: 'SOUND_EFFECT', sound: 'buzzer' });
          }

          broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          break;
        }

        case 'RESET_GAME': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room || room.hostId !== session.playerId) return;

          room.status = 'LOBBY';
          room.activeViolation = null;
          room.players.forEach((p) => {
            p.lives = room.settings.initialLives;
            p.maxLives = room.settings.initialLives;
            p.penaltyCount = 0;
            p.isEliminated = false;
            p.forbiddenCard = undefined;
            p.hasGuessed = false;
          });

          room.historyLog.push({
            id: `log-${Date.now()}`,
            text: `🔄 遊戲重置回到大廳，準備下一輪！`,
            type: 'topic',
            timestamp: Date.now(),
          });

          broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          break;
        }

        case 'SEND_CHAT': {
          const session = clientSessions.get(ws);
          if (!session) return;
          const room = rooms.get(session.roomId);
          if (!room) return;

          const player = room.players.find((p) => p.id === session.playerId);
          if (!player) return;

          const newMsg = {
            id: `msg-${Date.now()}`,
            senderId: player.id,
            senderName: player.name,
            avatar: player.avatar,
            text: action.text.trim(),
            timestamp: Date.now(),
          };

          room.messages.push(newMsg);
          if (room.messages.length > 50) {
            room.messages.shift();
          }

          broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
          break;
        }
      }
    } catch (err) {
      console.error('Error parsing client message:', err);
    }
  });

  ws.on('close', () => {
    const session = clientSessions.get(ws);
    if (!session) return;

    clientSessions.delete(ws);
    const room = rooms.get(session.roomId);
    if (!room) return;

    const leavingPlayer = room.players.find((p) => p.id === session.playerId);
    room.players = room.players.filter((p) => p.id !== session.playerId);

    if (leavingPlayer) {
      room.historyLog.push({
        id: `log-${Date.now()}`,
        text: `🚪 ${leavingPlayer.name} 離開了房間`,
        type: 'leave',
        timestamp: Date.now(),
      });
    }

    if (room.players.length === 0) {
      // Room empty, clean up after 10 minutes
      setTimeout(() => {
        const check = rooms.get(session.roomId);
        if (check && check.players.length === 0) {
          rooms.delete(session.roomId);
        }
      }, 10 * 60 * 1000);
    } else {
      // If host left, transfer host to first player
      if (room.hostId === session.playerId) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
        room.players[0].isReady = true;
      }
      broadcastToRoom(session.roomId, { type: 'ROOM_UPDATE', room });
    }
  });
});

// REST Endpoints
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    roomsCount: rooms.size,
    timestamp: Date.now(),
  });
});

app.get('/api/room/:roomId', (req, res) => {
  const roomId = req.params.roomId.toUpperCase();
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({
    roomId: room.roomId,
    status: room.status,
    playerCount: room.players.length,
  });
});

// Vite / Static setup
async function setupServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`> Don't Do It Challenge Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
