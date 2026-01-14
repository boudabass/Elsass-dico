import { JSONFilePreset } from 'lowdb/node';

// Generic Interface for a resource (Example)
export interface Item {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  userId?: string; // Ownership
}

// Interfaces for User Storage (Settings, Profile, etc.)
export interface UserData {
  userId: string;       // ID Supabase
  updatedAt: string;    // Date de dernière modification
  payload: any;         // Données libres (settings, profile, etc.)
}

// Main Database Schema
export interface DatabaseData {
  items: Item[];        // Generic collection example
  users_data: UserData[];
  app_settings: any;
}

const defaultData: DatabaseData = { 
  items: [],
  users_data: [], 
  app_settings: { version: "1.0.0", maintenance: false } 
};

// Singleton pour la connexion DB - Pointant vers le dossier storage demandé
export const getDb = async () => {
  return await JSONFilePreset<DatabaseData>('data/storage/db.json', defaultData);
};