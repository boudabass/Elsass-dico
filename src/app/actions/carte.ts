'use server'

import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

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
/** Une forme du lemme, pour le panneau de contribution qui accompagne la
 *  recherche sur la carte (17/09/2026) : assez pour brancher les mêmes gestes
 *  que /entree/[id] (`VoteVariante`, `NouvelleVariante`) directement ici,
 *  plutôt que de renvoyer vers la fiche. `nbVillages` à 0 = la forme n'a
 *  aucun point sur la carte (elle se liste au-dessus). */
export interface VarianteMot {
    id: string
    forme: string
    nbVillages: number
    monVote: boolean
}

export interface PointsMot {
    francais: string
    /** Un point par (variante, village) : une couleur par variante suppose que
     *  chaque point ne porte qu'une seule forme, pas le tableau qu'utilise
     *  `pointsCarteAction()` pour ses villages toponymes. */
    points: PointCarte[]
    /** Toutes les formes du lemme, avec de quoi voter ou en ajouter une. */
    variantes: VarianteMot[]
}

export async function pointsMotAction(lemmeId: string): Promise<PointsMot | null> {
    const session = await sessionActuelle()

    const lemme = await prisma.lemme.findUnique({
        where: { id: lemmeId },
        select: {
            francais: true,
            variantes: {
                where: { masquee: false },
                orderBy: { creeLe: "asc" },
                select: {
                    id: true,
                    forme: true,
                    temoignages: {
                        // Restreint aux témoignages de locuteurs : un vote de
                        // membre porte toujours un village (voterPourVarianteAction),
                        // les témoignages de sources écrites (communeId nul) ne
                        // comptent ni pour `nbVillages` ni pour `monVote`.
                        where: { communeId: { not: null } },
                        select: {
                            membreId: true,
                            commune: { select: { id: true, nom: true, latitude: true, longitude: true } },
                        },
                    },
                },
            },
        },
    })
    if (!lemme) return null

    const points: PointCarte[] = []
    const variantes: VarianteMot[] = []

    for (const v of lemme.variantes) {
        // Dédoublonné par commune : deux locuteurs du même village qui
        // témoignent de la même forme restent UN point, pas deux superposés.
        const villages = new Map<number, { id: number; nom: string; latitude: number; longitude: number }>()
        let monVote = false
        for (const t of v.temoignages) {
            if (t.commune) villages.set(t.commune.id, t.commune)
            if (session && t.membreId === session.membreId) monVote = true
        }

        Array.from(villages.values()).forEach((c) => {
            points.push({ id: c.id, nom: c.nom, latitude: c.latitude, longitude: c.longitude, formes: [v.forme] })
        })

        variantes.push({ id: v.id, forme: v.forme, nbVillages: villages.size, monVote })
    }

    return { francais: lemme.francais, points, variantes }
}
