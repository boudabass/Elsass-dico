#!/usr/bin/env -S npx tsx
/**
 * Dérive le dictionnaire depuis l'archive : `attestations` → `Lemme` /
 * `Variante` / `Temoignage`.
 *
 * **C'est le cœur de la refonte du 11/09/2026, et ce n'est PAS le retour de
 * `attestations → entrees`.** L'ancienne chaîne exigeait un arbitrage humain
 * par mot et a plafonné à 338 entrées en quatre mois. Celle-ci est automatique
 * et exhaustive : les 27 179 lignes deviennent toutes des variantes visibles,
 * sans une décision de plus. Aucune forme n'est choisie, aucune n'est écartée,
 * aucune n'est canonique.
 *
 * Ce que le script garantit :
 *
 *   * **Règle 1** — toute `forme` produite est un fragment contigu d'une chaîne
 *     attestée, dont seuls des séparateurs et de la ponctuation ont été
 *     retirés. Aucun caractère n'est ajouté ni modifié. C'est la garantie déjà
 *     mesurée de `scinderSynonymes()` (10 608 chaînes scindables, 0 violation),
 *     et elle est re-vérifiée ici forme par forme.
 *   * **Rejouable** — un second passage ne crée rien et ne change rien.
 *   * **N'efface jamais rien.** Il n'y a donc pas de « purge et régénère » : une
 *     variante contribuée par un membre ne peut pas être emportée par un rejeu.
 *     Contrepartie : une attestation retirée de l'archive laisserait sa variante
 *     derrière elle, à retirer à la main.
 *
 * Ce qu'il ne fait pas, exprès : deviner. Un toponyme dont le nom ne désigne
 * aucune commune reste sans commune, et le rapport le dit.
 *
 *   DATABASE_URL=… pnpm exec tsx scripts/deriver.mts
 */
import { randomUUID } from "node:crypto"

import { cleDeForme, scinderSynonymes } from "../src/lib/dictionnaire.ts"
import { cleFrancais, nomNormalise, ouvrirBase, parLots, slugifier, titre } from "./lib/base.mts"

const LEXIQUE = new Set(["mot", "expression", "proverbe"])

/** Les 7 pages du lexique de `culture_alsace` où la source déclare elle-même,
 *  par un bandeau en tête, avoir mélangé des formes du Bas-Rhin :
 *  « Cette page a été enrichie avec des expressions du bas alémanique du Nord
 *  (Bas-Rhinois). »
 *
 *  Liste en dur et non recalculée : elle vit dans l'archive de la branche
 *  `data`, que ce script n'a pas à lire. `scripts/mesures/aire_declaree.py` la
 *  régénère et la contrôle — si elle changeait, il le dirait. */
const PAGES_MELANGEES = new Set([
    "page_af.htm", "page_bf.htm", "page_cf.htm", "page_df.htm",
    "page_ef.htm", "page_ff.htm", "page_gf.htm",
])

/** Département porté par le contexte d'un toponyme. Les autres contextes
 *  (« Alsace ; Géographie », vide) ne désignent pas de département : ils ne
 *  permettent donc pas de trancher entre les deux Bouxwiller, et le
 *  rattachement s'abstient. */
const DEPARTEMENT_DU_CONTEXTE: Record<string, string> = {
    "Haut-Rhin": "68",
    "Bas-Rhin": "67",
}

/** Sépare les morceaux d'une clé composée. Un caractère qu'aucun français,
 *  aucune forme alsacienne et aucun contexte ne contient — un espace ou un
 *  tiret fusionneraient deux clés différentes dès qu'un champ en contient un. */
const SEP = "\u0000"

const prisma = ouvrirBase()

interface FormeDerivee {
    forme: string
    article: string | null
    formeSansArticle: string | null
}

/** Les formes portées par une attestation, et leur article quand la base l'a
 *  décomposé (migration 20260903010000).
 *
 *  L'article n'est reporté que sur une attestation à forme unique : sur une
 *  chaîne scindée, il ne préfixerait qu'un des fragments et le rattacher aux
 *  autres serait faux. Aucune perte en pratique — les 8 886 attestations
 *  décomposées ne contiennent ni virgule ni point-virgule (vérifié le
 *  03/09/2026, et recompté par ce script). */
function formesDe(a: {
    alsacien: string
    article: string | null
    alsacienSansArticle: string | null
}): FormeDerivee[] {
    const fragments = scinderSynonymes(a.alsacien)
    if (fragments.length) {
        return fragments.map((f) => ({ forme: f, article: null, formeSansArticle: null }))
    }

    const forme = cleDeForme(a.alsacien)
    if (!forme) return []

    // La forme perd sa ponctuation finale, donc la partie sans article doit la
    // perdre aussi — sinon la concaténation ne redonne plus la forme et le
    // CHECK du schéma refuse la ligne, à juste titre.
    if (a.article && a.alsacienSansArticle) {
        const sansArticle = cleDeForme(a.alsacienSansArticle)
        if (a.article + sansArticle === forme) {
            return [{ forme, article: a.article, formeSansArticle: sansArticle }]
        }
    }
    return [{ forme, article: null, formeSansArticle: null }]
}

try {
    titre("Lecture de l'archive")
    const [attestations, communes, sources] = await Promise.all([
        prisma.attestation.findMany({ orderBy: { id: "asc" } }),
        prisma.commune.findMany(),
        prisma.source.findMany(),
    ])
    const codeSource = new Map(sources.map((s) => [s.id, s.code]))
    console.log(`  ${attestations.length} attestations, ${communes.length} communes`)
    if (!attestations.length) {
        throw new Error("Archive vide : lancer scripts/importer-archive.mts d'abord.")
    }

    // --- Index des communes -------------------------------------------------
    const parNomExact = new Map<string, typeof communes>()
    const parNomNormalise = new Map<string, typeof communes>()
    for (const c of communes) {
        for (const [index, cle] of [
            [parNomExact, c.nom] as const,
            [parNomNormalise, nomNormalise(c.nom)] as const,
        ]) {
            const liste = index.get(cle)
            if (liste) liste.push(c)
            else index.set(cle, [c])
        }
    }

    // --- Construction en mémoire -------------------------------------------
    titre("Dérivation")
    interface LemmeDerive {
        cle: string
        contexte: string
        type: string
        francais: string
        communeId: number | null
        slug: string | null
    }
    const lemmes = new Map<string, LemmeDerive>()
    const variantes = new Map<string, { cleLemme: string } & FormeDerivee>()
    // Indexés par (variante, attestation) : une attestation qui répète deux
    // fois la même forme (`s'Rossisa, s'Rossisa`) ne témoigne qu'une fois. Une
    // répétition interne à une source n'a jamais valu deux témoignages — c'est
    // le précédent `Altenbach` de la campagne 1. Sans ce dédoublonnage ici, la
    // contrainte d'unicité l'absorberait en base sans rien dire, et le rapport
    // annoncerait un total que la base ne contient pas.
    const temoignages = new Map<string, {
        cleVariante: string
        sourceId: string
        attestationId: string
        aireDeclaree: string | null
    }>()
    let repetitionsInternes = 0

    const rapport = {
        sansForme: 0,
        scindees: 0,
        decomposeesEtScindables: 0,
        violationsRegle1: [] as string[],
        toponymes: { exact: 0, typographie: 0, sansCommune: 0, ambigu: 0 },
        sansCommune: new Map<string, string>(),
        ambigus: [] as string[],
        parTypographie: [] as string[],
    }

    for (const a of attestations) {
        const cle = cleFrancais(a.francais)
        if (!cle) { rapport.sansForme++; continue }
        const cleLemme = `${cle}${SEP}${a.contexte}${SEP}${a.type}`

        const connu = lemmes.get(cleLemme)
        if (!connu) {
            lemmes.set(cleLemme, {
                cle,
                contexte: a.contexte,
                type: a.type,
                // Le français retenu est celui qui ne porte pas de ponctuation
                // finale : c'est celui qu'un visiteur tape. Il reste toujours
                // écrit tel quel par une source — rien n'est fabriqué.
                francais: a.francais.trim().replace(/[.;,\s]+$/, "") || a.francais.trim(),
                communeId: null,
                slug: null,
            })
        }

        const formes = formesDe(a)
        if (!formes.length) { rapport.sansForme++; continue }
        if (formes.length > 1) rapport.scindees++
        if (a.article && /[;,]/.test(a.alsacien)) rapport.decomposeesEtScindables++

        for (const f of formes) {
            // Garantie règle 1, re-vérifiée ici et pas seulement supposée : la
            // forme doit être présente telle quelle dans la chaîne attestée.
            if (!a.alsacien.includes(f.forme)) {
                rapport.violationsRegle1.push(`${a.id} : « ${f.forme} » absente de « ${a.alsacien} »`)
                continue
            }
            const cleForme = cleDeForme(f.forme)
            if (!cleForme) continue
            const cleVariante = `${cleLemme}${SEP}${cleForme}`
            if (!variantes.has(cleVariante)) variantes.set(cleVariante, { cleLemme, ...f })

            const cleTemoignage = `${cleVariante}${SEP}${a.id}`
            if (temoignages.has(cleTemoignage)) { repetitionsInternes++; continue }
            temoignages.set(cleTemoignage, {
                cleVariante,
                sourceId: a.sourceId,
                attestationId: a.id,
                aireDeclaree: aireDe(a),
            })
        }
    }

    /** Ce que la source DÉCLARE de son propre parler — jamais ce qu'on en
     *  déduit. Voir documentation/22-MESURE-MARQUEUR-AE.md. */
    function aireDe(a: typeof attestations[number]): string | null {
        if (codeSource.get(a.sourceId) !== "culture_alsace") return null
        if (!LEXIQUE.has(a.type)) return null
        const page = (a.reference ?? "").split("#")[0]
        if (!page || PAGES_MELANGEES.has(page)) return null
        return "bas_alemanique_sud"
    }

    // --- Toponymes : rattachement aux communes ------------------------------
    for (const lemme of lemmes.values()) {
        if (lemme.type !== "toponyme") continue
        const departement = DEPARTEMENT_DU_CONTEXTE[lemme.contexte]
        const filtrer = (liste: typeof communes | undefined) =>
            (liste ?? []).filter((c) => !departement || c.departement === departement)

        const exacts = filtrer(parNomExact.get(lemme.francais))
        if (exacts.length === 1) {
            lemme.communeId = exacts[0].id
            rapport.toponymes.exact++
            continue
        }
        if (exacts.length > 1) {
            rapport.toponymes.ambigu++
            rapport.ambigus.push(`${lemme.francais} [${lemme.contexte}]`)
            continue
        }

        // Seconde passe : égalité stricte après normalisation typographique du
        // nom FRANÇAIS (ligature, diacritique, tiret). Ce n'est pas un
        // rapprochement approché — et elle exige un candidat unique.
        const proches = filtrer(parNomNormalise.get(nomNormalise(lemme.francais)))
        if (proches.length === 1) {
            lemme.communeId = proches[0].id
            rapport.toponymes.typographie++
            if (rapport.parTypographie.length < 100) {
                rapport.parTypographie.push(`${lemme.francais} → ${proches[0].nom}`)
            }
            continue
        }
        if (proches.length > 1) {
            rapport.toponymes.ambigu++
            rapport.ambigus.push(`${lemme.francais} [${lemme.contexte}]`)
            continue
        }
        rapport.toponymes.sansCommune++
        rapport.sansCommune.set(lemme.francais, lemme.contexte)
    }

    // --- Slugs des prénoms (pages publiques générées statiquement) ----------
    const slugsPris = new Set<string>()
    for (const lemme of [...lemmes.values()].sort((a, b) => a.cle.localeCompare(b.cle))) {
        if (lemme.type !== "prenom") continue
        const racine = slugifier(lemme.francais) || "prenom"
        let slug = racine
        for (let n = 2; slugsPris.has(slug); n++) slug = `${racine}-${n}`
        slugsPris.add(slug)
        lemme.slug = slug
    }

    console.log(`  lemmes ${lemmes.size}, variantes ${variantes.size}, `
        + `témoignages ${temoignages.size}`)
    if (rapport.violationsRegle1.length) {
        console.error("\n⚠ RÈGLE 1 VIOLÉE — arrêt avant toute écriture :")
        for (const v of rapport.violationsRegle1.slice(0, 20)) console.error(`   ${v}`)
        process.exit(1)
    }

    // --- Écriture -----------------------------------------------------------
    titre("Écriture")
    const lignesLemmes = [...lemmes.entries()].map(([cleLemme, l]) => ({
        cleLemme, id: randomUUID(), ...l,
    }))
    await parLots(lignesLemmes, 1000, (lot) => prisma.lemme.createMany({
        data: lot.map((l) => ({
            id: l.id, francais: l.francais, cle: l.cle, contexte: l.contexte,
            type: l.type as any, communeId: l.communeId, slug: l.slug,
        })),
        skipDuplicates: true,
    }))

    // Relecture : sur un rejeu, `skipDuplicates` a laissé les lignes en place
    // et ce sont LEURS identifiants qui comptent, pas ceux qu'on vient de
    // tirer. Prendre les seconds rattacherait les variantes à des lemmes
    // inexistants.
    const lemmesEnBase = await prisma.lemme.findMany({
        select: { id: true, cle: true, contexte: true, type: true, communeId: true, slug: true },
    })
    const idLemme = new Map(lemmesEnBase.map((l) =>
        [`${l.cle}${SEP}${l.contexte}${SEP}${l.type}`, l.id]))

    // Un lemme déjà présent d'un passage antérieur peut s'être vu rattacher une
    // commune ou un slug depuis. On complète, on n'écrase jamais une valeur
    // déjà posée.
    let complements = 0
    for (const l of lignesLemmes) {
        const enBase = lemmesEnBase.find((x) =>
            x.cle === l.cle && x.contexte === l.contexte && x.type === l.type)
        if (!enBase) continue
        const patch: { communeId?: number; slug?: string } = {}
        if (l.communeId && !enBase.communeId) patch.communeId = l.communeId
        if (l.slug && !enBase.slug) patch.slug = l.slug
        if (Object.keys(patch).length) {
            await prisma.lemme.update({ where: { id: enBase.id }, data: patch })
            complements++
        }
    }
    if (complements) console.log(`  ${complements} lemmes complétés (commune ou slug)`)

    const lignesVariantes = [...variantes.entries()].map(([cleVariante, v]) => ({
        cleVariante,
        id: randomUUID(),
        lemmeId: idLemme.get(v.cleLemme)!,
        forme: v.forme,
        cleForme: cleDeForme(v.forme),
        article: v.article,
        formeSansArticle: v.formeSansArticle,
    }))
    const orphelines = lignesVariantes.filter((v) => !v.lemmeId)
    if (orphelines.length) throw new Error(`${orphelines.length} variantes sans lemme`)

    await parLots(lignesVariantes, 1000, (lot) => prisma.variante.createMany({
        data: lot.map(({ cleVariante, ...v }) => v),
        skipDuplicates: true,
    }))

    const variantesEnBase = await prisma.variante.findMany({
        select: { id: true, lemmeId: true, cleForme: true },
    })
    const idVariante = new Map(variantesEnBase.map((v) => [`${v.lemmeId}${SEP}${v.cleForme}`, v.id]))

    const lignesTemoignages = [...temoignages.values()].map((t) => {
        const v = variantes.get(t.cleVariante)!
        const lemmeId = idLemme.get(v.cleLemme)!
        return {
            id: randomUUID(),
            varianteId: idVariante.get(`${lemmeId}${SEP}${cleDeForme(v.forme)}`)!,
            sourceId: t.sourceId,
            attestationId: t.attestationId,
            aireDeclaree: t.aireDeclaree as any,
        }
    })
    await parLots(lignesTemoignages, 1000, (lot) => prisma.temoignage.createMany({
        data: lot, skipDuplicates: true,
    }))

    // --- Contrôle, recompté en base ----------------------------------------
    titre("Contrôle en base")
    const [nLemmes, nVariantes, nTemoignages] = await Promise.all([
        prisma.lemme.count(), prisma.variante.count(), prisma.temoignage.count(),
    ])
    console.log(`  lemmes      ${nLemmes}\t(attendu ${lemmes.size})`)
    console.log(`  variantes   ${nVariantes}\t(attendu ${variantes.size})`)
    console.log(`  témoignages ${nTemoignages}\t(attendu ${temoignages.size})`)

    const parType = await prisma.lemme.groupBy({ by: ["type"], _count: true })
    for (const g of parType.sort((a, b) => b._count - a._count)) {
        console.log(`    ${g.type} : ${g._count}`)
    }

    const avecCommune = await prisma.lemme.count({ where: { NOT: { communeId: null } } })
    const avecAire = await prisma.temoignage.count({ where: { NOT: { aireDeclaree: null } } })
    const attestationsCouvertes = await prisma.temoignage.findMany({
        select: { attestationId: true }, distinct: ["attestationId"],
    })

    titre("Rattachements")
    console.log(`  toponymes rattachés à une commune : ${avecCommune}`)
    console.log(`    par nom exact        ${rapport.toponymes.exact}`)
    console.log(`    par typographie      ${rapport.toponymes.typographie}`
        + `  (ligature, diacritique ou tiret ; candidat unique exigé)`)
    console.log(`    sans commune         ${rapport.toponymes.sansCommune}`
        + `  (communes fusionnées depuis la source, ou hors Alsace)`)
    console.log(`    ambigus, non liés    ${rapport.toponymes.ambigu}`
        + `  ${rapport.ambigus.slice(0, 6).join(", ")}`)
    for (const ex of rapport.parTypographie.slice(0, 8)) console.log(`      ${ex}`)
    console.log(`  témoignages portant une aire déclarée : ${avecAire}`)
    console.log(`  attestations ayant produit au moins une variante : `
        + `${attestationsCouvertes.length} / ${attestations.length}`)
    console.log(`  attestations scindées en plusieurs formes : ${rapport.scindees}`)
    console.log(`  formes répétées dans une même attestation, comptées une fois : `
        + `${repetitionsInternes}`)
    console.log(`  attestations à article décomposé ET scindables : `
        + `${rapport.decomposeesEtScindables} (attendu 0)`)
    if (rapport.sansForme) console.log(`  ⚠ attestations sans forme exploitable : ${rapport.sansForme}`)

    const ecarts = [
        nLemmes !== lemmes.size && "lemmes",
        nVariantes !== variantes.size && "variantes",
        nTemoignages !== temoignages.size && "témoignages",
    ].filter(Boolean)
    if (ecarts.length) {
        console.error(`\n⚠ Écart entre l'attendu et la base sur : ${ecarts.join(", ")}.`)
        console.error("  Normal sur un rejeu partiel, anormal sur une base neuve.")
    }
} finally {
    await prisma.$disconnect()
}
