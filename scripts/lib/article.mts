/**
 * Décomposition de l'article défini collé.
 *
 * Port TypeScript de la migration `20260903010000_article_colle_attestations.sql`,
 * qui faisait ce travail en SQL sur la base Supabase. La refonte reconstruit
 * la base depuis `data/`, donc la règle doit vivre dans le code — mais c'est
 * la MÊME règle, et elle ne se réinvente pas : chaque cas ci-dessous vient de
 * la mesure du 03/09/2026, pas d'une intuition sur l'alsacien.
 *
 * Ce n'est pas une réécriture (règle 1) : `article + formeSansArticle` redonne
 * la chaîne attestée octet à octet, et un CHECK du schéma l'impose.
 */

/** Longueur du préfixe article, ou null si la forme n'en porte pas — ou si
 *  elle en porte peut-être un mais qu'on ne peut pas le dire.
 *
 *  Les cinq cas mesurés le 03/09/2026, sur les 12 786 attestations lexicales
 *  de `culture_alsace` à forme unique :
 *
 *    `d'r ` / `s' ` / `d' ` espacés — 5 996 lignes, aucune ambiguïté :
 *        l'article est un mot séparé.
 *    `d'` / `s'` collés DEVANT UNE MAJUSCULE — 2 890 lignes : article élidé
 *        devant un nom propre.
 *
 *  Ce qui reste volontairement de côté :
 *
 *    collé devant une minuscule — 130 lignes. `d'frescha Luft` (article +
 *        adjectif) est indiscernable de `s'esch…` (pronom + verbe) sans une
 *        analyse grammaticale qu'on n'a pas. L'ambiguïté se signale, elle ne
 *        se comble pas.
 *    tout autre préfixe — 3 770 lignes : `z'`, `g'`, `sech`… hors du périmètre
 *        de l'article défini.
 */
function longueurArticle(alsacien: string): number | null {
    if (/^[dD]'r /.test(alsacien)) return 4
    if (/^[sS]' /.test(alsacien)) return 3
    if (/^[dD]' /.test(alsacien)) return 3
    if (/^[dD]'[A-ZÀ-Ý]/.test(alsacien)) return 2
    if (/^[sS]'[A-ZÀ-Ý]/.test(alsacien)) return 2
    return null
}

export interface ArticleDecompose {
    article: string | null
    sansArticle: string | null
}

const AUCUN: ArticleDecompose = { article: null, sansArticle: null }

/**
 * Ne décompose QUE ce que la migration décomposait :
 *   * la source `culture_alsace` — les autres n'ont jamais été mesurées ;
 *   * le lexique (`mot`, `expression`), pas les toponymes ni les prénoms ;
 *   * les chaînes à forme unique : une attestation qui empile des synonymes
 *     verrait l'article n'en préfixer qu'un seul.
 */
export function decomposerArticle(
    a: { alsacien: string; type: string; sourceCode: string },
): ArticleDecompose {
    if (a.sourceCode !== "culture_alsace") return AUCUN
    if (a.type !== "mot" && a.type !== "expression") return AUCUN
    if (a.alsacien.includes(",") || a.alsacien.includes(";")) return AUCUN

    const n = longueurArticle(a.alsacien)
    if (n === null) return AUCUN

    const article = a.alsacien.slice(0, n)
    const sansArticle = a.alsacien.slice(n)
    // La garantie se vérifie, elle ne se suppose pas : un `slice` mal borné
    // passerait inaperçu jusqu'au CHECK de la base, loin d'ici.
    if (article + sansArticle !== a.alsacien) return AUCUN
    return { article, sansArticle }
}
