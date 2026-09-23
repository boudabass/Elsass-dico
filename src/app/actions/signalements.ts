'use server'

import { revalidatePath } from "next/cache"

import type { SignalementListe } from "@/lib/signalements"
import { prisma } from "@/lib/prisma"
import { adminExige, sessionActuelle } from "@/lib/session-serveur"

type Resultat =
    | { succes: true; message: string }
    | { succes: false; erreur: string }

const REFUS = "Réservé aux administrateurs"
const MOTIF_MAX = 500

/** Un membre connecté signale une variante précise — jamais anonyme (le
 *  compte est obligatoire depuis la refonte, ce qui bloquait un signalement
 *  in-app à l'étape 2 ne tient plus). Ça ne modifie rien : ça met la variante
 *  dans la file que l'admin lit. */
export async function creerSignalementAction(
    varianteId: string,
    motif: string,
): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connecte-toi pour continuer" }

    const propre = motif.trim().slice(0, MOTIF_MAX)
    if (!propre) return { succes: false, erreur: "Décris le problème" }

    const variante = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: { id: true },
    })
    if (!variante) return { succes: false, erreur: "Forme introuvable" }

    try {
        await prisma.signalement.create({
            data: { varianteId, membreId: session.membreId, motif: propre },
        })
    } catch (erreur) {
        console.error("[Signalements] Non créé:", erreur)
        return { succes: false, erreur: "Envoi impossible, réessaie dans un instant" }
    }

    return { succes: true, message: "Signalement envoyé" }
}

export async function listerSignalementsAction(): Promise<
    { succes: true; signalements: SignalementListe[] } | { succes: false; erreur: string }
> {
    if (!(await adminExige())) return { succes: false, erreur: REFUS }

    const lignes = await prisma.signalement.findMany({
        where: { traiteLe: null },
        select: {
            id: true,
            motif: true,
            creeLe: true,
            traiteLe: true,
            variante: { select: { id: true, forme: true, lemme: { select: { id: true, francais: true } } } },
            membre: { select: { email: true, nom: true } },
        },
        // Les plus anciens d'abord : une file se vide dans l'ordre où elle se
        // remplit, sinon un signalement ancien peut rester invisible en
        // permanence derrière des arrivées plus récentes.
        orderBy: { creeLe: 'asc' },
    })

    return {
        succes: true,
        signalements: lignes.map((s) => ({
            id: s.id,
            motif: s.motif,
            creeLe: s.creeLe.toISOString(),
            traiteLe: s.traiteLe?.toISOString() ?? null,
            variante: { id: s.variante.id, forme: s.variante.forme },
            lemme: s.variante.lemme,
            membre: { email: s.membre.email, nom: s.membre.nom },
        })),
    }
}

/** Marque traité, ne modifie ni ne supprime rien d'autre : la décision (garder,
 *  masquer la variante, corriger) reste un geste séparé, pris ailleurs par
 *  l'admin — cet écran est une file, pas un exécuteur. */
export async function traiterSignalementAction(id: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return { succes: false, erreur: REFUS }

    try {
        await prisma.signalement.update({ where: { id }, data: { traiteLe: new Date() } })
    } catch (erreur) {
        console.error("[Signalements] Non marqué traité:", erreur)
        return { succes: false, erreur: "Modification impossible, réessaie dans un instant" }
    }

    revalidatePath('/admin/signalements')
    return { succes: true, message: "Marqué traité" }
}
