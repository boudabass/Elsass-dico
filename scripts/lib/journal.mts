// Format du journal des contributions exporté dans le dépôt, partagé par
// `exporter-contributions.mts` et `importer-contributions.mts`. Dans un
// module à part : importer ce type depuis l'exporteur exécuterait l'export.

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
    temoignageId: string | null
    commune: number | null // code INSEE
    ancienneForme: string | null
    nouvelleForme: string | null
}
