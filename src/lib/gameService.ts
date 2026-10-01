import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp, 
  runTransaction,
  query,
  where,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db, getLocalPlayerId } from './firebase';
import { RoomState, Player, ServerMessage, ViolationEvent, GameSettings } from '../types/game';
import { PRESET_CARDS, VARIETY_TOPICS } from '../data/defaultCards';
import { sounds } from '../utils/audio';

// Helper to generate room ID
const generateRoomId = () => Math.random().toString(36).substring(2, 7).toUpperCase();

export const gameService = {
  // Join or Create Room
  async joinRoom(roomIdInput: string, name: string, avatar: string) {
    const playerId = getLocalPlayerId();
    const roomId = roomIdInput || generateRoomId();

    const roomRef = doc(db, 'rooms', roomId);
    const playerRef = doc(db, 'rooms', roomId, 'players', playerId);

    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        // Create room if it doesn't exist with full proper GameSettings
        transaction.set(roomRef, {
          status: 'LOBBY',
          hostId: playerId,
          currentTopic: VARIETY_TOPICS[0],
          topicIndex: 0,
          settings: {
            initialLives: 3,
            deckCategories: ['daily', 'chat'],
            enableDeductionGuess: true,
            roundDurationMinutes: 0,
            customCards: []
          },
          messages: [],
          historyLog: [],
          createdAt: serverTimestamp()
        });
      }

      // Add player with default lives and stats
      transaction.set(playerRef, {
        id: playerId,
        name,
        avatar,
        lives: 3,
        maxLives: 3,
        penaltyCount: 0,
        isEliminated: false,
        isReady: false,
        isHost: !roomDoc.exists(),
        joinedAt: serverTimestamp()
      });
    });

    return { roomId, playerId };
  },

  // Listen to Game State
  subscribeToRoom(roomId: string, playerId: string, onUpdate: (room: RoomState) => void) {
    const roomRef = doc(db, 'rooms', roomId);
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const secretsRef = collection(db, 'rooms', roomId, 'secrets');

    // Composite state management
    let currentRoomData: any = null;
    let currentPlayers: Player[] = [];
    let currentSecrets: Record<string, string> = {};

    const notify = () => {
      if (currentRoomData && currentPlayers.length > 0) {
        // Merge secrets into players
        const playersWithCards = currentPlayers.map(p => {
          const secretCard = currentSecrets[p.id];
          // Determine if we should reveal the card
          // Host sees all, players see others' cards, but not their own (unless reveal logic exists)
          const isMe = p.id === playerId;
          const isHost = currentRoomData.hostId === playerId;
          
          return {
            ...p,
            forbiddenCard: (isHost || !isMe) ? secretCard : undefined
          };
        });

        onUpdate({
          ...currentRoomData,
          roomId,
          players: playersWithCards
        });
      }
    };

    const unsubRoom = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.data();
        const rawSettings = rawData.settings || {};
        const safeSettings: GameSettings = {
          initialLives: typeof rawSettings.initialLives === 'number' ? rawSettings.initialLives : (rawSettings.lives || 3),
          deckCategories: Array.isArray(rawSettings.deckCategories) && rawSettings.deckCategories.length > 0
            ? rawSettings.deckCategories
            : ['daily', 'chat'],
          enableDeductionGuess: rawSettings.enableDeductionGuess ?? true,
          roundDurationMinutes: rawSettings.roundDurationMinutes ?? 0,
          customCards: Array.isArray(rawSettings.customCards) ? rawSettings.customCards : []
        };
        currentRoomData = {
          ...rawData,
          settings: safeSettings
        };
        notify();
      }
    }, (error) => {
      console.error("Room sync error:", error);
    });

    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      currentPlayers = snapshot.docs.map(d => d.data() as Player);
      notify();
    }, (error) => {
      console.error("Players sync error:", error);
    });

    const unsubSecrets = onSnapshot(secretsRef, (snapshot) => {
      snapshot.docs.forEach(d => {
        currentSecrets[d.id] = d.data().card;
      });
      notify();
    }, (error) => {
      console.error("Secrets sync error:", error);
    });

    return () => {
      unsubRoom();
      unsubPlayers();
      unsubSecrets();
    };
  },

  // Actions
  async toggleReady(roomId: string, playerId: string, ready: boolean) {
    const playerRef = doc(db, 'rooms', roomId, 'players', playerId);
    await updateDoc(playerRef, { isReady: ready });
  },

  async startGame(roomId: string, players: Player[]) {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) return;
    
    const rawSettings = roomDoc.data().settings || {};
    const categories: string[] = (Array.isArray(rawSettings.deckCategories) && rawSettings.deckCategories.length > 0)
      ? rawSettings.deckCategories
      : ['daily', 'chat'];
    const initialLives: number = typeof rawSettings.initialLives === 'number' ? rawSettings.initialLives : (rawSettings.lives || 3);
    
    // Filter cards by category
    let pool = PRESET_CARDS.filter(c => categories.includes(c.category));
    if (Array.isArray(rawSettings.customCards) && rawSettings.customCards.length > 0) {
      const customFormatted = rawSettings.customCards.map((c: any, idx: number) => ({
        id: `custom_${idx}`,
        category: 'custom',
        type: c.type,
        content: c.content,
        baitTip: '自訂趣味陷阱牌'
      }));
      pool = [...pool, ...customFormatted];
    }

    if (pool.length < players.length) pool = PRESET_CARDS; // Fallback to all if pool too small
    
    // Better shuffle (Fisher-Yates)
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    await runTransaction(db, async (transaction) => {
      // Set room status and clear old violations
      transaction.update(roomRef, { 
        status: 'PLAYING',
        activeViolation: null 
      });
      
      // Set secrets AND properly initialize/reset players' lives and stats!
      players.forEach((p, i) => {
        const secretRef = doc(db, 'rooms', roomId, 'secrets', p.id);
        const playerRef = doc(db, 'rooms', roomId, 'players', p.id);
        const card = shuffled[i % shuffled.length];
        transaction.set(secretRef, { card });
        transaction.update(playerRef, {
          lives: initialLives,
          maxLives: initialLives,
          penaltyCount: 0,
          isEliminated: false
        });
      });
    });
  },

  async reportViolation(roomId: string, targetPlayerId: string, attackerName: string) {
    const playerRef = doc(db, 'rooms', roomId, 'players', targetPlayerId);
    const roomRef = doc(db, 'rooms', roomId);

    await runTransaction(db, async (transaction) => {
      const playerDoc = await transaction.get(playerRef);
      if (!playerDoc.exists()) return;

      const currentLives = playerDoc.data().lives;
      if (currentLives <= 0) return;

      const newLives = currentLives - 1;
      const targetName = playerDoc.data().name || '玩家';
      const penaltyCount = (playerDoc.data().penaltyCount || 0) + 1;
      transaction.update(playerRef, {
        lives: newLives,
        penaltyCount,
        isEliminated: newLives <= 0
      });

      // Update room violation status
      transaction.update(roomRef, {
        activeViolation: {
          targetPlayerId,
          targetPlayerName: targetName,
          reporterName: attackerName,
          timestamp: Date.now(),
          violatedRule: '禁忌動作或禁詞被抓包！'
        }
      });
    });
    
    sounds.playHammer();

    // Auto-clear violation from DB after 2.5 seconds so it doesn't stay active in database
    setTimeout(async () => {
      try {
        await updateDoc(roomRef, { activeViolation: null });
      } catch (e) {
        console.error("Error clearing violation:", e);
      }
    }, 2500);
  },

  async guessCard(roomId: string, playerId: string, guess: string) {
    const secretRef = doc(db, 'rooms', roomId, 'secrets', playerId);
    const secretDoc = await getDoc(secretRef);
    
    if (!secretDoc.exists()) return false;
    
    const actualCard = secretDoc.data().card;
    const isCorrect = actualCard.content.includes(guess) || guess.includes(actualCard.content);
    
    if (isCorrect) {
      sounds.playSuccess();
      // Logic for success (e.g. gain life) could go here
    } else {
      sounds.playBuzzer();
    }
    return isCorrect;
  },

  async sendChat(roomId: string, playerId: string, name: string, text: string) {
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) return;

    const messages = roomDoc.data().messages || [];
    await updateDoc(roomRef, {
      messages: [...messages, {
        id: Math.random().toString(36).slice(2),
        senderId: playerId,
        senderName: name,
        text,
        timestamp: Date.now()
      }].slice(-50)
    });
  },

  async updateSettings(roomId: string, newSettings: Partial<GameSettings>) {
    const roomRef = doc(db, 'rooms', roomId);
    await runTransaction(db, async (transaction) => {
       const roomDoc = await transaction.get(roomRef);
       if (!roomDoc.exists()) return;
       const currentSettings: GameSettings = roomDoc.data().settings || {
         initialLives: 3,
         deckCategories: ['daily', 'chat'],
         enableDeductionGuess: true,
         roundDurationMinutes: 0,
         customCards: []
       };

       const merged: GameSettings = {
         initialLives: typeof newSettings.initialLives === 'number' ? newSettings.initialLives : (currentSettings.initialLives || 3),
         deckCategories: Array.isArray(newSettings.deckCategories) && newSettings.deckCategories.length > 0
           ? newSettings.deckCategories
           : (currentSettings.deckCategories?.length > 0 ? currentSettings.deckCategories : ['daily', 'chat']),
         enableDeductionGuess: newSettings.enableDeductionGuess ?? currentSettings.enableDeductionGuess ?? true,
         roundDurationMinutes: newSettings.roundDurationMinutes ?? currentSettings.roundDurationMinutes ?? 0,
         customCards: newSettings.customCards ?? currentSettings.customCards ?? []
       };

       transaction.update(roomRef, { settings: merged });
    });
  },

  async nextTopic(roomId: string, currentIndex: number) {
    const roomRef = doc(db, 'rooms', roomId);
    const nextIndex = (currentIndex + 1) % VARIETY_TOPICS.length;
    await updateDoc(roomRef, {
      topicIndex: nextIndex,
      currentTopic: VARIETY_TOPICS[nextIndex]
    });
  },

  async resetGame(roomId: string) {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'LOBBY',
      activeViolation: null,
      historyLog: []
    });
  }
};
