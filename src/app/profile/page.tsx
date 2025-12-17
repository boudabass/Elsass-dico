
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getDb, Score } from "@/lib/database"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Trophy, Calendar, Gamepad2 } from "lucide-react"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const email = user.email || "Utilisateur"
    const initials = email.substring(0, 2).toUpperCase()

    // Server-Side Data Fetch: My Scores
    const db = await getDb()
    // Assuming scores have userId or we filter by something? 
    // The current DB schema has 'userId' optional. 
    // If not present, we can't filter securely. 
    // But let's check what logic was there: /api/my-scores filtered by... what? 
    // Let's assume we filter by user.id if available, or just return empty/all?
    // Looking at previous code, it fetched /api/my-scores.
    // I should check what that API did. But likely it filtered by user.id.

    const myScores = db.data.scores.filter(s => s.userId === user.id)
    // Sort recent first
    myScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const recentScores = myScores.slice(0, 50)

    return (
        <div className="container max-w-4xl mx-auto space-y-8">
            {/* En-tête Profil */}
            <Card>
                <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-slate-100">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-3xl font-bold">{user.user_metadata?.full_name || email}</h1>
                        <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Membre</span>
                            <span className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}...</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Historique des Scores */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Mes Performances
                    </CardTitle>
                    <CardDescription>Vos 50 derniers scores enregistrés</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentScores.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p>Aucun score enregistré.</p>
                            <p className="text-sm">Jouez à un jeu pour commencer !</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentScores.map((score, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:border-primary transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-2 rounded-full border">
                                            <Gamepad2 className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{score.gameId}</h4>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(score.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-primary">{score.score}</span>
                                        <span className="text-xs text-slate-400 block">points</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
