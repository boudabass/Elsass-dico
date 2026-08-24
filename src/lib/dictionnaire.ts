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
// distinctes ferait manquer de vrais recoupements. Sert de CLÉ de comparaison
// seulement — ce qui est publié reste une graphie copiée telle quelle.
function cleDeForme(alsacien: string): string {
    return alsacien.trim().replace(/[.;,\s]+$/, '')
}

// Une forme alsacienne attestée, avec ce qui la fonde. Les regrouper une fois
// évite de re-normaliser les mêmes chaînes à chaque question posée : qui
// l'atteste, quelle graphie publier, quelle région.
interface FormeAttestee {
    graphie: string
    sources: Set<string>
    region: Region | null
    nbAttestations: number
}

function grouperParForme(variantes: VarianteAttestee[]): FormeAttestee[] {
    const parForme = new Map<string, FormeAttestee>()

    for (const v of variantes) {
        const cle = cleDeForme(v.alsacien)
        if (!cle) continue

        const graphie = v.alsacien.trim()
        const connue = parForme.get(cle)
        if (!connue) {
            parForme.set(cle, {
                graphie,
                sources: new Set([v.source_id]),
                region: v.region,
                nbAttestations: 1,
            })
            continue
        }

        connue.sources.add(v.source_id)
        connue.nbAttestations++
        // On préfère la graphie qu'une source écrit sans ponctuation finale :
        // c'est encore un verbatim, pas une réécriture (règle 1). À défaut, la
        // première attestée part telle quelle — mieux vaut une coquille de
        // source qu'une forme que personne n'a écrite.
        if (connue.graphie !== cle && graphie === cle) connue.graphie = graphie
        connue.region ??= v.region
    }

    return Array.from(parForme.values())
}

// Le tableau traductions d'un candidat recoupé, ou [] s'il ne l'est pas.
// Trier par nombre de sources décroissant suffit à tout ordonner : la forme
// d'accord se retrouve en index 0 — la canonique au sens « Premier est Roi » —
// et les formes à source unique suivent comme variantes, que la doctrine
// conserve quand elles diffèrent. Aucune forme n'est inventée.
export function traductionsRecoupees(variantes: VarianteAttestee[]): Traduction[] {
    const formes = grouperParForme(variantes).sort((a, b) => b.sources.size - a.sources.size)

    if (!formes.length || formes[0].sources.size < SOURCES_MINIMUM) return []

    return formes.map((f) => ({
        alsacien: f.graphie,
        region: f.region,
        niveau: null,
        note: null,
    }))
}

// --- Divergences -------------------------------------------------------------
//
// Le symétrique du recoupement : deux sources ou plus attestent le mot, mais
// aucune forme n'est écrite pareil par deux d'entre elles. La doctrine ne les
// publie pas en lot — « Divergence entre sources = entrée marquée pour arbitrage
// manuel ». Choisir la forme canonique EST l'arbitrage : ce module présente le
// choix, il ne le fait jamais.

// Normalisation volontairement plus lâche que cleDeForme : casse et diacritiques
// écrasés. Elle ne sert QU'À TRIER — repérer les divergences où il n'y a qu'un
// accent en jeu (Barr / Bàrr), qui se tranchent d'un coup d'œil à la règle
// ORTHAL. Elle ne doit JAMAIS servir à décider d'un recoupement : en Orthal les
// diacritiques notent des sons, deux graphies restent deux graphies, et les
// confondre effacerait la question posée à l'arbitre.
// U+0300..U+036F : les diacritiques combinants que NFD détache des lettres.
// Échappés plutôt qu'écrits littéralement — un caractère combinant seul dans
// une source se déplace au moindre aller-retour d'encodage. On n'emploie pas
// \p{Mn}, qui exigerait une cible ES6 dans ce tsconfig.
function cleDeTri(alsacien: string): string {
    return cleDeForme(alsacien)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
}

// Une forme en lice, telle qu'elle sera proposée à l'arbitre. `graphie` est
// toujours le verbatim d'une attestation (règle 1).
export interface FormeCandidate {
    graphie: string
    nbSources: number
    nbAttestations: number
    region: Region | null
}

export interface Divergence {
    // Triées : la plus attestée d'abord. Aucune n'est privilégiée par le code —
    // l'ordre n'est qu'un confort de lecture, le choix reste entier.
    formes: FormeCandidate[]
    // Toutes les formes se ramènent à la même chaîne une fois casse et
    // diacritiques ignorés. Sert à remonter les arbitrages faciles en tête.
    diacritiquesSeuls: boolean
}

// Le détail d'un candidat divergent, ou null s'il ne l'est pas — soit qu'il
// soit recoupé (deux sources sur la même forme), soit qu'il n'ait qu'une forme.
export function analyserDivergence(variantes: VarianteAttestee[]): Divergence | null {
    const formes = grouperParForme(variantes).sort(
        (a, b) => b.sources.size - a.sources.size || b.nbAttestations - a.nbAttestations,
    )

    if (formes.length < 2) return null
    // Recoupé : ce candidat relève de l'onglet des recoupées, pas d'ici.
    if (formes[0].sources.size >= SOURCES_MINIMUM) return null

    return {
        formes: formes.map((f) => ({
            graphie: f.graphie,
            nbSources: f.sources.size,
            nbAttestations: f.nbAttestations,
            region: f.region,
        })),
        diacritiquesSeuls: new Set(formes.map((f) => cleDeTri(f.graphie))).size === 1,
    }
}

// Le tableau traductions à publier quand l'arbitre a retenu `graphie` : la forme
// choisie en index 0 — « Premier est Roi » — et les autres formes attestées
// conservées derrière, la doctrine gardant les variantes quand elles diffèrent.
// Retourne [] si la graphie n'est pas l'une des formes attestées : rien ne doit
// pouvoir publier une forme que personne n'a écrite (règle 1).
export function traductionsArbitrees(divergence: Divergence, graphie: string): Traduction[] {
    const choisie = divergence.formes.find((f) => f.graphie === graphie)
    if (!choisie) return []

    return [choisie, ...divergence.formes.filter((f) => f.graphie !== graphie)].map((f) => ({
        alsacien: f.graphie,
        region: f.region,
        niveau: null,
        note: null,
    }))
}
