'use server'

import { revalidatePath } from "next/cache"

import type { MembreListe } from "@/lib/membres"
import { prisma } from "@/lib/prisma"
import { adminExige, sessionActuelle } from "@/lib/session-serveur"

// Gestion des membres. Remplace `user-management.ts` du 12/09/2026, qui
// pilotait l'annuaire `auth.users` de Supabase.
//
// Trois choses ont disparu avec Supabase, et aucune n'est à réintroduire :
//   * l'INVITATION et le LIEN DE RÉINITIALISATION. Odoo est l'autorité sur les
//     comptes et les mots de passe ; un compte se crée sur le portail public
//     (`URL_INSCRIPTION_ODOO`), et le membre apparaît ici à sa première
//     connexion. Il n'y a pas de SMTP côté dico (décision du 07/08/2026) et il
//     n'y a plus de second annuaire de mots de passe à réinitialiser.
//   * la SUPPRESSION d'un compte. `Temoignage.membre` est en cascade : effacer
//     un membre effacerait les villages qu'il a attachés à des formes, donc de
//     l'information que personne d'autre ne porte. La doctrine de la refonte est
//     « on masque, on ne supprime pas » (`Variante.masquee`).
//   * le troisième rôle. Deux rôles désormais : membre et admin. Tout membre
//     contribue — c'était la raison d'être du rôle `contributeur`.

type Resultat =
    | { succes: true; message: string }
    | { succes: false; erreur: string }

const REFUS = "Réservé aux administrateurs"

export async function listerMembresAction(): Promise<
    { succes: true; membres: MembreListe[] } | { succes: false; erreur: string }
> {
    if (!(await adminExige())) return { succes: false, erreur: REFUS }

    const membres = await prisma.membre.findMany({
        select: {
            id: true,
            email: true,
            nom: true,
            role: true,
            creeLe: true,
            vuLe: true,
            commune: { select: { nom: true } },
            _count: { select: { temoignages: true } },
        },
        orderBy: [{ creeLe: 'asc' }],
    })

    return {
        succes: true,
        membres: membres.map((m) => ({
            id: m.id,
            email: m.email,
            nom: m.nom,
            role: m.role,
            village: m.commune?.nom ?? null,
            // Sérialisé ici : une `Date` traverse la frontière serveur/client,
            // mais chaque écran la reformaterait à sa façon.
            creeLe: m.creeLe.toISOString(),
            vuLe: m.vuLe?.toISOString() ?? null,
            nbTemoignages: m._count.temoignages,
        })),
    }
}

export interface MonEspace {
    email: string
    nom: string | null
    village: string | null
    /** Nombre de formes auxquelles ce membre a attaché son village. */
    nbTemoignages: number
    /** Nombre de formes qu'il a lui-même apportées. */
    nbVariantes: number
}

/** Les chiffres de « Mon espace ». Lus pour le membre de la session, jamais pour
 *  un identifiant reçu du navigateur : un paramètre ici ferait de cette action un
 *  moyen de lire l'activité de n'importe qui. */
export async function monEspaceAction(): Promise<MonEspace | null> {
    const session = await sessionActuelle()
    if (!session) return null

    const membre = await prisma.membre.findUnique({
        where: { id: session.membreId },
        select: {
            email: true,
            nom: true,
            commune: { select: { nom: true } },
            _count: { select: { temoignages: true, variantes: true } },
        },
    })
    if (!membre) return null

    return {
        email: membre.email,
        nom: membre.nom,
        village: membre.commune?.nom ?? null,
        nbTemoignages: membre._count.temoignages,
        nbVariantes: membre._count.variantes,
    }
}

export async function changerRoleAction(membreId: string, role: string): Promise<Resultat> {
    const admin = await adminExige()
    if (!admin) return { succes: false, erreur: REFUS }

    if (role !== 'membre' && role !== 'admin') {
        return { succes: false, erreur: `Rôle inconnu : ${role}` }
    }

    // Un admin ne se retire pas son propre rôle : il se verrouillerait dehors,
    // et remonter demanderait un accès direct à la base.
    if (membreId === admin.membreId && role !== 'admin') {
        return { succes: false, erreur: "Tu ne peux pas retirer ton propre rôle d'administrateur" }
    }

    try {
        await prisma.membre.update({ where: { id: membreId }, data: { role } })
    } catch (erreur) {
        console.error("[Membres] Rôle non modifié:", erreur)
        return { succes: false, erreur: "Modification impossible" }
    }

    // Le jeton du membre concerné porte encore l'ancien rôle. Il ne le portera
    // plus au prochain renouvellement (30 min au plus), parce que
    // `/api/session/refresh` relit le rôle en base — c'est précisément pourquoi
    // le jeton de renouvellement ne le transporte pas.
    revalidatePath('/admin')
    return { succes: true, message: "Rôle mis à jour" }
}
