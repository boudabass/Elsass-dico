import type { Prisma } from "@/generated/prisma/client"
import { cleDeForme } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"
import type { MonVote } from "@/lib/contribution"
import { composerForme, type FormeComposee } from "@/lib/saisie-forme"

// Ce que partagent la création d'une forme (variantes.ts) et celle d'un mot
// (mots.ts), côté serveur. PAS dans un fichier `'use server'` : tout ce qu'un
// tel fichier exporte devient une action appelable depuis le navigateur, et
// `villageDuMembre(id)` y lirait le village de n'importe qui.

export const FORME_MAX = 200

/** Ce que la feuille envoie : l'article (préfixe exact, ou rien) et la forme
 *  tapée, séparés. Le serveur recompose, il ne fait jamais confiance à une
 *  forme déjà assemblée par le navigateur. */
export interface SaisieForme {
    prefixe: string | null
    reste: string
}

/** Longueur, et composition qui respecte le CHECK de l'article. */
export function validerSaisie(
    saisie: SaisieForme,
): { ok: true; forme: FormeComposee; cle: string } | { ok: false; erreur: string } {
    // Un préfixe d'article n'a jamais besoin de plus de quelques caractères.
    const prefixe = saisie.prefixe?.length ? saisie.prefixe.slice(0, 12) : null
    const forme = composerForme(prefixe, saisie.reste ?? "")
    if (!forme) return { ok: false, erreur: "Écris un mot alsacien avant d'envoyer" }
    if (forme.forme.length > FORME_MAX) return { ok: false, erreur: "Trop long pour un mot alsacien" }
    const cle = cleDeForme(forme.forme)
    if (!cle) return { ok: false, erreur: "Écris un mot alsacien avant d'envoyer" }
    return { ok: true, forme, cle }
}

/** Le village du membre, relu en base à chaque geste : le jeton de session
 *  dure 30 min et ne se resynchronise pas au fil de l'eau, or un village tout
 *  juste choisi dans la feuille doit servir tout de suite. */
export async function villageDuMembre(membreId: string): Promise<number | null> {
    const membre = await prisma.membre.findUnique({ where: { id: membreId }, select: { communeId: true } })
    return membre?.communeId ?? null
}

/** La variante, le témoignage de l'auteur et les deux événements du journal,
 *  dans la transaction de l'appelant. */
export async function poserVariante(
    tx: Prisma.TransactionClient,
    { lemmeId, forme, cle, membreId, communeId }:
        { lemmeId: string; forme: FormeComposee; cle: string; membreId: string; communeId: number },
): Promise<string> {
    const v = await tx.variante.create({
        data: {
            lemmeId, forme: forme.forme, cleForme: cle, creeParId: membreId,
            article: forme.article, formeSansArticle: forme.formeSansArticle,
        },
        select: { id: true },
    })
    const t = await tx.temoignage.create({
        data: { varianteId: v.id, membreId, communeId },
        select: { id: true },
    })
    // Journal (24/09/2026) : la création, puis la pose de l'auteur, dans cet
    // ordre et dans la même transaction que la forme elle-même.
    await tx.evenementContribution.create({
        data: { type: "creation", varianteId: v.id, communeId, membreId, nouvelleForme: forme.forme },
    })
    await tx.evenementContribution.create({
        data: { type: "pose", varianteId: v.id, temoignageId: t.id, communeId, membreId },
    })
    return v.id
}

/** Mes témoignages sur ces variantes, avec le village qu'ils portent. Un
 *  membre n'en a qu'un par variante (`@@unique([varianteId, membreId])`). */
export async function mesVotes(membreId: string, varianteIds: string[]): Promise<Map<string, MonVote>> {
    if (!varianteIds.length) return new Map()
    const [temoignages, monVillage] = await Promise.all([
        prisma.temoignage.findMany({
            where: { membreId, varianteId: { in: varianteIds } },
            select: { varianteId: true, communeId: true, commune: { select: { nom: true } } },
        }),
        villageDuMembre(membreId),
    ])
    return new Map(temoignages.map((t) => [t.varianteId, {
        village: t.commune?.nom ?? "ton ancien village",
        actuel: t.communeId !== null && t.communeId === monVillage,
    }]))
}
