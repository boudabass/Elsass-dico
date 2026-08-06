'use server'

import { createClient } from "@/utils/supabase/server"
import { estRegionValide, estTypeTermeValide } from "@/lib/dictionnaire"
import { revalidatePath } from "next/cache"

// Toutes ces actions passent par le client SSR, donc par le RLS : c'est la
// base qui arbitre la propriété d'une contribution, pas ce fichier. Le
// service_role n'a rien à faire ici.

export interface MaContribution {
    id: string
    francais: string
    alsacien: string
    contexte: string
    type: string
    region: string | null
    created_at: string
    score: number
    retenue: boolean
}

export interface ContributionAValider {
    id: string
    francais: string
    alsacien: string
    contexte: string
    type: string
    region: string | null
    auteur: string
    score: number
    deja_vote: boolean
}

type Resultat =
    | { success: true; message: string }
    | { success: false; error: string }

export async function listerMesContributions(): Promise<MaContribution[]> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('mes_contributions')

    if (error) {
        console.error(`[Contributions] Lecture échouée: ${error.message}`)
        return []
    }
    return (data ?? []) as MaContribution[]
}

export async function listerContributionsAValider(): Promise<ContributionAValider[]> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('contributions_a_valider')

    if (error) {
        console.error(`[Contributions] Lecture de la file échouée: ${error.message}`)
        return []
    }
    return (data ?? []) as ContributionAValider[]
}

interface ChampsContribution {
    francais: string
    alsacien: string
    contexte: string
    type: string
    region: string | null
}

// Discriminant explicite : un simple `'erreur' in lecture` ne narrowe pas, le
// message ressortait en string | undefined chez l'appelant.
type LectureChamps =
    | { ok: false; erreur: string }
    | { ok: true; champs: ChampsContribution }

function lireChamps(formData: FormData): LectureChamps {
    const francais = (formData.get('francais') as string ?? '').trim()
    const alsacien = (formData.get('alsacien') as string ?? '').trim()
    const contexte = (formData.get('contexte') as string ?? '').trim()
    const type = formData.get('type') as string ?? 'mot'
    const region = (formData.get('region') as string ?? '').trim()

    if (!francais || !alsacien) {
        return { ok: false, erreur: "Le français et l'alsacien sont requis" }
    }
    if (!estTypeTermeValide(type)) {
        return { ok: false, erreur: `Type inconnu : ${type}` }
    }
    if (region && !estRegionValide(region)) {
        return { ok: false, erreur: `Région inconnue : ${region}` }
    }

    return {
        ok: true,
        champs: {
            francais,
            alsacien,
            contexte,
            type,
            region: region === '' ? null : region,
        },
    }
}

export async function ajouterContributionAction(formData: FormData): Promise<Resultat> {
    const lecture = lireChamps(formData)
    if (!lecture.ok) return { success: false, error: lecture.erreur }

    const supabase = await createClient()

    // Crée la source du contributeur au premier ajout, la renvoie ensuite.
    const { data: sourceId, error: erreurSource } = await supabase.rpc('source_du_contributeur')
    if (erreurSource || !sourceId) {
        return { success: false, error: erreurSource?.message ?? "Contribution réservée aux contributeurs" }
    }

    const { error } = await supabase.from('attestations').insert({
        source_id: sourceId,
        ...lecture.champs,
        // Pour une contribution, la graphie d'origine est ce que le
        // contributeur a écrit : la normalisation Orthal viendra à l'arbitrage.
        graphie_origine: lecture.champs.alsacien,
    })

    if (error) {
        // La contrainte UNIQUE (source_id, francais, alsacien, contexte) empêche
        // un contributeur d'attester deux fois la même chose.
        if (error.code === '23505') {
            return { success: false, error: "Vous avez déjà proposé cette traduction" }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/contributions')
    return { success: true, message: "Contribution ajoutée" }
}

export async function modifierContributionAction(id: string, formData: FormData): Promise<Resultat> {
    const lecture = lireChamps(formData)
    if (!lecture.ok) return { success: false, error: lecture.erreur }

    const supabase = await createClient()
    const { error, count } = await supabase
        .from('attestations')
        .update({ ...lecture.champs, graphie_origine: lecture.champs.alsacien }, { count: 'exact' })
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    if (!count) {
        // Le RLS a filtré la ligne : soit elle n'est pas à vous, soit elle a
        // déjà été retenue dans une entrée et s'est donc figée.
        return { success: false, error: "Contribution non modifiable (déjà retenue dans une entrée ?)" }
    }

    revalidatePath('/contributions')
    return { success: true, message: "Contribution modifiée" }
}

export async function supprimerContributionAction(id: string): Promise<Resultat> {
    const supabase = await createClient()
    const { error, count } = await supabase
        .from('attestations')
        .delete({ count: 'exact' })
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    if (!count) {
        return { success: false, error: "Contribution non supprimable (déjà retenue dans une entrée ?)" }
    }

    revalidatePath('/contributions')
    return { success: true, message: "Contribution supprimée" }
}

export async function voterAction(attestationId: string): Promise<Resultat> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Non authentifié" }

    const { error } = await supabase
        .from('attestation_votes')
        .insert({ attestation_id: attestationId, profil_id: user.id })

    if (error) {
        if (error.code === '23505') return { success: false, error: "Vous avez déjà validé cette proposition" }
        return { success: false, error: error.message }
    }

    revalidatePath('/contributions')
    return { success: true, message: "Validation enregistrée" }
}

export async function retirerVoteAction(attestationId: string): Promise<Resultat> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Non authentifié" }

    const { error } = await supabase
        .from('attestation_votes')
        .delete()
        .eq('attestation_id', attestationId)
        .eq('profil_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/contributions')
    return { success: true, message: "Validation retirée" }
}
