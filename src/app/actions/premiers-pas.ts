'use server'

import { chargerLemme } from "@/app/actions/recherche"
import type { TypeTerme } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

// Le premier mot d'un nouveau membre, dans « Mon espace » (24/09/2026).
//
// Décision de John du même jour : le locuteur est prioritaire, il faut
// accumuler les parlers. Or un membre qui vient d'arriver ne savait pas quoi
// faire une fois son village choisi. On lui tend trois mots que tout le monde
// dit, avec leurs vraies formes : en reconnaître une, c'est un vrai vote, pas
// un exercice.
//
// Clés naturelles `(cle, contexte, type)` et non des UUID, comme la vitrine de
// la home (`accueil.ts`) : elles survivent à une redérivation. Les formes, elles,
// viennent de la base à chaque appel (règle 1, rien de codé en dur).
const PREMIERS_MOTS: { cle: string; contexte: string; type: TypeTerme }[] = [
    { cle: "bonjour", contexte: "", type: "mot" },
    { cle: "merci", contexte: "", type: "mot" },
    { cle: "au revoir", contexte: "", type: "expression" },
]

export interface PremierMot {
    id: string
    francais: string
    formes: { id: string; forme: string; monVote: boolean }[]
}

export async function premiersMotsAction(): Promise<PremierMot[]> {
    const session = await sessionActuelle()
    if (!session) return []

    const lemmes = await prisma.lemme.findMany({
        where: { OR: PREMIERS_MOTS },
        select: { id: true, cle: true, contexte: true, type: true },
    })
    const parClef = new Map(lemmes.map((l) => [`${l.cle}|${l.contexte}|${l.type}`, l.id]))

    // Dans l'ordre de PREMIERS_MOTS ; un mot disparu de la base est ignoré
    // plutôt que de casser l'écran.
    const ids = PREMIERS_MOTS.flatMap((m) => parClef.get(`${m.cle}|${m.contexte}|${m.type}`) ?? [])
    const details = await Promise.all(ids.map((id) => chargerLemme(id)))

    return details.flatMap((d) => d ? [{
        id: d.id,
        francais: d.francais,
        formes: d.variantes.map((v) => ({ id: v.id, forme: v.forme, monVote: v.monVote ?? false })),
    }] : [])
}
