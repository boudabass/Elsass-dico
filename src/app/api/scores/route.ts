import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';
import { createClient } from '@/lib/supabase/server';

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

    // --- SECURITE SUPABASE ---
    const supabase = await createClient(); // Fonction standard server-side
    const { data: { user } } = await supabase.auth.getUser();

    let finalPlayerName = playerName || 'Anonyme';
    let userId = undefined;
    let userEmail = undefined;

    if (user) {
      // Authentifié : On force l'identité (Sécurité)
      // On utilise l'email ou une metadata 'full_name' si présente
      finalPlayerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      userId = user.id;
      userEmail = user.email;
    }
    // -------------------------

    const db = await getDb();
    await db.update(({ scores }) => scores.push({
      gameId,
      playerName: finalPlayerName,
      score: Number(score),
      date: new Date().toISOString(),
      userId,     // Nouveau champ
      userEmail   // Nouveau champ
    }));

    return NextResponse.json({ success: true, user: user?.email });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}