"use client";

import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";

interface GamePlayerProps {
  gameUrl: string;
  gameName: string;
}

export function GamePlayer({ gameUrl, gameName }: GamePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    setIsLoading(false);
    // Tente de donner le focus au jeu immédiatement
    focusGame();
  };

  const focusGame = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
    }
  };

  return (
    <div 
      className="w-full max-w-[1200px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 relative group"
      onClick={focusGame} // Redonne le focus si on clique sur le cadre
    >
      
      {/* État de Chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-20">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
          <p className="text-xl font-medium animate-pulse">Lancement de {gameName}...</p>
        </div>
      )}

      {/* Indication visuelle au survol */}
      {!isLoading && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-1 rounded pointer-events-none select-none">
          Cliquez sur le jeu pour activer les contrôles
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={gameUrl}
        onLoad={handleLoad}
        className="w-full h-full border-0 relative z-0 block"
        // Permissions étendues pour supporter tous les types de capteurs p5.js
        allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; microphone; camera; midi"
        title={`Jeu ${gameName}`}
      />
    </div>
  );
}