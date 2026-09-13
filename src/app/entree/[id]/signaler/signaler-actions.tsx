"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { creerSignalementAction } from "@/app/actions/signalements";
import { URL_FORUM_DICTIONNAIRE } from "@/lib/liens-externes";

// Écran 4 du handoff, revu le 13/09/2026 : la soumission in-app était écartée
// à l'étape 2 parce qu'un signalement anonyme n'était pas faisable côté
// backend. Le compte est obligatoire depuis (doc 20), donc ce n'est plus vrai
// — `creerSignalementAction` attache le membre de la session. Le forum reste
// en secours pour une discussion plus large, il n'est plus le seul chemin.
export function SignalerActions({
  variantes,
}: {
  variantes: { id: string; forme: string }[];
}) {
  const router = useRouter();
  const [varianteId, setVarianteId] = useState(variantes[0]?.id ?? "");
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async () => {
    if (!varianteId || !motif.trim()) {
      toast.error("Choisis une forme et décris le problème.");
      return;
    }
    setEnvoi(true);
    const res = await creerSignalementAction(varianteId, motif);
    setEnvoi(false);
    if (res.succes) {
      toast.success(res.message);
      router.back();
    } else {
      toast.error(res.erreur);
    }
  };

  return (
    <>
      <label className="block text-xs font-semibold uppercase tracking-wide text-neutre-400">
        Forme concernée
      </label>
      <select
        value={varianteId}
        onChange={(e) => setVarianteId(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-lg border border-bordure-forte bg-transparent px-3 text-sm text-foreground"
      >
        {variantes.map((v) => (
          <option key={v.id} value={v.id}>
            {v.forme}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutre-400">
        Ce qui cloche
      </label>
      <textarea
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        rows={4}
        placeholder="Graphie, source, village attaché par erreur…"
        className="mt-1.5 w-full rounded-lg border border-bordure-forte bg-transparent p-3 text-sm text-foreground"
      />

      <button
        type="button"
        onClick={envoyer}
        disabled={envoi}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-marque-rouge-500 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-60"
      >
        {envoi ? "Envoi…" : "Envoyer à l'admin"}
      </button>

      <a
        href={URL_FORUM_DICTIONNAIRE}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-bordure-forte bg-transparent text-sm font-semibold text-foreground transition-colors hover:bg-neutre-50"
      >
        Ouvrir le forum du dictionnaire ↗
      </a>
      <p className="mt-2.5 text-center text-xs text-neutre-400">
        Pour une discussion plus large, ça quitte l&apos;app et ouvre
        theelsassisch.com dans un nouvel onglet.
      </p>
    </>
  );
}
