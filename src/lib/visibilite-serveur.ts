// Qui voit quoi (04/11/2026, décisions de John). Quatre niveaux, à ne jamais
// confondre, et chaque requête qui les lit passe par ce fichier :
//
//   1. DICTIONNAIRE : une forme y est si elle n'est pas masquée, validée ou non.
//      C'est le seul niveau qui montre une forme de membre en attente. Il est
//      réservé aux membres connectés (`/recherche`, `/dictionnaire`, `/entree`,
//      et `/village` ou `/prenom` vus avec un compte).
//   2. PUBLIC : une forme y entre si elle n'est pas masquée ET (qu'un témoignage
//      de source l'écrit, OU qu'elle a été validée). C'est ce que voit un visiteur
//      sans compte : accueil, fiches `/village` et `/prenom`, recherche de
//      l'accueil, aperçus, chiffres et points de carte de l'accueil, métadonnées. Le défi montre
//      les mêmes formes. Un
//      témoignage de source se reconnaît à `source_id` non nul, jamais à
//      `cree_par` nul : un compte supprimé le met à nul, et une base reconstruite
//      aussi.
//   3. TIRAGE DU DÉFI : une forme de source non masquée (`formeSourceSql`). Une
//      validation ou un masquage de membre ne déplace aucun défi.
//   4. MOT VISIBLE et MOT PUBLIC : un mot s'affiche s'il a au moins une forme au
//      dictionnaire (`MOT_VISIBLE`), ou au public (`MOT_PUBLIC`). Un mot dont
//      toutes les formes sont masquées disparaît, sans erreur.
//
// Les formes SQL ont leur miroir Prisma : si l'une bouge, l'autre bouge.
// Pas de `'use server'` : ce ne sont que des utilitaires.

import { Prisma } from "@/generated/prisma/client"

/** Dictionnaire : les formes non masquées, validées ou non. Membres connectés. */
export const FORME_AU_DICTIONNAIRE: Prisma.VarianteWhereInput = { masquee: false }

/** Public : non masquée, et de source ou validée. Ce que voit un visiteur sans compte. */
export const FORME_PUBLIQUE: Prisma.VarianteWhereInput = {
    masquee: false,
    OR: [
        { temoignages: { some: { sourceId: { not: null } } } },
        { valideeDefiLe: { not: null } },
    ],
}

/** Mot visible au dictionnaire : au moins une forme au dictionnaire. */
export const MOT_VISIBLE: Prisma.LemmeWhereInput = {
    variantes: { some: FORME_AU_DICTIONNAIRE },
}

/** Mot public : au moins une forme publique. */
export const MOT_PUBLIC: Prisma.LemmeWhereInput = {
    variantes: { some: FORME_PUBLIQUE },
}

/** Condition SQL « forme publique » sur un alias de `variantes`. `alias` est
 *  écrit en dur dans le code, jamais une saisie : il passe par `Prisma.raw`. */
export function formePubliqueSql(alias: string): Prisma.Sql {
    const a = Prisma.raw(alias)
    return Prisma.sql`(${a}.masquee = false AND (${a}.validee_defi_le IS NOT NULL OR EXISTS (
        SELECT 1 FROM temoignages t WHERE t.variante_id = ${a}.id AND t.source_id IS NOT NULL)))`
}

/** Condition SQL « forme de source » sur un alias de `variantes` : non masquée
 *  et écrite par au moins une source. C'est la seule base du tirage du défi
 *  (04/11/2026) : une validation ou un masquage de membre n'y touche pas. */
export function formeSourceSql(alias: string): Prisma.Sql {
    const a = Prisma.raw(alias)
    return Prisma.sql`(${a}.masquee = false AND EXISTS (
        SELECT 1 FROM temoignages t WHERE t.variante_id = ${a}.id AND t.source_id IS NOT NULL))`
}

/** Condition SQL « mot visible » sur un alias de `lemmes` : une forme au
 *  dictionnaire au moins. Miroir de `MOT_VISIBLE`. */
export function motVisibleSql(alias: string): Prisma.Sql {
    const a = Prisma.raw(alias)
    return Prisma.sql`EXISTS (SELECT 1 FROM variantes vv WHERE vv.lemme_id = ${a}.id AND vv.masquee = false)`
}

/** Condition SQL « mot public » sur un alias de `lemmes` : une forme publique au
 *  moins. Miroir de `MOT_PUBLIC`. */
export function motPubliqueSql(alias: string): Prisma.Sql {
    const a = Prisma.raw(alias)
    return Prisma.sql`EXISTS (SELECT 1 FROM variantes vv WHERE vv.lemme_id = ${a}.id AND ${formePubliqueSql("vv")})`
}
