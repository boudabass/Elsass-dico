'use server'

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

// Doc 20, étape 5 : « un vote = un village », bouton `+` sur une variante,
// jamais de vote contre. Le témoignage créé ici porte membreId + communeId et
// ni sourceId ni attestationId — la branche « locuteur » du CHECK SQL qui
// interdit de mélanger les deux (schema.prisma, Temoignage).

type Resultat = { succes: true } | { succes: false; erreur: string }

export async function voterPourVarianteAction(varianteId: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connexion requise" }

    // Relu en base plutôt que pris du cookie : le jeton de session dure 30 min,
    // et un village tout juste choisi ne doit pas attendre son renouvellement
    // pour pouvoir voter.
    const membre = await prisma.membre.findUnique({
        where: { id: session.membreId },
        select: { communeId: true },
    })
    if (!membre?.communeId) {
        return { succes: false, erreur: "Choisis d'abord ton village, dans Mon espace" }
    }

    const variante = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { lemmeId: true, masquee: true },
    })
    if (!variante || variante.masquee) return { succes: false, erreur: "Forme introuvable" }

    try {
        // `upsert` plutôt que `create` : un second clic (double envoi réseau,
        // bouton pressé deux fois) ne doit pas échouer sur la contrainte
        // d'unicité — voter deux fois pour son propre village est un no-op,
        // pas une erreur à afficher.
        await prisma.temoignage.upsert({
            where: { varianteId_membreId: { varianteId, membreId: session.membreId } },
            create: { varianteId, membreId: session.membreId, communeId: membre.communeId },
            update: {},
        })
    } catch (erreur) {
        console.error("[Votes] Non enregistré:", erreur)
        return { succes: false, erreur: "Enregistrement impossible" }
    }

    revalidatePath(`/entree/${variante.lemmeId}`)
    return { succes: true }
}

export async function retirerVoteAction(varianteId: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connexion requise" }

    const variante = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { lemmeId: true },
    })

    await prisma.temoignage.deleteMany({
        where: { varianteId, membreId: session.membreId },
    })

    if (variante) revalidatePath(`/entree/${variante.lemmeId}`)
    return { succes: true }
}
