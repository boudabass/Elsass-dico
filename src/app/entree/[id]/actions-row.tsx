"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import { toast } from "sonner";

// Écran 2 du handoff : rangée d'actions Copier/Signaler. Extraite en composant
// client parce que la page reste un composant serveur (chargerEntree()).
export function RangeeActions({ entreeId, formeCanonique }: { entreeId: string; formeCanonique: string }) {
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(formeCanonique);
      toast.success("Copié.");
    } catch {
      toast.error("Impossible de copier.");
    }
  };

  return (
    <div className="mt-5 flex gap-2.5">
      <button
        type="button"
        onClick={copier}
        className="h-11 flex-1 rounded-lg border border-bordure-forte bg-transparent text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
      >
        Copier
      </button>
      <Link
        href={`/entree/${entreeId}/signaler`}
        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-marque-rouge-texte transition-colors hover:bg-marque-rouge-50"
      >
        <Flag className="h-4 w-4" strokeWidth={2} />
        Signaler
      </Link>
    </div>
  );
}
