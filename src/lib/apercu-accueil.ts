// Ce que la home publique montre de l'app derrière le compte (26/09/2026,
// retour de John : « on ne comprend pas qu'il y a encore tout le dico, la
// recherche, la carte, le jeu »). Des aperçus RÉELS : la vraie carte, les
// vrais chiffres, lus en base. Rien n'est écrit en dur, rien ne se périme au
// prochain import.
//
// La carte est dessinée ICI, en SVG, et pas par Leaflet : la home n'a besoin
// ni de zoom ni de clic, et un visiteur qui arrive de Google ne doit pas
// télécharger Leaflet, le fond et 819 villages pour voir une image. Même fond
// que `/carte` (`public/carte/contours.topojson`, le nôtre, aucun service
// extérieur), réduit à ce qu'une image de présentation montre : le contour de
// l'Alsace-Moselle, les limites de département, un point par village.

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { merge, mesh } from "topojson-client"

import { chargerPointsCarte } from "@/lib/villages"
import type { FormeApercu } from "@/lib/dictionnaire"
import { apercusParLemme } from "@/lib/lemmes"
import { prisma } from "@/lib/prisma"

export interface ApercuCarte {
    largeur: number
    hauteur: number
    /** Le contour de tout le référentiel, plein. */
    terre: string
    /** Les limites entre départements. */
    limites: string
    /** Un tracé par couleur : chaque point y est un `M x y h0`, dessiné par un
     *  trait rond de l'épaisseur du point. 819 cercles en balises pèseraient
     *  cinq fois plus dans le HTML. */
    points: { couleur: string; d: string }[]
    nbVillages: number
    nbFormes: number
}

export interface ApercuAccueil {
    carte: ApercuCarte
    nbMots: number
    nbFormes: number
    /** Un mot montré avec TOUTES ses formes, pour dire en une image « aucune
     *  n'est la bonne ». Nul si la base ne l'a plus (jamais vu à ce jour). */
    exemple: { id: string; francais: string; formes: FormeApercu[] } | null
}

// Le mot de l'aperçu du dictionnaire, par sa clé naturelle (elle survit à une
// redérivation, un UUID non). « bonjour » parce que c'est le premier mot qu'on
// cherche, et qu'il a quatre formes de quatre coins différents.
const EXEMPLE = { cle: "bonjour", contexte: "", type: "mot" } as const

type Topo = Parameters<typeof mesh>[0]
type Collection = Parameters<typeof mesh>[1] & { geometries: Parameters<typeof merge>[1] }

// Le cadre du fond (bbox du topojson). Projection équirectangulaire corrigée
// de la latitude moyenne : sur 2° de latitude, l'écart avec une vraie
// projection conforme ne se voit pas à cette taille.
const OUEST = 5.8917
const EST = 8.23334
const SUD = 47.42022
const NORD = 49.51451
const LARGEUR = 800
const COS_LAT = Math.cos((((SUD + NORD) / 2) * Math.PI) / 180)
const ECHELLE = LARGEUR / ((EST - OUEST) * COS_LAT)
const HAUTEUR = Math.round((NORD - SUD) * ECHELLE)

function projeter([lon, lat]: number[]): [number, number] {
    return [Math.round((lon - OUEST) * COS_LAT * ECHELLE), Math.round((NORD - lat) * ECHELLE)]
}

/** Un tracé SVG à la résolution du pixel : les sommets qui tombent sur le même
 *  point entier sont sautés, c'est ce qui ramène 1 605 contours à quelques Ko. */
function trace(lignes: number[][][], fermer: boolean): string {
    let d = ""
    for (const ligne of lignes) {
        let precedent = ""
        let n = 0
        let morceau = ""
        for (const p of ligne) {
            const [x, y] = projeter(p)
            const cle = `${x} ${y}`
            if (cle === precedent) continue
            morceau += (n === 0 ? "M" : " ") + cle
            precedent = cle
            n++
        }
        if (n > 1) d += morceau + (fermer ? "Z" : "")
    }
    return d
}

const FRAICHEUR_MS = 60 * 60 * 1000
let cache: { valeur: ApercuAccueil; datee: number } | null = null

/** Relu au plus une fois par heure, comme la réserve du jeu : la home est la
 *  page la plus vue, et ces chiffres ne bougent qu'à une contribution. */
export async function chargerApercuAccueil(): Promise<ApercuAccueil> {
    if (cache && Date.now() - cache.datee < FRAICHEUR_MS) return cache.valeur

    const [brut, { points, nbFormes: nbFormesVillages }, nbMots, nbFormes, lemmeExemple] = await Promise.all([
        readFile(join(process.cwd(), "public/carte/contours.topojson"), "utf8"),
        chargerPointsCarte(),
        prisma.lemme.count(),
        prisma.variante.count({ where: { masquee: false } }),
        prisma.lemme.findUnique({
            where: { cle_contexte_type: EXEMPLE },
            select: { id: true, francais: true },
        }),
    ])
    const formesExemple = lemmeExemple ? ((await apercusParLemme([lemmeExemple.id])).get(lemmeExemple.id) ?? []) : []

    const topo = JSON.parse(brut) as Topo
    const communes = topo.objects.communes as Collection
    const departement = (g: { properties?: unknown }) =>
        String((g.properties as { c?: string } | null)?.c ?? "").slice(0, 2)

    const terre = merge(topo, communes.geometries)
    const limites = mesh(topo, communes, (a, b) => a !== b && departement(a) !== departement(b))

    // Un point par village, tous du rouge de marque (page publique). Les
    // couleurs par forme, sans légende possible ici, ne signifiaient rien
    // (revue du 28/09/2026).
    let d = ""
    for (const p of points) {
        const [x, y] = projeter([p.longitude, p.latitude])
        d += `M${x} ${y}h0`
    }

    const valeur: ApercuAccueil = {
        carte: {
            largeur: LARGEUR,
            hauteur: HAUTEUR,
            terre: trace(terre.coordinates.flat(), true),
            limites: trace(limites.coordinates, false),
            points: [{ couleur: "#C20000", d }],
            nbVillages: points.length,
            nbFormes: nbFormesVillages,
        },
        nbMots,
        nbFormes,
        exemple:
            lemmeExemple && formesExemple.length
                ? { id: lemmeExemple.id, francais: lemmeExemple.francais, formes: formesExemple }
                : null,
    }
    cache = { valeur, datee: Date.now() }
    return valeur
}
