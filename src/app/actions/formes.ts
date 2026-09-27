'use server'

import type { FormeDetaillee, FormeResume, SensDetaille, SensForme, TypeTerme, VarianteDetaillee } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

// Le dictionnaire côté alsacien (27/09/2026, décision de John) : on part d'une
// forme et on trouve ses sens français. Un index inversé des variantes, rien de
// plus — aucune donnée créée (règle 1).
//
// Les trois fonctions SQL de la migration 20260927120000 font tout le travail
// de clé, et leurs résultats sont stockés dans deux colonnes générées,
// `cle_inv` et `parcours_inv` (20260927200000) : les recalculer à la lecture
// coûtait 4 s pour l'alphabet. `cle_inverse` regroupe (sans article, sans casse, accents gardés),
// `parcours_inverse` range et donne la lettre, `forme_inverse` donne le titre.
// Lettre, tri et saut « Aller à un mot » passent par la même, comme côté
// français (`cleParcours()`, navigation.ts).

const LIMITE_RECHERCHE = 30
const TAILLE_PAGE = 100
const SENS_EN_APERCU = 3

function nbPagesPour(total: number): number {
    return Math.max(1, Math.ceil(total / TAILLE_PAGE))
}

interface VarianteBrute {
    id: string
    cle: string
    titre: string
}

type LemmeRattache = { id: string; francais: string; contexte: string; type: string; commune: { departement: string } | null }

/** Les variantes de plusieurs formes, par clé, en deux requêtes : la clé ne
 *  s'exprime qu'en SQL, les témoins se lisent mieux par Prisma. */
async function variantesDesCles(cles: string[]) {
    const brutes = await prisma.$queryRaw<VarianteBrute[]>`
        SELECT id, cle_inv AS cle, forme_inverse(cle_forme) AS titre
        FROM variantes
        WHERE masquee = false AND cle_inv = ANY(${cles})
    `
    const variantes = await prisma.variante.findMany({
        where: { id: { in: brutes.map((b) => b.id) } },
        select: {
            id: true,
            forme: true,
            article: true,
            formeSansArticle: true,
            lemme: {
                select: {
                    id: true,
                    francais: true,
                    contexte: true,
                    type: true,
                    commune: { select: { departement: true } },
                },
            },
            temoignages: {
                select: {
                    membreId: true,
                    source: { select: { id: true, nom: true, url: true } },
                    commune: { select: { id: true, nom: true, slug: true } },
                },
            },
        },
    })
    return { brutes, parId: new Map(variantes.map((v) => [v.id, v])) }
}

/** Le titre d'une forme : la graphie sans article la plus fréquente de son
 *  groupe, à égalité la première dans l'ordre alphabétique — stable d'un
 *  chargement à l'autre (leçon du 12/09 sur l'ordre des UUID). */
function titreDe(titres: string[]): string {
    const comptes = new Map<string, number>()
    titres.forEach((t) => comptes.set(t, (comptes.get(t) ?? 0) + 1))
    return Array.from(comptes.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))[0]?.[0] ?? ""
}

/** Sources et villages comptés SÉPARÉMENT, par identité distincte, et jamais
 *  additionnés (bug de la PR #41) — même règle que `apercusParLemme()`. */
function temoinsDe(temoignages: { source: { id: string; nom: string; url: string | null } | null; commune: { id: number; nom: string; slug: string } | null }[]) {
    const sources = new Map<string, { nom: string; url: string | null }>()
    const villages = new Map<number, { id: number; nom: string; slug: string }>()
    for (const t of temoignages) {
        if (t.source) sources.set(t.source.id, { nom: t.source.nom, url: t.source.url })
        if (t.commune) villages.set(t.commune.id, t.commune)
    }
    return {
        sources: Array.from(sources.values()).sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
        villages: Array.from(villages.values()).sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    }
}

function lemmeCourt(l: LemmeRattache) {
    return { id: l.id, francais: l.francais, contexte: l.contexte, type: l.type as TypeTerme, departement: l.commune?.departement ?? null }
}

/** Les sens le mieux attestés d'abord — en cascade, sources puis villages,
 *  jamais par leur somme. Ce n'est pas « le bon sens », c'est celui que le
 *  plus de témoins écrivent. */
function comparerSens(a: SensForme, b: SensForme): number {
    return b.nbSources - a.nbSources || b.nbVillages - a.nbVillages || a.francais.localeCompare(b.francais, "fr")
}

async function resumerFormes(cles: string[]): Promise<Map<string, FormeResume>> {
    if (!cles.length) return new Map()
    const { brutes, parId } = await variantesDesCles(cles)

    const titres = new Map<string, string[]>()
    const sensParCle = new Map<string, Map<string, SensForme>>()

    for (const b of brutes) {
        const v = parId.get(b.id)
        if (!v) continue
        titres.set(b.cle, [...(titres.get(b.cle) ?? []), b.titre])

        const { sources, villages } = temoinsDe(v.temoignages)
        const sens: SensForme = {
            lemmeId: v.lemme.id,
            francais: v.lemme.francais,
            contexte: v.lemme.contexte,
            type: v.lemme.type as TypeTerme,
            departement: v.lemme.commune?.departement ?? null,
            forme: v.forme,
            nbSources: sources.length,
            nbVillages: villages.length,
        }
        // Un sens une seule fois par forme : si un même mot porte `Lohn` ET
        // `d'r Lohn`, l'aperçu garde la variante la mieux attestée. La fiche
        // de la forme, elle, les montre toutes.
        const parLemme = sensParCle.get(b.cle) ?? new Map<string, SensForme>()
        const deja = parLemme.get(sens.lemmeId)
        if (!deja || comparerSens(sens, deja) < 0) parLemme.set(sens.lemmeId, sens)
        sensParCle.set(b.cle, parLemme)
    }

    const resumes = new Map<string, FormeResume>()
    sensParCle.forEach((parLemme, cle) => {
        const sens = Array.from(parLemme.values()).sort(comparerSens)
        resumes.set(cle, { cle, titre: titreDe(titres.get(cle) ?? []), sens: sens.slice(0, SENS_EN_APERCU), nbSens: sens.length })
    })
    return resumes
}

function dansLOrdre(cles: string[], resumes: Map<string, FormeResume>): FormeResume[] {
    return cles.map((c) => resumes.get(c)).filter((r): r is FormeResume => !!r)
}

/** Chercher depuis l'alsacien. La sous-requête `par_alsacien` de l'ancienne
 *  recherche mélangée, désormais seule, et groupée par forme plutôt que par
 *  mot français : taper `Tàg` rend `güata Tàg → bonjour`, pas une carte
 *  « bonjour » dont on ne sait pas ce qui a correspondu. */
export async function rechercherFormesAction(terme: string): Promise<FormeResume[]> {
    const requete = terme.trim()
    if (requete.length < 2) return []

    // Bonus d'égalité sur la clé SANS article : `lohn` doit passer devant
    // `Lohnerhöhung`, et devant `d'r Lohn` qui n'en diffère que par l'article.
    const lignes = await prisma.$queryRaw<{ cle: string }[]>`
        WITH t AS (SELECT immutable_unaccent(lower(btrim(${requete}))) AS q)
        SELECT v.cle_inv AS cle
        FROM variantes v, t
        WHERE v.masquee = false
          AND immutable_unaccent(lower(v.forme)) LIKE '%' || t.q || '%'
        GROUP BY 1
        ORDER BY max(similarity(immutable_unaccent(lower(v.forme)), t.q)
                     + CASE WHEN immutable_unaccent(v.cle_inv) = t.q THEN 1 ELSE 0 END) DESC,
                 length(v.cle_inv) ASC,
                 v.cle_inv ASC
        LIMIT ${LIMITE_RECHERCHE}
    `
    const cles = lignes.map((l) => l.cle)
    return dansLOrdre(cles, await resumerFormes(cles))
}

export async function lettresFormesAction(): Promise<string[]> {
    const lignes = await prisma.$queryRaw<{ lettre: string }[]>`
        SELECT DISTINCT upper(left(parcours_inv, 1)) AS lettre
        FROM variantes
        WHERE masquee = false
        ORDER BY lettre
    `
    return lignes.map((l) => l.lettre).filter((l) => /^[A-Z]$/.test(l))
}

export interface PageLettreFormes {
    formes: FormeResume[]
    total: number
    page: number
    nbPages: number
}

async function totalLettre(initiale: string): Promise<number> {
    const comptes = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(DISTINCT cle_inv) AS n FROM variantes
        WHERE masquee = false AND upper(left(parcours_inv, 1)) = ${initiale}
    `
    return Number(comptes[0]?.n ?? 0)
}

/** Même contrat que `lemmesParLettreAction()` : le compte d'abord, la page
 *  demandée validée contre lui, 100 formes à la fois. */
export async function formesParLettreAction(lettre: string, page = 1): Promise<PageLettreFormes> {
    const vide: PageLettreFormes = { formes: [], total: 0, page: 1, nbPages: 1 }

    const initiale = lettre.trim().toUpperCase()
    if (!/^[A-Z]$/.test(initiale)) return vide

    const total = await totalLettre(initiale)
    if (total === 0) return vide

    const nbPages = nbPagesPour(total)
    const pageValidee = Math.min(Math.max(1, Math.floor(page) || 1), nbPages)

    // Toutes les lignes d'un groupe partagent la même valeur de
    // `parcours_inverse` (elle ne dépend que de la clé) : `min()` ne choisit
    // rien, il ne fait que la remonter au niveau du groupe.
    const lignes = await prisma.$queryRaw<{ cle: string }[]>`
        SELECT cle_inv AS cle
        FROM variantes
        WHERE masquee = false AND upper(left(parcours_inv, 1)) = ${initiale}
        GROUP BY 1
        ORDER BY min(parcours_inv) ASC, cle ASC
        LIMIT ${TAILLE_PAGE} OFFSET ${(pageValidee - 1) * TAILLE_PAGE}
    `
    const cles = lignes.map((l) => l.cle)

    return { formes: dansLOrdre(cles, await resumerFormes(cles)), total, page: pageValidee, nbPages }
}

/** La page où tombe `prefixe`, avec exactement le tri de
 *  `formesParLettreAction` — le préfixe passe par `parcours_inverse` lui
 *  aussi, donc `d'r Lo` saute bien à L. */
export async function pageDuPrefixeFormeAction(lettre: string, prefixe: string): Promise<number> {
    const initiale = lettre.trim().toUpperCase()
    const prefixeTrim = prefixe.trim()
    if (!/^[A-Z]$/.test(initiale) || !prefixeTrim) return 1

    const total = await totalLettre(initiale)
    if (total === 0) return 1

    const rangs = await prisma.$queryRaw<{ rang: bigint }[]>`
        SELECT count(DISTINCT cle_inv) AS rang FROM variantes
        WHERE masquee = false
          AND upper(left(parcours_inv, 1)) = ${initiale}
          AND parcours_inv < parcours_inverse(${prefixeTrim})
    `
    const rang = Number(rangs[0]?.rang ?? 0)
    return Math.min(Math.max(1, Math.floor(rang / TAILLE_PAGE) + 1), nbPagesPour(total))
}

/** La fiche d'une forme : chacun de ses sens français, et sous chacun TOUTES
 *  ses variantes du groupe (`Lohn` et `d'r Lohn`), chacune avec ses témoins.
 *  `monVote` comme sur /entree/[id], pour voter depuis la forme. */
export async function chargerFormeAction(cle: string): Promise<FormeDetaillee | null> {
    const cleNette = cle.trim()
    if (!cleNette) return null

    const { brutes, parId } = await variantesDesCles([cleNette])
    if (!brutes.length) return null

    const session = await sessionActuelle()

    const parLemme = new Map<string, SensDetaille>()
    for (const b of brutes) {
        const v = parId.get(b.id)
        if (!v) continue
        const { sources, villages } = temoinsDe(v.temoignages)
        const variante: VarianteDetaillee = {
            id: v.id,
            forme: v.forme,
            article: v.article,
            formeSansArticle: v.formeSansArticle,
            nbSources: sources.length,
            nbVillages: villages.length,
            sources,
            villages,
            monVote: !!session && v.temoignages.some((t) => t.membreId === session.membreId),
        }
        const sens = parLemme.get(v.lemme.id) ?? { lemme: lemmeCourt(v.lemme), variantes: [] }
        sens.variantes.push(variante)
        parLemme.set(v.lemme.id, sens)
    }

    const cascade = (a: VarianteDetaillee, b: VarianteDetaillee) =>
        b.nbSources - a.nbSources || b.nbVillages - a.nbVillages || a.forme.localeCompare(b.forme, "fr")

    const sens = Array.from(parLemme.values())
    sens.forEach((s) => s.variantes.sort(cascade))
    sens.sort((a, b) => cascade(a.variantes[0], b.variantes[0]) || a.lemme.francais.localeCompare(b.lemme.francais, "fr"))

    return { cle: cleNette, titre: titreDe(brutes.map((b) => b.titre)), sens }
}
