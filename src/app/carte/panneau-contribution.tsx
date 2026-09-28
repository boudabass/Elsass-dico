"use client"

import type { VarianteMot } from "@/app/actions/carte"
import { BoutonChezMoi } from "@/components/contribution/bouton-chez-moi"
import { BoutonContribuer } from "@/components/contribution/bouton-contribuer"

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
            <p className="font-medium text-foreground">« {francais} »</p>

            {variantes === null ? (
                <p className="text-muted-foreground">Chargement des formes…</p>
            ) : (
                <>
                    {variantes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {variantes.map((v) => (
                                <BoutonChezMoi
                                    key={v.id}
                                    varianteId={v.id}
                                    monVote={v.monVote}
                                    puce={<span lang="gsw">{v.forme}</span>}
                                    onSucces={() => onSucces()}
                                />
                            ))}
                        </div>
                    )}
                    <BoutonContribuer
                        depart={{ type: "mot", lemme: { id: lemmeId, francais } }}
                        onSucces={() => onSucces()}
                        className="h-11"
                    />
                </>
            )}
        </div>
    )
}
