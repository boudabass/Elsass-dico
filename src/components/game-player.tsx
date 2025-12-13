"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface GamePlayerProps {
  gameUrl: string;
  gameName: string;
  width?: number;
  height?: number;
}

export function GamePlayer({ gameUrl, gameName, width = 800, height = 600 }: GamePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Épaisseur de la bordure en pixels (border-4 = 4px)
  const BORDER_WIDTH = 4; 
  // Espace total pris par les bordures (gauche + droite)
  const TOTAL_BORDER_X = BORDER_WIDTH * 2;
  const TOTAL_BORDER_Y = BORDER_WIDTH * 2;

  // Fonction de calcul de l'échelle
  const updateScale = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      
      // On calcule le ratio en incluant la place nécessaire pour la bordure
      // Sinon la bordure sortirait de l'écran sur mobile
      const contentWidthNeeded = width + TOTAL_BORDER_X;
      
      const newScale = containerWidth / contentWidthNeeded;
      
      // On limite l'échelle à 1.5 pour éviter que ça devienne énorme sur les écrans 4k
      setScale(Math.min(newScale, 1.5)); 
    }
  };

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [width]); // Recalcul si la largeur native change

  const handleLoad = () => {
    setIsLoading(false);
    focusGame();
  };

  const focusGame = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Conteneur Parent qui définit la largeur disponible */}
      <div 
        ref={containerRef} 
        className="w-full max-w-[1200px] relative flex justify-center"
        // La hauteur du conteneur doit s'adapter à la hauteur mise à l'échelle (+ les bordures)
        style={{ height: (height + TOTAL_BORDER_Y) * scale }}
      >
        {/* Loader */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-20 rounded-xl h-full">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p className="text-xl font-medium animate-pulse">Lancement de {gameName}...</p>
          </div>
        )}

        {/* Zone de transformation */}
        <div
          className="origin-top-left absolute top-0 left-0 overflow-hidden rounded-xl shadow-2xl border-4 border-slate-700 bg-black"
          style={{
            // IMPORTANT : content-box assure que width = largeur du contenu (iframe)
            // La bordure s'ajoute A L'EXTERIEUR de ces dimensions
            boxSizing: 'content-box', 
            width: width,   
            height: height, 
            transform: `scale(${scale})`,
            // Centrage horizontal si le conteneur est plus large que le jeu scalé
            left: '50%',
            translate: '-50% 0' 
          }}
          onClick={focusGame}
        >
          <iframe
            ref={iframeRef}
            src={gameUrl}
            onLoad={handleLoad}
            width={width}
            height={height}
            className="border-0 block overflow-hidden"
            // Permissions étendues
            allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; microphone; camera; midi"
            title={`Jeu ${gameName}`}
            // Force le scrolling à non pour éviter les barres dans l'iframe
            scrolling="no"
          />
        </div>
      </div>
      
      {/* Info debug */}
      <p className="text-xs text-slate-500 mt-2 opacity-50">
        Jeu : {width}x{height} | Total (avec bordures) : {width + TOTAL_BORDER_X}x{height + TOTAL_BORDER_Y} | Scale : {scale.toFixed(3)}
      </p>
    </div>
  );
}