// La saisie d'une forme par un membre : article, composition, et comparaison
// avec les formes déjà connues d'un mot (28/09/2026, refonte du parcours « Ça
// se dit autrement chez moi ? »). Aucun accès à la base : ce fichier se teste
// seul, et le serveur comme le client s'en servent.
//
// GARANTIE (règle 1) : rien n'est réécrit. La forme publiée est la
// concaténation exacte de l'article choisi (ou tapé) et de ce que le membre a
// écrit, moins les espaces extérieurs et la ponctuation finale (`cleDeForme`).
// `article + formeSansArticle = forme`, octet pour octet : c'est le CHECK
// `chk_variante_article_reconstruction`, et `composerForme` le vérifie avant.

import { cleDeForme } from "@/lib/dictionnaire"

// --- Les articles -------------------------------------------------------------
//
// Mesurés en base le 28/09/2026. Formes décomposées : `d'r ` 3 720, `d'` collé
// 1 843, `d' ` espacé 1 488, `s'` collé 1 038, `s' ` espacé 764. En tête des
// formes non décomposées : `de ` 1 218. Rien d'autre n'approche : `a`, `en`,
// `e` sont aussi des mots (« in », « un »), on ne les propose pas.
//
// Chaque bouton porte le PRÉFIXE exact qu'il ajoute : `d'` et `s'` collés (la
// graphie majoritaire, et celle de la source devant un nom), `d'r` et `de`
// suivis d'une espace. Un article tapé dans le champ garde, lui, exactement
// l'espacement que le membre a tapé.

export interface ArticlePropose {
    libelle: string
    prefixe: string
}

export const ARTICLES_PROPOSES: readonly ArticlePropose[] = [
    { libelle: "d'r", prefixe: "d'r " },
    { libelle: "d'", prefixe: "d'" },
    { libelle: "s'", prefixe: "s'" },
    { libelle: "de", prefixe: "de " },
]

/** Le libellé d'un préfixe, pour savoir quel bouton allumer : `D’r ` → `d'r`. */
export function libelleArticle(prefixe: string): string {
    return prefixe.trim().toLowerCase().replace(/[’‘´`]/g, "'")
}

/** Préfixe d'un article « autre », tapé dans le petit champ libre : collé s'il
 *  finit par une apostrophe (élision), suivi d'une espace sinon. */
export function prefixeAutre(saisie: string): string | null {
    const a = saisie.trim()
    if (!a) return null
    return /['’]$/.test(a) ? a : `${a} `
}

// Ce qu'on sait détacher sans se tromper, repris de scripts/lib/article.mts
// (mesure du 03/09/2026) plus `de ` : `d'r ` / `d' ` / `s' ` / `de ` espacés
// sont toujours un article ; `d'` / `s'` collés seulement devant une
// majuscule. Collés devant une minuscule (`s'esch`, pronom + verbe), on ne
// détache pas : l'ambiguïté se laisse, elle ne se tranche pas.
const ARTICLE_DETACHABLE = /^(?:[dD]['’][rR] +|[dDsS]['’] +|[dDsS]['’](?=[A-ZÀ-Ý])|[dD][eE] +)/

/** Sépare un article tapé en tête du champ. `d'r Lohn` → préfixe `d'r `,
 *  reste `Lohn`. Le préfixe garde la casse, l'apostrophe et l'espacement tapés. */
export function detacherArticle(saisie: string): { prefixe: string | null; reste: string } {
    const s = saisie.replace(/^\s+/, "")
    const m = ARTICLE_DETACHABLE.exec(s)
    if (!m || !s.slice(m[0].length).trim()) return { prefixe: null, reste: saisie }
    // Un article espacé se normalise à UNE espace : `d'r   Lohn` n'est pas une
    // autre graphie, c'est une frappe.
    const prefixe = m[0].endsWith(" ") ? `${m[0].trimEnd()} ` : m[0]
    return { prefixe, reste: s.slice(m[0].length) }
}

export interface FormeComposee {
    forme: string
    article: string | null
    formeSansArticle: string | null
}

/** La forme telle qu'elle sera publiée. `null` si rien n'a été écrit après
 *  l'article : un article seul se tape sans bouton, comme un mot. */
export function composerForme(prefixe: string | null, reste: string): FormeComposee | null {
    const sansArticle = cleDeForme(reste)
    if (!sansArticle) return null
    if (!prefixe) return { forme: sansArticle, article: null, formeSansArticle: null }
    const forme = prefixe + sansArticle
    // La garantie se vérifie, elle ne se suppose pas.
    if (cleDeForme(forme) !== forme) return null
    return { forme, article: prefixe, formeSansArticle: sansArticle }
}

// --- Comparer avec les formes déjà connues d'un mot ----------------------------
//
// Décision de John (27/09/2026) : TOUJOURS comparer, même sans article, aux
// formes de ce mot seulement, et proposer la plus proche.
//
//   identique : même forme, lettre pour lettre, une fois l'article mis de
//               côté, et des articles compatibles (identiques, ou absents d'un
//               côté : `Lohn` et `d'r Lohn`). Pas de doublon possible.
//   proche    : les mêmes lettres à la casse et aux accents près, un autre
//               article (`s' Bigudi` / `de Bigudi`), ou une ou deux lettres de
//               différence. On propose, on ne bloque jamais : `Barr` et `Bàrr`
//               ne notent pas le même /a/ (ORTHAL), ce sont deux graphies.
//   nouvelle  : rien de tel.
//
// Seuil mesuré le 28/09/2026 sur les 21 314 paires de formes des 10 678 mots
// qui en ont plusieurs : distance ≤ 2 ET ≤ 25 % de la longueur couvre 1 974
// paires (9 %), dont les vraies quasi-copies ; au-delà de 25 %, une ou deux
// lettres de différence sur un mot court en font un autre mot.

const ARTICLE_EN_TETE = /^(?:[dD]['’][rR]\s*|[dDsS]['’]\s*|(?:der|dr|de|die|di|das|dàs)\s+)/i
const SEUIL_DISTANCE = 2
const SEUIL_PROPORTION = 0.25

function decouper(forme: string): { article: string | null; reste: string } {
    const f = cleDeForme(forme)
    const m = ARTICLE_EN_TETE.exec(f)
    if (!m || !f.slice(m[0].length).trim()) return { article: null, reste: f }
    return { article: libelleArticle(m[0]), reste: f.slice(m[0].length).trim() }
}

function sansAccentNiCasse(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]+/g, "")
}

export function distanceEdition(a: string, b: string): number {
    const d = Array.from({ length: b.length + 1 }, (_, j) => j)
    for (let i = 1; i <= a.length; i++) {
        let diag = d[0]
        d[0] = i
        for (let j = 1; j <= b.length; j++) {
            const haut = d[j]
            d[j] = Math.min(d[j] + 1, d[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
            diag = haut
        }
    }
    return d[b.length]
}

export type Statut = "identique" | "proche" | "nouvelle"

export interface Rapprochement<T> {
    statut: Statut
    /** La forme identique, ou la plus proche. */
    candidat: T | null
    /** Au plus deux autres formes proches, les plus proches d'abord. */
    autres: T[]
}

export function classerSaisie<T extends { forme: string }>(
    saisie: FormeComposee,
    formes: readonly T[],
): Rapprochement<T> {
    const tapee = decouper(saisie.forme)
    const cleTapee = sansAccentNiCasse(tapee.reste)

    const proches: { f: T; d: number }[] = []
    for (const f of formes) {
        const connue = decouper(f.forme)
        const articlesCompatibles = !tapee.article || !connue.article || tapee.article === connue.article
        if (connue.reste === tapee.reste && articlesCompatibles) {
            return {
                statut: "identique",
                candidat: f,
                autres: [],
            }
        }
        const cle = sansAccentNiCasse(connue.reste)
        const d = distanceEdition(cleTapee, cle)
        if (d <= SEUIL_DISTANCE && d / Math.max(cleTapee.length, cle.length, 1) <= SEUIL_PROPORTION) {
            proches.push({ f, d })
        }
    }

    if (!proches.length) return { statut: "nouvelle", candidat: null, autres: [] }
    proches.sort((a, b) => a.d - b.d)
    return { statut: "proche", candidat: proches[0].f, autres: proches.slice(1, 3).map((p) => p.f) }
}
