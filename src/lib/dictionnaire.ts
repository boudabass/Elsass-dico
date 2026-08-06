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

export function estTypeTermeValide(valeur: string): valeur is TypeTerme {
    return (TYPES_TERME as readonly string[]).includes(valeur)
}

export function estRegionValide(valeur: string): valeur is Region {
    return (REGIONS as readonly string[]).includes(valeur)
}
