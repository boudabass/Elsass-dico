"use client";

import Link from "next/link";
import { Copy, Flag } from "lucide-react";
import { toast } from "sonner";

// Écran 2 du handoff : rangée d'actions Copier/Signaler. Extraite en composant
// client parce que la page reste un composant serveur (chargerEntree()).
// `premiereForme` et non `formeCanonique` : il n'y a plus de forme
// canonique depuis le 11/09/2026. C'est la forme la mieux attestee, celle
// qu'on copie par defaut — pas celle qui aurait raison.
export function RangeeActions({ entreeId, premiereForme }: { entreeId: string; premiereForme: string }) {
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(premiereForme);
      toast.success("Copié");
    } catch {
      toast.error("Copie impossible");
    }
  };

  // Deux liens discrets plutôt que deux gros boutons (revue du 28/09/2026) :
  // « Copier » pesait plus que la contribution, qui est le vrai geste ici.
  const lien =
    "inline-flex h-9 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-sens-texte focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="mt-6 flex items-center gap-4 border-t border-border pt-3">
      <button type="button" onClick={copier} className={lien}>
        <Copy className="h-4 w-4" strokeWidth={2} aria-hidden />
        Copier « {premiereForme} »
      </button>
      <Link href={`/entree/${entreeId}/signaler`} className={lien}>
        <Flag className="h-4 w-4" strokeWidth={2} aria-hidden />
        Signaler
      </Link>
    </div>
  );
}
