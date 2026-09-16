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

// Étape 4 (doc 20) : « recherche d'un mot → les variantes s'affichent aux
// villages qui les revendiquent, une couleur par variante ». Distinct de
// `pointsCarteAction()` : celle-ci montre les 819 toponymes par leur PROPRE
// commune (`Lemme.communeId`) ; celle-ci montre n'importe quel lemme par les
// communes de ses TÉMOINS (`Temoignage.communeId`, un vote de locuteur), qui
// n'ont rien à voir l'une avec l'autre.
export interface PointsMot {
    francais: string
    /** Un point par (variante, village) : une couleur par variante suppose que
     *  chaque point ne porte qu'une seule forme, pas le tableau qu'utilise
     *  `pointsCarteAction()` pour ses villages toponymes. */
    points: PointCarte[]
    /** Formes qu'aucun témoignage de locuteur ne rattache à un village. Ne
     *  vont jamais sur la carte (doc 20) — elles se disent au-dessus. */
    formesSansLieu: string[]
}

export async function pointsMotAction(lemmeId: string): Promise<PointsMot | null> {
    const lemme = await prisma.lemme.findUnique({
        where: { id: lemmeId },
        select: {
            francais: true,
            variantes: {
                where: { masquee: false },
                select: {
                    forme: true,
                    temoignages: {
                        where: { communeId: { not: null } },
                        select: { commune: { select: { id: true, nom: true, latitude: true, longitude: true } } },
                    },
                },
            },
        },
    })
    if (!lemme) return null

    const points: PointCarte[] = []
    const formesSansLieu: string[] = []

    for (const v of lemme.variantes) {
        // Dédoublonné par commune : deux locuteurs du même village qui
        // témoignent de la même forme restent UN point, pas deux superposés.
        const villages = new Map<number, { id: number; nom: string; latitude: number; longitude: number }>()
        for (const t of v.temoignages) {
            if (t.commune) villages.set(t.commune.id, t.commune)
        }

        if (!villages.size) {
            formesSansLieu.push(v.forme)
            continue
        }

        Array.from(villages.values()).forEach((c) => {
            points.push({ id: c.id, nom: c.nom, latitude: c.latitude, longitude: c.longitude, formes: [v.forme] })
        })
    }

    return { francais: lemme.francais, points, formesSansLieu }
}
