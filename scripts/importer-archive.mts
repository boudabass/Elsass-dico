#!/usr/bin/env -S npx tsx
/**
 * Recopie l'archive de Supabase vers la base Postgres de la refonte.
 *
 * Trois tables, et seulement elles : `sources`, `attestations` (27 179 lignes
 * copiées verbatim de leurs sources) et `anomalies_source` (390 coquilles
 * connues). C'est le patrimoine — tout le reste de l'ancienne base
 * (`entrees`, `entree_attestations`, `attestation_votes`, les 25 fonctions RPC)
 * est abandonné par la refonte du 11/09/2026 et n'est pas repris.
 *
 * **Les identifiants sont conservés à l'identique.** `Temoignage.attestationId`
 * doit pouvoir remonter à la ligne brute ; des UUID régénérés couperaient ce
 * fil, et la dérivation cesserait d'être vérifiable.
 *
 * Idempotent, et il n'efface jamais rien : `skipDuplicates` laisse en place ce
 * qui existe déjà. Une ligne modifiée dans Supabase après un premier import ne
 * serait donc PAS mise à jour ici — l'archive est en lecture seule, elle ne
 * bouge pas, mais il faut le savoir.
 *
 *   DATABASE_URL=… pnpm exec tsx scripts/importer-archive.mts
 */
import { ouvrirBase, parLots, titre } from "./lib/base.mts"

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const CLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_SUPABASE || !CLE) {
    console.error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY "
        + "manquante dans .env.local")
    process.exit(2)
}

/** PostgREST plafonne une requête sans `Range` — un plafond lu comme un total
 *  est le piège des compteurs « 50+ » de l'ancienne file d'arbitrage. */
async function lireTout(table: string, select: string): Promise<any[]> {
    const lot = 1000
    const lignes: any[] = []
    for (let debut = 0; ; debut += lot) {
        const url = `${URL_SUPABASE!.replace(/\/$/, "")}/rest/v1/${table}`
            + `?select=${select}&order=id.asc&offset=${debut}&limit=${lot}`
        const r = await fetch(url, {
            headers: { apikey: CLE!, Authorization: `Bearer ${CLE!}` },
        })
        if (!r.ok) throw new Error(`${table} : HTTP ${r.status} ${await r.text()}`)
        const page = await r.json() as any[]
        lignes.push(...page)
        if (page.length < lot) return lignes
    }
}

const prisma = ouvrirBase()

try {
    titre("Lecture de Supabase")
    const sources = await lireTout("sources", "id,code,nom,url,type,annee,licence,fiabilite")
    const attestations = await lireTout(
        "attestations",
        "id,source_id,francais,alsacien,graphie_origine,type,contexte,region,"
        + "reference,article,alsacien_sans_article,created_at")
    const anomalies = await lireTout("anomalies_source", "id,reference,type,detail,created_at")
    console.log(`  sources ${sources.length}, attestations ${attestations.length}, `
        + `anomalies ${anomalies.length}`)

    // « Un contributeur = une source » est abandonné : l'enum de la refonte ne
    // connaît que `site` et `ouvrage`. Aucune source de type `contribution`
    // n'existe aujourd'hui — mais si une apparaissait, elle porterait un
    // e-mail de contributeur dans `notes`, et il vaut mieux s'arrêter que la
    // laisser passer sans regarder.
    const horsType = sources.filter((s) => s.type !== "site" && s.type !== "ouvrage")
    if (horsType.length) {
        throw new Error(`Sources de type non repris : `
            + horsType.map((s) => `${s.code} (${s.type})`).join(", "))
    }

    titre("Écriture dans Postgres")
    // `notes` n'est pas repris : il contient les e-mails des contributeurs, et
    // `sources` est une table exposée publiquement.
    await parLots(sources, 200, (lot) => prisma.source.createMany({
        data: lot.map((s) => ({
            id: s.id, code: s.code, nom: s.nom, url: s.url, type: s.type,
            annee: s.annee, licence: s.licence, fiabilite: s.fiabilite,
        })),
        skipDuplicates: true,
    }))

    await parLots(attestations, 1000, (lot) => prisma.attestation.createMany({
        data: lot.map((a) => ({
            id: a.id,
            sourceId: a.source_id,
            francais: a.francais,
            alsacien: a.alsacien,
            graphieOrigine: a.graphie_origine,
            type: a.type,
            contexte: a.contexte ?? "",
            region: a.region,
            reference: a.reference,
            article: a.article,
            alsacienSansArticle: a.alsacien_sans_article,
            creeLe: new Date(a.created_at),
        })),
        skipDuplicates: true,
    }))

    await parLots(anomalies, 500, (lot) => prisma.anomalieSource.createMany({
        data: lot.map((x) => ({
            id: x.id, reference: x.reference, type: x.type, detail: x.detail,
            creeLe: new Date(x.created_at),
        })),
        skipDuplicates: true,
    }))

    titre("Contrôle en base")
    const [nSources, nAtt, nAnom] = await Promise.all([
        prisma.source.count(), prisma.attestation.count(), prisma.anomalieSource.count(),
    ])
    console.log(`  sources     ${nSources} / ${sources.length}`)
    console.log(`  attestations ${nAtt} / ${attestations.length}`)
    console.log(`  anomalies   ${nAnom} / ${anomalies.length}`)

    const parSource = await prisma.attestation.groupBy({
        by: ["sourceId"], _count: true,
    })
    const codes = new Map(sources.map((s) => [s.id, s.code]))
    for (const g of parSource.sort((a, b) => b._count - a._count)) {
        console.log(`    ${codes.get(g.sourceId) ?? g.sourceId} : ${g._count}`)
    }
    const parType = await prisma.attestation.groupBy({ by: ["type"], _count: true })
    for (const g of parType) console.log(`    ${g.type} : ${g._count}`)

    if (nAtt !== attestations.length) {
        console.error("\n⚠ Le compte en base diffère du compte lu. À regarder "
            + "avant de dériver.")
        process.exit(1)
    }
} finally {
    await prisma.$disconnect()
}
