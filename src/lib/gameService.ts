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
import { RoomState, Player, ServerMessage, ViolationEvent } from '../types/game';
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
        // Create room if it doesn't exist
        transaction.set(roomRef, {
          status: 'LOBBY',
          hostId: playerId,
          currentTopic: VARIETY_TOPICS[0],
          topicIndex: 0,
          settings: { lives: 3, timeLimit: 0 },
          messages: [],
          historyLog: [],
          createdAt: serverTimestamp()
        });
      }

      // Add player
      transaction.set(playerRef, {
        id: playerId,
        name,
        avatar,
        lives: 3,
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
        // Merge secrets into players (only if we can see them)
        const playersWithCards = currentPlayers.map(p => ({
          ...p,
          card: currentSecrets[p.id] || (p.id === playerId ? '???' : '')
        }));

        onUpdate({
          ...currentRoomData,
          roomId,
          players: playersWithCards
        });
      }
    };

    const unsubRoom = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        currentRoomData = snapshot.data();
        notify();
      }
    });

    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      currentPlayers = snapshot.docs.map(d => d.data() as Player);
      notify();
    });

    const unsubSecrets = onSnapshot(secretsRef, (snapshot) => {
      snapshot.docs.forEach(d => {
        currentSecrets[d.id] = d.data().card;
      });
      notify();
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
    
    // Shuffle cards
    const shuffled = [...PRESET_CARDS].sort(() => Math.random() - 0.5);
    
    await runTransaction(db, async (transaction) => {
      // Set room status
      transaction.update(roomRef, { status: 'PLAYING' });
      
      // Set secrets
      players.forEach((p, i) => {
        const secretRef = doc(db, 'rooms', roomId, 'secrets', p.id);
        transaction.set(secretRef, { card: shuffled[i % shuffled.length] });
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
      transaction.update(playerRef, { lives: newLives });

      // Update room violation status
      transaction.update(roomRef, {
        activeViolation: {
          targetPlayerId,
          attackerName,
          timestamp: Date.now()
        }
      });
      
      // Check for game over
      // (This would normally check all players, but we can do it reactively)
    });
    
    sounds.playHammer();
  },

  async guessCard(roomId: string, playerId: string, guess: string, actualCard: string) {
    if (guess === actualCard) {
      // Success! Gain life? Or just clear card?
      // In this version, we'll just play a sound and maybe announce
      sounds.playSuccess();
    } else {
      sounds.playBuzzer();
    }
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

  async updateSettings(roomId: string, settings: Record<string, any>) {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { settings });
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
