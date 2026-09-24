'use server'

import type { LemmeResume } from "@/lib/dictionnaire"
import { MOTS_DE_BASE } from "@/lib/mots-de-base"
import { apercusParLemme } from "@/lib/lemmes"
import { prisma } from "@/lib/prisma"

// Ce que la home publique (`/`, non connectée) montre pour donner un aperçu
// réel du dico, retour de John du 18/09/2026 : la page ne disait jusque-là que
// « connecte-toi » ou « crée un compte », sans qu'un visiteur voie jamais un
// seul mot alsacien. Deux morceaux, volontairement distincts :
//
//   - `motsVitrineAction()` : une vitrine STATIQUE, quelques mots de base de
//     tout cours de débutant, avec leurs vraies formes tirées de la base.
//   - `rechercherAccueilAction()` : une recherche INTERACTIVE, restreinte aux
//     deux collections déjà publiques sans compte (`/village/[slug]`,
//     `/prenom/[slug]`) — jamais le dictionnaire entier, qui reste derrière
//     `/recherche` et le login.
//
// Aucune des deux n'exige de session : c'est tout le sens de cet écran.

// --- Vitrine de mots de base --------------------------------------------------
//
// La liste vit dans `lib/mots-de-base.ts`, partagée avec la fin de partie du
// jeu (25/09/2026).
const MOTS_VITRINE = MOTS_DE_BASE

/** La vitrine de la home publique : quelques mots de base, avec leurs vraies
 *  formes et ce qui les fonde. Jamais de traduction codée en dur (règle 1) —
 *  seules les CLÉS de recherche sont fixées ici, les formes viennent de la
 *  base à chaque appel. */
export async function motsVitrineAction(): Promise<LemmeResume[]> {
    const lemmes = await prisma.lemme.findMany({
        where: { OR: MOTS_VITRINE.map((m) => ({ cle: m.cle, contexte: m.contexte, type: m.type })) },
        select: { id: true, francais: true, contexte: true, type: true, cle: true },
    })

    const parClef = new Map(lemmes.map((l) => [`${l.cle}|${l.contexte}|${l.type}`, l]))
    const apercus = await apercusParLemme(lemmes.map((l) => l.id))

    // Dans l'ordre de MOTS_VITRINE, pas celui — non garanti — de la requête :
    // un mot absent de la base (jamais vu depuis la mesure du 18/09) est
    // silencieusement ignoré plutôt que de casser l'écran.
    return MOTS_VITRINE.flatMap((m) => {
        const lemme = parClef.get(`${m.cle}|${m.contexte}|${m.type}`)
        if (!lemme) return []
        const formes = apercus.get(lemme.id) ?? []
        return [{
            id: lemme.id,
            francais: lemme.francais,
            contexte: lemme.contexte,
            type: lemme.type,
            departement: null,
            formes: formes.slice(0, 3),
            nbFormes: formes.length,
        }]
    })
}

// --- Recherche village / prénom ----------------------------------------------

export interface SuggestionAccueil {
    type: "village" | "prenom"
    slug: string
    label: string
    sousLabel: string | null
}

interface LigneSuggestion {
    type: "village" | "prenom"
    slug: string
    label: string
    sousLabel: string | null
    score: number
}

const LIMITE = 8

/** Recherche restreinte aux deux collections déjà publiques sans compte : les
 *  communes qui ont une forme attestée (`/village/[slug]`) et les prénoms
 *  attestés (`/prenom/[slug]`). Jamais le reste du dictionnaire — c'est ce qui
 *  distingue cette action de `rechercherAction()`, réservée aux membres. */
export async function rechercherAccueilAction(terme: string): Promise<SuggestionAccueil[]> {
    const requete = terme.trim()
    if (requete.length < 2) return []

    const lignes = await prisma.$queryRaw<LigneSuggestion[]>`
        WITH t AS (SELECT immutable_unaccent(lower(btrim(${requete}))) AS q)
        SELECT c.slug, c.nom AS label, 'village' AS type,
               CASE WHEN c.departement = '67' THEN 'Bas-Rhin'
                    WHEN c.departement = '68' THEN 'Haut-Rhin'
                    WHEN c.departement = '57' THEN 'Moselle'
                    ELSE c.departement END AS "sousLabel",
               similarity(immutable_unaccent(c.nom), t.q)
                 + CASE WHEN immutable_unaccent(lower(c.nom)) = t.q THEN 1 ELSE 0 END AS score
        FROM communes c, t
        WHERE immutable_unaccent(lower(c.nom)) LIKE '%' || t.q || '%'
          AND EXISTS (
              SELECT 1 FROM lemmes l
              JOIN variantes v ON v.lemme_id = l.id
              WHERE l.commune_id = c.id AND v.masquee = false
          )
        UNION ALL
        SELECT l.slug, l.francais AS label, 'prenom' AS type, NULL AS "sousLabel",
               similarity(immutable_unaccent(l.francais), t.q)
                 + CASE WHEN immutable_unaccent(lower(l.francais)) = t.q THEN 1 ELSE 0 END AS score
        FROM lemmes l, t
        WHERE l.type = 'prenom' AND l.slug IS NOT NULL
          AND immutable_unaccent(lower(l.francais)) LIKE '%' || t.q || '%'
        ORDER BY score DESC, label ASC
        LIMIT ${LIMITE}
    `

    return lignes.map((l) => ({ type: l.type, slug: l.slug, label: l.label, sousLabel: l.sousLabel }))
}
