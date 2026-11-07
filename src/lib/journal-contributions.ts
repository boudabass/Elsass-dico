// Export du journal des contributions, sous forme anonyme (09/10/2026 : sorti
// de `scripts/exporter-contributions.mts` pour servir aussi la route
// `/api/automatisation/contributions`, une seule version du format).
//
// **Anonyme, et le dépôt est public.** Aucun identifiant de membre ne sort. Ce
// qui sort, c'est ce que le site montre déjà (une forme, un village) plus le
// jour du geste, jamais l'heure.
//
// **Clés naturelles, jamais des UUID de lemme ou de variante** : ceux-là ne
// survivent pas à une redérivation (leçon du 12/09). Un lemme se désigne par
// `(cle, contexte, type)`, une variante par sa `cleForme` sur ce lemme, un
// village par son code INSEE. Tous les événements d'une variante portent sa
// forme ACTUELLE : c'est celle qu'on retrouve au rejeu, même après une
// modification.
//
// Importé aussi par les scripts (`tsx`) : imports relatifs et de type
// seulement, jamais `@/` ni le client Prisma de l'app.

import type { PrismaClient } from "../generated/prisma/client"

export const FICHIER_JOURNAL = "data/contributions/journal.jsonl"

/** Les gestes des membres (table `evenements_contribution`). */
export const TYPES_EVENEMENT_JOURNAL = ["pose", "retrait", "creation", "modification"] as const

/** Les gestes de l'admin (table `moderations`, 04/11/2026). */
export const TYPES_MODERATION_JOURNAL = [
    "masquage",
    "demasquage",
    "retrait_vote",
    "validation_defi",
    "annulation_validation_defi",
] as const

/** Le geste de l'admin sur le mot seul (07/11/2026) : retirer la catégorie « insulte ».
 *  Ajouté en FIN de fichier, comme les gestes de modération. Pas de forme : `cleForme`
 *  et `forme` sont vides, `nouveauContexte` dit le contexte après le geste. */
export const TYPES_CATEGORIE_JOURNAL = ["categorie_insulte_retiree"] as const

export type TypeLigneJournal =
    | (typeof TYPES_EVENEMENT_JOURNAL)[number]
    | (typeof TYPES_MODERATION_JOURNAL)[number]
    | (typeof TYPES_CATEGORIE_JOURNAL)[number]

/** Une ligne du fichier : anonyme (aucun membre), en clés naturelles.
 *
 *  Depuis le 04/11/2026, le fichier porte aussi les gestes de l'admin
 *  (`masquage`, `demasquage`, `retrait_vote`, `validation_defi`,
 *  `annulation_validation_defi`), ajoutés APRÈS les événements : le début du
 *  fichier ne bouge pas, N8N ne voit qu'un ajout. Une ligne de modération n'a
 *  ni village ni ancienne/nouvelle forme ; `temoignageId` y est celui du vote
 *  retiré. Jamais l'admin qui l'a faite (`acteurId`). */
export interface LigneJournal {
    id: string
    type: TypeLigneJournal
    jour: string // AAAA-MM-JJ
    // `francais` et `parMembre` (28/09/2026) : un mot créé par un membre n'existe
    // dans aucune source, il faut pouvoir le recréer. Absents des lignes plus
    // anciennes et des mots de source, d'où facultatifs.
    lemme: { cle: string; contexte: string; type: string; francais?: string; parMembre?: true }
    cleForme: string
    forme: string // forme ACTUELLE de la variante, celle qu'on retrouve au rejeu
    // Son article décomposé (28/09/2026), pour qu'une forme de membre recréée
    // garde `article + formeSansArticle = forme`. Absent sans article.
    article?: string
    temoignageId: string | null
    commune: number | null // code INSEE
    ancienneForme: string | null
    nouvelleForme: string | null
    /** Seulement pour `categorie_insulte_retiree` : le contexte du mot APRÈS le geste
     *  (`lemme.contexte` donne celui d'AVANT). */
    nouveauContexte?: string
}

export async function lignesDuJournal(prisma: PrismaClient): Promise<LigneJournal[]> {
    const evenements = await prisma.evenementContribution.findMany({
        select: {
            id: true, type: true, le: true, temoignageId: true, communeId: true,
            ancienneForme: true, nouvelleForme: true,
            variante: {
                select: {
                    cleForme: true, forme: true, article: true,
                    lemme: { select: { cle: true, contexte: true, type: true, francais: true, parMembre: true } },
                },
            },
        },
        // L'heure ordonne encore l'export, même si elle n'en sort pas : une pose et
        // son retrait du même jour restent dans l'ordre où ils ont eu lieu.
        orderBy: [{ le: "asc" }, { id: "asc" }],
    })

    const lignesEvenements: LigneJournal[] = evenements.map((e) => ({
        id: e.id,
        type: e.type,
        jour: e.le.toISOString().slice(0, 10),
        lemme: {
            cle: e.variante.lemme.cle, contexte: e.variante.lemme.contexte, type: e.variante.lemme.type,
            // Un mot créé par un membre (28/09/2026) : son libellé part avec lui pour
            // être recréé au rejeu. L'auteur, lui, ne sort jamais.
            ...(e.variante.lemme.parMembre ? { francais: e.variante.lemme.francais, parMembre: true as const } : {}),
        },
        cleForme: e.variante.cleForme,
        forme: e.variante.forme,
        ...(e.variante.article ? { article: e.variante.article } : {}),
        temoignageId: e.temoignageId,
        commune: e.communeId,
        ancienneForme: e.ancienneForme,
        nouvelleForme: e.nouvelleForme,
    }))

    // Les gestes de l'admin, à la suite : le début du fichier reste octet pour
    // octet le même, N8N ne voit qu'un ajout. Anonymes : `acteurId` ne sort pas.
    const moderations = await prisma.moderation.findMany({
        select: {
            id: true, type: true, le: true, temoignageId: true,
            variante: {
                select: {
                    cleForme: true, forme: true, article: true,
                    lemme: { select: { cle: true, contexte: true, type: true, francais: true, parMembre: true } },
                },
            },
        },
        orderBy: [{ le: "asc" }, { id: "asc" }],
    })

    const lignesModeration: LigneJournal[] = moderations.map((m) => ({
        id: m.id,
        type: m.type,
        jour: m.le.toISOString().slice(0, 10),
        lemme: {
            cle: m.variante.lemme.cle, contexte: m.variante.lemme.contexte, type: m.variante.lemme.type,
            ...(m.variante.lemme.parMembre ? { francais: m.variante.lemme.francais, parMembre: true as const } : {}),
        },
        cleForme: m.variante.cleForme,
        forme: m.variante.forme,
        ...(m.variante.article ? { article: m.variante.article } : {}),
        temoignageId: m.temoignageId,
        commune: null,
        ancienneForme: null,
        nouvelleForme: null,
    }))

    // Le retrait de la catégorie « insulte » (07/11/2026), à la suite. Le mot y est
    // désigné AVANT le geste (`contexte` = « insulte »), et `nouveauContexte` dit ce
    // qu'il est devenu. Les autres lignes du mot portent son contexte ACTUEL, comme
    // le reste du journal : l'importeur recrée donc le mot sous sa clé finale.
    const changements = await prisma.changementCategorie.findMany({
        select: {
            id: true, le: true, ancienContexte: true, nouveauContexte: true,
            lemme: { select: { cle: true, type: true, francais: true, parMembre: true } },
        },
        orderBy: [{ le: "asc" }, { id: "asc" }],
    })

    const lignesCategorie: LigneJournal[] = changements.map((c) => ({
        id: c.id,
        type: "categorie_insulte_retiree",
        jour: c.le.toISOString().slice(0, 10),
        lemme: {
            cle: c.lemme.cle, contexte: c.ancienContexte, type: c.lemme.type,
            ...(c.lemme.parMembre ? { francais: c.lemme.francais, parMembre: true as const } : {}),
        },
        cleForme: "",
        forme: "",
        temoignageId: null,
        commune: null,
        ancienneForme: null,
        nouvelleForme: null,
        nouveauContexte: c.nouveauContexte,
    }))

    return [...lignesEvenements, ...lignesModeration, ...lignesCategorie]
}

/** Le contenu exact du fichier. Trié et stable : deux exports sans nouveau
 *  geste donnent le même texte, donc un diff vide (c'est ce que compare N8N). */
export function texteDuJournal(lignes: LigneJournal[]): string {
    return lignes.map((l) => JSON.stringify(l)).join("\n") + (lignes.length ? "\n" : "")
}
