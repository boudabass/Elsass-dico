import { Prisma } from "@/generated/prisma/client"
import type { FiltreDico } from "@/lib/dictionnaire"

// La condition SQL du filtre par catégorie (16/10/2026). Miroir exact de
// `correspondAuFiltre()` dans src/lib/dictionnaire.ts : si l'une bouge, l'autre
// bouge. Ce fichier n'est pas un `'use server'` : il ne porte que des utilitaires.
//
// `alias` est une table ou un alias écrit en dur dans le code (`l`, `lemmes`),
// jamais une saisie : il passe par `Prisma.raw`.

export function conditionFiltre(filtre: FiltreDico, alias: string): Prisma.Sql {
    const a = Prisma.raw(alias)
    if (filtre === "tout") return Prisma.sql`TRUE`
    if (filtre === "insulte") return Prisma.sql`${a}.contexte = 'insulte'`
    return Prisma.sql`${a}.type = CAST(${filtre} AS type_terme)`
}

// Côté alsacien, le filtre porte sur le lemme de la variante : la jointure n'est
// ajoutée que lorsqu'il existe, pour que « tout » garde son plan d'origine.
export function jointureFiltre(filtre: FiltreDico): Prisma.Sql {
    return filtre === "tout" ? Prisma.empty : Prisma.sql`JOIN lemmes l ON l.id = v.lemme_id`
}
