"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

// Ce qu'un écran montre quand `useListeMemorisee` a épuisé ses tentatives
// (27/09/2026). Avant, il restait sur son squelette pour toujours, sans rien
// dire : la lettre A du dictionnaire « ne se chargeait pas » (retour de John),
// après deux 503 du serveur à la suite. Un bouton plutôt qu'une nouvelle
// boucle : le serveur saturé n'a pas besoin qu'on insiste tout seul.
export function EchecChargement({ onReessayer }: { onReessayer: () => Promise<void> }) {
  const [enCours, setEnCours] = useState(false);

  return (
    <div role="alert" className="flex flex-col items-center px-3 pb-2 pt-10 text-center">
      <p className="text-[15px] font-bold text-foreground">Le chargement n&apos;a pas abouti.</p>
      <p className="mt-1.5 text-sm text-muted-foreground">Le serveur est peut-être occupé. Réessaie dans un instant.</p>
      <button
        type="button"
        disabled={enCours}
        onClick={async () => {
          setEnCours(true);
          try {
            await onReessayer();
          } finally {
            setEnCours(false);
          }
        }}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-sens-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-sens-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <RotateCw className={`h-4 w-4 ${enCours ? "animate-spin" : ""}`} strokeWidth={2.4} />
        Réessayer
      </button>
    </div>
  );
}
