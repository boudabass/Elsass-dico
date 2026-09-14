'use server'

import type { LemmeResume, TypeTerme } from "@/lib/dictionnaire"
import { apercusParLemme } from "@/lib/lemmes"
import { prisma } from "@/lib/prisma"

// Parcours alphabétique (écran « Dictionnaire A-Z » du handoff mobile). Portée
// par Prisma depuis le 12/09/2026 ; passait par les RPC `lettres_disponibles()`
// et `entrees_par_lettre()`, disparues avec la table `entrees`.

// 100 et non 200 (retour de John, 14/09/2026, après le plafond sans suite du
// 13/09) : sur ce VPS sans limite CPU ni rate limiting, une page plus courte
// coûte moins par clic, et la navigation devient triviale avec les boutons —
// l'argument pour 200 (moins de clics pour tout parcourir) ne tient plus une
// fois qu'on peut effectivement tourner les pages.
const TAILLE_PAGE = 100
const FORMES_EN_APERCU = 3

function nbPagesPour(total: number): number {
    return Math.max(1, Math.ceil(total / TAILLE_PAGE))
}

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

/** Une page à la fois, jamais la lettre entière d'un coup — certaines lettres
 *  portent plus de 3 000 lemmes (C : 3 006, P : 2 622). `page` et `nbPages`
 *  remplacent le plafond muet du 13/09/2026 (« 200 premiers sur X », sans
 *  moyen de voir la suite) — signalé par John le 14/09 : « il faut juste
 *  faire en sorte de ne pas charger tous les mots en une fois et charger au
 *  fur et à mesure de page vue ». */
export interface PageLettre {
    lemmes: LemmeResume[]
    total: number
    page: number
    nbPages: number
}

export async function lemmesParLettreAction(lettre: string, page = 1): Promise<PageLettre> {
    const vide: PageLettre = { lemmes: [], total: 0, page: 1, nbPages: 1 }

    const initiale = lettre.trim().toUpperCase()
    if (!/^[A-Z]$/.test(initiale)) return vide

    // Le compte d'abord, séparément du LIMIT/OFFSET : sans lui, une page
    // demandée hors bornes (lien trafiqué, lettre changée entre deux clics)
    // rendrait une liste vide alors que la lettre ne l'est pas — on VALIDE la
    // page demandée contre le vrai nombre de pages plutôt que de la croire.
    const comptes = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM lemmes
        WHERE upper(left(immutable_unaccent(cle), 1)) = ${initiale}
    `
    const total = Number(comptes[0]?.n ?? 0)
    if (total === 0) return vide

    const nbPages = nbPagesPour(total)
    const pageValidee = Math.min(Math.max(1, Math.floor(page) || 1), nbPages)
    const offset = (pageValidee - 1) * TAILLE_PAGE

    // Tri sur `immutable_unaccent(l.cle)` et non `l.cle` (retour de John,
    // 14/09/2026) : la collation Postgres range les caractères accentués
    // après l'ASCII simple, donc `ça`/`çà` tombaient en toute fin de C au lieu
    // du début. `l.cle ASC` reste un second critère : simple départage
    // stable entre mots devenus identiques une fois désaccentués
    // (`cote`/`côte`/`côté`), jamais une fusion de lignes — donc pas une
    // violation de la doctrine du 24/08/2026 sur `unaccent` dans une clé
    // d'identité.
    const lignes = await prisma.$queryRaw<LigneLettre[]>`
        SELECT l.id, l.francais, l.contexte, l.type::text AS type, c.departement
        FROM lemmes l
        LEFT JOIN communes c ON c.id = l.commune_id
        WHERE upper(left(immutable_unaccent(l.cle), 1)) = ${initiale}
        ORDER BY immutable_unaccent(l.cle) ASC, l.cle ASC
        LIMIT ${TAILLE_PAGE} OFFSET ${offset}
    `

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
        page: pageValidee,
        nbPages,
    }
}

/** Retourne la page contenant `prefixe` sur la lettre donnée, avec EXACTEMENT
 *  le même tri que `lemmesParLettreAction` (`immutable_unaccent`) — sinon la
 *  page où l'on saute ne serait pas celle qui affiche vraiment le mot. Ne
 *  suppose jamais que `prefixe` existe tel quel : un préfixe partiel ou
 *  approximatif saute simplement à la page où il tomberait alphabétiquement.
 *  Champ « Aller à un mot » du 14/09/2026 (retour de John : 12 clics pour
 *  atteindre « bricoler », 30 pour « cytise »). */
export async function pageDuPrefixeAction(lettre: string, prefixe: string): Promise<number> {
    const initiale = lettre.trim().toUpperCase()
    if (!/^[A-Z]$/.test(initiale)) return 1

    const prefixeTrim = prefixe.trim()
    if (!prefixeTrim) return 1

    const comptes = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM lemmes
        WHERE upper(left(immutable_unaccent(cle), 1)) = ${initiale}
    `
    const total = Number(comptes[0]?.n ?? 0)
    if (total === 0) return 1

    const rangs = await prisma.$queryRaw<{ rang: bigint }[]>`
        SELECT count(*) AS rang FROM lemmes
        WHERE upper(left(immutable_unaccent(cle), 1)) = ${initiale}
          AND immutable_unaccent(cle) < immutable_unaccent(${prefixeTrim})
    `
    const rang = Number(rangs[0]?.rang ?? 0)

    return Math.min(Math.max(1, Math.floor(rang / TAILLE_PAGE) + 1), nbPagesPour(total))
}
