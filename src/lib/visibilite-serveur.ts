// Qui voit quoi (04/11/2026, décisions de John). Trois niveaux, à ne jamais
// confondre, et chaque requête qui les lit passe par ce fichier :
//
//   1. DICTIONNAIRE : une forme y est si elle n'est pas masquée. Une forme de
//      membre non validée s'y voit déjà (fiches, carte, recherche).
//   2. DÉFI : une forme y entre si elle n'est pas masquée ET (qu'un témoignage
//      de source l'écrit, OU qu'elle a été validée pour le défi). Un témoignage
//      de source se reconnaît à `source_id` non nul, jamais à `cree_par` nul : un
//      compte supprimé le met à nul, et une base reconstruite aussi.
//   3. MOT VISIBLE : un mot s'affiche s'il a au moins une forme au dictionnaire.
//      Un mot dont toutes les formes sont masquées disparaît, sans erreur.
//
// Les formes SQL ont leur miroir Prisma : si l'une bouge, l'autre bouge.
// Pas de `'use server'` : ce ne sont que des utilitaires.

import { Prisma } from "@/generated/prisma/client"

/** Dictionnaire : les formes non masquées. */
export const FORME_AU_DICTIONNAIRE: Prisma.VarianteWhereInput = { masquee: false }

/** Défi : non masquée, et de source ou validée pour le défi. */
export const FORME_AU_DEFI: Prisma.VarianteWhereInput = {
    masquee: false,
    OR: [
        { temoignages: { some: { sourceId: { not: null } } } },
        { valideeDefiLe: { not: null } },
    ],
}

/** Mot visible : au moins une forme au dictionnaire. */
export const MOT_VISIBLE: Prisma.LemmeWhereInput = {
    variantes: { some: FORME_AU_DICTIONNAIRE },
}

/** Condition SQL « forme au défi » sur un alias de `variantes`. `alias` est
 *  écrit en dur dans le code, jamais une saisie : il passe par `Prisma.raw`. */
export function formeDefiSql(alias: string): Prisma.Sql {
    const a = Prisma.raw(alias)
    return Prisma.sql`(${a}.masquee = false AND (${a}.validee_defi_le IS NOT NULL OR EXISTS (
        SELECT 1 FROM temoignages t WHERE t.variante_id = ${a}.id AND t.source_id IS NOT NULL)))`
}

/** Condition SQL « mot visible » sur un alias de `lemmes` : une forme au
 *  dictionnaire au moins. Miroir de `MOT_VISIBLE`. */
export function motVisibleSql(alias: string): Prisma.Sql {
    const a = Prisma.raw(alias)
    return Prisma.sql`EXISTS (SELECT 1 FROM variantes vv WHERE vv.lemme_id = ${a}.id AND vv.masquee = false)`
}
