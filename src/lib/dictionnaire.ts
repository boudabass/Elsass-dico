// Vocabulaire du dictionnaire — types d'affichage et normalisations de formes.
//
// Purgé le 12/09/2026 de tout ce qui servait l'arbitrage (`traductionsRecoupees`,
// `analyserDivergence`, `traductionsArbitrees`, `formesRetenuesNonPubliees`,
// `grouperParForme`, `formeDuHautRhin`, `SOURCES_MINIMUM`, l'enum `Region`, les
// statuts d'entrée). La refonte du 11/09 n'arbitre plus : toutes les variantes
// coexistent, portées par leurs témoins. Ce qui reste ici est ce que le doc 20
// garde explicitement — et `cleDeForme()` / `scinderSynonymes()` sont utilisées
// par la dérivation, donc mesurées sur les 27 179 attestations réelles.

export const TYPES_TERME = ['mot', 'expression', 'proverbe', 'toponyme', 'prenom'] as const
export type TypeTerme = typeof TYPES_TERME[number]

export const LIBELLES_TYPE_TERME: Record<TypeTerme, string> = {
    mot: 'Mot',
    expression: 'Expression',
    proverbe: 'Proverbe',
    toponyme: 'Toponyme',
    prenom: 'Prénom',
}

export function estTypeTermeValide(valeur: string): valeur is TypeTerme {
    return (TYPES_TERME as readonly string[]).includes(valeur)
}

// --- Ce qui fonde une forme --------------------------------------------------
//
// Deux comptes, JAMAIS additionnés : des sources écrites d'un côté, des villages
// de l'autre. Un village n'est pas une source bibliographique et une source ne
// parle depuis aucun village — les confondre dans un seul chiffre est l'erreur
// exacte de la PR #41, trouvée en production le 09/09/2026.

export interface FormeAffichee {
    id: string
    forme: string
    /** Article défini isolé pour l'affichage (migration 20260903010000).
     *  `article + formeSansArticle` redonne `forme` octet à octet. */
    article: string | null
    formeSansArticle: string | null
    nbSources: number
    nbVillages: number
}

export interface VarianteDetaillee extends FormeAffichee {
    sources: { nom: string; url: string | null }[]
    villages: { id: number; nom: string; slug: string }[]
}

/** Une forme telle qu'elle apparaît dans une LISTE : la graphie, et de quoi
 *  dire ce qui la fonde. Les deux comptes voyagent avec la forme, jamais après
 *  elle — « ne jamais afficher une forme sans dire ce qui la fonde » vaut aussi
 *  dans les résultats de recherche, pas seulement sur la fiche. */
export interface FormeApercu {
    forme: string
    nbSources: number
    nbVillages: number
}

export interface LemmeResume {
    id: string
    francais: string
    contexte: string
    type: TypeTerme
    /** Département INSEE quand le lemme EST une commune. Il prime sur `contexte`
     *  à l'affichage : le contexte d'un toponyme vient de la source qui a créé
     *  le lemme la première, et il dit n'importe quoi selon laquelle — `Barr`
     *  porte « Alsace ; Géographie » du wiktionnaire, `Mulhouse` porte
     *  « Haut-Rhin » de culture_alsace. Le référentiel, lui, ne varie pas. */
    departement: string | null
    /** Les premières formes, pour l'aperçu d'une liste. */
    formes: FormeApercu[]
    nbFormes: number
}

export const LIBELLES_DEPARTEMENT: Record<string, string> = {
    '67': 'Bas-Rhin',
    '68': 'Haut-Rhin',
    '57': 'Moselle',
}

/** Ce qu'on affiche sous le mot français : le département s'il s'agit d'une
 *  commune, le contexte de la source sinon. */
export function precisionLemme(lemme: LemmeResume): string {
    if (lemme.departement) return LIBELLES_DEPARTEMENT[lemme.departement] ?? lemme.departement
    return lemme.contexte
}

export interface LemmeDetaille {
    id: string
    francais: string
    contexte: string
    type: TypeTerme
    /** Un toponyme EST une commune : la fiche du mot et la page du village
     *  sont deux vues de la même chose. */
    commune: { id: number; nom: string; slug: string; departement: string } | null
    variantes: VarianteDetaillee[]
}

// --- Niveau de confiance -----------------------------------------------------
//
// Compte des SOURCES ÉCRITES distinctes, jamais un total de témoignages — une
// source peut fournir deux lignes sur le même mot sans que personne d'autre ne
// la confirme (piège documenté le 23/08/2026, puis reproduit le 09/09).

export const NIVEAUX_CONFIANCE = ['rouge', 'jaune', 'vert'] as const
export type NiveauConfiance = typeof NIVEAUX_CONFIANCE[number]

export const LIBELLES_NIVEAU_CONFIANCE: Record<NiveauConfiance, string> = {
    rouge: 'Une source',
    jaune: 'Deux sources',
    vert: 'Trois sources ou plus',
}

export function niveauConfiance(nbSources: number): NiveauConfiance {
    if (nbSources >= 3) return 'vert'
    if (nbSources === 2) return 'jaune'
    return 'rouge'
}

// --- Normalisation des formes ------------------------------------------------

// La ponctuation finale est un artefact de source, pas une différence de forme :
// culture_alsace termine ses entrées de lexique par un point (« Jüli. ») là où
// wiktionnaire_fr ne le fait pas (« Jüli »). Sert de CLÉ de comparaison
// seulement — ce qui est affiché reste une graphie copiée telle quelle.
//
// La dérivation `attestations` -> `Variante` s'en sert pour dédoublonner, et
// elle doit utiliser EXACTEMENT cette fonction-là. Une clé recalculée « à peu
// près » ailleurs finirait par diverger sans que rien ne le signale.
export function cleDeForme(alsacien: string): string {
    return alsacien.trim().replace(/[.;,\s]+$/, '')
}

// --- Synonymes empilés dans une seule attestation ----------------------------
//
// culture_alsace écrit plusieurs équivalents dans un même champ, séparés par une
// virgule ou un point-virgule : « bleed, schwàchsennig. » pour « idiot ».
// 11 065 de ses 23 851 attestations lexicales sont dans ce cas (46 %) — rendues
// telles quelles, l'app répond la chaîne entière à qui cherche le mot.
//
// GARANTIE (règle 1) : aucun caractère n'est ajouté ni modifié. Chaque forme
// rendue est un fragment contigu de la chaîne attestée, dont seuls des
// séparateurs et de la ponctuation ont été retirés — c'est vérifié fragment par
// fragment, et un découpage qui ne le vérifie pas n'est pas proposé. Mesurée sur
// la base entière : 10 608 chaînes scindables, 461 refusées, 0 violation.
//
// Trois gardes, parce qu'une virgule ne sépare pas toujours des synonymes :
//   * aucune parenthèse ni crochet. Ils portent des gloses explicatives
//     (« z' comme z'Mehlhüsa, ze Schtrosburi, z'füass (à pied). ») et les
//     relevés dialectaux de martin_lienhart, où découper serait faux. Mesuré :
//     34 chaînes sur 11 069 en contiennent, et aucune n'a de virgule à
//     l'intérieur d'une parenthèse.
//   * des fragments courts et peu nombreux — un fragment long signale une
//     explication, pas une forme.
//   * l'ambiguïté ne se comble pas : hors de ces bornes, [] est rendu.
const SEPARATEUR_SYNONYME = /(\s*[;,]\s*)/
const GLOSE = /[()[\]]/
const SYNONYMES_MAX = 6
const MOTS_PAR_SYNONYME_MAX = 3

export function scinderSynonymes(alsacien: string): string[] {
    const brut = alsacien.trim()
    if (GLOSE.test(brut)) return []

    // Groupe capturant : les fragments tombent aux index pairs, les séparateurs
    // aux impairs. Moins de 3 morceaux = aucun séparateur, rien à scinder.
    const morceaux = brut.split(SEPARATEUR_SYNONYME)
    if (morceaux.length < 3) return []

    const fragments = morceaux.filter((_, i) => i % 2 === 0)
    const formes = fragments.map(cleDeForme)

    if (formes.length < 2 || formes.length > SYNONYMES_MAX) return []
    if (formes.some((f) => !f || f.split(/\s+/).length > MOTS_PAR_SYNONYME_MAX)) return []

    // Contrôle de fidélité : chaque forme doit être le début exact de son
    // fragment, le reste n'étant que ponctuation ou espaces. C'est ce qui
    // interdit qu'un caractère de la source disparaisse en silence.
    const fidele = fragments.every((f, i) => {
        const propre = f.trim()
        return propre.startsWith(formes[i]) && /^[.;,\s]*$/.test(propre.slice(formes[i].length))
    })

    return fidele ? formes : []
}

// --- Clés de rapprochement ---------------------------------------------------
//
// Ces trois clés servent à RAPPROCHER et à ORDONNER des formes voisines, jamais
// à les fusionner ni à décider qu'elles n'en font qu'une. En Orthal les
// diacritiques notent des sons — `wisse` (blancs) contre `wìsse` (savoir) — et
// les écraser pour « trouver » un rapprochement ne trouve rien, ça efface la
// question. C'est l'erreur du « +13 » du 24/08/2026 : gain réel +1.
//
// U+0300..U+036F : les diacritiques combinants que NFD détache des lettres.
// Échappés plutôt qu'écrits littéralement — un caractère combinant seul dans
// une source se déplace au moindre aller-retour d'encodage.
export function cleDeTri(alsacien: string): string {
    return cleDeForme(alsacien)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
}

// ALTERNANCE a ~ e. Il y a une vraie isoglosse, et culture_alsace la note : ses
// toponymes du Haut-Rhin finissent en -a à 99 % (149 contre 1), ceux du Bas-Rhin
// à 2 % (6 contre 238). alsacien_wikipedia et wiktionnaire_fr écrivent -e
// partout, y compris pour une commune du Haut-Rhin. Mesuré en base le
// 01/09/2026, puis retrouvé sur le lexique le 12/09 (doc 22).
export function cleSansAlternanceAE(alsacien: string): string {
    return cleDeTri(alsacien).replace(/[ae]/g, '@')
}

// SONORISATION p~b, t~d, k~g (Mànschpàch / Mànschbàch).
// sch et ch d'abord, sinon le c de sch serait pris pour une occlusive isolée.
export function cleSansSonorisation(alsacien: string): string {
    return cleDeTri(alsacien)
        .replace(/sch/g, '$')
        .replace(/ch/g, '%')
        .replace(/ck/g, 'k')
        .replace(/b/g, 'p')
        .replace(/d/g, 't')
        .replace(/g/g, 'k')
        .replace(/y/g, 'i')
}
