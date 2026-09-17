"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { retirerVoteAction, voterPourVarianteAction } from "@/app/actions/votes";

// Le bouton `+` du doc 20, étape 5 : « un vote = un village ». `monVote` vient
// du serveur (chargerLemme()) ; après un aller-retour réussi on redemande la
// page plutôt que de garder un état local optimiste — `router.refresh()`
// refait tourner /entree/[id] côté serveur, donc le compte de villages et
// `monVote` reviennent à jour ensemble, sans risque de désaccord entre les
// deux.
//
// `onSucces` : la carte (17/09/2026) réutilise ce même bouton mais charge ses
// données via un Server Action côté client (`useListeMemorisee`), pas par le
// rendu serveur de la page — `router.refresh()` n'y rafraîchirait rien.
// Optionnel et par défaut égal au comportement d'origine, pour ne rien
// changer sur /entree/[id].
export function VoteVariante({
    varianteId,
    monVote,
    onSucces,
}: {
    varianteId: string;
    monVote: boolean;
    onSucces?: () => void;
}) {
    const router = useRouter();
    const [enCours, demarrer] = useTransition();

    function basculer() {
        demarrer(async () => {
            const res = monVote
                ? await retirerVoteAction(varianteId)
                : await voterPourVarianteAction(varianteId);
            if (res.succes) {
                if (onSucces) onSucces();
                else router.refresh();
            } else {
                toast.error(res.erreur);
            }
        });
    }

    return (
        <button
            type="button"
            onClick={basculer}
            disabled={enCours}
            aria-pressed={monVote}
            className={
                monVote
                    ? "inline-flex h-8 items-center gap-1 rounded-full bg-succes-100 px-3 text-xs font-semibold text-succes-500 disabled:opacity-60"
                    : "inline-flex h-8 items-center gap-1 rounded-full border border-bordure-forte px-3 text-xs font-semibold text-foreground transition-colors hover:bg-neutre-50 disabled:opacity-60"
            }
        >
            {monVote ? "✓ Chez moi aussi" : "+ Chez moi aussi"}
        </button>
    );
}
