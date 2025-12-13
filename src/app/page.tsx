import { getPublicGames } from "@/app/actions/get-public-games";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Play } from "lucide-react";
import Link from "next/link";
import { MadeWithDyad } from "@/components/made-with-dyad";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const games = await getPublicGames();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm py-8 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Espace Jeux
        </h1>
        <p className="text-slate-500 mt-2 text-xl">Choisissez un jeu pour commencer</p>
      </header>

      <main className="flex-1 container mx-auto p-6 md:p-12">
        {games.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-slate-400">Aucun jeu disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <Card key={game.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors shadow-lg flex flex-col h-full">
                {/* Zone Image / Thumbnail */}
                <div className="h-48 bg-slate-200 flex items-center justify-center relative">
                  {game.thumbnail ? (
                    <img 
                      src={`/games/${game.id}/${game.thumbnail}`} 
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl font-bold text-slate-300 select-none">
                      {game.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-3xl font-bold text-slate-800">
                    {game.name}
                  </CardTitle>
                  <p className="text-lg text-slate-500 line-clamp-2">
                    {game.description}
                  </p>
                </CardHeader>

                <CardContent className="flex-1">
                  {game.bestScore && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <Trophy className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Record à battre</p>
                        <p className="text-xl font-bold text-amber-900">
                          {game.bestScore.value} <span className="text-sm font-normal text-amber-700">par {game.bestScore.playerName}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 pb-6 px-6">
                  <Button asChild size="lg" className="w-full text-xl py-8 font-bold shadow-md hover:scale-[1.02] transition-transform">
                    <Link href={`/play/${game.id}`}>
                      <Play className="mr-2 h-6 w-6 fill-current" />
                      JOUER
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <MadeWithDyad />
    </div>
  );
}