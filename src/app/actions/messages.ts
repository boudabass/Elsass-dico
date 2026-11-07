'use server'

import { depasse, noter } from "@/lib/limite-tentatives-serveur"
import { MESSAGE_TEXTE_MAX, MESSAGES_PAR_HEURE } from "@/lib/messages"
import { endpointAccepte, pousser, type Message } from "@/lib/notifications-serveur"
import { prisma } from "@/lib/prisma"
import { adminExige, sessionActuelle } from "@/lib/session-serveur"

// Les messages de l'équipe à un membre (07/11/2026). L'admin écrit depuis Admin >
// Membres ou depuis une ligne de /admin/contributions ; le membre le lit dans
// Mon espace. Un message part aussi en notification, si le membre est abonné.
// Un échec d'envoi de la notification ne fait rien perdre : le message est déjà écrit.

const UNE_HEURE_MS = 60 * 60 * 1000

type Resultat = { succes: true } | { succes: false; erreur: string }

const REFUS = { succes: false, erreur: "Réservé aux administrateurs" } as const

const MESSAGE_PUSH: Message = {
    titre: "Message de l'équipe The Elsassisch",
    corps: "Tu as un nouveau message dans ton espace.",
    url: "/dashboard",
    tag: "message-equipe",
}

export async function envoyerMessageMembreAction(membreId: string, texte: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const propre = texte.trim()
    if (!propre) return { succes: false, erreur: "Écris le message avant de l'envoyer" }
    if (propre.length > MESSAGE_TEXTE_MAX) {
        return { succes: false, erreur: `Le message fait ${propre.length} caractères : ${MESSAGE_TEXTE_MAX} au plus` }
    }

    const cleEnvoi = `message:${admin.membreId}`
    if (depasse(cleEnvoi, MESSAGES_PAR_HEURE, UNE_HEURE_MS)) {
        return { succes: false, erreur: `Tu as déjà envoyé ${MESSAGES_PAR_HEURE} messages cette heure-ci. Réessaie un peu plus tard.` }
    }

    const membre = await prisma.membre.findUnique({ where: { id: membreId }, select: { id: true } })
    if (!membre) return { succes: false, erreur: "Membre introuvable" }

    try {
        await prisma.messageMembre.create({
            data: { membreId, auteurId: admin.membreId, texte: propre },
        })
    } catch (erreur) {
        console.error("[Messages] Non envoyé:", erreur)
        return { succes: false, erreur: "Envoi impossible, réessaie dans un instant" }
    }
    noter(cleEnvoi)

    // La notification : une tentative par abonnement, sans reprise, et sans bloquer l'envoi.
    const abonnements = await prisma.abonnementPush.findMany({ where: { membreId } })
    await Promise.all(abonnements.filter((a) => endpointAccepte(a.endpoint)).map((a) => pousser(a, MESSAGE_PUSH)))

    return { succes: true }
}

export interface MessageEnvoye {
    id: string
    texte: string
    /** ISO */
    creeLe: string
    /** ISO, ou null tant que le membre n'a pas ouvert Mon espace depuis. */
    luLe: string | null
}

/** Les messages écrits à un membre, du plus récent au plus ancien : la fiche de l'admin. */
export async function listerMessagesEnvoyesAction(
    membreId: string,
): Promise<{ succes: true; messages: MessageEnvoye[] } | { succes: false; erreur: string }> {
    const admin = await adminExige()
    if (!admin) return REFUS

    const messages = await prisma.messageMembre.findMany({
        where: { membreId },
        orderBy: { creeLe: "desc" },
        take: 50,
        select: { id: true, texte: true, creeLe: true, luLe: true },
    })
    return {
        succes: true,
        messages: messages.map((m) => ({
            id: m.id,
            texte: m.texte,
            creeLe: m.creeLe.toISOString(),
            luLe: m.luLe?.toISOString() ?? null,
        })),
    }
}

export interface MessageRecu {
    id: string
    texte: string
    creeLe: string
    /** Vrai si le membre ne l'avait pas encore lu avant cette ouverture de Mon espace. */
    nouveau: boolean
}

/** Les messages reçus, pour le bloc « Messages de l'équipe » de Mon espace. Lus pour la
 *  session seulement (jamais un identifiant reçu du navigateur). Ouvrir Mon espace les marque lus. */
export async function mesMessagesAction(): Promise<MessageRecu[]> {
    const session = await sessionActuelle()
    if (!session) return []

    const messages = await prisma.messageMembre.findMany({
        where: { membreId: session.membreId },
        orderBy: { creeLe: "desc" },
        take: 20,
        select: { id: true, texte: true, creeLe: true, luLe: true },
    })

    const nonLus = messages.filter((m) => m.luLe === null).map((m) => m.id)
    if (nonLus.length) {
        await prisma.messageMembre.updateMany({
            where: { id: { in: nonLus }, luLe: null },
            data: { luLe: new Date() },
        })
    }

    return messages.map((m) => ({
        id: m.id,
        texte: m.texte,
        creeLe: m.creeLe.toISOString(),
        nouveau: m.luLe === null,
    }))
}
