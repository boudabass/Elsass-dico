"use client";

import { useState, type ReactNode } from "react";
import { Check, MapPin, Plus } from "lucide-react";

import { FeuilleChezMoi, type CoteVote } from "@/components/contribution/feuille-chez-moi";
import type { MonVote } from "@/lib/contribution";
import { cn } from "@/lib/utils";

// Le seul déclencheur de « Chez moi aussi » (28/09/2026) : fiche d'un mot,
// fiche d'une forme, carte, jeu et premiers pas. Il ne vote pas, il ouvre la
// feuille (feuille-chez-moi.tsx), et il dit à quel village le vote est
// rattaché. Trois états :
//
//   « Chez moi aussi »   pas de vote
//   « Dit à X »          vote qui porte mon village actuel
//   « Dit à Y »          vote qui porte un ancien village (trait discret)
//
// `puce` : la forme elle-même devient le bouton, là où plusieurs formes
// tiennent sur une ligne (carte, premiers pas). Toute la pastille se touche,
// plutôt qu'un mini-bouton dans une pastille.
//
// `onSucces` : même contrat que BoutonContribuer. Par défaut, la feuille
// rafraîchit la page serveur ; la carte et le jeu, qui chargent leurs données
// côté client, passent leur `rafraichir`.

export function BoutonChezMoi({
    varianteId,
    monVote,
    cote = "fr",
    puce,
    onSucces,
    className,
}: {
    varianteId: string;
    monVote: MonVote | null | undefined;
    cote?: CoteVote;
    puce?: ReactNode;
    onSucces?: (vote: MonVote | null) => void;
    className?: string;
}) {
    const [ouvert, setOuvert] = useState(false);
    const vote = monVote ?? null;
    const etat = vote ? `Dit à ${vote.village}` : "Chez moi aussi";
    const Icone = !vote ? Plus : vote.actuel ? Check : MapPin;

    return (
        <>
            <button
                type="button"
                onClick={() => setOuvert(true)}
                aria-haspopup="dialog"
                className={cn(
                    "inline-flex h-10 max-w-full items-center gap-1.5 rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    puce ? "pl-3 pr-4" : "px-3.5",
                    !vote && "border-bordure-forte text-foreground hover:border-sens-500 hover:bg-sens-50",
                    vote?.actuel && "border-sens-200 bg-sens-50 text-sens-texte hover:bg-sens-100",
                    vote && !vote.actuel && "border-dashed border-bordure-forte text-muted-foreground hover:bg-muted",
                    className,
                )}
            >
                <Icone className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden />
                {puce ? (
                    <>
                        <span className="truncate">{puce}</span>
                        <span className="sr-only">, {etat}</span>
                    </>
                ) : (
                    <span className="truncate">{etat}</span>
                )}
            </button>
            <FeuilleChezMoi varianteId={varianteId} cote={cote} ouvert={ouvert} onOuvertChange={setOuvert} onSucces={onSucces} />
        </>
    );
}
