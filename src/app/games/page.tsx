
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import Link from "next/link"
import { getDb } from "@/lib/database"

export default async function GamesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const db = await getDb()
    const games = db.data.games

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in">
            <header className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Arcade Hub</h1>
                    <p className="text-slate-500 text-lg">Le catalogue complet</p>
                </div>
            </header>

            {games.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
                    <p className="text-xl text-slate-500">Aucun jeu installé.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <Card key={game.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900">
                            <div className="relative h-48 bg-slate-900 overflow-hidden">
                                {game.thumbnail ? (
                                    <img
                                        src={`/games/${game.path}/${game.thumbnail}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    // Note: onError is client-side, hard to do in Server Component without hydration. 
                                    // We assume thumbnail exists if path is set, or CSS handles broken image/fallback.
                                    // Alternatively, we can use a client component wrapper for the Image.
                                    // For now, simple img tag.
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-500 font-bold text-4xl opacity-30">
                                        {game.id.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">{game.name}</h3>
                                    <p className="text-xs text-white/70 line-clamp-1">{game.description}</p>
                                </div>
                            </div>
                            <CardFooter className="p-4 bg-slate-50 dark:bg-slate-800/50">
                                <Link href={`/play/${game.id}`} className="w-full">
                                    <Button className="w-full font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <Play className="mr-2 w-4 h-4 fill-current" /> JOUER
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
