'use server'

import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

export interface CommuneOption {
    id: number
    nom: string
    departement: string
}

/** Le référentiel des 1 605 communes, pour le sélecteur de village de « Mon
 *  espace ». Trié par population décroissante : c'est la raison d'être du
 *  champ (commentaire de schema.prisma) — un sélecteur de 1 605 entrées doit
 *  proposer d'abord ce que l'utilisateur cherche en premier.
 *
 *  Gardé derrière une session comme le reste de l'app, même si la donnée
 *  elle-même n'a rien de sensible : ce n'est pas un annuaire public. */
export async function listerCommunesAction(): Promise<CommuneOption[]> {
    const session = await sessionActuelle()
    if (!session) return []

    return prisma.commune.findMany({
        select: { id: true, nom: true, departement: true },
        orderBy: [{ population: "desc" }, { nom: "asc" }],
    })
}
