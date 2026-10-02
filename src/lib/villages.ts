// Accès en lecture aux communes, pour les fiches publiques /village/[slug].
//
// Un toponyme EST une commune (doc 20) : la fiche village n'est pas un
// second modèle, c'est le lemme rattaché à la commune (`Lemme.communeId`,
// unique) vu depuis l'autre bout. Une commune n'a donc au plus qu'un lemme.

import { chargerLemmeDetaille } from "@/lib/lemmes"
import { prisma } from "@/lib/prisma"
import type { LemmeDetaille } from "@/lib/dictionnaire"
import type { PointCarte, PointsCarte } from "@/app/actions/carte"

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

/** Les villages qui ont une forme attestée de leur propre nom, pour la carte.
 *  Hors de `actions/carte.ts` (02/10/2026) : tout ce qu'un fichier
 *  `'use server'` exporte devient appelable depuis le navigateur. La home
 *  publique en a besoin côté serveur ; l'action, elle, est réservée aux
 *  membres. */
export async function chargerPointsCarte(): Promise<PointsCarte> {
    const villages = await prisma.lemme.findMany({
        where: { NOT: { communeId: null }, commune: { isNot: null } },
        select: {
            commune: { select: { id: true, nom: true, latitude: true, longitude: true } },
            variantes: {
                where: { masquee: false },
                select: { forme: true },
                orderBy: { creeLe: "asc" },
            },
        },
    })

    const points: PointCarte[] = villages
        .filter((v) => v.commune && v.variantes.length)
        .map((v) => ({
            id: v.commune!.id,
            nom: v.commune!.nom,
            latitude: v.commune!.latitude,
            longitude: v.commune!.longitude,
            formes: v.variantes.map((x) => x.forme),
        }))

    return { points, nbFormes: points.reduce((n, p) => n + p.formes.length, 0) }
}
