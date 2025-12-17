'use server';

import { getDb } from '@/lib/database';

export interface PublicGame {
  id: string;
  name: string;
  description: string;
  version: string;
  path: string;
  thumbnail?: string;
  width: number;
  height: number;
  bestScore: {
    playerName: string;
    value: number;
  } | null;
}

export async function getPublicGames(): Promise<PublicGame[]> {
  const db = await getDb();
  await db.read();

  const { games, scores } = db.data;

  // On transforme la liste des jeux pour y inclure le meilleur score
  const publicGames = games.map((game) => {
    // Trouver les scores de ce jeu
    const gameScores = scores.filter((s) => s.gameId === game.id);
    
    // Trier pour trouver le meilleur
    const bestScoreEntry = gameScores.sort((a, b) => b.score - a.score)[0];

    return {
      id: game.id,
      name: game.name,
      description: game.description || '',
      version: game.version,
      path: game.path,
      thumbnail: game.thumbnail,
      width: game.width || 800,
      height: game.height || 600,
      bestScore: bestScoreEntry ? {
        playerName: bestScoreEntry.playerName,
        value: bestScoreEntry.score
      } : null
    };
  });

  return publicGames;
}