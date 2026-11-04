// Lecture de l'écran Contributions (04/11/2026) : le journal des membres et les
// gestes de l'admin, dans UNE liste, du plus récent au plus ancien.
//
// Une requête SQL et non deux listes fusionnées en mémoire : la pagination
// (20 lignes, « Voir plus ») doit porter sur la liste réunie, pas sur chacune.
//
// Un geste admin porte le membre qu'il concerne : le votant pour un retrait de
// vote, l'auteur de la forme pour un masquage ou une validation. Le village d'un
// retrait est celui du retrait ; celui d'un geste admin sur une forme est celui
// de sa création.
//
// Réservé à l'admin : l'appelant (`listerContributionsAction`) vérifie `adminExige()`.

import { Prisma } from "@/generated/prisma/client"
import {
    TAILLE_PAGE_CONTRIBUTIONS,
    type FiltresContributions,
    type LigneContribution,
    type PageContributions,
    type TypeContribution,
    nomAffiche,
} from "@/lib/moderation"
import { prisma } from "@/lib/prisma"
import { motVisibleSql } from "@/lib/visibilite-serveur"

interface LigneBrute {
    genre: "evenement" | "moderation"
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
    vote_actif: boolean
}

export async function lirePageContributions(filtres: FiltresContributions): Promise<PageContributions> {
    const conditions: Prisma.Sql[] = []
    if (filtres.type) conditions.push(Prisma.sql`l.type = ${filtres.type}`)
    if (filtres.membreId) conditions.push(Prisma.sql`l.membre_id = ${filtres.membreId}`)
    if (filtres.depuis) conditions.push(Prisma.sql`l.le > ${new Date(filtres.depuis)}`)
    const ou = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty

    const page = Math.max(1, Math.floor(filtres.page) || 1)
    const offset = (page - 1) * TAILLE_PAGE_CONTRIBUTIONS

    // Une de plus que la taille de page : elle dit s'il reste une page à charger.
    const brutes = await prisma.$queryRaw<LigneBrute[]>`
        WITH lignes AS (
            SELECT 'evenement' AS genre, e.id, e.type::text AS type, e.le, e.variante_id,
                   e.membre_id, e.commune_id,
                   NULL::text AS acteur_id, e.ancienne_forme, e.nouvelle_forme
            FROM evenements_contribution e
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
        ),
        filtrees AS (
            SELECT * FROM lignes l ${ou}
            ORDER BY l.le DESC, l.id DESC
            LIMIT ${TAILLE_PAGE_CONTRIBUTIONS + 1} OFFSET ${offset}
        )
        SELECT f.genre, f.id, f.type, f.le,
               f.membre_id, mb.nom AS membre_nom, mb.email AS membre_email,
               co.nom AS commune_nom,
               f.acteur_id, ac.nom AS acteur_nom, ac.email AS acteur_email,
               v.forme, v.masquee, v.validee_defi_le IS NOT NULL AS validee,
               f.ancienne_forme, f.nouvelle_forme,
               lem.id AS lemme_id, lem.francais, lem.contexte, lem.type::text AS lemme_type,
               ${motVisibleSql("lem")} AS lemme_visible,
               v.id AS variante_id,
               EXISTS (SELECT 1 FROM temoignages t WHERE t.variante_id = v.id AND t.source_id IS NOT NULL) AS source,
               EXISTS (SELECT 1 FROM temoignages t WHERE t.variante_id = v.id AND t.membre_id = f.membre_id) AS vote_actif
        FROM filtrees f
        JOIN variantes v ON v.id = f.variante_id
        JOIN lemmes lem ON lem.id = v.lemme_id
        LEFT JOIN membres mb ON mb.id = f.membre_id
        LEFT JOIN membres ac ON ac.id = f.acteur_id
        LEFT JOIN communes co ON co.id = f.commune_id
        ORDER BY f.le DESC, f.id DESC
    `

    const plusDeLignes = brutes.length > TAILLE_PAGE_CONTRIBUTIONS
    const lignes: LigneContribution[] = brutes.slice(0, TAILLE_PAGE_CONTRIBUTIONS).map((b) => ({
        id: b.id,
        genre: b.genre,
        type: b.type,
        le: b.le.toISOString(),
        membre: nomAffiche(b.membre_nom, b.membre_email),
        membreId: b.membre_id,
        varianteId: b.variante_id,
        source: b.source,
        voteActif: b.vote_actif,
        village: b.commune_nom,
        mot: { id: b.lemme_id, francais: b.francais, contexte: b.contexte, type: b.lemme_type, visible: b.lemme_visible },
        forme: b.forme,
        ancienneForme: b.ancienne_forme,
        nouvelleForme: b.nouvelle_forme,
        masquee: b.masquee,
        validee: b.validee,
        acteur: nomAffiche(b.acteur_nom, b.acteur_email),
    }))

    return { lignes, page, plusDeLignes }
}
