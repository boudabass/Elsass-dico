'use server';

import { getDb } from '@/lib/database';
import { GameMetadata } from '@/lib/database';

export async function getGame(gameId: string): Promise<GameMetadata | undefined> {
  const db = await getDb();
  await db.read();
  
  return db.data.games.find((g) => g.id === gameId);
}