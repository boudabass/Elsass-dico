"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { creerVarianteAction } from "@/app/actions/variantes";

// Doc 20, étape 5 : « ça se dit autrement chez moi » — forme + village, en un
// seul geste. Le succès efface le champ et redemande la page
// (`router.refresh()`), comme VoteVariante : pas d'état local optimiste, la
// nouvelle forme vient du serveur avec son badge déjà à jour.
//
// `onSucces` optionnel : voir la même note dans vote-variante.tsx — la carte
// (17/09/2026) réutilise ce formulaire hors du rendu serveur de la page.
export function NouvelleVariante({ lemmeId, onSucces }: { lemmeId: string; onSucces?: () => void }) {
    const [forme, setForme] = useState("");
    const [enCours, demarrer] = useTransition();
    const router = useRouter();

    function envoyer(e: React.FormEvent) {
        e.preventDefault();
        if (!forme.trim()) return;
        demarrer(async () => {
            const res = await creerVarianteAction(lemmeId, forme);
            if (res.succes) {
                setForme("");
                toast.success("Forme ajoutée.");
                if (onSucces) onSucces();
                else router.refresh();
            } else {
                toast.error(res.erreur);
            }
        });
    }

    return (
        <form onSubmit={envoyer} className="mt-5 rounded-lg border border-bordure-forte p-3.5">
            <p className="text-sm font-semibold text-foreground">Ça se dit autrement chez moi ?</p>
            <div className="mt-2 flex gap-2">
                <input
                    value={forme}
                    onChange={(e) => setForme(e.target.value)}
                    placeholder="La forme que tu connais…"
                    aria-label="Nouvelle forme"
                    disabled={enCours}
                    // `text-base` et non `text-sm` : sous 16 px, iOS zoome sur le
                    // champ au focus (même choix que village-profil.tsx).
                    className="h-10 flex-1 min-w-0 rounded-md border border-input bg-background px-3 text-base text-foreground disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={enCours || !forme.trim()}
                    className="h-10 shrink-0 rounded-md bg-marque-rouge-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-marque-rouge-600 disabled:opacity-50"
                >
                    Ajouter
                </button>
            </div>
        </form>
    );
}
