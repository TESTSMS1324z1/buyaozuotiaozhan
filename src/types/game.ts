export type GameStatus = 'LOBBY' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  lives: number;
  maxLives: number;
  penaltyCount: number;
  isEliminated: boolean;
  // The secret forbidden card assigned to this player
  forbiddenCard?: {
    id: string;
    type: 'ACTION' | 'WORD';
    content: string;
    category?: string;
  };
  hasGuessed?: boolean;
}

export interface GameSettings {
  initialLives: number; // e.g. 3 or 5
  deckCategories: string[]; // ['daily', 'chat', 'body', 'hardcore']
  enableDeductionGuess: boolean; // can guess own card to survive
  roundDurationMinutes: number; // 0 for unlimited, or e.g. 5, 10
  customCards: Array<{ type: 'ACTION' | 'WORD'; content: string }>;
}

export interface ViolationEvent {
  id: string;
  targetPlayerId: string;
  targetPlayerName: string;
  reporterId: string;
  reporterName: string;
  violatedRule: string;
  timestamp: number;
  confirmed: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  status: GameStatus;
  settings: GameSettings;
  players: Player[];
  currentTopic: string;
  topicIndex: number;
  roundStartTime?: number;
  activeViolation?: ViolationEvent | null;
  historyLog: Array<{
    id: string;
    text: string;
    type: 'penalty' | 'guess_correct' | 'guess_wrong' | 'topic' | 'join' | 'leave';
    timestamp: number;
  }>;
  messages: ChatMessage[];
}

export type ClientAction =
  | { type: 'JOIN_ROOM'; roomId: string; playerName: string; avatar: string }
  | { type: 'LEAVE_ROOM' }
  | { type: 'TOGGLE_READY' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GameSettings> }
  | { type: 'ADD_CUSTOM_CARD'; cardType: 'ACTION' | 'WORD'; content: string }
  | { type: 'START_GAME' }
  | { type: 'NEXT_TOPIC' }
  | { type: 'REPORT_VIOLATION'; targetPlayerId: string }
  | { type: 'CONFIRM_VIOLATION'; violationId: string; approved: boolean }
  | { type: 'GUESS_OWN_CARD'; guess: string }
  | { type: 'RESET_GAME' }
  | { type: 'SEND_CHAT'; text: string };

export type ServerMessage =
  | { type: 'INIT_STATE'; room: RoomState; yourPlayerId: string }
  | { type: 'ROOM_UPDATE'; room: RoomState }
  | { type: 'VIOLATION_TRIGGERED'; violation: ViolationEvent }
  | { type: 'SOUND_EFFECT'; sound: 'hammer' | 'buzzer' | 'success' | 'cheer' | 'ding' }
  | { type: 'ERROR'; message: string };
