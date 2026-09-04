'use server'

import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/supabase/require-admin"
import { revalidatePath } from "next/cache"
import {
    analyserDivergence,
    estStatutValide,
    estTypeTermeValide,
    rangNature,
    traductionsArbitrees,
    traductionsRecoupees,
    SOURCES_MINIMUM,
    type Entree,
    type FormeCandidate,
    type NatureDivergence,
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

export async function listerCandidats(terme?: string, type?: TypeTerme): Promise<Candidat[]> {
    const garde = await requireAdmin()
    if (!garde.authorized) return []

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('candidats_arbitrage', {
        p_terme: terme?.trim() || null,
        p_limite: 50,
        p_offset: 0,
        p_type: type ?? null,
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
// Parcourt la file jusqu'aux candidats à source unique et retient ce que
// `retenir` accepte. Factorisé parce que la condition d'arrêt est subtile et
// qu'elle doit rester la même pour les recoupées et les divergentes : les deux
// vivent dans la tranche à deux sources ou plus, en tête du tri SQL.
async function parcourirCandidatsMultiSources<T>(
    terme: string | undefined,
    etiquette: string,
    retenir: (candidat: Candidat) => T | null,
    type?: TypeTerme,
): Promise<T[]> {
    const supabase = await createClient()
    const retenus: T[] = []
    let page = 0

    for (; page < MAX_PAGES_RECOUPEES; page++) {
        const { data, error } = await supabase.rpc('candidats_arbitrage', {
            p_terme: terme?.trim() || null,
            p_limite: PAGE_CANDIDATS,
            p_offset: page * PAGE_CANDIDATS,
            p_type: type ?? null,
        })

        if (error) {
            console.error(`[Arbitrage] ${etiquette} indisponible: ${error.message}`)
            return []
        }

        const lot = (data ?? []) as Candidat[]
        for (const candidat of lot) {
            if (candidat.nb_sources < SOURCES_MINIMUM) continue
            const valeur = retenir(candidat)
            if (valeur !== null) retenus.push(valeur)
        }

        // Le tri décroissant garantit qu'après une page sans candidat à deux
        // sources, les suivantes n'en porteront pas non plus.
        const encoreMultiSources = lot.some((c) => c.nb_sources >= SOURCES_MINIMUM)
        if (lot.length < PAGE_CANDIDATS || !encoreMultiSources) break
    }

    // Sortie par épuisement du compteur et non par la coupure naturelle : le lot
    // est incomplet. Sans ce signal, un admin verrait moins de candidats qu'il
    // n'en existe sans que rien ne le lui dise.
    if (page === MAX_PAGES_RECOUPEES) {
        console.warn(
            `[Arbitrage] ${etiquette} tronqué : ${MAX_PAGES_RECOUPEES * PAGE_CANDIDATS} candidats parcourus ` +
            `sans atteindre les candidats à source unique. Relever MAX_PAGES_RECOUPEES.`,
        )
    }

    return retenus
}

export async function listerCandidatsRecoupes(terme?: string, type?: TypeTerme): Promise<CandidatRecoupe[]> {
    const garde = await requireAdmin()
    if (!garde.authorized) return []

    return parcourirCandidatsMultiSources(terme, 'Lot recoupé', (candidat) => {
        const traductions = traductionsRecoupees(candidat.variantes)
        if (traductions.length === 0) return null
        return { ...candidat, formeCanonique: traductions[0].alsacien, traductions }
    }, type)
}

export interface CandidatDivergent extends Candidat {
    formes: FormeCandidate[]
    nature: NatureDivergence
    formeRegionale: string | null
}

// Le symétrique de listerCandidatsRecoupes() : deux sources ou plus, mais aucune
// forme commune. Ces candidats ne partent jamais en lot — l'arbitre choisit la
// forme canonique un par un. La file s'ordonne par nature de l'écart : accents
// seuls, puis alternance a~e régionale, puis sonorisation, puis le reste. C'est
// un ordre de commodité, pas une hiérarchie de légitimité — un candidat en tête
// n'est pas plus fondé qu'un autre, il est plus rapide à regarder.
export async function listerCandidatsDivergents(terme?: string, type?: TypeTerme): Promise<CandidatDivergent[]> {
    const garde = await requireAdmin()
    if (!garde.authorized) return []

    const divergents = await parcourirCandidatsMultiSources(terme, 'Lot divergent', (candidat) => {
        const divergence = analyserDivergence(candidat.variantes)
        if (!divergence) return null
        return {
            ...candidat,
            formes: divergence.formes,
            nature: divergence.nature,
            formeRegionale: divergence.formeRegionale,
        }
    }, type)

    return divergents.sort((a, b) => {
        const rang = rangNature(a.nature) - rangNature(b.nature)
        if (rang !== 0) return rang
        if (a.formes.length !== b.formes.length) return a.formes.length - b.formes.length
        return a.francais.localeCompare(b.francais, 'fr')
    })
}

// Publie un candidat divergent avec la forme que l'arbitre a retenue. C'est un
// arbitrage unitaire présenté commodément, jamais un traitement de masse : une
// décision humaine par appel, et arbitrer_entree() exécute ses gardes comme
// depuis l'écran de détail.
export async function arbitrerDivergenceAction(demande: {
    cle: string
    contexte: string
    graphie: string
}): Promise<Resultat> {
    const garde = await requireAdmin()
    if (!garde.authorized) return { success: false, error: garde.error }

    // Le candidat et ses formes sont recalculés côté serveur : ce qui vient du
    // navigateur ne désigne qu'un choix, il ne le fonde pas. Sans ce recalcul,
    // l'action publierait n'importe quelle graphie sous n'importe quelle clé.
    const candidat = (await listerCandidatsDivergents()).find(
        (c) => c.cle === demande.cle && c.contexte === demande.contexte,
    )
    if (!candidat) {
        return { success: false, error: "Candidat absent de la file des divergentes : à rouvrir dans l'écran d'arbitrage." }
    }

    const traductions = traductionsArbitrees(candidat.formes, demande.graphie)
    // Garde de la règle 1 : la forme publiée est copiée d'une attestation, ou
    // rien n'est publié.
    if (traductions.length === 0) {
        return { success: false, error: `Forme non attestée pour ce candidat : ${demande.graphie}` }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('arbitrer_entree', {
        p_francais: candidat.francais.trim(),
        p_contexte: candidat.contexte.trim(),
        p_type: candidat.type,
        p_traductions: traductions,
        p_attestation_ids: candidat.variantes.map((v) => v.attestation_id),
        p_statut: 'valide',
        p_notes: null,
        p_entree_id: candidat.entree_id,
    })

    if (error) {
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
    return { success: true, message: `Publiée avec « ${demande.graphie} »`, entreeId: data as string }
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
