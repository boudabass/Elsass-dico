"use server"

import { depasse, effacer, ipClient, noter } from "@/lib/limite-tentatives-serveur"
import { authentifierAupresDOdoo } from "@/lib/odoo"
import { prisma } from "@/lib/prisma"
import { fermerSession, ouvrirSession } from "@/lib/session-serveur"

type ResultatConnexion =
    | { succes: true }
    | { succes: false; erreur: string }

// Message volontairement identique quel que soit le motif : un message précis
// transformerait le formulaire en oracle d'existence de comptes Odoo.
const ERREUR_GENERIQUE = "Adresse email ou mot de passe incorrect"

// Limite de tentatives (audit du 02/10/2026) : 5 échecs par email, 20 par IP,
// sur 15 minutes. Seuls les échecs d'identifiants comptent ; une panne d'Odoo
// ou de la base ne bloque personne.
const QUINZE_MINUTES = 15 * 60 * 1000

/** Connexion. Odoo reste l'autorité sur les mots de passe — il répond à une
 *  seule question, « ce couple est-il valide ? » — et le dico ouvre sa propre
 *  session.
 *
 *  Ce qui a disparu le 12/09/2026 : le montage `createUser` + `generateLink` +
 *  `verifyOtp` de Supabase, qui fabriquait un compte miroir et un lien magique
 *  pour obtenir une session. Un membre, un cookie signé, rien de plus. */
export async function connexionAction(formData: FormData): Promise<ResultatConnexion> {
    const email = String(formData.get("email") ?? "").trim().toLowerCase()
    const motDePasse = String(formData.get("password") ?? "")

    if (!email || !motDePasse) {
        return { succes: false, erreur: "Indique ton adresse email et ton mot de passe" }
    }

    // La limite se vérifie AVANT tout appel à Odoo.
    const cleEmail = `connexion:email:${email}`
    // Sans IP connue (en-tête absent), la limite par IP serait partagée par tous les
    // membres : elle ne s'applique pas, la limite par email reste active.
    const ip = await ipClient()
    const cleIp = ip === "inconnue" ? null : `connexion:ip:${ip}`
    if (depasse(cleEmail, 5, QUINZE_MINUTES) || (cleIp !== null && depasse(cleIp, 20, QUINZE_MINUTES))) {
        return { succes: false, erreur: "Trop d'essais. Réessaie dans 15 minutes." }
    }

    let utilisateurOdoo
    try {
        utilisateurOdoo = await authentifierAupresDOdoo(email, motDePasse)
    } catch (erreur) {
        // Panne, pas un mauvais mot de passe : la tentative ne compte pas.
        console.error("[Auth] Odoo injoignable:", erreur)
        return { succes: false, erreur: "Connexion impossible, réessaie dans un instant" }
    }
    if (!utilisateurOdoo) {
        noter(cleEmail)
        if (cleIp !== null) noter(cleIp)
        return { succes: false, erreur: ERREUR_GENERIQUE }
    }
    effacer(cleEmail)

    // Le membre est créé au premier login et retrouvé ensuite. Le rôle n'est
    // JAMAIS dérivé d'Odoo : Odoo authentifie, le dico autorise. `role` est
    // donc absent de l'`update` — une promotion faite dans /admin ne doit pas
    // être annulée à la prochaine connexion.
    let membre
    try {
        membre = await prisma.membre.upsert({
            where: { email },
            create: { email, odooUid: utilisateurOdoo.uid, nom: utilisateurOdoo.name },
            update: { odooUid: utilisateurOdoo.uid, nom: utilisateurOdoo.name },
            select: { id: true },
        })
    } catch (erreur) {
        console.error("[Auth] Membre non enregistré:", erreur)
        return { succes: false, erreur: "Connexion impossible, réessaie dans un instant" }
    }

    const session = await ouvrirSession(membre.id)
    if (!session) {
        return { succes: false, erreur: "Connexion impossible, réessaie dans un instant" }
    }

    return { succes: true }
}

// Ne redirige pas : l'appelant enchaîne sur une navigation complète, seule
// façon de repartir d'un AuthProvider vierge.
export async function deconnexionAction() {
    await fermerSession()
}
