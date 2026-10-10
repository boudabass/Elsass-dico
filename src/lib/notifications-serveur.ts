// Notifications du défi du jour (Web Push), côté serveur. Plan : Odoo 930
// (09/10/2026), même mécanique que l'app marketing (Odoo 929), dont la logique
// d'envoi et le nettoyage 404/410 sont repris ici.
//
// Exception à la doctrine « aucun service extérieur à l'exécution », acceptée
// par John le 09/10 : l'envoi passe par Google (Android) ou Apple (iPhone).
// C'est le SERVEUR qui leur parle ; le navigateur n'appelle aucun tiers, et le
// message, chiffré, ne contient qu'une phrase.

import webpush from "web-push"

import { jourActuel, NB_MANCHES, numeroDefi } from "@/lib/jeu"
import { prisma } from "@/lib/prisma"

// Lues à l'APPEL, pas au chargement du module (même motif que
// `AUTOMATISATION_API_TOKEN`) : `next build` évalue les modules sans les
// variables runtime de Coolify. Sans clés, les notifications sont coupées et
// l'interface ne propose rien.
export function configurationVapid(): { publique: string; privee: string; sujet: string } | null {
    const publique = process.env.VAPID_PUBLIC_KEY ?? ""
    const privee = process.env.VAPID_PRIVATE_KEY ?? ""
    const sujet = process.env.VAPID_SUJET || "mailto:integrations@theelsassisch.com"
    if (!publique || !privee) return null
    return { publique, privee, sujet }
}

export interface Message {
    titre: string
    corps: string
    url: string
    tag: string
}

/** Le texte décidé par John le 09/10 : « Défi du jour : 5 villages ». La forme
 *  « <nombre> <ce qu'on devine> » laisse la place à d'autres défis plus tard
 *  (« 5 mots », « 5 expressions »). Jamais la réponse ni un indice. */
export function messageDefi(jour: string, devine = "villages"): Message {
    return {
        titre: `Défi du jour : ${NB_MANCHES} ${devine}`,
        corps: `Défi n° ${numeroDefi(jour)}`,
        url: "/jeu",
        // Un tag fixe : une notification non lue est remplacée par la suivante
        // au lieu de s'empiler.
        tag: "defi-du-jour",
    }
}

export const MESSAGE_ESSAI: Message = {
    titre: "Les notifications marchent",
    corps: "Tu recevras le défi du jour chaque matin à 10 h.",
    url: "/jeu",
    tag: "essai",
}

interface Cible {
    endpoint: string
    p256dh: string
    auth: string
}

/** Un envoi. Rend le code HTTP du refus, ou null si c'est parti. Un 404 ou un
 *  410 veut dire « abonnement mort pour de bon » (l'app a été désinstallée, ou
 *  l'autorisation retirée) : la ligne est alors supprimée. */
export async function pousser(
    cible: Cible,
    message: Message,
): Promise<{ ok: true } | { ok: false; code: number | null; supprime: boolean }> {
    const config = configurationVapid()
    if (!config) return { ok: false, code: null, supprime: false }
    try {
        await webpush.sendNotification(
            { endpoint: cible.endpoint, keys: { p256dh: cible.p256dh, auth: cible.auth } },
            JSON.stringify(message),
            {
                vapidDetails: { subject: config.sujet, publicKey: config.publique, privateKey: config.privee },
                // Le défi reste valable jusqu'à minuit : un téléphone éteint à
                // 10 h le reçoit encore dans l'après-midi, pas le lendemain.
                TTL: 6 * 3600,
                // Un second envoi encore en attente remplace le premier chez
                // Google, au lieu de s'ajouter.
                topic: message.tag,
            },
        )
        return { ok: true }
    } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode ?? null
        if (code === 404 || code === 410) {
            await prisma.abonnementPush.deleteMany({ where: { endpoint: cible.endpoint } })
            return { ok: false, code, supprime: true }
        }
        console.warn(`Notification refusée (${code ?? "sans code"}) : ${String((e as Error)?.message ?? e).slice(0, 200)}`)
        return { ok: false, code, supprime: false }
    }
}

export interface BilanDefi {
    jour: string
    numero: number
    abonnes: number
    dejaJoue: number
    dejaEnvoye: number
    envoyes: number
    supprimes: number
    erreurs: string[]
    simule: boolean
}

/** L'envoi de 10 h. À chaque abonné qui n'a pas TERMINÉ le défi du jour (un
 *  défi commencé sans être fini mérite le rappel), une fois par jour au plus.
 *
 *  Le « une fois » tient même si N8N déclenche deux fois en même temps :
 *  chaque abonnement est réservé par une mise à jour conditionnelle de
 *  `dernierDefi` avant l'envoi, et une seule des deux requêtes la gagne. */
export async function annoncerDefi({ simuler = false } = {}): Promise<BilanDefi> {
    const jour = jourActuel()
    const date = new Date(`${jour}T00:00:00Z`)
    const message = messageDefi(jour)

    const abonnements = await prisma.abonnementPush.findMany()
    const finis = new Set(
        (
            await prisma.partieJeu.findMany({
                where: { mode: "jour", jour: date, finie: true, membreId: { in: Array.from(new Set(abonnements.map((a) => a.membreId))) } },
                select: { membreId: true },
            })
        ).map((p) => p.membreId),
    )

    const bilan: BilanDefi = {
        jour,
        numero: numeroDefi(jour),
        abonnes: abonnements.length,
        dejaJoue: 0,
        dejaEnvoye: 0,
        envoyes: 0,
        supprimes: 0,
        erreurs: [],
        simule: simuler,
    }

    await Promise.all(
        abonnements.map(async (a) => {
            if (finis.has(a.membreId)) {
                bilan.dejaJoue += 1
                return
            }
            if (a.dernierDefi && a.dernierDefi.getTime() === date.getTime()) {
                bilan.dejaEnvoye += 1
                return
            }
            if (simuler) {
                bilan.envoyes += 1
                return
            }
            const reserve = await prisma.abonnementPush.updateMany({
                where: { endpoint: a.endpoint, OR: [{ dernierDefi: null }, { dernierDefi: { not: date } }] },
                data: { dernierDefi: date },
            })
            if (reserve.count === 0) {
                bilan.dejaEnvoye += 1
                return
            }
            const r = await pousser(a, message)
            if (r.ok) {
                bilan.envoyes += 1
            } else if (r.supprime) {
                bilan.supprimes += 1
            } else {
                // Échec passager : on rend la réservation, pour qu'un nouvel
                // appel du jour puisse réessayer.
                await prisma.abonnementPush.updateMany({
                    where: { endpoint: a.endpoint },
                    data: { dernierDefi: a.dernierDefi },
                })
                bilan.erreurs.push(r.code ? `Refus ${r.code}` : "Envoi impossible")
            }
        }),
    )

    return bilan
}
