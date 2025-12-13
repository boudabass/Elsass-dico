import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';

// GET /api/scores?gameId=tetris-v1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
  }

  const db = await getDb();
  await db.read();

  // Récupérer les 10 meilleurs scores pour ce jeu
  const scores = db.data.scores
    .filter((s) => s.gameId === gameId)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json(scores);
}

// POST /api/scores
export async function POST(request: Request) {
  const body = await request.json();
  const { gameId, playerName, score } = body;

  if (!gameId || !playerName || score === undefined) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const db = await getDb();
  await db.update(({ scores }) => scores.push({
    gameId,
    playerName,
    score: Number(score),
    date: new Date().toISOString()
  }));

  return NextResponse.json({ success: true });
}