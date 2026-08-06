'use server'

import { createAdminClient } from "@/utils/supabase/admin"
import { requireAdmin } from "@/utils/supabase/require-admin"
import { estRoleValide } from "@/lib/roles"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

// Union discriminée explicite : sans elle, l'inférence rend `lien` optionnel
// côté appelant et le typage du composant admin ne tient plus.
type ResultatLien =
    | { success: true; message: string; lien: string }
    | { success: false; error: string }

// Construit le lien que l'admin transmettra manuellement. On passe par notre
// propre route /auth/confirm (et non par le lien Supabase brut) car elle
// vérifie le jeton côté serveur et pose les cookies de session : c'est le
// seul schéma fiable en rendu serveur. Le jour où le SMTP sera configuré,
// les gabarits d'e-mail Supabase pointeront vers cette même route.
async function construireLienConfirmation(tokenHash: string, type: 'invite' | 'recovery') {
    const entetes = await headers()
    const protocole = entetes.get('x-forwarded-proto') ?? 'https'
    const hote = entetes.get('x-forwarded-host') ?? entetes.get('host')
    return `${protocole}://${hote}/auth/confirm?token_hash=${tokenHash}&type=${type}&next=/set-password`
}

export async function getUsersAction() {
    const guard = await requireAdmin()
    if (!guard.authorized) return { success: false, error: guard.error }

    const supabase = createAdminClient()

    // On récupère auth et profile
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
        console.error(`[Admin Action] listUsers Error: ${authError.message}`);
        return { success: false, error: authError.message }
    }

    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, role')

    if (profError) return { success: false, error: profError.message }

    // Merge
    const mergedUsers = users.map(u => ({
        ...u,
        profile_role: profiles.find(p => p.id === u.id)?.role || 'user'
    }))

    return { success: true, users: mergedUsers }
}

export async function inviteUserAction(formData: FormData): Promise<ResultatLien> {
    const guard = await requireAdmin()
    if (!guard.authorized) return { success: false, error: guard.error }

    const email = formData.get('email') as string
    const role = formData.get('role') as string || 'user'

    console.log(`[Admin Action] Inviting user: ${email} with role: ${role}`);

    if (!email) {
        return { success: false, error: "Email requis" }
    }

    if (!estRoleValide(role)) {
        return { success: false, error: `Rôle inconnu : ${role}` }
    }

    const supabase = createAdminClient()

    // Crée le compte sans mot de passe et produit un jeton d'invitation :
    // c'est l'utilisateur qui choisira son mot de passe via le lien.
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
    })

    if (error) return { success: false, error: error.message }

    // Le trigger on_auth_user_created a déjà inséré le profil avec le rôle
    // 'user' par défaut : on ne fait que l'ajuster si besoin.
    const { error: profError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', data.user.id)

    if (profError) {
        return { success: false, error: `Erreur mise à jour rôle profil: ${profError.message}` }
    }

    revalidatePath('/admin')
    return {
        success: true,
        message: "Invitation créée",
        lien: await construireLienConfirmation(data.properties.hashed_token, 'invite'),
    }
}

export async function generateRecoveryLinkAction(email: string): Promise<ResultatLien> {
    const guard = await requireAdmin()
    if (!guard.authorized) return { success: false, error: guard.error }

    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
    })

    if (error) return { success: false, error: error.message }

    return {
        success: true,
        message: "Lien de réinitialisation créé",
        lien: await construireLienConfirmation(data.properties.hashed_token, 'recovery'),
    }
}

export async function deleteUserAction(userId: string) {
    const guard = await requireAdmin()
    if (!guard.authorized) return { success: false, error: guard.error }

    const supabase = createAdminClient()

    // Suppression profil (si pas de cascade)
    await supabase.from('profiles').delete().eq('id', userId)

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    return { success: true, message: "Utilisateur supprimé" }
}

export async function updateUserRoleAction(userId: string, role: string) {
    const guard = await requireAdmin()
    if (!guard.authorized) return { success: false, error: guard.error }

    // La contrainte en base rejetterait déjà une valeur inconnue, mais un refus
    // explicite ici donne un message clair plutôt qu'une erreur Postgres brute.
    if (!estRoleValide(role)) {
        return { success: false, error: `Rôle inconnu : ${role}` }
    }

    const supabase = createAdminClient()

    // Sync metadata for backup
    await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role }
    })

    // Update primary role source
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    return { success: true, message: "Rôle mis à jour dans la table profil" }
}
