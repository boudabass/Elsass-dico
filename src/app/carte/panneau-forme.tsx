"use client"

import type { SensFormeCarte } from "@/app/actions/carte"
import { BoutonChezMoi } from "@/components/contribution/bouton-chez-moi"
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
                        <BoutonChezMoi
                            key={s.varianteId}
                            varianteId={s.varianteId}
                            monVote={s.monVote}
                            cote="als"
                            puce={<>
                                {s.francais}
                                {s.forme !== titre && <span lang="gsw" className="font-normal opacity-80"> ({s.forme})</span>}
                            </>}
                            onSucces={() => onSucces()}
                        />
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
