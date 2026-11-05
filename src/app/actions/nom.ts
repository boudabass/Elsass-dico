'use server'

import { CHANGEMENTS_NOM_PAR_JOUR, validerNom } from "@/lib/nom"
import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

const UN_JOUR_MS = 24 * 60 * 60 * 1000

// Le membre confirme son prénom et son nom (Mon espace, ou la feuille de
// contribution). C'est cette confirmation, et elle seule, qui rend le nom
// affichable : `nomConfirmeLe` est posé ici et nulle part ailleurs.
//
// L'ancien nom n'est pas perdu : quand il change, il part dans `noms_membre`,
// daté, et reste visible à l'administration. Le nombre de changements est
// plafonné par jour, pour qu'un nom ne tourne pas sous les yeux de ceux qui
// le lisent.
export async function enregistrerNomAction(
    saisie: { prenom: string; nom: string },
): Promise<{ succes: true } | { succes: false; erreur: string }> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connecte-toi pour continuer" }

    const valide = validerNom(saisie.prenom, saisie.nom)
    if (!valide.ok) return { succes: false, erreur: valide.erreur }

    const membre = await prisma.membre.findUnique({
        where: { id: session.membreId },
        select: { nom: true, nomConfirmeLe: true },
    })
    if (!membre) return { succes: false, erreur: "Compte introuvable" }

    // Déjà confirmé sous ce nom : rien à écrire, rien à compter.
    if (membre.nomConfirmeLe && membre.nom === valide.nom) return { succes: true }

    if (membre.nom && membre.nom !== valide.nom) {
        const recents = await prisma.nomMembre.count({
            where: { membreId: session.membreId, le: { gte: new Date(Date.now() - UN_JOUR_MS) } },
        })
        if (recents >= CHANGEMENTS_NOM_PAR_JOUR) {
            return { succes: false, erreur: "Tu as changé ton nom plusieurs fois aujourd'hui. Réessaie demain." }
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            if (membre.nom && membre.nom !== valide.nom) {
                await tx.nomMembre.create({ data: { membreId: session.membreId, nom: membre.nom } })
            }
            await tx.membre.update({
                where: { id: session.membreId },
                data: { nom: valide.nom, nomConfirmeLe: new Date() },
            })
        })
    } catch (erreur) {
        console.error("[Nom] Non enregistré:", erreur)
        return { succes: false, erreur: "Enregistrement impossible, réessaie dans un instant" }
    }
    return { succes: true }
}

// Le nom courant et s'il est confirmé : la feuille de contribution s'ouvre sur
// le champ du nom quand il ne l'est pas encore, pour que le membre n'ait qu'un
// geste à faire avant d'écrire.
export async function monNomAction(): Promise<{ nom: string | null; confirme: boolean } | null> {
    const session = await sessionActuelle()
    if (!session) return null
    const membre = await prisma.membre.findUnique({
        where: { id: session.membreId },
        select: { nom: true, nomConfirmeLe: true },
    })
    if (!membre) return null
    return { nom: membre.nom, confirme: membre.nomConfirmeLe != null }
}
