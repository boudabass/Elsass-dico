// Limite de tentatives sur la connexion et les signalements (audit du 02/10/2026,
// rien ne bornait les essais de mot de passe ni les envois).
//
// En mémoire du processus : pas de dépendance, pas de service extérieur à
// l'exécution (CLAUDE.md). Une seule instance par environnement suffit ici. Le
// compteur repart à zéro à chaque déploiement : c'est accepté, un redéploiement
// ne sert pas d'échappatoire longue à qui essaie des mots de passe.
//
// Fenêtre glissante : on garde les horodatages récents de chaque clé, et on
// purge à chaque appel ce qui dépasse la période la plus longue (1 h). La taille
// est bornée : au-delà de MAX_CLES, on purge l'expiré, puis les clés les plus
// anciennes, pour que la mémoire ne grossisse pas avec des clés inventées.
//
// Ce fichier n'est PAS un fichier `'use server'` : il n'exporte que des
// utilitaires, les actions qui l'appellent restent seules à être exposées.

import { headers } from "next/headers"

const PERIODE_MAX_MS = 60 * 60 * 1000
const MAX_CLES = 10_000

const tentatives = new Map<string, number[]>()

function purgerExpirees(maintenant: number): void {
  const debut = maintenant - PERIODE_MAX_MS
  // forEach et non for...of : le tsconfig cible ES5. Supprimer pendant le parcours est permis.
  tentatives.forEach((horodatages, cle) => {
    const recentes = horodatages.filter((t) => t > debut)
    if (recentes.length === 0) tentatives.delete(cle)
    else tentatives.set(cle, recentes)
  })
}

/** Vrai si la clé a déjà atteint `max` tentatives dans les `fenetreMs` dernières
 *  millisecondes. `fenetreMs` ne doit pas dépasser une heure. */
export function depasse(cle: string, max: number, fenetreMs: number): boolean {
  const maintenant = Date.now()
  purgerExpirees(maintenant)
  const debut = maintenant - fenetreMs
  const recentes = (tentatives.get(cle) ?? []).filter((t) => t > debut)
  return recentes.length >= max
}

/** Compte une tentative pour la clé. */
export function noter(cle: string): void {
  const maintenant = Date.now()
  purgerExpirees(maintenant)
  const horodatages = tentatives.get(cle) ?? []
  horodatages.push(maintenant)
  tentatives.set(cle, horodatages)

  // Les clés sont insérées dans l'ordre : on retire d'abord les plus anciennes.
  while (tentatives.size > MAX_CLES) {
    const plusAncienne = tentatives.keys().next().value
    if (plusAncienne === undefined) break
    tentatives.delete(plusAncienne)
  }
}

/** Efface les tentatives de la clé (succès de connexion). */
export function effacer(cle: string): void {
  tentatives.delete(cle)
}

/** Nombre de clés suivies. Pour les tests seulement. */
export function taille(): number {
  return tentatives.size
}

/** L'adresse du client, pour les clés de limite. Derrière le proxy de Coolify :
 *  `x-real-ip` d'abord ; à défaut, la valeur la plus à droite de
 *  `x-forwarded-for`, celle que le proxy ajoute lui-même (les premières sont
 *  fournies par le client et falsifiables). Sinon « inconnue ». */
export async function ipClient(): Promise<string> {
  return ipDepuis(await headers())
}

/** Même logique que `ipClient`, sur des en-têtes donnés (pour les tests). */
export function ipDepuis(entetes: { get(nom: string): string | null }): string {
  const reelle = entetes.get("x-real-ip")?.trim()
  if (reelle) return reelle
  const chaine = entetes.get("x-forwarded-for")
  const dernier = chaine?.split(",").pop()?.trim()
  if (dernier) return dernier
  return "inconnue"
}
