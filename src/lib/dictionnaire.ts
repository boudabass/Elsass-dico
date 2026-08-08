// Alignés sur les types ENUM de
// supabase/migrations/20260731120000_schema_dictionnaire.sql.

export const TYPES_TERME = ['mot', 'expression', 'proverbe'] as const
export type TypeTerme = typeof TYPES_TERME[number]

export const LIBELLES_TYPE_TERME: Record<TypeTerme, string> = {
    mot: 'Mot',
    expression: 'Expression',
    proverbe: 'Proverbe',
}

export const REGIONS = ['bas_rhin', 'haut_rhin', 'commun'] as const
export type Region = typeof REGIONS[number]

export const LIBELLES_REGION: Record<Region, string> = {
    bas_rhin: 'Bas-Rhin',
    haut_rhin: 'Haut-Rhin',
    commun: 'Commun',
}

// Nombre de validations par les pairs correspondant à un score plein. Ce seuil
// n'est qu'un repère d'affichage : il ne déclenche aucune publication
// automatique (règle 4 de CLAUDE.md).
export const SCORE_PLEIN = 5

export const STATUTS_ENTREE = ['a_valider', 'valide', 'conflit', 'rejete'] as const
export type StatutEntree = typeof STATUTS_ENTREE[number]

export const LIBELLES_STATUT: Record<StatutEntree, string> = {
    a_valider: 'À valider',
    valide: 'Validée',
    conflit: 'Conflit',
    rejete: 'Rejetée',
}

export function estTypeTermeValide(valeur: string): valeur is TypeTerme {
    return (TYPES_TERME as readonly string[]).includes(valeur)
}

export function estRegionValide(valeur: string): valeur is Region {
    return (REGIONS as readonly string[]).includes(valeur)
}

export function estStatutValide(valeur: string): valeur is StatutEntree {
    return (STATUTS_ENTREE as readonly string[]).includes(valeur)
}

// Un élément du tableau JSONB entrees.traductions. L'index 0 est la traduction
// canonique — règle « Premier est Roi » de la doctrine éditoriale.
export interface Traduction {
    alsacien: string
    region: Region | null
    niveau: string | null
    note: string | null
}

export function traductionVide(): Traduction {
    return { alsacien: '', region: null, niveau: null, note: null }
}

export interface Entree {
    id: string
    francais: string
    contexte: string
    type: TypeTerme
    traductions: Traduction[]
    nb_attestations: number
    statut?: StatutEntree
}

// Une variante telle que la renvoient candidats_arbitrage() et
// detail_candidat() : l'attestation brute, jamais retouchée, avec sa source.
export interface VarianteAttestee {
    attestation_id: string
    alsacien: string
    graphie_origine: string
    region: Region | null
    type: TypeTerme
    source_id: string
    source_nom: string
    source_type: string
    fiabilite: number
    reference: string | null
    votes: number
    retenue?: boolean
}

// Le seuil de recoupement de la règle 2 : en dessous, la publication exige une
// note d'arbitrage (exception du 07/08/2026). Doit rester aligné sur la garde
// de arbitrer_entree() — c'est la base qui tranche, pas l'interface.
export const SOURCES_MINIMUM = 2
