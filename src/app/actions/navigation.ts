'use server'

import { createClient } from "@/utils/supabase/server"
import type { Entree } from "@/lib/dictionnaire"

// Parcours alphabétique public (écran "Dictionnaire A-Z" du handoff mobile).
// Mêmes garanties que rechercherAction() : lettres_disponibles() et
// entrees_par_lettre() ne sont pas SECURITY DEFINER, le RLS
// lecture_publique_entrees_validees est la barrière.

export async function lettresDisponiblesAction(): Promise<string[]> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('lettres_disponibles')

    if (error) {
        console.error(`[Navigation] Échec lettres_disponibles: ${error.message}`)
        return []
    }
    return (data ?? []).map((ligne: { lettre: string }) => ligne.lettre)
}

export async function entreesParLettreAction(lettre: string): Promise<Entree[]> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('entrees_par_lettre', { p_lettre: lettre })

    if (error) {
        console.error(`[Navigation] Échec entrees_par_lettre: ${error.message}`)
        return []
    }
    return (data ?? []) as Entree[]
}
