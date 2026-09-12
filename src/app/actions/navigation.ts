'use server'

import type { LemmeResume, TypeTerme } from "@/lib/dictionnaire"
import { apercusParLemme } from "@/lib/lemmes"
import { prisma } from "@/lib/prisma"

// Parcours alphabétique (écran « Dictionnaire A-Z » du handoff mobile). Portée
// par Prisma depuis le 12/09/2026 ; passait par les RPC `lettres_disponibles()`
// et `entrees_par_lettre()`, disparues avec la table `entrees`.

const LEMMES_PAR_LETTRE = 200
const FORMES_EN_APERCU = 3

export async function lettresDisponiblesAction(): Promise<string[]> {
    // La lettre est désaccentuée : `Écureuil` se range sous E, pas dans une
    // vingt-septième case. Le tri, lui, est celui du français.
    const lignes = await prisma.$queryRaw<{ lettre: string }[]>`
        SELECT DISTINCT upper(left(immutable_unaccent(cle), 1)) AS lettre
        FROM lemmes
        WHERE cle <> ''
        ORDER BY lettre
    `
    // Un lemme qui commence par un chiffre ou un signe existe (les sources en
    // ont) : il ne fabrique pas une lettre pour autant.
    return lignes.map((l) => l.lettre).filter((l) => /^[A-Z]$/.test(l))
}

interface LigneLettre {
    id: string
    francais: string
    contexte: string
    type: TypeTerme
    departement: string | null
}

/** Le plafond se DIT. Certaines lettres portent plus de 3 000 lemmes (C : 3 006,
 *  P : 2 622) : rendre les 200 premières sans le signaler ferait lire une page
 *  comme un total — le piège des compteurs « 50+ » de l'ancienne file
 *  d'arbitrage, et celui du rapport de parseur plafonné à 80 anomalies. */
export interface PageLettre {
    lemmes: LemmeResume[]
    total: number
    plafond: number
}

export async function lemmesParLettreAction(lettre: string): Promise<PageLettre> {
    const vide: PageLettre = { lemmes: [], total: 0, plafond: LEMMES_PAR_LETTRE }

    const initiale = lettre.trim().toUpperCase()
    if (!/^[A-Z]$/.test(initiale)) return vide

    const [lignes, comptes] = await Promise.all([
        prisma.$queryRaw<LigneLettre[]>`
            SELECT l.id, l.francais, l.contexte, l.type::text AS type, c.departement
            FROM lemmes l
            LEFT JOIN communes c ON c.id = l.commune_id
            WHERE upper(left(immutable_unaccent(l.cle), 1)) = ${initiale}
            ORDER BY l.cle ASC
            LIMIT ${LEMMES_PAR_LETTRE}
        `,
        prisma.$queryRaw<{ n: bigint }[]>`
            SELECT count(*) AS n FROM lemmes
            WHERE upper(left(immutable_unaccent(cle), 1)) = ${initiale}
        `,
    ])

    const total = Number(comptes[0]?.n ?? 0)
    if (!lignes.length) return { ...vide, total }

    const apercus = await apercusParLemme(lignes.map((l) => l.id))

    return {
        lemmes: lignes.map((l) => {
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
        }),
        total,
        plafond: LEMMES_PAR_LETTRE,
    }
}
