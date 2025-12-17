import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        await db.read();

        const myScores = db.data.scores
            .filter((s) => s.userId === user.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50);

        return NextResponse.json(myScores);
    } catch (e) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
