'use server'

import { authentifierAupresDOdoo } from "@/lib/odoo"
import { createAdminClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

type ResultatConnexion =
    | { success: true }
    | { success: false; error: string }

const ERREUR_GENERIQUE = "Identifiants incorrects"

export async function signInWithOdooAction(formData: FormData): Promise<ResultatConnexion> {
    const email = (formData.get('email') as string ?? '').trim()
    const password = formData.get('password') as string ?? ''

    if (!email || !password) {
        return { success: false, error: "Email et mot de passe requis" }
    }

    // 1. Odoo est la seule autorité sur le mot de passe.
    const utilisateurOdoo = await authentifierAupresDOdoo(email, password)
    if (!utilisateurOdoo) {
        // Message volontairement identique quel que soit le motif, pour ne pas
        // transformer le formulaire en oracle d'existence de comptes Odoo.
        return { success: false, error: ERREUR_GENERIQUE }
    }

    const admin = createAdminClient()

    // 2. Miroir du compte côté Supabase, créé au premier login. Le trigger
    //    on_auth_user_created posera le profil avec le rôle 'user'.
    const { error: erreurCreation } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
    })

    // Un compte déjà présent est le cas nominal après le premier login.
    if (erreurCreation && !estErreurCompteExistant(erreurCreation.message)) {
        console.error(`[Odoo Auth] Création du miroir Supabase échouée: ${erreurCreation.message}`)
        return { success: false, error: "Compte indisponible, contactez un administrateur" }
    }

    // 3. Ouvrir une vraie session Supabase (avec ses refresh tokens) plutôt
    //    qu'un jeton fabriqué à la main : toute la RLS continue de fonctionner.
    const { data: lien, error: erreurLien } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
    })

    if (erreurLien || !lien) {
        console.error(`[Odoo Auth] Génération du jeton échouée: ${erreurLien?.message}`)
        return { success: false, error: "Connexion impossible, réessayez" }
    }

    const supabase = await createClient()
    const { data: session, error: erreurVerification } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: lien.properties.hashed_token,
    })

    if (erreurVerification || !session.user) {
        console.error(`[Odoo Auth] Ouverture de session échouée: ${erreurVerification?.message}`)
        return { success: false, error: "Connexion impossible, réessayez" }
    }

    // 4. Mémoriser le lien entre les deux annuaires. L'e-mail sert de clé au
    //    premier login, mais il peut changer côté Odoo.
    const { error: erreurProfil } = await admin
        .from('profiles')
        .update({ odoo_uid: utilisateurOdoo.uid })
        .eq('id', session.user.id)

    if (erreurProfil) {
        // Non bloquant : la session est valide, seul le lien Odoo manque.
        console.warn(`[Odoo Auth] odoo_uid non enregistré: ${erreurProfil.message}`)
    }

    return { success: true }
}

function estErreurCompteExistant(message: string) {
    const normalise = message.toLowerCase()
    return normalise.includes('already') || normalise.includes('exists')
}
