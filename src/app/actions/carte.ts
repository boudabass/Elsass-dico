'use server'

import { prisma } from "@/lib/prisma"

export interface PointCarte {
    /** Code INSEE — sert de clé et de lien vers le contour, jamais affiché. */
    id: number
    nom: string
    latitude: number
    longitude: number
    /** Les formes attestées pour ce village, dans l'ordre où elles viennent. */
    formes: string[]
}

export interface PointsCarte {
    points: PointCarte[]
    nbFormes: number
}

// Sorti de `page.tsx` (14/09/2026) : envoyer les 819 villages dans le rendu
// serveur gonflait la page initiale de 127 Ko de HTML avant même que la carte
// n'existe à l'écran (doc 20, note du prototype). Un appel client après
// montage — via `useListeMemorisee`, donc mis en cache et non rejoué à chaque
// aller-retour sur l'écran — retire ce poids du premier rendu, au prix d'un
// aller-retour supplémentaire une fois la carte affichée : même compromis que
// la pagination A-Z du même jour.
export async function pointsCarteAction(): Promise<PointsCarte> {
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
