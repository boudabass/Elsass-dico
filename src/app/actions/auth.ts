"use server"

import { authentifierAupresDOdoo } from "@/lib/odoo"
import { prisma } from "@/lib/prisma"
import { fermerSession, ouvrirSession } from "@/lib/session-serveur"

type ResultatConnexion =
    | { succes: true }
    | { succes: false; erreur: string }

// Message volontairement identique quel que soit le motif : un message précis
// transformerait le formulaire en oracle d'existence de comptes Odoo.
const ERREUR_GENERIQUE = "Identifiants incorrects"

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
        return { succes: false, erreur: "E-mail et mot de passe requis" }
    }

    const utilisateurOdoo = await authentifierAupresDOdoo(email, motDePasse)
    if (!utilisateurOdoo) {
        return { succes: false, erreur: ERREUR_GENERIQUE }
    }

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
        return { succes: false, erreur: "Compte indisponible, contactez un administrateur" }
    }

    const session = await ouvrirSession(membre.id)
    if (!session) {
        return { succes: false, erreur: "Connexion impossible, réessayez" }
    }

    return { succes: true }
}

// Ne redirige pas : l'appelant enchaîne sur une navigation complète, seule
// façon de repartir d'un AuthProvider vierge.
export async function deconnexionAction() {
    await fermerSession()
}
