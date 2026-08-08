'use server'

import { createClient } from "@/utils/supabase/server"
import type { Entree, Traduction, TypeTerme } from "@/lib/dictionnaire"

// Recherche publique : accessible sans compte. Le client SSR est utilisé sans
// garde de rôle à dessein — c'est le RLS (lecture_publique_entrees_validees)
// qui borne ce qui sort, et rechercher_entrees() restreint en plus à
// statut='valide' pour qu'un contributeur connecté ne voie pas de brouillon ici.

export interface ResultatRecherche extends Entree {
    score: number
}

export async function rechercherAction(terme: string): Promise<ResultatRecherche[]> {
    const requete = terme.trim()
    if (requete.length < 2) return []

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('rechercher_entrees', {
        p_terme: requete,
        p_limite: 30,
    })

    if (error) {
        console.error(`[Recherche] Échec: ${error.message}`)
        return []
    }
    return (data ?? []) as ResultatRecherche[]
}

export interface EntreeDetaillee {
    id: string
    francais: string
    contexte: string
    type: TypeTerme
    traductions: Traduction[]
    nb_attestations: number
    sources: { nom: string; url: string | null }[]
}

export async function chargerEntree(id: string): Promise<EntreeDetaillee | null> {
    const supabase = await createClient()

    const { data: entree, error } = await supabase
        .from('entrees')
        .select('id, francais, contexte, type, traductions, nb_attestations')
        .eq('id', id)
        .eq('statut', 'valide')
        .maybeSingle()

    if (error || !entree) return null

    // sources_entree() existe depuis la migration du schéma : elle expose le
    // nom et l'URL des sources d'une entrée validée sans ouvrir le RLS des
    // tables sources et attestations.
    const { data: sources } = await supabase.rpc('sources_entree', { p_entree_id: id })

    return {
        ...(entree as Omit<EntreeDetaillee, 'sources'>),
        sources: (sources ?? []) as { nom: string; url: string | null }[],
    }
}
