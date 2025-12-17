
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Gamepad2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getDb, Score } from "@/lib/database"

export default async function ScoresPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const db = await getDb()
    const games = db.data.games
    const allScores = db.data.scores

    // Group scores by gameId
    const scoresMap: Record<string, Score[]> = {}

    // Initialize map for all games
    games.forEach(g => {
        scoresMap[g.id] = []
    })

    // Populate with scores
    allScores.forEach(s => {
        if (scoresMap[s.gameId]) {
            scoresMap[s.gameId].push(s)
        }
    })

    // Sort scores (descending)
    Object.keys(scoresMap).forEach(key => {
        scoresMap[key].sort((a, b) => b.score - a.score)
    })

    return (
        <div className="container max-w-5xl mx-auto p-4 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black text-primary flex justify-center items-center gap-3">
                    <Trophy className="w-10 h-10 text-yellow-500" /> Temple de la Renommée
                </h1>
                <p className="text-muted-foreground">Les meilleurs scores de tous les temps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {games.map((game) => {
                    const gameScores = scoresMap[game.id] || []
                    return (
                        <Card key={game.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="bg-slate-50 border-b pb-3">
                                <CardTitle className="flex justify-between items-center">
                                    <span className="capitalize">{game.name}</span>
                                    <Gamepad2 className="text-primary w-5 h-5" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {gameScores.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic text-center">Aucun score pour le moment.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {gameScores.slice(0, 5).map((score, idx) => (
                                            <li key={idx} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className={`
                                                        w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs
                                                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                            idx === 1 ? 'bg-slate-100 text-slate-700' :
                                                                idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-400'}
                                                    `}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-medium truncate max-w-[120px]" title={score.playerName}>
                                                        {score.playerName}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono font-bold text-primary">{score.score}</span>
                                                    <span className="text-[10px] text-slate-400 block">
                                                        {format(new Date(score.date), "d MMM", { locale: fr })}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
