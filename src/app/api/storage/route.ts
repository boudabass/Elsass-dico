import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/storage
// Récupère les données du profil/settings du joueur connecté
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  await db.read();

  const entry = db.data.users_data.find(u => u.userId === user.id);

  return NextResponse.json({ 
    data: entry ? entry.payload : null, 
    updatedAt: entry ? entry.updatedAt : null 
  });
}

// POST /api/storage
// Sauvegarde ou écrase les données de l'utilisateur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payload } = body;

    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    await db.update(({ users_data }) => {
      const existingIndex = users_data.findIndex(u => u.userId === user.id);
      
      const newEntry = {
        userId: user.id,
        updatedAt: new Date().toISOString(),
        payload: payload
      };

      if (existingIndex >= 0) {
        users_data[existingIndex] = newEntry;
      } else {
        users_data.push(newEntry);
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}