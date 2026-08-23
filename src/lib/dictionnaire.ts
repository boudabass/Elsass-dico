// Alignés sur les types ENUM de
// supabase/migrations/20260731120000_schema_dictionnaire.sql, étendus par
// 20260808140000_types_toponyme_prenom.sql (toponyme, prenom).
//
// Cette liste ne sert pas qu'à l'affichage : estTypeTermeValide() garde
// arbitrerAction(). Un type absent d'ici rend le terme correspondant
// impossible à arbitrer, alors même que la base l'accepte.

export const TYPES_TERME = ['mot', 'expression', 'proverbe', 'toponyme', 'prenom'] as const
export type TypeTerme = typeof TYPES_TERME[number]

export const LIBELLES_TYPE_TERME: Record<TypeTerme, string> = {
    mot: 'Mot',
    expression: 'Expression',
    proverbe: 'Proverbe',
    toponyme: 'Toponyme',
    prenom: 'Prénom',
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

// --- Recoupement lexical -----------------------------------------------------
//
// arbitrer_entree() compte des source_id distincts : deux sources qui parlent
// du même mot français suffisent à passer sa garde. La doctrine demande plus —
// que les sources s'accordent sur LA MÊME forme alsacienne. Les deux notions
// coïncident souvent, pas toujours : sur les toponymes, 598 candidats ont deux
// sources distinctes mais seuls 166 leur voient écrire la même forme. Les
// autres relèvent du « Divergence entre sources = arbitrage manuel » de la
// doctrine, et ne peuvent pas partir en lot : choisir la forme canonique EST
// l'arbitrage.
//
// Ce module ne relâche donc jamais la garde SQL, il la resserre.

// La ponctuation finale est un artefact de source, pas une différence de forme :
// culture_alsace termine ses entrées de lexique par un point (« Jüli. ») là où
// wiktionnaire_fr ne le fait pas (« Jüli »). Les traiter comme deux formes
// distinctes ferait manquer de vrais recoupements. Sert à COMPARER seulement —
// ce qui est stocké reste une forme copiée telle quelle d'une source.
export function normaliserFormeAttestee(forme: string): string {
    return forme.trim().replace(/[.;,\s]+$/, '').trim()
}

// Les formes alsaciennes sur lesquelles au moins SOURCES_MINIMUM sources
// distinctes s'accordent, les mieux recoupées d'abord.
export function formesRecoupees(variantes: VarianteAttestee[]): string[] {
    const sourcesParForme = new Map<string, Set<string>>()
    for (const v of variantes) {
        const forme = normaliserFormeAttestee(v.alsacien)
        if (!forme) continue
        const sources = sourcesParForme.get(forme) ?? new Set<string>()
        sources.add(v.source_id)
        sourcesParForme.set(forme, sources)
    }
    return Array.from(sourcesParForme.entries())
        .filter(([, sources]) => sources.size >= SOURCES_MINIMUM)
        .sort((a, b) => b[1].size - a[1].size)
        .map(([forme]) => forme)
}

// Parmi les attestations d'une même forme, la graphie à retenir. On préfère
// celle qu'une source écrit sans ponctuation finale — c'est encore un verbatim,
// pas une réécriture (règle 1). Si aucune source ne l'écrit ainsi, on garde la
// forme attestée telle quelle, point compris : mieux vaut une coquille de source
// qu'une forme que personne n'a écrite.
function graphieRetenue(variantes: VarianteAttestee[], forme: string): string {
    const correspondantes = variantes.filter((v) => normaliserFormeAttestee(v.alsacien) === forme)
    const propre = correspondantes.find((v) => v.alsacien.trim() === forme)
    return (propre ?? correspondantes[0])?.alsacien.trim() ?? forme
}

// Construit le tableau traductions d'un candidat recoupé : la forme d'accord en
// index 0 (« Premier est Roi »), puis les autres formes attestées comme
// variantes — la doctrine conserve les variantes quand elles diffèrent. Aucune
// forme n'est inventée : toutes sortent des attestations reçues.
export function traductionsRecoupees(variantes: VarianteAttestee[]): Traduction[] {
    const recoupees = formesRecoupees(variantes)
    if (recoupees.length === 0) return []

    const vues = new Set<string>()
    const ordonnees = [
        ...recoupees,
        ...variantes.map((v) => normaliserFormeAttestee(v.alsacien)).filter(Boolean),
    ].filter((forme) => {
        if (vues.has(forme)) return false
        vues.add(forme)
        return true
    })

    return ordonnees.map((forme) => {
        const correspondantes = variantes.filter((v) => normaliserFormeAttestee(v.alsacien) === forme)
        const region = correspondantes.find((v) => v.region !== null)?.region ?? null
        return {
            alsacien: graphieRetenue(variantes, forme),
            region,
            niveau: null,
            note: null,
        }
    })
}
