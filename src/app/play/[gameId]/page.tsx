
import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getDb } from "@/lib/database"

export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  // 1. Auth Check (Server Side)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 2. Unwrap Params and Fetch Data
  const { gameId } = await params
  const db = await getDb()
  const game = db.data.games.find(g => g.id === gameId)

  if (!game) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-2xl font-bold">Jeu introuvable</h1>
        <Link href="/games">
          <Button>Retour au catalogue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-2 bg-slate-900 border-b border-white/10 text-white shadow-md z-10">
        <div className="flex items-center gap-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 w-4 h-4" /> Retour
            </Button>
          </Link>
          <h1 className="font-bold text-lg hidden md:block">{game.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded font-mono">
            {game.version}
          </span>
        </div>
      </div>

      {/* Game Canvas (Iframe) */}
      <div className="flex-1 w-full h-full relative bg-black">
        <iframe
          src={`/games/${game.path}/index.html`}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          allow="autoplay; gamepad; fullscreen" // Important for games
        />
      </div>
    </div>
  );
}