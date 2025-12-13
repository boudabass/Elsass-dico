import { getGame } from "@/app/actions/get-game";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PlayPageProps {
  params: Promise<{ gameId: string }>;
}

export default async function PlayPage(props: PlayPageProps) {
  const params = await props.params;
  const game = await getGame(params.gameId);

  if (!game) {
    notFound();
  }

  // Le chemin stocké dans la DB est relatif à /public/games
  // Ex: "tetris/v1" -> URL "/games/tetris/v1/index.html"
  const gameUrl = `/games/${game.path}/index.html`;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* En-tête de navigation sécurisante */}
      <header className="bg-white p-4 shadow-md z-10 flex items-center justify-between">
        <Button 
          asChild 
          variant="destructive" 
          size="lg" 
          className="text-lg font-bold px-8 h-14"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-6 w-6" />
            QUITTER LE JEU
          </Link>
        </Button>

        <h1 className="text-2xl font-bold text-slate-800 hidden md:block">
          {game.name}
        </h1>
        
        {/* Placeholder pour équilibrer le header */}
        <div className="w-[140px] hidden md:block"></div>
      </header>

      {/* Zone de jeu */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[1200px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 relative">
          
          {/* Message de chargement (sera caché par l'iframe une fois chargée) */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p className="text-xl animate-pulse">Chargement du jeu...</p>
          </div>

          <iframe
            src={gameUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; gamepad"
            title={`Jeu ${game.name}`}
          />
        </div>
        
        <p className="text-slate-400 mt-4 text-center max-w-lg">
          {game.description}
        </p>
      </main>
    </div>
  );
}