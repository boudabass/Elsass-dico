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
    nb_sources: number
    statut?: StatutEntree
}

// --- Modèle de confiance à trois niveaux (décision de John, 02/09/2026) -----
//
// nb_sources compte des sources DISTINCTES — jamais nb_attestations, qui
// compte des attestations et peut monter sans qu'une seconde source
// intervienne (piège déjà documenté le 23/08/2026 pour arbitrer_entree()).
// Afficher nb_attestations en croyant afficher des sources surestimerait la
// confiance, exactement ce que ce badge existe pour empêcher.

export const NIVEAUX_CONFIANCE = ['rouge', 'jaune', 'vert'] as const
export type NiveauConfiance = typeof NIVEAUX_CONFIANCE[number]

export const LIBELLES_NIVEAU_CONFIANCE: Record<NiveauConfiance, string> = {
    rouge: 'Non recoupée',
    jaune: 'Recoupée (2 sources)',
    vert: 'Bien recoupée',
}

export function niveauConfiance(nbSources: number): NiveauConfiance {
    if (nbSources >= 3) return 'vert'
    if (nbSources === 2) return 'jaune'
    return 'rouge'
}

// Une variante telle que la renvoient candidats_arbitrage() et
// detail_candidat() : l'attestation brute, jamais retouchée, avec sa source.
export interface VarianteAttestee {
    attestation_id: string
    alsacien: string
    // Article défini collé, isolé pour l'affichage seul (migrations
    // 20260903010000 et 20260904000000). Ne sert jamais à décider d'un
    // recoupement ni à publier une forme autre que v.alsacien tel quel
    // (règle 1) — cf. mesure du 04/09/2026 : 0 candidat actuel n'est unifié
    // par ce retrait.
    article?: string | null
    alsacien_sans_article?: string | null
    graphie_origine: string
    region: Region | null
    type: TypeTerme
    source_id: string
    source_nom: string
    source_type: string
    fiabilite: number
    reference: string | null
    // Défauts observés dans la source et copiés verbatim (règle 1), rattachés
    // par `reference` — table anomalies_source, migration 20260907010000. La
    // liste des 390 de culture_alsace n'existait nulle part avant : « elles ne
    // partent jamais dans un lot » était une intention qu'aucun code
    // n'appliquait.
    anomalies?: AnomalieSource[] | null
    votes: number
    retenue?: boolean
}

export interface AnomalieSource {
    type: string
    detail: string
}

// Un candidat porte une anomalie dès qu'une seule de ses attestations en porte
// une : c'est ce qui le tient hors des lots cochés par défaut.
export function aAnomalieDeSource(variantes: VarianteAttestee[]): boolean {
    return variantes.some((v) => (v.anomalies?.length ?? 0) > 0)
}

// Le seuil de recoupement de la règle 2. Depuis le 07/09/2026, arbitrer_entree()
// ne le fait plus respecter : publier sur source unique est permis, c'est
// l'affichage du niveau de confiance qui porte la doctrine. Ce seuil ne gouverne
// donc plus qu'une chose — quels candidats un LOT a le droit d'emporter (cf.
// parcourirCandidatsMultiSources, src/app/actions/arbitrage.ts), la reprise en
// masse d'une source scrapée restant interdite. C'est désormais la seule
// barrière technique sur ce point : elle a quitté SQL pour TypeScript.
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

// --- Synonymes empilés dans une seule attestation ----------------------------
//
// culture_alsace écrit plusieurs équivalents dans un même champ, séparés par une
// virgule ou un point-virgule : « bleed, schwàchsennig. » pour « idiot ».
// 11 065 de ses 23 851 attestations lexicales sont dans ce cas (46 %) — publiées
// telles quelles, l'app rend la chaîne entière à qui cherche le mot.
//
// Scinder l'attestation elle-même reste hors périmètre (décision de John,
// 03/09/2026) : la ligne continue de dire ce que la source écrit. Ce découpage
// ne vit qu'au moment d'arbitrer, où le tableau `traductions` d'une entrée est
// justement fait pour porter plusieurs formes — « Premier est Roi » désigne la
// canonique. La proposition est relue et modifiable avant publication.
//
// GARANTIE (règle 1) : aucun caractère n'est ajouté ni modifié. Chaque forme
// rendue est un fragment contigu de la chaîne attestée, dont seuls des
// séparateurs et de la ponctuation ont été retirés — c'est vérifié fragment par
// fragment, et un découpage qui ne le vérifie pas n'est pas proposé.
//
// Trois gardes, parce qu'une virgule ne sépare pas toujours des synonymes :
//   * aucune parenthèse ni crochet. Ils portent des gloses explicatives
//     (« z' comme z'Mehlhüsa, ze Schtrosburi, z'füass (à pied). ») et les
//     relevés dialectaux de martin_lienhart, où découper serait faux. Mesuré :
//     34 chaînes sur 11 069 en contiennent, et aucune n'a de virgule à
//     l'intérieur d'une parenthèse.
//   * des fragments courts et peu nombreux — un fragment long signale une
//     explication, pas une forme.
//   * l'ambiguïté ne se comble pas : hors de ces bornes, [] est rendu et
//     l'arbitre reprend la forme entière comme avant.
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

// --- Traçabilité contre contenu ----------------------------------------------
//
// Une entrée porte deux choses distinctes : les attestations RETENUES, qui
// fondent son badge de confiance, et les formes PUBLIÉES, seules visibles du
// visiteur. Rien ne les relie — on peut cocher deux sources et ne publier que
// la forme de l'une. Mesuré en base le 08/09/2026 : 6 des 339 entrées valides
// sont dans ce cas, dont « idiot » qui affiche 🟡 2 sources devant
// « bleed, schwàchsennig. », forme que seule culture_alsace écrit, tandis que
// le « Simbel » du wiktionnaire n'apparaît nulle part.
//
// La cause est structurelle et non une inattention : l'écran de détail coche
// toutes les attestations à l'ouverture (traçabilité pleine) et démarre les
// traductions à un champ vide. Reprendre une seule forme puis publier suffit.
//
// Cette fonction nomme l'écart. Elle ne le corrige pas : décocher la source ou
// ajouter la forme sont deux arbitrages valides, et c'est l'humain qui tranche
// (règle 4). La comparaison se fait à la ponctuation près, comme partout
// ailleurs ici — « Jüli. » et « Jüli » sont la même forme (doctrine du
// 23/08/2026), et crier dessus noierait les vrais écarts.
export function formesRetenuesNonPubliees(
    variantes: VarianteAttestee[],
    selection: string[],
    traductions: Traduction[],
): VarianteAttestee[] {
    const publiees = new Set(
        traductions.map((t) => cleDeForme(t.alsacien)).filter((c) => c !== ''),
    )

    const vues = new Set<string>()
    const manquantes: VarianteAttestee[] = []

    for (const v of variantes) {
        if (!selection.includes(v.attestation_id)) continue
        const cle = cleDeForme(v.alsacien)
        if (!cle || publiees.has(cle) || vues.has(cle)) continue
        // Une source qui empile plusieurs équivalents dans un champ
        // (« bleed, schwàchsennig. ») est couverte dès qu'UN de ses fragments
        // est publié : scinderSynonymes() ne rend que du verbatim, et retenir
        // un seul des synonymes d'une source est un arbitrage légitime, pas une
        // perte de témoignage. Sans ce test, le bandeau crierait sur toute
        // entrée passée par le bouton « En N formes » — c'est-à-dire sur le
        // geste même qu'il est censé encourager, et sur 46 % du lexique de
        // culture_alsace. Constaté à l'écran le 09/09/2026 en réparant « idiot ».
        if (scinderSynonymes(v.alsacien).some((f) => publiees.has(cleDeForme(f)))) continue
        vues.add(cle)
        manquantes.push(v)
    }

    return manquantes
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

// Les deux traits dialectaux qui expliquent, à eux seuls, une divergence sur
// cinq. Mesurés en base le 01/09/2026 sur les 27 179 attestations, pas supposés.
//
// 1. ALTERNANCE a ~ e. Il y a une vraie isoglosse, et culture_alsace la note :
//    ses toponymes du Haut-Rhin finissent en -a à 99 % (149 contre 1), ceux du
//    Bas-Rhin à 2 % (6 contre 238) ; ses digrammes valent ia/ua à 87 % au sud et
//    0 % au nord. alsacien_wikipedia et wiktionnaire_fr écrivent -e et ie/ue
//    partout, y compris pour une commune du Haut-Rhin. D'où le sens
//    unidirectionnel du désaccord : sur 72 divergences a~e du Haut-Rhin, 71 ont
//    culture_alsace du côté a. Ce n'est donc pas un désaccord entre deux
//    témoins, c'est un témoin qui note le parler local et un autre qui ne le
//    note pas.
// 2. SONORISATION p~b, t~d, k~g (Mànschpàch / Mànschbàch).
//
// Ces normalisations servent à TRIER et à nommer l'écart, jamais à décider d'un
// recoupement : deux graphies restent deux graphies, et les confondre effacerait
// la question posée à l'arbitre. Même mise en garde que cleDeTri ci-dessus.
function cleSansAlternanceAE(alsacien: string): string {
    return cleDeTri(alsacien).replace(/[ae]/g, '@')
}

// sch et ch d'abord, sinon le c de sch serait pris pour une occlusive isolée.
function cleSansSonorisation(alsacien: string): string {
    return cleDeTri(alsacien)
        .replace(/sch/g, '$')
        .replace(/ch/g, '%')
        .replace(/ck/g, 'k')
        .replace(/b/g, 'p')
        .replace(/d/g, 't')
        .replace(/g/g, 'k')
        .replace(/y/g, 'i')
}

function cleSansTraits(alsacien: string): string {
    return cleSansSonorisation(alsacien).replace(/[ae]/g, '@')
}

// Ce à quoi tient l'écart entre les formes. Sert à ordonner la file et à dire à
// l'arbitre ce qu'il regarde — jamais à trancher pour lui.
export const NATURES_DIVERGENCE = [
    'accents',
    'alternance_regionale',
    'sonorisation',
    'traits_cumules',
    'autre',
] as const
export type NatureDivergence = typeof NATURES_DIVERGENCE[number]

export const LIBELLES_NATURE_DIVERGENCE: Record<NatureDivergence, string> = {
    accents: 'accents seuls',
    alternance_regionale: 'alternance a ~ e',
    sonorisation: 'sonorisation p ~ b',
    traits_cumules: 'a ~ e et sonorisation',
    autre: '',
}

// Ordre d'affichage de la file : le plus mécanique d'abord. C'est un confort de
// lecture, pas une hiérarchie de légitimité — chacune reste un arbitrage entier.
const RANG_NATURE: Record<NatureDivergence, number> = {
    accents: 0,
    alternance_regionale: 1,
    traits_cumules: 2,
    sonorisation: 3,
    autre: 4,
}

export function rangNature(nature: NatureDivergence): number {
    return RANG_NATURE[nature]
}

function natureDe(graphies: string[]): NatureDivergence {
    if (new Set(graphies.map(cleDeTri)).size === 1) return 'accents'
    if (new Set(graphies.map(cleSansAlternanceAE)).size === 1) return 'alternance_regionale'
    if (new Set(graphies.map(cleSansSonorisation)).size === 1) return 'sonorisation'
    if (new Set(graphies.map(cleSansTraits)).size === 1) return 'traits_cumules'
    return 'autre'
}

// La forme qui porte le trait du Haut-Rhin : finale -a, ou digramme ia/ua. Ne
// vaut QUE pour une commune du Haut-Rhin et une divergence a~e — au Bas-Rhin les
// 4 cas mesurés vont dans tous les sens, il n'y a rien à orienter, et inventer
// une règle là où la mesure n'en montre pas serait pire que de ne rien dire.
// Renvoie null dès que deux formes portent le trait : l'ambiguïté se signale,
// elle ne se comble pas.
function formeDuHautRhin(formes: FormeCandidate[], region: Region | null): string | null {
    if (region !== 'haut_rhin') return null

    const marquees = formes.filter((f) => {
        const plat = cleDeTri(f.graphie)
        return plat.endsWith('a') || /[iu]a/.test(plat)
    })
    return marquees.length === 1 ? marquees[0].graphie : null
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
    // Triées : la forme qui note le parler local d'abord s'il y en a une,
    // sinon la plus attestée. Aucune n'est retenue par le code — l'ordre n'est
    // qu'un confort de lecture, le choix reste entier.
    formes: FormeCandidate[]
    // Ce à quoi tient l'écart. Sert à ordonner la file et à l'annoncer.
    nature: NatureDivergence
    // La forme qui note le parler du Haut-Rhin, quand la mesure permet de la
    // désigner sans ambiguïté. Proposée en premier, jamais choisie d'office.
    formeRegionale: string | null
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

    const candidates: FormeCandidate[] = formes.map((f) => ({
        graphie: f.graphie,
        nbSources: f.sources.size,
        nbAttestations: f.nbAttestations,
        region: f.region,
    }))

    const nature = natureDe(candidates.map((f) => f.graphie))
    // La région d'un toponyme est celle de la commune : elle est la même sur
    // toutes ses attestations, la première non nulle suffit donc.
    const region = candidates.find((f) => f.region !== null)?.region ?? null
    // L'orientation n'a de sens que là où la mesure l'établit : une divergence
    // a~e (seule ou cumulée à la sonorisation) sur une commune du Haut-Rhin.
    const formeRegionale =
        nature === 'alternance_regionale' || nature === 'traits_cumules'
            ? formeDuHautRhin(candidates, region)
            : null

    return {
        formes: formeRegionale
            ? [
                  ...candidates.filter((f) => f.graphie === formeRegionale),
                  ...candidates.filter((f) => f.graphie !== formeRegionale),
              ]
            : candidates,
        nature,
        formeRegionale,
    }
}

// Le tableau traductions à publier quand l'arbitre a retenu `graphie` : la forme
// choisie en index 0 — « Premier est Roi » — et les autres formes attestées
// conservées derrière, la doctrine gardant les variantes quand elles diffèrent.
// Retourne [] si la graphie n'est pas l'une des formes attestées : rien ne doit
// pouvoir publier une forme que personne n'a écrite (règle 1).
export function traductionsArbitrees(formes: FormeCandidate[], graphie: string): Traduction[] {
    const choisie = formes.find((f) => f.graphie === graphie)
    if (!choisie) return []

    return [choisie, ...formes.filter((f) => f.graphie !== graphie)].map((f) => ({
        alsacien: f.graphie,
        region: f.region,
        niveau: null,
        note: null,
    }))
}
