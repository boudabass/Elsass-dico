"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

import {
    FeuilleContribution,
    type DepartContribution,
    type ResultatContribution,
} from "@/components/contribution/feuille-contribution";
import { cn } from "@/lib/utils";

// Le seul déclencheur du parcours de contribution (28/09/2026) : la fiche d'un
// mot, la carte, le jeu, la fiche d'une forme et « aucun résultat » ouvrent la
// même feuille, chacun avec son point de départ.
//
// `onSucces` : même contrat que BoutonChezMoi. Par défaut, la feuille
// rafraîchit la page serveur (ou ouvre la fiche d'un mot créé) ; la carte et
// le jeu, qui chargent leurs données côté client, passent leur `rafraichir`.

export function BoutonContribuer({
    depart,
    libelle,
    onSucces,
    variante = "cadre",
    className,
}: {
    depart: DepartContribution;
    libelle?: string;
    onSucces?: (r: ResultatContribution) => void;
    /** `cadre` : bloc pleine largeur sous une liste. `plein` : bouton d'action. */
    variante?: "cadre" | "plein";
    className?: string;
}) {
    const [ouvert, setOuvert] = useState(false);
    const texte = libelle
        ?? (depart.type === "forme" ? "Ce mot veut aussi dire…" : "Ça se dit autrement chez moi ?");

    return (
        <>
            <button
                type="button"
                onClick={() => setOuvert(true)}
                aria-haspopup="dialog"
                className={cn(
                    "inline-flex items-center gap-2.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    variante === "cadre"
                        ? "h-12 w-full justify-center rounded-lg border-2 border-dashed border-sens-200 text-base text-sens-texte hover:border-sens-500 hover:bg-sens-50"
                        : "h-10 justify-center rounded-full bg-sens-500 px-4 text-sm text-white hover:bg-sens-600",
                    className,
                )}
            >
                <MessageSquarePlus className="h-5 w-5 shrink-0" strokeWidth={2.2} aria-hidden />
                {texte}
            </button>
            <FeuilleContribution depart={depart} ouvert={ouvert} onOuvertChange={setOuvert} onSucces={onSucces} />
        </>
    );
}
