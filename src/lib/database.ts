import { JSONFilePreset } from 'lowdb/node';

// --- STANDARD: ONE SOURCE OF TRUTH ---
// Voir documentation/architecture_standard.md

// L'unité atomique du système est une "GameRelease" (Version Jouable).
// La DB stocke une liste plate de ces releases.
export interface GameRelease {
  id: string;           // ID Unique Composite : "{gameName}-{versionName}" (ex: snake-v1)
  name: string;         // Nom d'affichage du projet (ex: Snake)
  version: string;      // Nom de la version (ex: v1)
  path: string;         // Chemin relatif du launcher (ex: snake/v1)

  description?: string;
  thumbnail?: string;
  createdAt?: string;
}

// Alias pour compatibilité existante, mais déprécié mentalement
export type GameMetadata = GameRelease;

export interface Score {
  gameId: string;       // Doit correspondre à GameRelease.id
  playerName: string;
  score: number;
  date: string;
  userId?: string;      // Supabase UUID
  userEmail?: string;
}

// Structure générique pour sauvegarder l'état complet d'un jeu
export interface GameSave {
  gameId: string;       // ID du jeu (ex: elsass-farm-v1)
  userId: string;       // ID du joueur (Supabase)
  updatedAt: string;    // Date de dernière save
  data: any;            // Payload JSON libre (inventaire, positions, etc.)
}

export interface DatabaseData {
  games: GameRelease[];
  scores: Score[];
  saves: GameSave[];    // Nouvelle table
}

const defaultData: DatabaseData = { games: [], scores: [], saves: [] };

// Singleton pour la connexion DB
export const getDb = async () => {
  return await JSONFilePreset<DatabaseData>('data/db.json', defaultData);
};