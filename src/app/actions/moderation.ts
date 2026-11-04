'use server'

import { revalidatePath } from "next/cache"

import { lirePageContributions } from "@/lib/moderation-serveur"
import { TYPES_CONTRIBUTION, type FiltresContributions, type PageContributions } from "@/lib/moderation"
import { viderCacheAccueil } from "@/lib/apercu-accueil"
import { viderReserve } from "@/lib/jeu"
import { prisma } from "@/lib/prisma"
import { adminExige } from "@/lib/session-serveur"

// Les gestes de l'admin sur les contributions (04/11/2026). Chacun écrit sa
// ligne `moderations` dans la MÊME transaction que le geste, comme le journal :
// un geste qui n'a pas sa ligne ne doit pas exister. Rien n'est effacé, sauf
// le témoignage d'un vote retiré, dont le retrait reste au journal.
//
// Toute action commence par `adminExige()`. Les utilitaires vivent dans `lib/`.

type Resultat = { succes: true } | { succes: false; erreur: string }

const REFUS = { succes: false, erreur: "Réservé aux administrateurs" } as const

/** Ce qui change dans le défi doit se voir tout de suite sur cette instance,
 *  et sur les pages qui montrent le jeu et l'accueil. */
function rafraichirDefi(): void {
    viderReserve()
    viderCacheAccueil()
    revalidatePath("/jeu")
    revalidatePath("/")
    revalidatePath("/admin/contributions")
}

export async function listerContributionsAction(
    filtres: FiltresContributions,
): Promise<{ succes: true; valeur: PageContributions } | { succes: false; erreur: string }> {
    if (!(await adminExige())) return REFUS

    const type = filtres.type && (TYPES_CONTRIBUTION as readonly string[]).includes(filtres.type)
        ? filtres.type
        : undefined
    const depuis = filtres.depuis && !Number.isNaN(Date.parse(filtres.depuis)) ? filtres.depuis : undefined
    const membreId = filtres.membreId?.trim() || undefined

    return { succes: true, valeur: await lirePageContributions({ page: filtres.page, type, membreId, depuis }) }
}

/** Les membres qui ont un geste au journal : ce que le filtre « Membre » propose. */
export async function listerMembresContributeursAction(): Promise<
    { succes: true; membres: { id: string; nom: string }[] } | { succes: false; erreur: string }
> {
    if (!(await adminExige())) return REFUS

    const membres = await prisma.membre.findMany({
        where: { evenements: { some: {} } },
        select: { id: true, nom: true, email: true },
        orderBy: { creeLe: "asc" },
        take: 500,
    })
    return {
        succes: true,
        membres: membres.map((m) => ({ id: m.id, nom: m.nom ?? m.email })),
    }
}

// --- Masquer et réafficher une forme ------------------------------------------

export async function masquerFormeAction(varianteId: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    // Une forme de source ne se masque pas : elle vient d'une source écrite, et
    // le tirage du défi ne lit que ces formes-là. Réafficher reste permis, pour
    // pouvoir toujours défaire.
    const v = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { id: true, temoignages: { where: { sourceId: { not: null } }, select: { id: true }, take: 1 } },
    })
    if (!v) return { succes: false, erreur: "Cette forme n'existe plus" }
    if (v.temoignages.length) return { succes: false, erreur: "Une forme de source ne se masque pas : elle vient d'une source écrite et sert au défi" }

    // `updateMany` avec la condition dans le WHERE : deux clics simultanés ne
    // journalisent pas deux fois le même masquage.
    const fait = await prisma.$transaction(async (tx) => {
        const { count } = await tx.variante.updateMany({ where: { id: varianteId, masquee: false }, data: { masquee: true } })
        if (!count) return false
        await tx.moderation.create({ data: { type: "masquage", varianteId, acteurId: admin.membreId } })
        return true
    })
    if (!fait) return { succes: false, erreur: "Cette forme est déjà masquée, ou n'existe plus" }

    rafraichirDefi()
    return { succes: true }
}

export async function reafficherFormeAction(varianteId: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const fait = await prisma.$transaction(async (tx) => {
        const { count } = await tx.variante.updateMany({ where: { id: varianteId, masquee: true }, data: { masquee: false } })
        if (!count) return false
        await tx.moderation.create({ data: { type: "demasquage", varianteId, acteurId: admin.membreId } })
        return true
    })
    if (!fait) return { succes: false, erreur: "Cette forme n'est pas masquée, ou n'existe plus" }

    rafraichirDefi()
    return { succes: true }
}

// --- Retirer un vote ----------------------------------------------------------

/** Retire le vote d'un membre sur une forme. Un membre n'a qu'un témoignage par
 *  forme (`varianteId`, `membreId` unique), donc le couple suffit. Refusé sur un
 *  témoignage de source : une source écrite ne vote pas, et n'a pas de village. */
export async function retirerVoteModereAction(varianteId: string, membreId: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const t = await prisma.temoignage.findUnique({
        where: { varianteId_membreId: { varianteId, membreId } },
        select: { id: true, varianteId: true, membreId: true, communeId: true, sourceId: true },
    })
    if (!t) return { succes: false, erreur: "Ce vote n'existe plus" }
    if (t.sourceId) return { succes: false, erreur: "C'est le témoignage d'une source écrite : il ne se retire pas comme un vote" }

    const fait = await prisma.$transaction(async (tx) => {
        // Le témoignage est supprimé dans la transaction : un second retrait
        // simultané ne trouve plus rien et ne journalise rien.
        const { count } = await tx.temoignage.deleteMany({ where: { id: t.id, sourceId: null } })
        if (!count) return false
        await tx.evenementContribution.create({
            data: { type: "retrait", varianteId: t.varianteId, temoignageId: t.id, communeId: t.communeId, membreId: t.membreId },
        })
        await tx.moderation.create({
            data: { type: "retrait_vote", varianteId: t.varianteId, temoignageId: t.id, acteurId: admin.membreId },
        })
        return true
    })
    if (!fait) return { succes: false, erreur: "Ce vote n'existe plus" }

    revalidatePath("/admin/contributions")
    return { succes: true }
}

// --- Valider une forme pour le défi -------------------------------------------

/** Une forme de membre entre dans le défi. Refusé sur une forme de source :
 *  elle y est déjà. */
export async function validerPourDefiAction(varianteId: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const v = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { id: true, temoignages: { where: { sourceId: { not: null } }, select: { id: true }, take: 1 } },
    })
    if (!v) return { succes: false, erreur: "Cette forme n'existe plus" }
    if (v.temoignages.length) return { succes: false, erreur: "Une forme de source est déjà dans le défi" }

    const fait = await prisma.$transaction(async (tx) => {
        const { count } = await tx.variante.updateMany({
            where: { id: varianteId, valideeDefiLe: null },
            data: { valideeDefiLe: new Date() },
        })
        if (!count) return false
        await tx.moderation.create({ data: { type: "validation_defi", varianteId, acteurId: admin.membreId } })
        return true
    })
    if (!fait) return { succes: false, erreur: "Cette forme est déjà validée pour le défi" }

    rafraichirDefi()
    return { succes: true }
}

export async function annulerValidationDefiAction(varianteId: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const fait = await prisma.$transaction(async (tx) => {
        const { count } = await tx.variante.updateMany({
            where: { id: varianteId, valideeDefiLe: { not: null } },
            data: { valideeDefiLe: null },
        })
        if (!count) return false
        await tx.moderation.create({ data: { type: "annulation_validation_defi", varianteId, acteurId: admin.membreId } })
        return true
    })
    if (!fait) return { succes: false, erreur: "Cette forme n'est pas validée pour le défi" }

    rafraichirDefi()
    return { succes: true }
}
