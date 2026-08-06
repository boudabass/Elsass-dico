// Doit rester aligné sur la contrainte profiles_role_check en base
// (cf. supabase/migrations/20260806220000_auth_odoo.sql).
//
// Le rôle n'est jamais dérivé d'Odoo : Odoo authentifie, le dico autorise.
export const ROLES_AUTORISES = ['user', 'contributeur', 'admin'] as const

export type RoleAutorise = typeof ROLES_AUTORISES[number]

export function estRoleValide(role: string): role is RoleAutorise {
    return (ROLES_AUTORISES as readonly string[]).includes(role)
}

// Un contributeur propose et corrige, mais ne valide pas : le passage à
// statut='valide' reste réservé aux admins (règle 4 de CLAUDE.md).
export const LIBELLES_ROLE: Record<RoleAutorise, string> = {
    user: 'Utilisateur',
    contributeur: 'Contributeur',
    admin: 'Administrateur',
}
