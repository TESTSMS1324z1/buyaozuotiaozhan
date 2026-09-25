import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Generate a persistent local ID instead of using Firebase Auth
export const getLocalPlayerId = () => {
  let id = localStorage.getItem('game_player_id');
  if (!id) {
    id = 'player_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('game_player_id', id);
  }
  return id;
};
