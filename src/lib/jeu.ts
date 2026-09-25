// Le jeu « Quel village dit ça ? » (brief validé par John le 25/09/2026).
//
// On montre toutes les formes alsaciennes attestées d'un village, et le membre
// le retrouve parmi quatre. Tout le contenu vient des toponymes déjà en base :
// aucune forme n'est écrite ici, et aucune n'est présentée comme la bonne. La
// réponse montre toutes les formes du village, avec ce qui fonde chacune.
//
// Vit dans `lib/` et non dans un fichier `'use server'` : ce sont des outils
// des actions de `app/actions/jeu.ts`, pas des points d'entrée appelables
// depuis le navigateur. La réponse d'une manche ne doit jamais y arriver avant
// que le membre ait répondu.

import { prisma } from "@/lib/prisma"

// --- Le calendrier ------------------------------------------------------------

/** Le jour du défi n°1. Le numéro d'un défi compte les jours depuis celui-ci. */
const LANCEMENT = "2026-09-25"

export const NB_MANCHES = 5

/** Le jour en cours à Strasbourg, et non en UTC : un défi qui changerait à
 *  2 h du matin l'été serait un défi qui change au milieu de la soirée de
 *  quelqu'un. `fr-CA` parce qu'il formate en AAAA-MM-JJ. */
export function jourActuel(): string {
    return new Intl.DateTimeFormat("fr-CA", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())
}

function joursEntre(de: string, a: string): number {
    return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000)
}

/** L'indice du jour depuis le lancement (0 le premier jour). */
export function indiceDuJour(jour: string): number {
    return Math.max(0, joursEntre(LANCEMENT, jour))
}

export function numeroDefi(jour: string): number {
    return indiceDuJour(jour) + 1
}

export function jourPrecedent(jour: string): string {
    return new Date(Date.parse(`${jour}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
}

/** L'inverse de `numeroDefi()` : le jour d'un défi numéroté. Sert à la route
 *  d'automatisation (25/09/2026), qui doit pouvoir révéler un défi précis
 *  plutôt que seulement « la veille ». */
export function jourDuDefi(numero: number): string {
    return new Date(Date.parse(`${LANCEMENT}T00:00:00Z`) + (numero - 1) * 86_400_000)
        .toISOString()
        .slice(0, 10)
}

// --- Le hasard, reproductible -------------------------------------------------
//
// Le défi du jour est le même pour tout le monde sans rien stocker : il se
// déduit de la date. D'où un générateur à graine plutôt que `Math.random()`.

function hacher(texte: string): number {
    let h = 2166136261
    for (let i = 0; i < texte.length; i++) {
        h ^= texte.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

/** mulberry32 : court, rapide, et largement suffisant pour tirer des villages. */
function generateur(graine: string): () => number {
    let a = hacher(graine)
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function melanger<T>(liste: T[], aleatoire: () => number): T[] {
    const copie = [...liste]
    for (let i = copie.length - 1; i > 0; i--) {
        const j = Math.floor(aleatoire() * (i + 1))
        ;[copie[i], copie[j]] = [copie[j], copie[i]]
    }
    return copie
}

// --- La réserve de villages ---------------------------------------------------

export interface VillageJeu {
    id: number
    nom: string
    departement: string
    latitude: number
    longitude: number
    /** Les formes montrées pendant la manche. */
    formes: string[]
    /** `cleDeForme()` de toutes ses formes : deux villages qui en partagent une
     *  ne peuvent pas être proposés ensemble, la réponse serait double. */
    cles: string[]
    /** Écart entre son nom français et sa forme la plus proche (voir `ecart`). */
    ecart: number
}

// Mesuré en base le 25/09/2026 sur les 819 villages à forme attestée, en
// distance d'édition rapportée à la longueur (0 = même nom, 1 = rien en
// commun). Sous 0,2, le nom se lit dans la forme (`Lembach` ← `Lämbàch`,
// `Hœrdt` ← `Herdt`, `Colmar` ← `Colmer`) et la manche ne demande rien : 280
// villages écartés. Les 539 autres se répartissent en cinq tranches de 97 à 124,
// de `Gunstett` ← `Gunschtett` à `Sarre-Union` ← `Buckenum`. Une manche par
// tranche, dans l'ordre : la partie monte en difficulté.
//
// Une première version mesurait la ressemblance en trigrammes (pg_trgm) : elle
// laissait passer `Herdt` et rangeait `Süfflum` parmi les plus durs. Sur des
// mots aussi courts, un trigramme de différence pèse trop lourd.
const TRANCHES: [number, number][] = [
    [0.2, 0.3],
    [0.3, 0.4],
    [0.4, 0.5],
    [0.5, 0.6],
    [0.6, Infinity],
]

/** Même normalisation que `nomNormalise()` des scripts : minuscules, accents
 *  et ligatures réduits, séparateurs retirés. Sert à MESURER, jamais à écrire
 *  ni à identifier une forme. */
function normaliser(texte: string): string {
    return texte
        .toLowerCase()
        .replace(/œ/g, "oe")
        .replace(/æ/g, "ae")
        .normalize("NFD")
        .replace(/[̀-ͯ]+/g, "")
        .replace(/[^a-z0-9]+/g, "")
}

function distanceEdition(a: string, b: string): number {
    let precedente = Array.from({ length: b.length + 1 }, (_, j) => j)
    for (let i = 1; i <= a.length; i++) {
        const ligne = [i]
        for (let j = 1; j <= b.length; j++) {
            ligne[j] = Math.min(precedente[j] + 1, ligne[j - 1] + 1, precedente[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
        }
        precedente = ligne
    }
    return precedente[b.length]
}

/** L'écart entre le nom français et sa forme alsacienne la plus proche :
 *  toutes les formes sont montrées, c'est la plus transparente qui compte. */
function ecart(nom: string, formes: string[]): number {
    const n = normaliser(nom)
    return Math.min(
        ...formes.map((f) => {
            const x = normaliser(f)
            return distanceEdition(x, n) / Math.max(x.length, n.length, 1)
        }),
    )
}

/** Rayon des distracteurs. Mesuré : dans 15 km, chaque village a au moins 13
 *  voisins attestés (58 en médiane). Des voisins, parce qu'un village à
 *  l'autre bout de l'Alsace se devine par élimination. */
const RAYON_KM = 15

interface Reserve {
    tous: VillageJeu[]
    tranches: VillageJeu[][]
    parId: Map<number, VillageJeu>
}

let reserve: { valeur: Reserve; datee: number } | null = null
const FRAICHEUR_RESERVE_MS = 60 * 60 * 1000

/** Les villages jouables, relus au plus une fois par heure : une modération
 *  (forme masquée) finit par s'y voir, sans relancer la requête à chaque clic
 *  sur un VPS sans limite CPU. */
export async function chargerReserve(): Promise<Reserve> {
    if (reserve && Date.now() - reserve.datee < FRAICHEUR_RESERVE_MS) return reserve.valeur

    // Les transcriptions phonétiques entre crochets (`[Itənə Str.; …]`, trois au
    // 25/09/2026) ne sont pas des graphies qu'un locuteur lirait : écartées du
    // jeu seulement, elles restent sur la fiche du village.
    const lignes = await prisma.$queryRaw<
        {
            id: number
            nom: string
            departement: string
            latitude: number
            longitude: number
            formes: string[]
            cles: string[]
        }[]
    >`
        SELECT c.id, c.nom, c.departement, c.latitude, c.longitude,
               array_agg(v.forme ORDER BY v.forme) AS formes,
               array_agg(v.cle_forme ORDER BY v.forme) AS cles
        FROM lemmes l
        JOIN communes c ON c.id = l.commune_id
        JOIN variantes v ON v.lemme_id = l.id AND v.masquee = false
        WHERE ltrim(v.forme) NOT LIKE '[%'
        GROUP BY c.id
        ORDER BY c.id
    `

    const tous: VillageJeu[] = lignes.map((l) => ({ ...l, ecart: ecart(l.nom, l.formes) }))
    const tranches = TRANCHES.map(([min, max]) => tous.filter((v) => v.ecart >= min && v.ecart < max))
    const valeur = { tous, tranches, parId: new Map(tous.map((v) => [v.id, v])) }
    reserve = { valeur, datee: Date.now() }
    return valeur
}

function distanceKm(a: VillageJeu, b: VillageJeu): number {
    const r = Math.PI / 180
    const dLat = (b.latitude - a.latitude) * r
    const dLon = (b.longitude - a.longitude) * r
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(x))
}

/** Trois villages voisins, qui ne partagent aucune forme avec la bonne réponse
 *  ni son nom (les deux Bouxwiller). Sinon on compterait faux une réponse
 *  juste : `Arelse` est aussi bien Ernolsheim-Bruche qu'Ernolsheim-lès-Saverne. */
function distracteurs(cible: VillageJeu, r: Reserve, aleatoire: () => number): VillageJeu[] {
    const cles = new Set(cible.cles)
    const admissible = (v: VillageJeu) =>
        v.id !== cible.id && v.nom !== cible.nom && !v.cles.some((c) => cles.has(c))

    for (const rayon of [RAYON_KM, RAYON_KM * 2, Infinity]) {
        const proches = r.tous.filter((v) => admissible(v) && distanceKm(cible, v) <= rayon)
        if (proches.length >= 3) return melanger(proches, aleatoire).slice(0, 3)
    }
    return melanger(r.tous.filter(admissible), aleatoire).slice(0, 3)
}

// --- Les manches --------------------------------------------------------------

/** Ce que la base garde d'une manche (`PartieJeu.manches`). */
export interface MancheStockee {
    communeId: number
    choix: number[]
    reponse: number | null
}

/** Le défi d'un jour. Dans chaque tranche, les villages passent tous une fois
 *  avant qu'un seul revienne : un ordre mélangé par cycle, parcouru jour après
 *  jour. La plus petite tranche compte 97 villages, soit plus de trois mois
 *  sans répétition. */
export async function manchesDuJour(jour: string): Promise<MancheStockee[]> {
    const r = await chargerReserve()
    const indice = indiceDuJour(jour)
    const aleatoire = generateur(`choix|${jour}`)

    return r.tranches.map((tranche, t) => {
        const cycle = Math.floor(indice / tranche.length)
        const ordre = melanger(tranche, generateur(`tranche|${t}|${cycle}`))
        const cible = ordre[indice % tranche.length]
        return mancheDe(cible, r, aleatoire)
    })
}

/** Une partie libre : même montée en difficulté, tirée au hasard. */
export async function manchesLibres(): Promise<MancheStockee[]> {
    const r = await chargerReserve()
    const aleatoire = Math.random
    return r.tranches.map((tranche) => mancheDe(tranche[Math.floor(aleatoire() * tranche.length)], r, aleatoire))
}

function mancheDe(cible: VillageJeu, r: Reserve, aleatoire: () => number): MancheStockee {
    const choix = melanger([cible, ...distracteurs(cible, r, aleatoire)], aleatoire).map((v) => v.id)
    return { communeId: cible.id, choix, reponse: null }
}
