// Ce que l'écran Contributions de l'admin manipule (04/11/2026). Pas d'accès à la
// base ici : ce fichier est importé par l'écran, donc par le navigateur.
//
// Décisions de John du 04/11 : un texte de membre reste publié tout de suite,
// John voit tout et peut agir à tout moment, rien n'est effacé. Une forme de
// membre n'entre dans le défi que si elle a été validée.

/** Vingt lignes par page, puis « Voir plus » : jamais de liste infinie. */
export const TAILLE_PAGE_CONTRIBUTIONS = 20

/** Les gestes du journal (événements) et ceux de la modération. Les deux
 *  familles ne se recouvrent pas : c'est ce qui permet de les lire ensemble. */
export const TYPES_CONTRIBUTION = [
    "pose",
    "retrait",
    "creation",
    "modification",
    "masquage",
    "demasquage",
    "retrait_vote",
    "validation_defi",
    "annulation_validation_defi",
] as const

export type TypeContribution = (typeof TYPES_CONTRIBUTION)[number]

export const LIBELLES_CONTRIBUTION: Record<TypeContribution, string> = {
    pose: "Ajout d'un vote",
    retrait: "Vote retiré par le membre",
    creation: "Forme nouvelle",
    modification: "Forme corrigée",
    masquage: "Forme masquée",
    demasquage: "Forme réaffichée",
    retrait_vote: "Vote retiré par l'admin",
    validation_defi: "Forme validée pour le défi",
    annulation_validation_defi: "Validation annulée",
}

/** Une ligne de l'écran. Les deux familles y ont la même forme. */
export interface LigneContribution {
    id: string
    /** `evenement` : une ligne du journal. `moderation` : un geste de l'admin. */
    genre: "evenement" | "moderation"
    type: TypeContribution
    /** ISO, avec l'heure : l'écran l'affiche, le journal public ne la garde pas. */
    le: string
    /** Le membre concerné : l'auteur d'une forme, ou le votant pour un retrait. */
    membre: string | null
    membreId: string | null
    varianteId: string
    /** Une forme de source écrite : elle est déjà dans le défi, rien à valider. */
    source: boolean
    /** Le membre a encore son vote actif sur cette forme : on peut le retirer. */
    voteActif: boolean
    /** Le village du geste (ou de la création de la forme pour un geste admin). */
    village: string | null
    mot: { id: string; francais: string; contexte: string; type: string; visible: boolean }
    forme: string
    /** Renseignés pour une modification seulement. */
    ancienneForme: string | null
    nouvelleForme: string | null
    masquee: boolean
    validee: boolean
    /** L'admin qui a fait le geste. Nul pour le journal des membres. */
    acteur: string | null
}

export interface FiltresContributions {
    page: number
    type?: TypeContribution
    membreId?: string
    /** ISO : seules les lignes postérieures à ce moment. */
    depuis?: string
}

export interface PageContributions {
    lignes: LigneContribution[]
    page: number
    plusDeLignes: boolean
}

/** Le nom affiché d'un membre : son nom, à défaut son identifiant de connexion. */
export function nomAffiche(nom: string | null, email: string | null): string | null {
    return nom ?? email
}

/** La catégorie visible d'une ligne : « Insulte » si le mot est une insulte,
 *  sinon son type. Une insulte est un contexte, jamais un type (PR #108). */
export function categorieDe(mot: { type: string; contexte: string }): string {
    if (mot.contexte === "insulte") return "Insulte"
    if (mot.type === "mot") return "Mot"
    if (mot.type === "expression") return "Expression"
    if (mot.type === "proverbe") return "Proverbe"
    if (mot.type === "toponyme") return "Village"
    if (mot.type === "prenom") return "Prénom"
    return mot.type
}
