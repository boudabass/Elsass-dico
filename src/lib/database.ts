import { JSONFilePreset } from 'lowdb/node';

// Interfaces for generic items (formerly Games)
export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  path: string;
  version: string;
  createdAt: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

// Alias for backward compatibility during refactor
export type GameRelease = GameMetadata;

export interface Score {
  gameId: string;
  score: number;
  userId?: string;
  userEmail?: string;
  playerName?: string;
  timestamp?: string;
  date?: string;
}

export interface Save {
  gameId: string;
  userId: string;
  updatedAt: string;
  data: any;
}

// Interfaces for User Storage (Settings, Profile, etc.)
export interface UserData {
  userId: string;       // ID Supabase
  updatedAt: string;    // Date de dernière modification
  payload: any;         // Données libres (settings, profile, etc.)
}

// Main Database Schema
export interface DatabaseData {
  games: GameMetadata[];
  scores: Score[];
  saves: Save[];
  users_data: UserData[];
  app_settings: any;
}

const defaultData: DatabaseData = { 
  games: [],
  scores: [],
  saves: [],
  users_data: [], 
  app_settings: { version: "1.0.0", maintenance: false } 
};

// Singleton pour la connexion DB - Pointant vers le dossier storage demandé
export const getDb = async () => {
  return await JSONFilePreset<DatabaseData>('data/storage/db.json', defaultData);
};