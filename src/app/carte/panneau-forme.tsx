"use client"

import type { SensFormeCarte } from "@/app/actions/carte"
import { VoteVariante } from "@/app/entree/[id]/vote-variante"
import { BoutonContribuer } from "@/components/contribution/bouton-contribuer"

// Pendant de `PanneauContribution` côté alsacien → français (27/09/2026) :
// sous la carte d'une forme, chacun de ses sens, et le `+` pour y rattacher
// son village. Depuis le 28/09/2026, « Ce mot veut aussi dire… » y rattache la
// forme à un autre mot français (décision de John : on contribue dans les deux
// sens). Proposer une AUTRE forme, elle, se fait depuis un mot français.
export function PanneauForme({
    titre,
    sens,
    onSucces,
}: {
    titre: string
    /** `null` : en cours de chargement. */
    sens: SensFormeCarte[] | null
    onSucces: () => void
}) {
    return (
        <div className="max-h-[32vh] shrink-0 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">« {titre} » veut dire&nbsp;:</p>

            {sens === null ? (
                <p className="text-muted-foreground">Chargement des sens…</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {sens.map((s) => (
                        <div
                            key={s.varianteId}
                            className="flex items-center gap-1.5 rounded-full border border-bordure-forte py-1 pl-3 pr-1.5 text-xs text-foreground"
                        >
                            <span>
                                <span className="font-semibold">{s.francais}</span>
                                {s.forme !== titre && <span className="text-muted-foreground"> ({s.forme})</span>}
                            </span>
                            <VoteVariante varianteId={s.varianteId} monVote={s.monVote} onSucces={onSucces} />
                        </div>
                    ))}
                </div>
            )}
            {sens !== null && (
                <BoutonContribuer
                    depart={{ type: "forme", forme: sens[0]?.forme ?? titre }}
                    onSucces={() => onSucces()}
                    className="h-11"
                />
            )}
        </div>
    )
}
