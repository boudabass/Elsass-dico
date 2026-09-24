'use server'

import { revalidatePath } from "next/cache"

import { Prisma } from "@/generated/prisma/client"
import { REFUS_VILLAGE_REQUIS, type EchecContribution } from "@/lib/contribution"
import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

// Doc 20, étape 5 : « un vote = un village », bouton `+` sur une variante,
// jamais de vote contre. Le témoignage créé ici porte membreId + communeId et
// ni sourceId ni attestationId — la branche « locuteur » du CHECK SQL qui
// interdit de mélanger les deux (schema.prisma, Temoignage).

type Resultat = { succes: true } | EchecContribution

export async function voterPourVarianteAction(varianteId: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connecte-toi pour continuer" }

    // Relu en base plutôt que pris du cookie : le jeton de session dure 30 min,
    // et un village tout juste choisi ne doit pas attendre son renouvellement
    // pour pouvoir voter.
    const membre = await prisma.membre.findUnique({
        where: { id: session.membreId },
        select: { communeId: true },
    })
    if (!membre?.communeId) return REFUS_VILLAGE_REQUIS

    const variante = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { lemmeId: true, masquee: true },
    })
    if (!variante || variante.masquee) return { succes: false, erreur: "Forme introuvable" }

    // Plus d'`upsert` depuis le journal (24/09/2026) : il faut savoir si le
    // témoignage vient d'être créé, pour n'écrire la pose qu'une fois. Un
    // second clic (double envoi réseau, bouton pressé deux fois) reste un
    // no-op, pas une erreur à afficher : déjà posé, ou perdu contre une course
    // sur la contrainte d'unicité, c'est le même résultat pour le membre.
    const dejaPose = await prisma.temoignage.findUnique({
        where: { varianteId_membreId: { varianteId, membreId: session.membreId } },
        select: { id: true },
    })
    if (!dejaPose) {
        try {
            await prisma.$transaction(async (tx) => {
                const t = await tx.temoignage.create({
                    data: { varianteId, membreId: session.membreId, communeId: membre.communeId },
                    select: { id: true },
                })
                await tx.evenementContribution.create({
                    data: {
                        type: "pose",
                        varianteId,
                        temoignageId: t.id,
                        communeId: membre.communeId,
                        membreId: session.membreId,
                    },
                })
            })
        } catch (erreur) {
            if (!estDoublon(erreur)) {
                console.error("[Votes] Non enregistré:", erreur)
                return { succes: false, erreur: "Enregistrement impossible, réessaie dans un instant" }
            }
        }
    }

    revalidatePath(`/entree/${variante.lemmeId}`)
    return { succes: true }
}

export async function retirerVoteAction(varianteId: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connecte-toi pour continuer" }

    const variante = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { lemmeId: true },
    })

    // Le témoignage est supprimé, le retrait reste au journal avec son village :
    // c'est lui qui dira un jour qu'un village a quitté cette forme.
    try {
        await prisma.$transaction(async (tx) => {
            const t = await tx.temoignage.findUnique({
                where: { varianteId_membreId: { varianteId, membreId: session.membreId } },
                select: { id: true, communeId: true },
            })
            if (!t) return
            await tx.temoignage.delete({ where: { id: t.id } })
            await tx.evenementContribution.create({
                data: {
                    type: "retrait",
                    varianteId,
                    temoignageId: t.id,
                    communeId: t.communeId,
                    membreId: session.membreId,
                },
            })
        })
    } catch (erreur) {
        // Deux retraits simultanés : le second ne trouve plus rien à supprimer.
        if (!estIntrouvable(erreur)) {
            console.error("[Votes] Retrait non enregistré:", erreur)
            return { succes: false, erreur: "Enregistrement impossible, réessaie dans un instant" }
        }
    }

    if (variante) revalidatePath(`/entree/${variante.lemmeId}`)
    return { succes: true }
}

function estDoublon(erreur: unknown): boolean {
    return erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2002"
}

function estIntrouvable(erreur: unknown): boolean {
    return erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2025"
}
