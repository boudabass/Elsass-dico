'use server'

import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/supabase/require-admin"
import { revalidatePath } from "next/cache"
import {
    estStatutValide,
    estTypeTermeValide,
    type Entree,
    type StatutEntree,
    type Traduction,
    type TypeTerme,
    type VarianteAttestee,
} from "@/lib/dictionnaire"

// Ces actions passent par le client SSR, donc par le RLS, et les RPC appelées
// portent chacune leur garde is_admin(). requireAdmin() n'est qu'une porte
// d'entrée : il évite un aller-retour inutile vers la base et permet un
// message clair, il ne remplace pas la garde SQL.

export interface Candidat {
    cle: string
    francais: string
    contexte: string
    type: TypeTerme
    nb_sources: number
    nb_attestations: number
    variantes: VarianteAttestee[]
    // Renseigné quand une entrée porte déjà cette clé : les attestations du
    // candidat viennent alors l'enrichir, elles n'en fondent pas une nouvelle.
    entree_id: string | null
}

export interface DetailCandidat extends Candidat {
    entree: {
        traductions: Traduction[]
        statut: StatutEntree
        notes_arbitrage: string | null
    } | null
}

export interface EntreeListee extends Entree {
    cle: string
    statut: StatutEntree
    updated_at: string
}

type Resultat =
    | { success: true; message: string; entreeId: string }
    | { success: false; error: string }

export async function listerCandidats(terme?: string): Promise<Candidat[]> {
    const garde = await requireAdmin()
    if (!garde.authorized) return []

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('candidats_arbitrage', {
        p_terme: terme?.trim() || null,
        p_limite: 50,
        p_offset: 0,
    })

    if (error) {
        console.error(`[Arbitrage] File des candidats indisponible: ${error.message}`)
        return []
    }
    return (data ?? []) as Candidat[]
}

export async function chargerCandidat(cle: string, contexte: string): Promise<DetailCandidat | null> {
    const garde = await requireAdmin()
    if (!garde.authorized) return null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('detail_candidat', {
        p_cle: cle,
        p_contexte: contexte,
    })

    if (error) {
        console.error(`[Arbitrage] Détail du candidat indisponible: ${error.message}`)
        return null
    }
    const lignes = (data ?? []) as DetailCandidat[]
    return lignes[0] ?? null
}

export async function listerEntrees(statut?: string, terme?: string): Promise<EntreeListee[]> {
    const garde = await requireAdmin()
    if (!garde.authorized) return []

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('entrees_par_statut', {
        p_statut: statut && estStatutValide(statut) ? statut : null,
        p_terme: terme?.trim() || null,
        p_limite: 50,
        p_offset: 0,
    })

    if (error) {
        console.error(`[Arbitrage] Liste des entrées indisponible: ${error.message}`)
        return []
    }
    return (data ?? []) as EntreeListee[]
}

export interface SaisieArbitrage {
    entreeId: string | null
    francais: string
    contexte: string
    type: string
    traductions: Traduction[]
    attestationIds: string[]
    statut: string
    notes: string
}

export async function arbitrerAction(saisie: SaisieArbitrage): Promise<Resultat> {
    const garde = await requireAdmin()
    if (!garde.authorized) return { success: false, error: garde.error }

    const francais = saisie.francais.trim()
    if (!francais) return { success: false, error: "Le français est requis" }
    if (!estTypeTermeValide(saisie.type)) return { success: false, error: `Type inconnu : ${saisie.type}` }
    if (!estStatutValide(saisie.statut)) return { success: false, error: `Statut inconnu : ${saisie.statut}` }

    const traductions = saisie.traductions
        .map((t) => ({
            alsacien: t.alsacien.trim(),
            region: t.region,
            niveau: t.niveau?.trim() || null,
            note: t.note?.trim() || null,
        }))
        .filter((t) => t.alsacien !== '')

    if (saisie.statut === 'valide' && traductions.length === 0) {
        return { success: false, error: "Une entrée validée doit porter au moins une traduction" }
    }
    if (saisie.attestationIds.length === 0) {
        return { success: false, error: "Sélectionnez au moins une attestation : une entrée sans source ne se justifie pas" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('arbitrer_entree', {
        p_francais: francais,
        p_contexte: saisie.contexte.trim(),
        p_type: saisie.type,
        p_traductions: traductions,
        p_attestation_ids: saisie.attestationIds,
        p_statut: saisie.statut,
        p_notes: saisie.notes.trim() || null,
        p_entree_id: saisie.entreeId,
    })

    if (error) {
        // 23505 = l'unique index sur (francais, contexte) normalisés : un
        // homonyme doit être séparé par le champ contexte, pas écrasé.
        if (error.code === '23505') {
            return {
                success: false,
                error: "Une entrée existe déjà pour ce français et ce contexte. Distinguez l'homonyme par le contexte.",
            }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/arbitrage')
    revalidatePath('/')
    return { success: true, message: "Arbitrage enregistré", entreeId: data as string }
}
