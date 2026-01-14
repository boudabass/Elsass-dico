import { JSONFilePreset } from 'lowdb/node';

// Schéma générique pour le boilerplate
export interface UserData {
  userId: string;       // ID Supabase
  updatedAt: string;    // Date de dernière modification
  payload: any;         // Données libres (settings, profile, etc.)
}

export interface DatabaseData {
  users_data: UserData[];
  app_settings: any;
}

const defaultData: DatabaseData = { 
  users_data: [], 
  app_settings: { version: "1.0.0", maintenance: false } 
};

// Singleton pour la connexion DB - Pointant vers le dossier storage demandé
export const getDb = async () => {
  return await JSONFilePreset<DatabaseData>('data/storage/db.json', defaultData);
};