import { toast } from "sonner"

import type { EchecContribution } from "@/lib/contribution"

/** Affiche le refus d'un vote ou d'une nouvelle forme. Quand il manque le
 *  village, le toast porte le bouton qui mène à son choix, plutôt que de dire
 *  où aller sans y conduire. */
export function signalerEchecContribution(echec: EchecContribution, allerChoisirVillage: () => void) {
    toast.error(
        echec.erreur,
        echec.villageRequis
            ? { action: { label: "Choisir mon village", onClick: allerChoisirVillage } }
            : undefined,
    )
}
