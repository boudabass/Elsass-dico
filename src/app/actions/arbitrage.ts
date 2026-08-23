'use server'

import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/supabase/require-admin"
import { revalidatePath } from "next/cache"
import {
    estStatutValide,
    estTypeTermeValide,
    traductionsRecoupees,
    SOURCES_MINIMUM,
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

// --- Lot recoupé -------------------------------------------------------------

// Plafond de candidats parcourus pour constituer le lot. candidats_arbitrage()
// trie par nb_sources DESC : tout ce qui a au moins deux sources arrive donc en
// tête, et la pagination s'arrête d'elle-même dès la première page retombée à
// une source. Inutile de balayer les 26 000 candidats à source unique.
const PAGE_CANDIDATS = 200
const MAX_PAGES_RECOUPEES = 10

export interface CandidatRecoupe extends Candidat {
    // La forme sur laquelle les sources s'accordent, telle qu'elle sera publiée.
    formeCanonique: string
    traductions: Traduction[]
}

// Les candidats que l'on peut publier sans arbitrage manuel : ceux dont au
// moins deux sources distinctes écrivent LA MÊME forme alsacienne. Critère
// strictement plus exigeant que la garde de arbitrer_entree() — voir le
// commentaire de traductionsRecoupees() dans @/lib/dictionnaire.
export async function listerCandidatsRecoupes(terme?: string): Promise<CandidatRecoupe[]> {
    const garde = await requireAdmin()
    if (!garde.authorized) return []

    const supabase = await createClient()
    const recoupes: CandidatRecoupe[] = []
    let page = 0

    for (; page < MAX_PAGES_RECOUPEES; page++) {
        const { data, error } = await supabase.rpc('candidats_arbitrage', {
            p_terme: terme?.trim() || null,
            p_limite: PAGE_CANDIDATS,
            p_offset: page * PAGE_CANDIDATS,
        })

        if (error) {
            console.error(`[Arbitrage] Lot recoupé indisponible: ${error.message}`)
            return []
        }

        const lot = (data ?? []) as Candidat[]
        for (const candidat of lot) {
            if (candidat.nb_sources < SOURCES_MINIMUM) continue
            const traductions = traductionsRecoupees(candidat.variantes)
            if (traductions.length === 0) continue
            recoupes.push({ ...candidat, formeCanonique: traductions[0].alsacien, traductions })
        }

        // Le tri décroissant garantit qu'après une page sans candidat à deux
        // sources, les suivantes n'en porteront pas non plus.
        const encoreRecoupable = lot.some((c) => c.nb_sources >= SOURCES_MINIMUM)
        if (lot.length < PAGE_CANDIDATS || !encoreRecoupable) break
    }

    // Sortie par épuisement du compteur et non par la coupure naturelle : le lot
    // est incomplet. Sans ce signal, un admin verrait moins de candidats qu'il
    // n'en existe sans que rien ne le lui dise.
    if (page === MAX_PAGES_RECOUPEES) {
        console.warn(
            `[Arbitrage] Lot recoupé tronqué : ${MAX_PAGES_RECOUPEES * PAGE_CANDIDATS} candidats parcourus ` +
            `sans atteindre les candidats à source unique. Relever MAX_PAGES_RECOUPEES.`,
        )
    }

    return recoupes
}

export interface BilanLot {
    reussies: number
    echecs: { francais: string; contexte: string; message: string }[]
}

// Valide en une passe les candidats recoupés désignés. Chaque entrée passe par
// arbitrer_entree(), donc par sa garde is_admin() et sa garde de la règle 2 :
// ce sont 166 arbitrages réels, pas une écriture de masse qui contournerait la
// chaîne. Aucune note d'arbitrage n'est jointe — elle ne sert qu'à publier sous
// le seuil de recoupement, et ce lot est au-dessus par construction.
export async function arbitrerLotAction(cles: { cle: string; contexte: string }[]): Promise<BilanLot> {
    const garde = await requireAdmin()
    if (!garde.authorized) {
        return { reussies: 0, echecs: [{ francais: '', contexte: '', message: garde.error }] }
    }

    // On ne fait jamais confiance aux clés reçues du navigateur : le lot est
    // recalculé côté serveur, et une clé absente de ce lot est refusée. Sans
    // cela, l'action deviendrait un moyen de publier n'importe quel candidat
    // sans passer par l'écran d'arbitrage.
    const eligibles = await listerCandidatsRecoupes()
    const parCle = new Map(eligibles.map((c) => [`${c.cle}|${c.contexte}`, c]))

    const supabase = await createClient()
    const bilan: BilanLot = { reussies: 0, echecs: [] }

    for (const demande of cles) {
        const candidat = parCle.get(`${demande.cle}|${demande.contexte}`)
        if (!candidat) {
            bilan.echecs.push({
                francais: demande.cle,
                contexte: demande.contexte,
                message: "Candidat absent du lot recoupé : à arbitrer un par un.",
            })
            continue
        }

        const { error } = await supabase.rpc('arbitrer_entree', {
            p_francais: candidat.francais.trim(),
            p_contexte: candidat.contexte.trim(),
            p_type: candidat.type,
            p_traductions: candidat.traductions,
            p_attestation_ids: candidat.variantes.map((v) => v.attestation_id),
            p_statut: 'valide',
            p_notes: null,
            p_entree_id: candidat.entree_id,
        })

        if (error) {
            bilan.echecs.push({
                francais: candidat.francais,
                contexte: candidat.contexte,
                message: error.code === '23505'
                    ? "Une entrée existe déjà pour ce français et ce contexte."
                    : error.message,
            })
            continue
        }
        bilan.reussies++
    }

    revalidatePath('/admin/arbitrage')
    revalidatePath('/')
    return bilan
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
