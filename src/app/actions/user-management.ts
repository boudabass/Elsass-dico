'use server'

import { createAdminClient } from "@/utils/supabase/admin"
import { revalidatePath } from "next/cache"

export async function getUsersAction() {
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

export async function createUserAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string || 'user'

    console.log(`[Admin Action] Creating user: ${email} with role: ${role}`);

    if (!email || !password) {
        return { success: false, error: "Email et mot de passe requis" }
    }

    const supabase = createAdminClient()

    // 1. Create in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role }
    })

    if (authError) return { success: false, error: authError.message }

    // 2. Update Role in Profiles (Created by trigger on_auth_user_created)
    const { error: profError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', authData.user.id)

    if (profError) {
        return { success: false, error: `Erreur mise à jour rôle profil: ${profError.message}` }
    }

    revalidatePath('/admin')
    return { success: true, message: "Utilisateur créé avec succès" }
}

export async function deleteUserAction(userId: string) {
    const supabase = createAdminClient()

    // Suppression profil (si pas de cascade)
    await supabase.from('profiles').delete().eq('id', userId)

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    return { success: true, message: "Utilisateur supprimé" }
}

export async function updateUserRoleAction(userId: string, role: string) {
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
