import { JSONFilePreset } from 'lowdb/node';

export interface Score {
  gameId: string;
  playerName: string;
  score: number;
  date: string;
}

export interface GameMetadata {
  id: string; // ex: "tetris-v1"
  name: string; // ex: "Tetris Classique"
  description: string;
  path: string; // ex: "tetris/v1"
  version: string;
  thumbnail?: string;
  createdAt: string;
}

export interface Data {
  games: GameMetadata[];
  scores: Score[];
}

const defaultData: Data = { games: [], scores: [] };

// Singleton pour la connexion DB
export const getDb = async () => {
  const db = await JSONFilePreset<Data>('data/db.json', defaultData);
  return db;
};