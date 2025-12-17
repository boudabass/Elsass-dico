import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

// --- SCHEMA DEFINITIONS ---

export interface GameRelease {
  id: string;
  name: string;
  version: string;
  path: string;
  description: string;
  thumbnail?: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface Score {
  gameId: string;
  playerName: string;
  score: number;
  date: string;
  // New fields for Supabase integration
  userId?: string;
  userEmail?: string;
}

export interface DatabaseData {
  games: GameRelease[];
  scores: Score[];
}

// --- DATABASE SETUP ---

const defaultData: DatabaseData = {
  games: [],
  scores: [],
};

// Determine the database file path
const DATABASE_DIR = process.env.DATABASE_DIR || path.join(process.cwd(), 'data');
const file = path.join(DATABASE_DIR, 'db.json');

const adapter = new JSONFile<DatabaseData>(file);
let db: Low<DatabaseData> | null = null;

export async function getDb() {
  if (db) {
    await db.read();
    return db;
  }

  db = new Low(adapter, defaultData);
  await db.read();

  // Initialize with default data if the file was empty
  if (!db.data || Object.keys(db.data).length === 0) {
    db.data = defaultData;
    await db.write();
  }

  return db;
}