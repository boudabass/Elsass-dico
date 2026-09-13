'use server'

import type { LemmeDetaille, LemmeResume, TypeTerme } from "@/lib/dictionnaire"
import { apercusParLemme, chargerLemmeDetaille } from "@/lib/lemmes"
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
 *  sources écrites d'un côté, villages de l'autre. Jamais additionnés.
 *  Chargée par id — c'est le chemin authentifié (/entree/[id]) ; les fiches
 *  publiques (/village, /prenom) appellent `chargerLemmeDetaille()` directement. */
export async function chargerLemme(id: string): Promise<LemmeDetaille | null> {
    return chargerLemmeDetaille({ id })
}
