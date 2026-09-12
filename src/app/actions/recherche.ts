'use server'

import type { LemmeDetaille, LemmeResume, TypeTerme, VarianteDetaillee } from "@/lib/dictionnaire"
import { apercusParLemme } from "@/lib/lemmes"
import { prisma } from "@/lib/prisma"

// Recherche dans les deux sens — français → alsacien et alsacien → français.
// Portée par Prisma depuis le 12/09/2026 ; elle passait jusque-là par la RPC
// `rechercher_entrees()` et la table `entrees`, qui n'existent plus.
//
// Ce qui change pour l'utilisateur : les résultats ne sont plus les 338 entrées
// arbitrées mais les 25 864 lemmes dérivés, chacun avec TOUTES ses formes. Le
// mot « bonjour », qui ne rendait rien depuis l'ouverture, rend `buschur`,
// `güata Tàg`, `göte Tàij`, `grias di wohl`.

const LIMITE = 30
const FORMES_EN_APERCU = 3

interface LigneRecherche {
    id: string
    francais: string
    contexte: string
    type: TypeTerme
    departement: string | null
    score: number
}

export async function rechercherAction(terme: string): Promise<LemmeResume[]> {
    const requete = terme.trim()
    if (requete.length < 2) return []

    // Les deux directions sont deux sous-requêtes réunies, et non deux appels :
    // un mot peut correspondre par son français ET par une de ses formes
    // (`Mulhouse` / `Milhüsa`), il ne doit apparaître qu'une fois.
    //
    // `similarity()` ordonne, `LIKE` filtre. L'égalité exacte reçoit un bonus
    // franc pour que « mais » ne se retrouve pas derrière « jamais ».
    const lignes = await prisma.$queryRaw<LigneRecherche[]>`
        WITH t AS (SELECT immutable_unaccent(lower(btrim(${requete}))) AS q),
        par_francais AS (
            SELECT l.id,
                   similarity(immutable_unaccent(l.cle), t.q)
                     + CASE WHEN immutable_unaccent(l.cle) = t.q THEN 1 ELSE 0 END AS score
            FROM lemmes l, t
            WHERE immutable_unaccent(l.cle) LIKE '%' || t.q || '%'
        ),
        par_alsacien AS (
            SELECT v.lemme_id AS id,
                   max(similarity(immutable_unaccent(lower(v.forme)), t.q)
                         + CASE WHEN immutable_unaccent(lower(v.forme)) = t.q THEN 1 ELSE 0 END) AS score
            FROM variantes v, t
            WHERE v.masquee = false
              AND immutable_unaccent(lower(v.forme)) LIKE '%' || t.q || '%'
            GROUP BY v.lemme_id
        ),
        reunis AS (
            SELECT id, max(score) AS score
            FROM (SELECT * FROM par_francais UNION ALL SELECT * FROM par_alsacien) x
            GROUP BY id
        )
        SELECT l.id, l.francais, l.contexte, l.type::text AS type,
               c.departement, r.score
        FROM reunis r
        JOIN lemmes l ON l.id = r.id
        LEFT JOIN communes c ON c.id = l.commune_id
        ORDER BY r.score DESC, length(l.francais) ASC, l.francais ASC
        LIMIT ${LIMITE}
    `

    if (!lignes.length) return []

    const apercus = await apercusParLemme(lignes.map((l) => l.id))

    return lignes.map((l) => {
        const formes = apercus.get(l.id) ?? []
        return {
            id: l.id,
            francais: l.francais,
            contexte: l.contexte,
            type: l.type,
            departement: l.departement,
            formes: formes.slice(0, FORMES_EN_APERCU),
            nbFormes: formes.length,
        }
    })
}

/** La fiche d'un mot : toutes ses variantes, et pour chacune ce qui la fonde —
 *  sources écrites d'un côté, villages de l'autre. Jamais additionnés. */
export async function chargerLemme(id: string): Promise<LemmeDetaille | null> {
    const lemme = await prisma.lemme.findUnique({
        where: { id },
        select: {
            id: true,
            francais: true,
            contexte: true,
            type: true,
            commune: { select: { id: true, nom: true, slug: true, departement: true } },
            variantes: {
                where: { masquee: false },
                select: {
                    id: true,
                    forme: true,
                    article: true,
                    formeSansArticle: true,
                    temoignages: {
                        select: {
                            source: { select: { nom: true, url: true } },
                            commune: { select: { id: true, nom: true, slug: true } },
                        },
                    },
                },
            },
        },
    })

    if (!lemme) return null

    const variantes: VarianteDetaillee[] = lemme.variantes.map((v) => {
        // Dédoublonnage par identité, et séparément : une source qui atteste
        // deux fois la même forme reste UNE source (règle 2 telle qu'elle
        // survit — l'affichage de ce qui fonde), et deux membres d'un même
        // village restent un village.
        const sources = new Map<string, { nom: string; url: string | null }>()
        const villages = new Map<number, { id: number; nom: string; slug: string }>()

        for (const t of v.temoignages) {
            if (t.source) sources.set(t.source.nom, t.source)
            if (t.commune) villages.set(t.commune.id, t.commune)
        }

        return {
            id: v.id,
            forme: v.forme,
            article: v.article,
            formeSansArticle: v.formeSansArticle,
            nbSources: sources.size,
            nbVillages: villages.size,
            sources: Array.from(sources.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
            villages: Array.from(villages.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
        }
    })

    // La forme la mieux attestée d'abord — ce n'est pas « la bonne », c'est
    // celle que le plus de témoins écrivent. Plus de forme canonique depuis le
    // 11/09/2026 : toutes coexistent, et l'ordre ne fait que présenter.
    //
    // Les deux comptes se comparent en CASCADE, jamais en somme. `nbSources +
    // nbVillages` aurait été le chiffre unique que la doctrine interdit — une
    // source écrite et un village ne sont pas deux unités du même genre. Ici
    // les sources départagent d'abord, les villages ensuite.
    variantes.sort((a, b) =>
        b.nbSources - a.nbSources
        || b.nbVillages - a.nbVillages
        || a.forme.localeCompare(b.forme, 'fr'))

    return {
        id: lemme.id,
        francais: lemme.francais,
        contexte: lemme.contexte,
        type: lemme.type,
        commune: lemme.commune,
        variantes,
    }
}
