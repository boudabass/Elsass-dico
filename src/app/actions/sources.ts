'use server'

import type { SourceListe } from "@/lib/sources"
import { prisma } from "@/lib/prisma"
import { adminExige } from "@/lib/session-serveur"

const REFUS = "Réservé aux administrateurs"

/** Lecture seule : `Source` est de l'archive (schéma, bloc « LECTURE SEULE »).
 *  Rien ici ne modifie une fiche — elles viennent des fiches versionnées de
 *  `data/sources/` et se régénèrent par l'importeur, pas depuis l'app. */
export async function listerSourcesAction(): Promise<
    { succes: true; sources: SourceListe[] } | { succes: false; erreur: string }
> {
    if (!(await adminExige())) return { succes: false, erreur: REFUS }

    const lignes = await prisma.source.findMany({
        select: {
            id: true,
            code: true,
            nom: true,
            url: true,
            type: true,
            annee: true,
            licence: true,
            fiabilite: true,
            _count: { select: { attestations: true, temoignages: true } },
        },
        orderBy: { nom: 'asc' },
    })

    return {
        succes: true,
        sources: lignes.map((s) => ({
            id: s.id,
            code: s.code,
            nom: s.nom,
            url: s.url,
            type: s.type,
            annee: s.annee,
            licence: s.licence,
            fiabilite: s.fiabilite,
            nbAttestations: s._count.attestations,
            nbTemoignages: s._count.temoignages,
        })),
    }
}
