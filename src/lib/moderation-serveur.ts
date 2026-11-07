// Lecture de l'écran Contributions (04/11/2026, refondu le 07/11) : une carte par mot,
// avec ses formes dedans. Le journal des membres et les gestes de l'admin se lisent
// ensemble ; un mot n'apparaît qu'une fois, même après plusieurs gestes.
//
// Deux requêtes : d'abord la page de mots (10 par page, du plus récent au plus ancien),
// puis tous les gestes de ces mots, rangés par forme dans le code. Ainsi la pagination
// porte sur les mots et jamais sur les gestes.
//
// Un geste admin porte le membre qu'il concerne : l'auteur de la forme pour un masquage
// ou une validation. Le village d'un geste admin sur une forme est celui de sa création.
//
// Réservé à l'admin : l'appelant (`listerContributionsAction`) vérifie `adminExige()`.

import { Prisma } from "@/generated/prisma/client"
import {
    TAILLE_PAGE_CONTRIBUTIONS,
    type FiltresContributions,
    type FormeContribution,
    type GesteContribution,
    type MotContribution,
    type PageContributions,
    type TypeContribution,
    nomAffiche,
} from "@/lib/moderation"
import { prisma } from "@/lib/prisma"
import { motVisibleSql } from "@/lib/visibilite-serveur"

interface LigneBrute {
    genre: "evenement" | "moderation" | "changement"
    id: string
    type: TypeContribution
    le: Date
    membre_id: string | null
    membre_nom: string | null
    membre_email: string | null
    commune_nom: string | null
    acteur_id: string | null
    acteur_nom: string | null
    acteur_email: string | null
    forme: string
    masquee: boolean
    validee: boolean
    ancienne_forme: string | null
    nouvelle_forme: string | null
    lemme_id: string
    francais: string
    contexte: string
    lemme_type: string
    lemme_visible: boolean
    variante_id: string
    source: boolean
    mot_sans_source: boolean
}

/** Tous les gestes, du journal des membres et de la modération de l'admin, dans une même
 *  forme. `variante_id` porte la forme concernée ; pour le retrait de la catégorie insulte,
 *  c'est la première forme du mot, et la ligne n'est rangée que sous le mot. */
const lignesSql = Prisma.sql`
    SELECT 'evenement' AS genre, e.id, e.type::text AS type, e.le, e.variante_id,
           e.membre_id, e.commune_id,
           NULL::text AS acteur_id, e.ancienne_forme, e.nouvelle_forme
    FROM evenements_contribution e
    WHERE e.type IN ('creation', 'modification')
    UNION ALL
    SELECT 'moderation', m.id, m.type::text, m.le, m.variante_id,
           CASE WHEN m.type = 'retrait_vote' THEN r.membre_id ELSE v.cree_par END,
           CASE WHEN m.type = 'retrait_vote' THEN r.commune_id ELSE c.commune_id END,
           m.acteur_id, NULL::text, NULL::text
    FROM moderations m
    JOIN variantes v ON v.id = m.variante_id
    LEFT JOIN LATERAL (
        SELECT e.membre_id, e.commune_id FROM evenements_contribution e
        WHERE e.type = 'retrait' AND e.temoignage_id = m.temoignage_id
        LIMIT 1
    ) r ON TRUE
    LEFT JOIN LATERAL (
        SELECT e.commune_id FROM evenements_contribution e
        WHERE e.variante_id = m.variante_id AND e.type = 'creation'
        ORDER BY e.le ASC LIMIT 1
    ) c ON TRUE
    UNION ALL
    SELECT 'changement', c.id, 'categorie_insulte_retiree', c.le, pv.id,
           NULL::text, NULL::integer, c.acteur_id, NULL::text, NULL::text
    FROM changements_categorie c
    JOIN LATERAL (
        SELECT v.id FROM variantes v
        WHERE v.lemme_id = c.lemme_id
        ORDER BY v.cree_le ASC LIMIT 1
    ) pv ON TRUE
`

/** Une forme est à décider : un membre l'a écrite, et ni validée, ni masquée, ni de source. */
const formeADecider = Prisma.sql`
    v.masquee = FALSE
    AND v.validee_defi_le IS NULL
    AND NOT EXISTS (SELECT 1 FROM temoignages t WHERE t.variante_id = v.id AND t.source_id IS NOT NULL)
    AND EXISTS (
        SELECT 1 FROM evenements_contribution e
        WHERE e.variante_id = v.id AND e.type IN ('creation', 'modification')
    )
`

function geste(b: LigneBrute): GesteContribution {
    return {
        genre: b.genre === "moderation" ? "moderation" : "evenement",
        type: b.type,
        le: b.le.toISOString(),
        membre: nomAffiche(b.membre_nom, b.membre_email),
        membreId: b.membre_id,
        village: b.commune_nom,
        acteur: nomAffiche(b.acteur_nom, b.acteur_email),
        ancienneForme: b.ancienne_forme,
        nouvelleForme: b.nouvelle_forme,
    }
}

export async function lirePageContributions(filtres: FiltresContributions): Promise<PageContributions> {
    const page = Math.max(1, Math.floor(filtres.page) || 1)
    const offset = (page - 1) * TAILLE_PAGE_CONTRIBUTIONS
    const filtre = filtres.aRegarder
        ? Prisma.sql`WHERE EXISTS (SELECT 1 FROM variantes v WHERE v.lemme_id = m.lemme_id AND ${formeADecider})`
        : Prisma.empty

    // Une de plus que la taille de page : elle dit s'il reste une page à charger.
    const idsBruts = await prisma.$queryRaw<{ lemme_id: string }[]>`
        WITH lignes AS (${lignesSql}),
        mots_actifs AS (
            SELECT v.lemme_id, MAX(l.le) AS dernier
            FROM lignes l
            JOIN variantes v ON v.id = l.variante_id
            GROUP BY v.lemme_id
        )
        SELECT m.lemme_id
        FROM mots_actifs m
        ${filtre}
        ORDER BY m.dernier DESC, m.lemme_id
        LIMIT ${TAILLE_PAGE_CONTRIBUTIONS + 1} OFFSET ${offset}
    `

    const plusDeMots = idsBruts.length > TAILLE_PAGE_CONTRIBUTIONS
    const ids = idsBruts.slice(0, TAILLE_PAGE_CONTRIBUTIONS).map((m) => m.lemme_id)
    if (ids.length === 0) return { mots: [], page, plusDeMots: false }

    const brutes = await prisma.$queryRaw<LigneBrute[]>`
        WITH lignes AS (${lignesSql})
        SELECT f.genre, f.id, f.type, f.le,
               f.membre_id, mb.nom AS membre_nom, mb.email AS membre_email,
               co.nom AS commune_nom,
               f.acteur_id, ac.nom AS acteur_nom, ac.email AS acteur_email,
               v.forme,
               CASE WHEN f.genre = 'changement' THEN FALSE ELSE v.masquee END AS masquee,
               CASE WHEN f.genre = 'changement' THEN FALSE ELSE v.validee_defi_le IS NOT NULL END AS validee,
               f.ancienne_forme, f.nouvelle_forme,
               lem.id AS lemme_id, lem.francais, lem.contexte, lem.type::text AS lemme_type,
               ${motVisibleSql("lem")} AS lemme_visible,
               v.id AS variante_id,
               EXISTS (SELECT 1 FROM temoignages t WHERE t.variante_id = v.id AND t.source_id IS NOT NULL) AS source,
               NOT EXISTS (
                   SELECT 1 FROM temoignages t
                   JOIN variantes vs ON vs.id = t.variante_id
                   WHERE vs.lemme_id = lem.id AND t.source_id IS NOT NULL
               ) AS mot_sans_source
        FROM lignes f
        JOIN variantes v ON v.id = f.variante_id
        JOIN lemmes lem ON lem.id = v.lemme_id
        LEFT JOIN membres mb ON mb.id = f.membre_id
        LEFT JOIN membres ac ON ac.id = f.acteur_id
        LEFT JOIN communes co ON co.id = f.commune_id
        WHERE lem.id IN (${Prisma.join(ids)})
        ORDER BY f.le DESC, f.id DESC
    `

    // Les lignes arrivent du plus récent au plus ancien : la première vue d'une forme
    // ou d'un mot est donc son dernier geste.
    const parMot = new Map<string, MotContribution>()
    const formes = new Map<string, FormeContribution>()
    const formeAMembre = new Set<string>()

    for (const b of brutes) {
        let mot = parMot.get(b.lemme_id)
        if (!mot) {
            mot = {
                mot: { id: b.lemme_id, francais: b.francais, contexte: b.contexte, type: b.lemme_type, visible: b.lemme_visible },
                motSansSource: b.mot_sans_source,
                dernier: b.le.toISOString(),
                nbGestes: 0,
                retraitInsulte: null,
                formes: [],
            }
            parMot.set(b.lemme_id, mot)
        }
        mot.nbGestes += 1

        if (b.genre === "changement") {
            if (!mot.retraitInsulte) {
                mot.retraitInsulte = { le: b.le.toISOString(), acteur: nomAffiche(b.acteur_nom, b.acteur_email) }
            }
            continue
        }

        let forme = formes.get(b.variante_id)
        if (!forme) {
            forme = {
                varianteId: b.variante_id,
                forme: b.forme,
                source: b.source,
                masquee: b.masquee,
                validee: b.validee,
                nbGestes: 0,
                aDecider: false,
                dernier: geste(b),
            }
            formes.set(b.variante_id, forme)
            mot.formes.push(forme)
        }
        forme.nbGestes += 1
        if (b.genre === "evenement" && (b.type === "creation" || b.type === "modification")) {
            formeAMembre.add(b.variante_id)
        }
    }

    formes.forEach((forme) => {
        forme.aDecider = !forme.source && !forme.masquee && !forme.validee && formeAMembre.has(forme.varianteId)
    })

    const mots: MotContribution[] = []
    for (const id of ids) {
        const mot = parMot.get(id)
        if (!mot) continue
        if (filtres.aRegarder) {
            mot.formes = mot.formes.filter((f) => f.aDecider)
            if (mot.formes.length === 0) continue
        }
        mots.push(mot)
    }

    return { mots, page, plusDeMots }
}
