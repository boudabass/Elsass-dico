'use server'

import { revalidatePath } from "next/cache"

import type { TypeTerme } from "@/generated/prisma/client"
import { REFUS_VILLAGE_REQUIS, type EchecContribution } from "@/lib/contribution"
import { poserVariante, validerSaisie, villageDuMembre, type SaisieForme } from "@/lib/contribution-serveur"
import { cleFrancais } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"
import { adminExige, sessionActuelle } from "@/lib/session-serveur"

// Un membre crée un mot français (décision de John, 27/09/2026) : jamais seul,
// TOUJOURS avec sa première forme alsacienne. Un mot sans forme ne dirait rien
// de l'alsacien, et un dictionnaire bilingue n'a pas d'entrée à un seul côté.
//
// Le mot naît comme un lemme dérivé : même clé naturelle `(cle, contexte,
// type)`, calculée par la même `cleFrancais()` que la dérivation. Il porte en
// plus `parMembre`, qui survit à l'anonymisation : c'est ce qui le fait
// recréer par `importer-contributions.mts` et lister dans /admin/mots.
//
// Pas de contexte à la création (décision de John : le mot et son type, rien
// d'autre). Les toponymes et les prénoms en sont exclus : un toponyme EST une
// commune du référentiel, et un prénom a une page publique générée au build.

const FRANCAIS_MAX = 120

export type TypeMotMembre = Extract<TypeTerme, "mot" | "expression" | "proverbe">
const TYPES_MEMBRE: readonly TypeMotMembre[] = ["mot", "expression", "proverbe"]

export interface MotExistant {
    id: string
    francais: string
    contexte: string
    type: TypeTerme
    nbFormes: number
}

/** Les mots déjà connus sous ce libellé, tous types confondus : avant de créer
 *  « salaire », la feuille montre qu'il existe. Même clé que la dérivation, donc
 *  sensible aux accents : `sur` n'est pas `sûr` (correctif du 24/08/2026). */
export async function verifierMotAction(francais: string): Promise<MotExistant[]> {
    const session = await sessionActuelle()
    if (!session) return []
    const cle = cleFrancais(francais)
    if (!cle) return []

    const lemmes = await prisma.lemme.findMany({
        where: { cle },
        select: {
            id: true, francais: true, contexte: true, type: true,
            _count: { select: { variantes: { where: { masquee: false } } } },
        },
        orderBy: [{ type: "asc" }, { contexte: "asc" }],
        take: 10,
    })
    return lemmes.map((l) => ({
        id: l.id, francais: l.francais, contexte: l.contexte, type: l.type, nbFormes: l._count.variantes,
    }))
}

type ResultatMot =
    | { succes: true; lemmeId: string }
    | { succes: false; erreur: string; lemmeExistant?: string; villageRequis?: true }

export async function creerMotAction(
    { francais, type, forme }: { francais: string; type: string; forme: SaisieForme },
): Promise<ResultatMot | EchecContribution> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connecte-toi pour continuer" }

    const libelle = francais.trim().replace(/\s+/g, " ")
    const cle = cleFrancais(libelle)
    if (!cle) return { succes: false, erreur: "Écris le mot français" }
    if (libelle.length > FRANCAIS_MAX) return { succes: false, erreur: "Trop long pour un mot" }
    if (!TYPES_MEMBRE.includes(type as TypeMotMembre)) return { succes: false, erreur: "Choisis s'il s'agit d'un mot, d'une expression ou d'un proverbe" }
    const typeMot = type as TypeMotMembre

    // Refusé ici et pas seulement désactivé à l'écran : pas de mot sans forme.
    const valide = validerSaisie(forme)
    if (!valide.ok) return { succes: false, erreur: "Ajoute sa forme alsacienne : un mot ne se crée pas sans elle" }

    const communeId = await villageDuMembre(session.membreId)
    if (!communeId) return REFUS_VILLAGE_REQUIS

    const existant = await prisma.lemme.findUnique({
        where: { cle_contexte_type: { cle, contexte: "", type: typeMot } },
        select: { id: true },
    })
    if (existant) {
        return { succes: false, erreur: "Ce mot existe déjà. Ajoute ta forme sur sa fiche", lemmeExistant: existant.id }
    }

    try {
        const lemmeId = await prisma.$transaction(async (tx) => {
            const lemme = await tx.lemme.create({
                data: {
                    francais: libelle, cle, contexte: "", type: typeMot,
                    parMembre: true, creeParId: session.membreId,
                },
                select: { id: true },
            })
            await poserVariante(tx, {
                lemmeId: lemme.id, forme: valide.forme, cle: valide.cle, membreId: session.membreId, communeId,
            })
            return lemme.id
        })
        revalidatePath("/admin/mots")
        return { succes: true, lemmeId }
    } catch (erreur) {
        console.error("[Mots] Non créé:", erreur)
        return { succes: false, erreur: "Enregistrement impossible, réessaie dans un instant" }
    }
}

// --- Admin : les mots ajoutés par les membres ---------------------------------
//
// Décision de John (28/09/2026). Une liste en lecture, du plus récent au plus
// ancien, comme /admin/sources : un mot ajouté ne se valide pas avant d'être
// publié (la modération passe par le signalement de ses formes), mais l'admin
// doit pouvoir voir passer ce qui n'existe dans aucune source.

export interface MotAjoute {
    id: string
    francais: string
    type: TypeTerme
    creeLe: string
    /** `null` : le compte a été supprimé depuis, le mot reste, anonyme. */
    auteur: string | null
    formes: { forme: string; villages: string[] }[]
}

const REFUS = "Réservé aux administrateurs"

export async function listerMotsAjoutesAction(): Promise<
    { succes: true; mots: MotAjoute[] } | { succes: false; erreur: string }
> {
    if (!(await adminExige())) return { succes: false, erreur: REFUS }

    const lemmes = await prisma.lemme.findMany({
        where: { parMembre: true },
        orderBy: { creeLe: "desc" },
        take: 200,
        select: {
            id: true, francais: true, type: true, creeLe: true,
            creePar: { select: { email: true, nom: true } },
            variantes: {
                where: { masquee: false },
                orderBy: { creeLe: "asc" },
                select: {
                    forme: true,
                    temoignages: {
                        where: { communeId: { not: null } },
                        select: { commune: { select: { nom: true } } },
                    },
                },
            },
        },
    })

    return {
        succes: true,
        mots: lemmes.map((l) => ({
            id: l.id,
            francais: l.francais,
            type: l.type,
            creeLe: l.creeLe.toISOString(),
            auteur: l.creePar ? (l.creePar.nom ?? l.creePar.email) : null,
            formes: l.variantes.map((v) => ({
                forme: v.forme,
                villages: v.temoignages.map((t) => t.commune?.nom).filter((n): n is string => !!n),
            })),
        })),
    }
}
