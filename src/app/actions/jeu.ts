'use server'

import { chargerLemme } from "@/app/actions/recherche"
import { Prisma } from "@/generated/prisma/client"
import type { LemmeDetaille, VarianteDetaillee } from "@/lib/dictionnaire"
import {
    chargerReserve,
    jourActuel,
    jourPrecedent,
    manchesDuJour,
    manchesLibres,
    numeroDefi,
    indiceDuJour,
    type MancheStockee,
} from "@/lib/jeu"
import { chargerLemmeDetaille } from "@/lib/lemmes"
import { MOTS_DE_BASE } from "@/lib/mots-de-base"
import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

// Le jeu « Quel village dit ça ? » (25/09/2026). La logique du tirage vit dans
// `lib/jeu.ts` ; ici, ce qui sort vers le navigateur.
//
// La règle qui organise tout ce fichier : la bonne réponse d'une manche ne
// quitte le serveur qu'APRÈS que le membre a répondu. Une manche publique ne
// porte que les formes et les quatre choix ; la vérification se fait ici, sur
// la partie enregistrée.

export interface ChoixPublic {
    id: number
    nom: string
    departement: string
}

/** Ce qu'on révèle une fois la réponse donnée : le village et toutes ses
 *  formes, chacune avec ce qui la fonde (sources et villages, jamais
 *  additionnés). */
export interface Revelation {
    bonneId: number
    reponseId: number
    village: { nom: string; slug: string; departement: string; latitude: number; longitude: number }
    variantes: VarianteDetaillee[]
}

export interface ManchePublique {
    formes: string[]
    choix: ChoixPublic[]
    revelation: Revelation | null
}

export interface PartiePublique {
    id: string
    mode: "jour" | "libre"
    numero: number | null
    manches: ManchePublique[]
    score: number
    finie: boolean
}

export interface EtatJeu {
    numero: number
    defi: { etat: "a_jouer" } | { etat: "en_cours"; manche: number } | { etat: "finie"; resultats: boolean[] }
    /** Jours de défi d'affilée terminés, jusqu'à aujourd'hui ou hier. */
    serie: number
}

type Resultat<T> = { succes: true; valeur: T } | { succes: false; erreur: string }

const NON_CONNECTE = { succes: false, erreur: "Connecte-toi pour jouer" } as const

function lireManches(valeur: Prisma.JsonValue): MancheStockee[] {
    return valeur as unknown as MancheStockee[]
}

// --- État de l'écran d'accueil du jeu -----------------------------------------

export async function etatJeuAction(): Promise<EtatJeu | null> {
    const session = await sessionActuelle()
    if (!session) return null

    const jour = jourActuel()
    const parties = await prisma.partieJeu.findMany({
        where: { membreId: session.membreId, mode: "jour" },
        select: { jour: true, manches: true, finie: true },
        orderBy: { jour: "desc" },
        take: 400,
    })

    const duJour = parties.find((p) => p.jour?.toISOString().slice(0, 10) === jour)
    let defi: EtatJeu["defi"] = { etat: "a_jouer" }
    if (duJour) {
        const manches = lireManches(duJour.manches)
        defi = duJour.finie
            ? { etat: "finie", resultats: manches.map((m) => m.reponse === m.communeId) }
            : { etat: "en_cours", manche: manches.filter((m) => m.reponse !== null).length + 1 }
    }

    // La série compte les défis terminés d'affilée. Celui d'aujourd'hui, pas
    // encore joué, ne la casse pas : elle part d'hier tant qu'il reste à jouer.
    const finis = new Set(parties.filter((p) => p.finie && p.jour).map((p) => p.jour!.toISOString().slice(0, 10)))
    let curseur = finis.has(jour) ? jour : jourPrecedent(jour)
    let serie = 0
    while (finis.has(curseur)) {
        serie++
        curseur = jourPrecedent(curseur)
    }

    return { numero: numeroDefi(jour), defi, serie }
}

// --- Une partie -----------------------------------------------------------------

export async function commencerPartieAction(mode: "jour" | "libre"): Promise<Resultat<PartiePublique>> {
    const session = await sessionActuelle()
    if (!session) return NON_CONNECTE

    if (mode === "jour") {
        const jour = jourActuel()
        const date = new Date(`${jour}T00:00:00Z`)
        const existante = await prisma.partieJeu.findUnique({
            where: { membreId_jour: { membreId: session.membreId, jour: date } },
        })
        if (existante) return { succes: true, valeur: await publier(existante) }

        const manches = await manchesDuJour(jour)
        try {
            const partie = await prisma.partieJeu.create({
                data: {
                    membreId: session.membreId,
                    mode: "jour",
                    jour: date,
                    manches: manches as unknown as Prisma.InputJsonValue,
                },
            })
            return { succes: true, valeur: await publier(partie) }
        } catch (erreur) {
            // Deux onglets qui démarrent le défi au même instant : le second perd
            // la course sur l'unicité (membre, jour), et reprend la partie du
            // premier plutôt que d'afficher une erreur.
            if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2002") {
                const partie = await prisma.partieJeu.findUnique({
                    where: { membreId_jour: { membreId: session.membreId, jour: date } },
                })
                if (partie) return { succes: true, valeur: await publier(partie) }
            }
            throw erreur
        }
    }

    const partie = await prisma.partieJeu.create({
        data: {
            membreId: session.membreId,
            mode: "libre",
            manches: (await manchesLibres()) as unknown as Prisma.InputJsonValue,
        },
    })
    return { succes: true, valeur: await publier(partie) }
}

export async function repondreAction(
    partieId: string,
    indice: number,
    communeId: number,
): Promise<Resultat<{ revelation: Revelation; score: number; finie: boolean }>> {
    const session = await sessionActuelle()
    if (!session) return NON_CONNECTE

    const partie = await prisma.partieJeu.findUnique({ where: { id: partieId } })
    if (!partie || partie.membreId !== session.membreId) return { succes: false, erreur: "Partie introuvable" }

    const manches = lireManches(partie.manches)
    const manche = manches[indice]
    // Les manches se jouent dans l'ordre, une réponse chacune. Une réponse déjà
    // donnée ne se change pas : on la renvoie telle quelle (double clic,
    // réseau qui rejoue la requête), sans toucher au score.
    if (!manche || manches.findIndex((m) => m.reponse === null) !== indice) {
        if (manche?.reponse != null) {
            return {
                succes: true,
                valeur: { revelation: await reveler(manche), score: partie.score, finie: partie.finie },
            }
        }
        return { succes: false, erreur: "Cette manche n'est pas encore ouverte" }
    }
    if (!manche.choix.includes(communeId)) return { succes: false, erreur: "Ce village ne fait pas partie des choix" }

    const nouvelles = manches.map((m, i) => (i === indice ? { ...m, reponse: communeId } : m))
    const score = partie.score + (communeId === manche.communeId ? 1 : 0)
    const finie = nouvelles.every((m) => m.reponse !== null)

    // Écrit seulement si la partie n'a pas bougé depuis sa lecture : deux
    // réponses simultanées à la même manche ne comptent pas deux points.
    const { count } = await prisma.partieJeu.updateMany({
        where: { id: partie.id, score: partie.score, finie: false, manches: { equals: partie.manches as Prisma.InputJsonValue } },
        data: { manches: nouvelles as unknown as Prisma.InputJsonValue, score, finie },
    })
    if (count === 0) return { succes: false, erreur: "Ta réponse est déjà enregistrée. Recharge la page pour continuer." }

    return { succes: true, valeur: { revelation: await reveler({ ...manche, reponse: communeId }), score, finie } }
}

async function publier(partie: {
    id: string
    mode: "jour" | "libre"
    jour: Date | null
    manches: Prisma.JsonValue
    score: number
    finie: boolean
}): Promise<PartiePublique> {
    const r = await chargerReserve()
    const manches = lireManches(partie.manches)

    // Les noms viennent du référentiel et non de la réserve : un village que la
    // modération aurait sorti du jeu depuis le début de la partie reste nommé.
    const ids = Array.from(new Set(manches.flatMap((m) => m.choix)))
    const communes = await prisma.commune.findMany({
        where: { id: { in: ids } },
        select: { id: true, nom: true, departement: true },
    })
    const parId = new Map(communes.map((c) => [c.id, c]))

    return {
        id: partie.id,
        mode: partie.mode,
        numero: partie.jour ? numeroDefi(partie.jour.toISOString().slice(0, 10)) : null,
        score: partie.score,
        finie: partie.finie,
        manches: await Promise.all(
            manches.map(async (m) => ({
                formes: r.parId.get(m.communeId)?.formes ?? (await formesDe(m.communeId)),
                choix: m.choix.flatMap((id) => (parId.has(id) ? [parId.get(id)!] : [])),
                revelation: m.reponse === null ? null : await reveler(m),
            })),
        ),
    }
}

async function formesDe(communeId: number): Promise<string[]> {
    const lemme = await chargerLemmeDetaille({ communeId })
    return lemme?.variantes.map((v) => v.forme) ?? []
}

async function reveler(manche: MancheStockee): Promise<Revelation> {
    const [lemme, commune] = await Promise.all([
        chargerLemmeDetaille({ communeId: manche.communeId }),
        prisma.commune.findUniqueOrThrow({
            where: { id: manche.communeId },
            select: { nom: true, slug: true, departement: true, latitude: true, longitude: true },
        }),
    ])
    return {
        bonneId: manche.communeId,
        reponseId: manche.reponse!,
        village: commune,
        variantes: lemme?.variantes ?? [],
    }
}

// --- La fin de partie ------------------------------------------------------------

/** Le mot tendu en fin de partie : « et chez toi, on dit comment ? ». Le même
 *  pour tous le jour du défi, au hasard en partie libre. Facultatif, et jamais
 *  compté dans le score : contribuer n'est pas un coup du jeu. */
export async function motChezToiAction(mode: "jour" | "libre"): Promise<LemmeDetaille | null> {
    const session = await sessionActuelle()
    if (!session) return null

    const indice =
        mode === "jour"
            ? indiceDuJour(jourActuel()) % MOTS_DE_BASE.length
            : Math.floor(Math.random() * MOTS_DE_BASE.length)
    const { cle, contexte, type } = MOTS_DE_BASE[indice]

    const lemme = await prisma.lemme.findUnique({
        where: { cle_contexte_type: { cle, contexte, type } },
        select: { id: true },
    })
    return lemme ? chargerLemme(lemme.id) : null
}

