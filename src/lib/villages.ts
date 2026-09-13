// Accès en lecture aux communes, pour les fiches publiques /village/[slug].
//
// Un toponyme EST une commune (doc 20) : la fiche village n'est pas un
// second modèle, c'est le lemme rattaché à la commune (`Lemme.communeId`,
// unique) vu depuis l'autre bout. Une commune n'a donc au plus qu'un lemme.

import { chargerLemmeDetaille } from "@/lib/lemmes"
import { prisma } from "@/lib/prisma"
import type { LemmeDetaille } from "@/lib/dictionnaire"

export interface VillageDetaille {
    id: number
    slug: string
    nom: string
    departement: string
    population: number | null
    aireLinguistique: string | null
    /** null pour les communes sans forme attestée — 786 sur 1 605 au 13/09/2026.
     *  La page existe quand même (appel à contribution), mais n'est pas générée
     *  statiquement ni indexée : cf. `generateStaticParams` de la page. */
    lemme: LemmeDetaille | null
}

export async function chargerVillage(slug: string): Promise<VillageDetaille | null> {
    const commune = await prisma.commune.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            nom: true,
            departement: true,
            population: true,
            aireLinguistique: true,
            lemmes: { select: { id: true } },
        },
    })
    if (!commune) return null

    // `communeId` est `@unique` sur Lemme : au plus une ligne.
    const idLemme = commune.lemmes[0]?.id
    const lemme = idLemme ? await chargerLemmeDetaille({ id: idLemme }) : null

    return {
        id: commune.id,
        slug: commune.slug,
        nom: commune.nom,
        departement: commune.departement,
        population: commune.population,
        aireLinguistique: commune.aireLinguistique,
        lemme,
    }
}

/** Les communes qui ont au moins une forme alsacienne attestée — celles que
 *  `generateStaticParams` pré-rend, les seules indexables (doc 20, étape 3).
 *  819 sur 1 605 au 13/09/2026 (cf. 21-REPRISE.md) ; les autres restent
 *  joignables à l'URL, rendues à la demande, en `noindex`. */
export async function slugsVillagesAttestes(): Promise<string[]> {
    const communes = await prisma.commune.findMany({
        where: { lemmes: { some: { variantes: { some: { masquee: false } } } } },
        select: { slug: true },
    })
    return communes.map((c) => c.slug)
}
