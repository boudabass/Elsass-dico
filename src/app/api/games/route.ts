import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = await getDb();
        await db.read();
        return NextResponse.json(db.data.games);
    } catch (e) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
