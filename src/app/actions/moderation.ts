'use server'

import { revalidatePath } from "next/cache"

import { lirePageContributions } from "@/lib/moderation-serveur"
import { TYPES_CONTRIBUTION, type FiltresContributions, type PageContributions } from "@/lib/moderation"
import { viderCacheAccueil } from "@/lib/apercu-accueil"
import { viderReserve } from "@/lib/jeu"
import { Prisma } from "@/generated/prisma/client"
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

/** Ce qui change dans le public ou le défi doit se voir tout de suite sur cette instance,
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

/** Les membres qui ont créé ou corrigé une forme : ce que le filtre « Membre » propose. */
export async function listerMembresContributeursAction(): Promise<
    { succes: true; membres: { id: string; nom: string }[] } | { succes: false; erreur: string }
> {
    if (!(await adminExige())) return REFUS

    const membres = await prisma.membre.findMany({
        where: { evenements: { some: { type: { in: ["creation", "modification"] } } } },
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
    if (v.temoignages.length) return { succes: false, erreur: "Une forme de source ne se masque pas : elle vient d'une source écrite, elle peut être montrée sans compte et sert au défi" }

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

// --- Valider une forme pour le défi -------------------------------------------

/** Une forme de membre peut être montrée sans compte et entrer dans le défi. Refusé sur une forme de source :
 *  elle y est déjà. */
export async function validerPourDefiAction(varianteId: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const v = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { id: true, temoignages: { where: { sourceId: { not: null } }, select: { id: true }, take: 1 } },
    })
    if (!v) return { succes: false, erreur: "Cette forme n'existe plus" }
    if (v.temoignages.length) return { succes: false, erreur: "Une forme de source est déjà montrée sans compte et dans le défi" }

    const fait = await prisma.$transaction(async (tx) => {
        const { count } = await tx.variante.updateMany({
            where: { id: varianteId, valideeDefiLe: null },
            data: { valideeDefiLe: new Date() },
        })
        if (!count) return false
        await tx.moderation.create({ data: { type: "validation_defi", varianteId, acteurId: admin.membreId } })
        return true
    })
    if (!fait) return { succes: false, erreur: "Cette forme est déjà validée" }

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
    if (!fait) return { succes: false, erreur: "Cette forme n'est pas validée" }

    rafraichirDefi()
    return { succes: true }
}

// --- Retirer la catégorie « insulte » d'un mot (07/11/2026) ---------------------

const MESSAGE_MOT_EXISTANT = "Ce mot existe déjà sans la catégorie insulte. Masque plutôt ce texte."

/** Le mot garde sa fiche et ses formes ; seul son contexte repasse à vide. Refusé si une
 *  source écrite porte ce mot (elle le donne comme insulte, l'admin ne la contredit pas)
 *  et refusé s'il existe déjà sans la catégorie : pas de fusion. */
export async function retirerCategorieInsulteAction(lemmeId: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const lemme = await prisma.lemme.findUnique({
        where: { id: lemmeId },
        select: { cle: true, type: true, contexte: true },
    })
    if (!lemme) return { succes: false, erreur: "Ce mot n'existe plus" }
    if (lemme.contexte !== "insulte") return { succes: false, erreur: "Ce mot n'est pas dans la catégorie insulte" }

    const sourcees = await prisma.temoignage.count({
        where: { sourceId: { not: null }, variante: { lemmeId } },
    })
    if (sourcees) return { succes: false, erreur: "Une source écrite porte ce mot : sa catégorie ne se retire pas" }

    const existant = await prisma.lemme.findUnique({
        where: { cle_contexte_type: { cle: lemme.cle, contexte: "", type: lemme.type } },
        select: { id: true },
    })
    if (existant) return { succes: false, erreur: MESSAGE_MOT_EXISTANT }

    try {
        // Le changement et sa trace dans la même transaction : un geste sans trace n'existe pas.
        const fait = await prisma.$transaction(async (tx) => {
            const { count } = await tx.lemme.updateMany({
                where: { id: lemmeId, contexte: "insulte" },
                data: { contexte: "" },
            })
            if (!count) return false
            await tx.changementCategorie.create({
                data: { lemmeId, ancienContexte: "insulte", nouveauContexte: "", acteurId: admin.membreId },
            })
            return true
        })
        if (!fait) return { succes: false, erreur: "Ce mot n'est plus dans la catégorie insulte" }
    } catch (erreur) {
        // Un mot identique a été créé entre la lecture et l'écriture : même refus.
        if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2002") {
            return { succes: false, erreur: MESSAGE_MOT_EXISTANT }
        }
        console.error("[Moderation] Catégorie non retirée:", erreur)
        return { succes: false, erreur: "Enregistrement impossible, réessaie dans un instant" }
    }

    rafraichirDefi()
    return { succes: true }
}
