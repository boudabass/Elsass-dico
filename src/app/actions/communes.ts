'use server'

import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

export interface CommuneOption {
    id: number
    nom: string
    departement: string
}

/** Le référentiel des 1 605 communes, pour le sélecteur de village de « Mon
 *  espace ». Trié par nom — révisé le 13/09/2026 (retour de John) : sur un
 *  sélecteur de 1 605 entrées SANS recherche, un tri par population était
 *  illisible (« ça devrait être classé alphabétiquement »). La recherche
 *  ajoutée côté client (`village-profil.tsx`) couvre désormais l'intention
 *  d'origine du champ `population` — proposer d'abord ce qu'on cherche —
 *  mieux qu'un tri ne pouvait le faire seul.
 *
 *  Gardé derrière une session comme le reste de l'app, même si la donnée
 *  elle-même n'a rien de sensible : ce n'est pas un annuaire public. */
export async function listerCommunesAction(): Promise<CommuneOption[]> {
    const session = await sessionActuelle()
    if (!session) return []

    return prisma.commune.findMany({
        select: { id: true, nom: true, departement: true },
        orderBy: [{ nom: "asc" }],
    })
}
