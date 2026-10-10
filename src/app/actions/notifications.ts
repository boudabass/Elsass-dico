'use server'

import { configurationVapid, MESSAGE_ESSAI, pousser } from "@/lib/notifications-serveur"
import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

// Notifications du défi du jour, côté membre (Odoo 930, 09/10/2026) : la clé
// publique, s'abonner, se désabonner, s'envoyer un essai. Chaque action se
// garde elle-même par la session : Next expose toute action importée par une
// page, et `/jeu` se joue aussi sans compte.

type Resultat<T = null> = { succes: true; valeur: T } | { succes: false; erreur: string }

const NON_CONNECTE = { succes: false, erreur: "Connecte-toi pour recevoir le défi du jour" } as const
const COUPE = { succes: false, erreur: "Les notifications ne sont pas encore en service" } as const

/** La clé publique VAPID, ou null si les notifications ne sont pas en
 *  service : l'interface ne propose alors rien. */
export async function clePubliqueAction(): Promise<Resultat<string | null>> {
    if (!(await sessionActuelle())) return NON_CONNECTE
    return { succes: true, valeur: configurationVapid()?.publique ?? null }
}

/** Ce que le navigateur envoie : `PushSubscription.toJSON()`. */
export interface AbonnementNavigateur {
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
}

export async function abonnerAction(abonnement: AbonnementNavigateur, appareil: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return NON_CONNECTE
    if (!configurationVapid()) return COUPE

    const endpoint = abonnement?.endpoint
    const p256dh = abonnement?.keys?.p256dh
    const auth = abonnement?.keys?.auth
    if (
        typeof endpoint !== "string" ||
        !/^https:\/\//.test(endpoint) ||
        endpoint.length > 1000 ||
        typeof p256dh !== "string" ||
        p256dh.length > 200 ||
        typeof auth !== "string" ||
        auth.length > 100
    ) {
        return { succes: false, erreur: "Le téléphone a renvoyé un abonnement illisible" }
    }

    // Un même navigateur réabonné sous un autre compte change de membre.
    await prisma.abonnementPush.upsert({
        where: { endpoint },
        create: { endpoint, p256dh, auth, membreId: session.membreId, appareil: appareil.slice(0, 120) || null },
        update: { p256dh, auth, membreId: session.membreId, appareil: appareil.slice(0, 120) || null },
    })
    return { succes: true, valeur: null }
}

export async function desabonnerAction(endpoint: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return NON_CONNECTE
    // Seulement les siens : un endpoint deviné ne coupe pas celui d'un autre.
    await prisma.abonnementPush.deleteMany({ where: { endpoint, membreId: session.membreId } })
    return { succes: true, valeur: null }
}

/** Ce téléphone est-il abonné, pour ce membre ? (Le navigateur peut garder un
 *  abonnement que la base a supprimé, ou qui appartient à un autre compte.) */
export async function estAbonneAction(endpoint: string): Promise<Resultat<boolean>> {
    const session = await sessionActuelle()
    if (!session) return NON_CONNECTE
    const ligne = await prisma.abonnementPush.findFirst({
        where: { endpoint, membreId: session.membreId },
        select: { endpoint: true },
    })
    return { succes: true, valeur: ligne !== null }
}

export async function essaiAction(endpoint: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return NON_CONNECTE
    if (!configurationVapid()) return COUPE
    const cible = await prisma.abonnementPush.findFirst({ where: { endpoint, membreId: session.membreId } })
    if (!cible) return { succes: false, erreur: "Ce téléphone n'est pas abonné" }
    const r = await pousser(cible, MESSAGE_ESSAI)
    if (r.ok) return { succes: true, valeur: null }
    return {
        succes: false,
        erreur: r.supprime
            ? "Le téléphone a refusé la notification. Réactive-les."
            : "L'envoi n'a pas marché. Réessaie dans un moment.",
    }
}
