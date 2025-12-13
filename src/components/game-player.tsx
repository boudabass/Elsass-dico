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

  const BORDER_WIDTH = 4; // Correspond à la classe `border-4`

  const updateScale = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      // La largeur totale à faire tenir est celle du jeu + ses bordures
      const totalWidthToScale = width + (BORDER_WIDTH * 2);
      const newScale = containerWidth / totalWidthToScale;
      setScale(Math.min(newScale, 1.5));
    }
  };

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [width]);

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
    <div 
      ref={containerRef}
      className="w-full max-w-[1200px] relative"
      // La hauteur du conteneur s'adapte à la hauteur de l'élément mis à l'échelle
      style={{ height: (height + BORDER_WIDTH * 2) * scale }}
      onClick={focusGame}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-20 rounded-xl">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
          <p className="text-xl font-medium animate-pulse">Lancement de {gameName}...</p>
        </div>
      )}

      {/* Conteneur du jeu mis à l'échelle */}
      <div
        className="absolute top-0 left-0 origin-top-left overflow-hidden rounded-xl shadow-2xl border-4 border-slate-700 bg-black"
        style={{
          // La bordure est DESSINÉE AUTOUR du contenu, pas dedans.
          boxSizing: 'content-box',
          width: width,
          height: height,
          transform: `scale(${scale})`,
        }}
      >
        <iframe
          ref={iframeRef}
          src={gameUrl}
          onLoad={handleLoad}
          width={width}
          height={height}
          className="border-0 block"
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; microphone; camera; midi"
          title={`Jeu ${gameName}`}
          scrolling="no"
        />
      </div>
    </div>
  );
}