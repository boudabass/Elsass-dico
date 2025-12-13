import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';

export const dynamic = 'force-dynamic'; // Important pour que Next.js ne cache pas les résultats

// GET /api/scores?gameId=tetris-v1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
  }

  const db = await getDb();
  await db.read();

  // On renvoie les scores filtrés par jeu, triés par score descendant
  const scores = db.data.scores
    .filter((s) => s.gameId === gameId)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10

  return NextResponse.json(scores);
}

// POST /api/scores
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, playerName, score } = body;

    if (!gameId || score === undefined) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const db = await getDb();
    await db.update(({ scores }) => scores.push({
      gameId,
      playerName: playerName || 'Anonyme',
      score: Number(score),
      date: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}