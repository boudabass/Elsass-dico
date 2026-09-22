"use client"

import type { VarianteMot } from "@/app/actions/carte"
import { NouvelleVariante } from "@/app/entree/[id]/nouvelle-variante"
import { VoteVariante } from "@/app/entree/[id]/vote-variante"

// Sous la recherche d'un mot : rattacher son village à une forme existante, ou
// en apporter une nouvelle, sans quitter la carte. Mêmes boutons que la fiche
// de mot, mais rafraîchis par `onSucces` : la carte charge ses données côté
// client, un `router.refresh()` n'y rafraîchirait rien.
//
// `max-h` + défilement interne : un mot à beaucoup de variantes fait défiler
// ce panneau, jamais la page ni la carte hors de l'écran.
export function PanneauContribution({
    lemmeId,
    francais,
    variantes,
    onSucces,
}: {
    lemmeId: string
    francais: string
    /** `null` : en cours de chargement. */
    variantes: VarianteMot[] | null
    onSucces: () => void
}) {
    return (
        <div className="max-h-[32vh] shrink-0 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">
                « {francais} »
                {variantes === null ? " — chargement…" : null}
            </p>

            {variantes !== null && (
                <>
                    {variantes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {variantes.map((v) => (
                                <div
                                    key={v.id}
                                    className="flex items-center gap-1.5 rounded-full border border-bordure-forte py-1 pl-3 pr-1.5 text-xs text-foreground"
                                >
                                    <span>{v.forme}</span>
                                    <VoteVariante varianteId={v.id} monVote={v.monVote} onSucces={onSucces} />
                                </div>
                            ))}
                        </div>
                    )}
                    <NouvelleVariante lemmeId={lemmeId} onSucces={onSucces} />
                </>
            )}
        </div>
    )
}
