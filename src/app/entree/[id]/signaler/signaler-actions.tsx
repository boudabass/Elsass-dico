"use client";

import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { URL_FORUM_DICTIONNAIRE } from "@/lib/liens-externes";

// Écran 4 du handoff : pas de soumission in-app (revu par rapport à un
// brouillon antérieur — un signalement anonyme n'est pas faisable côté
// backend aujourd'hui) : on copie le segment et on renvoie vers le forum.
export function SignalerActions({ segment }: { segment: string }) {
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(segment);
      toast.success("Segment copié.");
    } catch {
      toast.error("Impossible de copier.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={copier}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-bordure-forte bg-transparent text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
      >
        <ClipboardList className="h-4 w-4" strokeWidth={2} />
        Copier le segment
      </button>

      <a
        href={URL_FORUM_DICTIONNAIRE}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-12 w-full items-center justify-center rounded-lg bg-marque-rouge-500 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600"
      >
        Ouvrir le forum du dictionnaire ↗
      </a>
      <p className="mt-2.5 text-center text-xs text-neutre-400">
        Ça quitte l&apos;app et ouvre theelsassisch.com dans un nouvel onglet.
      </p>
    </>
  );
}
