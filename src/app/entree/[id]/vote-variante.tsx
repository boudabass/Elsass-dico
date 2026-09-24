"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { retirerVoteAction, voterPourVarianteAction } from "@/app/actions/votes";
import { signalerEchecContribution } from "@/lib/toast-contribution";
import { cn } from "@/lib/utils";

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
                signalerEchecContribution(res, () => router.push("/dashboard"));
            }
        });
    }

    return (
        <button
            type="button"
            onClick={basculer}
            disabled={enCours}
            aria-pressed={monVote}
            className={cn(
                "inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold disabled:opacity-60",
                monVote
                    ? "bg-succes-100 text-succes-500"
                    : "border border-bordure-forte text-foreground transition-colors hover:bg-neutre-50",
            )}
        >
            {monVote ? "✓ Chez moi aussi" : "+ Chez moi aussi"}
        </button>
    );
}
