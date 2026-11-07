// Ce que l'écran Contributions de l'admin manipule (04/11/2026, refondu le 07/11 :
// une carte par mot, avec ses formes dedans). Pas d'accès à la base ici : ce fichier
// est importé par l'écran, donc par le navigateur.
//
// Décisions de John du 04/11 : un texte de membre est visible tout de suite pour les membres connectés,
// John voit tout et peut agir à tout moment, rien n'est effacé. Une forme de
// membre n'est montrée sans compte, ni dans le défi, que si elle a été validée.

/** Dix mots par page, puis « Voir plus » : jamais de liste infinie. */
export const TAILLE_PAGE_CONTRIBUTIONS = 10

/** Les gestes du journal (événements) et ceux de la modération. */
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
    "categorie_insulte_retiree",
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
    validation_defi: "Forme validée",
    annulation_validation_defi: "Validation annulée",
    categorie_insulte_retiree: "Catégorie insulte retirée",
}

/** Un geste sur une forme (ou sur le mot). */
export interface GesteContribution {
    /** `evenement` : une ligne du journal. `moderation` : un geste de l'admin sur une forme. */
    genre: "evenement" | "moderation"
    type: TypeContribution
    /** ISO, avec l'heure. */
    le: string
    /** Le membre concerné : l'auteur d'une forme, ou le votant pour un retrait. */
    membre: string | null
    membreId: string | null
    /** Le village du geste (ou de la création de la forme pour un geste admin). */
    village: string | null
    /** L'admin qui a fait le geste. Nul pour le journal des membres. */
    acteur: string | null
    /** Renseignés pour une modification seulement. */
    ancienneForme: string | null
    nouvelleForme: string | null
}

/** Une forme du mot, avec son état actuel et son dernier geste. */
export interface FormeContribution {
    varianteId: string
    forme: string
    /** Une forme de source écrite : elle est déjà montrée sans compte et dans le défi, rien à valider. */
    source: boolean
    masquee: boolean
    validee: boolean
    /** Le nombre de gestes sur cette forme. */
    nbGestes: number
    /** Une forme de membre, ni validée, ni masquée, ni de source : elle attend la décision de l'admin. */
    aDecider: boolean
    dernier: GesteContribution
}

/** Un mot de l'écran : toutes ses formes qui ont eu un geste dans la période. */
export interface MotContribution {
    mot: { id: string; francais: string; contexte: string; type: string; visible: boolean }
    /** Vrai si aucune forme de ce mot ne vient d'une source : seul un tel mot peut perdre la catégorie insulte. */
    motSansSource: boolean
    /** ISO : le geste le plus récent sur ce mot. */
    dernier: string
    /** Tous les gestes du mot, formes et retrait de catégorie compris. */
    nbGestes: number
    /** Le dernier retrait de la catégorie insulte, s'il y en a un. */
    retraitInsulte: { le: string; acteur: string | null } | null
    /** Les formes, du geste le plus récent au plus ancien. */
    formes: FormeContribution[]
}

export interface FiltresContributions {
    page: number
    /** Vrai (la vue par défaut) : seuls les mots avec une forme à décider, et seules ces formes. */
    aRegarder: boolean
}

export interface PageContributions {
    mots: MotContribution[]
    page: number
    plusDeMots: boolean
}

/** Le nom affiché d'un membre : son nom, à défaut son identifiant de connexion. */
export function nomAffiche(nom: string | null, email: string | null): string | null {
    return nom ?? email
}

/** La catégorie visible d'un mot : « Insulte » si le mot est une insulte,
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
