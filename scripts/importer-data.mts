#!/usr/bin/env -S npx tsx
/**
 * Charge l'archive depuis le DÉPÔT, et non depuis Supabase.
 *
 * Décision de John du 12/09/2026 : repartir de données vierges, que quatre mois
 * d'anciennes décisions n'ont pas altérées. La source de vérité redevient
 * `data/` sur la branche `data` — les JSONL produits par les parseurs
 * versionnés, dont le contrat dit qu'un rejeu doit produire un `git diff` vide.
 * Supabase sort complètement du chemin, comme le veut le doc 20.
 *
 * Ce que ça évite, concrètement : la base portait des purges, des réingestions
 * et des colonnes ajoutées par migrations au fil de l'arbitrage. Le dépôt, lui,
 * porte ce que les parseurs ont extrait des sources — plus la seule altération
 * décisionnelle qui s'y était glissée, annulée par la PR #44 (349 contextes de
 * `wiktionnaire_fr` recopiés de `culture_alsace` pour la file d'arbitrage).
 *
 * Les fichiers sont lus par `git show`, jamais par un checkout : `data/raw/`
 * contient un nom de fichier avec un « ? », invalide sur NTFS.
 *
 * Idempotent, et il n'efface jamais rien.
 *
 *   DATABASE_URL=… pnpm exec tsx scripts/importer-data.mts
 *   DATABASE_URL=… pnpm exec tsx scripts/importer-data.mts --ref origin/data \
 *       --anomalies chemin/vers/anomalies.json
 */
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { randomUUID } from "node:crypto"

import { decomposerArticle } from "./lib/article.mts"
import { ouvrirBase, parLots, titre } from "./lib/base.mts"

const args = process.argv.slice(2)
const valeur = (nom: string) => {
    const i = args.indexOf(nom)
    return i >= 0 ? args[i + 1] : undefined
}
const REF = valeur("--ref") ?? "origin/data"
const ANOMALIES = valeur("--anomalies")

function lireDuDepot(chemin: string): string {
    return execFileSync("git", ["show", `${REF}:${chemin}`],
        { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 })
}

function listerDuDepot(prefixe: string): string[] {
    return execFileSync("git", ["ls-tree", "-r", "--name-only", REF, prefixe],
        { encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 })
        .split("\n").map((l) => l.trim()).filter(Boolean)
}

interface LigneJsonl {
    source_code: string
    francais: string
    alsacien: string
    graphie_origine: string
    type: string
    contexte?: string
    region?: string | null
    reference?: string | null
}

const prisma = ouvrirBase()

try {
    titre(`Lecture du dépôt (${REF})`)

    const fichiers = listerDuDepot("data/attestations/")
        .filter((f) => f.endsWith(".jsonl"))
    const lignes: LigneJsonl[] = []
    for (const f of fichiers) {
        const contenu = lireDuDepot(f)
        const lot = contenu.split("\n").filter((l) => l.trim())
            .map((l) => JSON.parse(l) as LigneJsonl)
        console.log(`  ${f.replace("data/attestations/", "")} : ${lot.length}`)
        lignes.push(...lot)
    }
    console.log(`  total : ${lignes.length} lignes`)

    // Les fiches sources sont nombreuses dans `data/sources/`, mais trois
    // décrivent des sources PROSPECTÉES PUIS ÉCARTÉES (`elsadico`,
    // `freelang_alsacien`, `runneburger_benfeld`) : aucune attestation ne s'y
    // rattache. Les créer quand même les exposerait publiquement comme des
    // sources du dictionnaire — c'est le piège qu'une simulation d'ingestion
    // avait révélé le 24/08/2026. On ne crée que ce qui atteste.
    const codesUtilises = new Set(lignes.map((l) => l.source_code))
    const fiches = listerDuDepot("data/sources/")
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(lireDuDepot(f)))
        .filter((s) => codesUtilises.has(s.code))
    const ecartees = [...new Set(listerDuDepot("data/sources/")
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(lireDuDepot(f)).code))]
        .filter((c) => !codesUtilises.has(c))
    console.log(`  sources retenues : ${fiches.map((s) => s.code).join(", ")}`)
    if (ecartees.length) {
        console.log(`  fiches sans aucune attestation, NON créées : ${ecartees.join(", ")}`)
    }
    const manquantes = [...codesUtilises].filter((c) => !fiches.some((s) => s.code === c))
    if (manquantes.length) throw new Error(`Sources sans fiche : ${manquantes.join(", ")}`)

    titre("Écriture")
    const idSource = new Map<string, string>()
    for (const s of fiches) {
        const existante = await prisma.source.findUnique({ where: { code: s.code } })
        if (existante) { idSource.set(s.code, existante.id); continue }
        const id = randomUUID()
        if (s.type !== "site" && s.type !== "ouvrage") {
            throw new Error(`${s.code} : type « ${s.type} » non repris par la refonte`)
        }
        await prisma.source.create({
            data: {
                id, code: s.code, nom: s.nom, url: s.url ?? null, type: s.type,
                annee: s.annee ?? null, licence: s.licence ?? null,
                // `notes` de la fiche n'est PAS repris : il décrit la collecte,
                // et `sources` est exposée publiquement.
                fiabilite: s.fiabilite,
            },
        })
        idSource.set(s.code, id)
    }

    let decomposees = 0
    const attestations = lignes.map((l) => {
        const type = l.type
        const { article, sansArticle } = decomposerArticle({
            alsacien: l.alsacien, type, sourceCode: l.source_code,
        })
        if (article) decomposees++
        return {
            id: randomUUID(),
            sourceId: idSource.get(l.source_code)!,
            francais: l.francais,
            alsacien: l.alsacien,
            graphieOrigine: l.graphie_origine,
            type: type as any,
            contexte: l.contexte ?? "",
            region: l.region ?? null,
            reference: l.reference ?? null,
            article,
            alsacienSansArticle: sansArticle,
        }
    })

    await parLots(attestations, 1000, (lot) =>
        prisma.attestation.createMany({ data: lot, skipDuplicates: true }))

    // Les 390 coquilles connues. Elles ne vivent dans aucun JSONL — elles sont
    // une SORTIE du parseur, reconstituée en le rejouant
    // (scripts/mesures/anomalies_culture_alsace.py). Sans elles, « elles ne
    // partent jamais dans un lot » redeviendrait une intention que rien
    // n'applique : on ne peut pas exclure ce qu'on ne sait pas nommer.
    if (ANOMALIES) {
        const brut = JSON.parse(readFileSync(ANOMALIES, "utf-8")) as
            { reference: string; type: string; detail: string }[]
        await parLots(brut, 500, (lot) => prisma.anomalieSource.createMany({
            data: lot.map((a) => ({ id: randomUUID(), ...a })), skipDuplicates: true,
        }))
        console.log(`  anomalies chargées depuis ${ANOMALIES} : ${brut.length}`)
    } else {
        console.log("  ⚠ aucune anomalie chargée (--anomalies non fourni)")
    }

    titre("Contrôle en base")
    const [nSources, nAtt, nAnom] = await Promise.all([
        prisma.source.count(), prisma.attestation.count(), prisma.anomalieSource.count(),
    ])
    console.log(`  sources      ${nSources}`)
    console.log(`  attestations ${nAtt} / ${lignes.length} lues`)
    if (nAtt < lignes.length) {
        console.log(`    ${lignes.length - nAtt} absorbées par la clé UNIQUE `
            + `(source, français, alsacien, contexte) — répétitions internes à une `
            + `source, jamais un recoupement (précédent Altenbach)`)
    }
    console.log(`  anomalies    ${nAnom}`)
    console.log(`  articles décomposés : ${decomposees}`)

    const codes = new Map([...idSource].map(([c, i]) => [i, c]))
    for (const g of (await prisma.attestation.groupBy({ by: ["sourceId"], _count: true }))
        .sort((a, b) => b._count - a._count)) {
        console.log(`    ${codes.get(g.sourceId) ?? g.sourceId} : ${g._count}`)
    }
    for (const g of await prisma.attestation.groupBy({ by: ["type"], _count: true })) {
        console.log(`    ${g.type} : ${g._count}`)
    }

    const contextesWiktionnaire = await prisma.attestation.count({
        where: { source: { code: "wiktionnaire_fr" }, contexte: { in: ["Bas-Rhin", "Haut-Rhin"] } },
    })
    // Contrôle du revert (PR #44) : après annulation de la recontextualisation,
    // plus aucune ligne de la rubrique `mots` ne porte un département. Les 7
    // qui restent viennent toutes de `gsw_fr` — ce sont les lignes « type
    // incertain » tranchées par John le 22/08/2026 (les 4 variantes de
    // Milhüsa, plus Strossburg, Gawiller et Zàwera), où le département est
    // écrit dans le JSONL d'origine et non ajouté après coup.
    console.log(`  contrôle PR #44 — contextes départementaux côté wiktionnaire_fr : `
        + `${contextesWiktionnaire} (attendu 7, tous de la rubrique gsw_fr)`)
    if (contextesWiktionnaire !== 7) {
        console.log(`    ⚠ écart : la recontextualisation du 24/08 est peut-être `
            + `revenue, ou le lot gsw_fr a changé`)
    }
} finally {
    await prisma.$disconnect()
}
