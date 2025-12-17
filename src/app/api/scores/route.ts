import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';
import { createServerSupabaseClient } from '@/integrations/supabase/server';

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const supabase = createServerSupabaseClient();
    
    // 1. Authenticate user from cookies
    const { data: { user } } = await supabase.auth.getUser();
    
    const { gameId, playerName, score } = await request.json();

    if (typeof gameId !== 'string' || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid score data' }, { status: 400 });
    }

    const newScore = {
      gameId,
      playerName: user ? user.email || playerName : playerName,
      score,
      date: new Date().toISOString(),
      userId: user?.id,
      userEmail: user?.email,
    };

    db.data.scores.push(newScore);
    await db.write();

    return NextResponse.json({ success: true, score: newScore });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const db = await getDb();
    
    // Simple retrieval of all scores, sorted by score descending
    const sortedScores = db.data.scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Limit to top 100 for performance

    return NextResponse.json(sortedScores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}