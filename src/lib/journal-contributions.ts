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

/** Une ligne du fichier : anonyme (aucun membre), en clés naturelles. */
export interface LigneJournal {
    id: string
    type: "pose" | "retrait" | "creation" | "modification"
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

    return evenements.map((e) => ({
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
}

/** Le contenu exact du fichier. Trié et stable : deux exports sans nouveau
 *  geste donnent le même texte, donc un diff vide (c'est ce que compare N8N). */
export function texteDuJournal(lignes: LigneJournal[]): string {
    return lignes.map((l) => JSON.stringify(l)).join("\n") + (lignes.length ? "\n" : "")
}
