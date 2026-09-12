// Vocabulaire des membres. Séparé des actions parce qu'un fichier `'use server'`
// n'a le droit d'exporter que des fonctions asynchrones : une constante y
// déclencherait une erreur de build, pas un avertissement.
//
// Deux rôles depuis la refonte du 11/09/2026, contre trois avant : `user`,
// `contributeur` et `admin` sont devenus `membre` et `admin`. Le rôle
// intermédiaire n'avait de sens que tant que contribuer demandait une
// habilitation — tout membre contribue désormais.

import type { Role } from "@/lib/session"

export const ROLES: readonly Role[] = ['membre', 'admin']

export const LIBELLES_ROLE: Record<Role, string> = {
    membre: 'Membre',
    admin: 'Administrateur',
}

export interface MembreListe {
    id: string
    email: string
    nom: string | null
    role: Role
    village: string | null
    /** ISO : une `Date` traverse la frontière serveur/client, mais chaque écran
     *  la reformaterait à sa façon. */
    creeLe: string
    vuLe: string | null
    nbTemoignages: number
}
