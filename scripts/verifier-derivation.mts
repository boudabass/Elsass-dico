#!/usr/bin/env -S npx tsx
/**
 * Contrôle la dérivation en relisant la base — jamais en croyant le rapport du
 * script qui vient d'écrire. C'est la règle de maison, et elle a rattrapé une
 * erreur à chacune des cinq campagnes de collecte.
 *
 * Les contrôles demandés par `20-REFONTE-CARTE-DES-PARLERS.md`, étape 1 :
 *
 *   1. **Règle 1** — aucune forme publiée qui ne soit un fragment contigu d'une
 *      chaîne attestée. Vérifié variante par variante, contre les attestations
 *      réellement liées à elle, pas contre l'archive entière : une forme qui
 *      existerait ailleurs dans le corpus mais pas dans SES attestations serait
 *      une forme que ses témoins n'ont pas écrite.
 *   2. **Rien de perdu** — toute attestation a produit au moins une variante.
 *   3. **Rien d'orphelin** — aucune variante sans témoignage, aucun témoignage
 *      qui ne soit ni écrit ni parlé.
 *   4. **Les deux blocs ne se mélangent pas** — un témoignage de source n'a
 *      jamais de commune, un témoignage de locuteur n'a jamais d'aire.
 *   5. **L'article se reconcatène** octet à octet.
 *
 * Sortie : code 0 si tout passe, 1 sinon.
 *
 *   DATABASE_URL=… pnpm exec tsx scripts/verifier-derivation.mts
 */
import { ouvrirBase, titre } from "./lib/base.mts"

const prisma = ouvrirBase()
let echecs = 0

function controle(nom: string, ok: boolean, detail: string): void {
    console.log(`  ${ok ? "OK  " : "ÉCHEC"} ${nom} — ${detail}`)
    if (!ok) echecs++
}

try {
    titre("Volumes")
    const [nAttestations, nLemmes, nVariantes, nTemoignages, nCommunes] = await Promise.all([
        prisma.attestation.count(), prisma.lemme.count(), prisma.variante.count(),
        prisma.temoignage.count(), prisma.commune.count(),
    ])
    console.log(`  attestations ${nAttestations}  lemmes ${nLemmes}  `
        + `variantes ${nVariantes}  témoignages ${nTemoignages}  communes ${nCommunes}`)

    titre("Contrôles")

    // 1. Règle 1, variante par variante, contre SES attestations.
    let violations: string[] = []
    let verifiees = 0
    const TAILLE = 2000
    for (let saut = 0; ; saut += TAILLE) {
        const lot = await prisma.variante.findMany({
            skip: saut, take: TAILLE, orderBy: { id: "asc" },
            select: {
                id: true, forme: true, cleForme: true, article: true,
                formeSansArticle: true, creeParId: true,
                temoignages: { select: { attestation: { select: { alsacien: true } } } },
            },
        })
        if (!lot.length) break
        for (const v of lot) {
            // Une variante contribuée par un membre n'a pas d'attestation
            // écrite : elle n'est pas concernée par ce contrôle-ci.
            if (v.creeParId) continue
            const chaines = v.temoignages
                .map((t) => t.attestation?.alsacien)
                .filter((x): x is string => Boolean(x))
            if (!chaines.length) continue
            verifiees++
            if (!chaines.some((c) => c.includes(v.forme))) {
                if (violations.length < 20) {
                    violations.push(`« ${v.forme} » absente de ${JSON.stringify(chaines[0])}`)
                }
            }
        }
    }
    controle("règle 1", violations.length === 0,
        `${verifiees} variantes contrôlées contre leurs attestations, `
        + `${violations.length} forme(s) qu'aucun témoin n'écrit`)
    for (const v of violations) console.log(`        ${v}`)

    // 2. Rien de perdu
    const attestationsSansTemoignage = await prisma.attestation.count({
        where: { temoignages: { none: {} } },
    })
    controle("rien de perdu", attestationsSansTemoignage === 0,
        `${nAttestations - attestationsSansTemoignage} / ${nAttestations} attestations `
        + `ont produit au moins une variante`)

    // 3. Rien d'orphelin
    const variantesSansTemoignage = await prisma.variante.count({
        where: { temoignages: { none: {} } },
    })
    controle("variantes sans témoignage", variantesSansTemoignage === 0,
        `${variantesSansTemoignage} trouvée(s)`)

    const lemmesSansVariante = await prisma.lemme.count({ where: { variantes: { none: {} } } })
    controle("lemmes sans variante", lemmesSansVariante === 0,
        `${lemmesSansVariante} trouvé(s)`)

    // 4. Les deux blocs ne se mélangent pas. Le CHECK SQL le garantit déjà —
    //    on le recompte quand même : une contrainte qu'on n'a jamais vue mordre
    //    n'est qu'une intention de plus.
    const ecrits = await prisma.temoignage.count({ where: { NOT: { sourceId: null } } })
    const parles = await prisma.temoignage.count({ where: { NOT: { membreId: null } } })
    const hybrides = await prisma.temoignage.count({
        where: { NOT: { sourceId: null }, AND: [{ NOT: { membreId: null } }] },
    })
    const ecritsAvecLieu = await prisma.temoignage.count({
        where: { NOT: { sourceId: null }, communeId: { not: null } },
    })
    const parlesAvecAire = await prisma.temoignage.count({
        where: { NOT: { membreId: null }, aireDeclaree: { not: null } },
    })
    controle("source XOR locuteur", hybrides === 0 && ecrits + parles === nTemoignages,
        `${ecrits} écrits, ${parles} parlés, ${hybrides} hybrides`)
    controle("une source n'a pas de village", ecritsAvecLieu === 0, `${ecritsAvecLieu} trouvé(s)`)
    controle("un locuteur n'a pas d'aire", parlesAvecAire === 0, `${parlesAvecAire} trouvé(s)`)

    // 5. L'article se reconcatène
    const avecArticle = await prisma.variante.findMany({
        where: { NOT: { article: null } },
        select: { forme: true, article: true, formeSansArticle: true },
    })
    const casses = avecArticle.filter((v) => (v.article ?? "") + (v.formeSansArticle ?? "") !== v.forme)
    controle("article reconstruit", casses.length === 0,
        `${avecArticle.length} variantes à article décomposé, ${casses.length} incohérente(s)`)

    // Ponctuation finale — 0 attendu, c'est l'état atteint le 09/09/2026 et il
    // ne doit pas se perdre dans la refonte.
    const ponctuation = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM variantes WHERE forme ~ '[.;,]$'`
    controle("aucune ponctuation finale publiée", Number(ponctuation[0].n) === 0,
        `${ponctuation[0].n} forme(s) concernée(s)`)

    titre("Ce que la carte pourra montrer")
    const lemmesLocalises = await prisma.lemme.count({ where: { NOT: { communeId: null } } })
    const avecAire = await prisma.temoignage.count({ where: { NOT: { aireDeclaree: null } } })
    const communesServies = await prisma.lemme.findMany({
        where: { NOT: { communeId: null } }, select: { communeId: true }, distinct: ["communeId"],
    })
    console.log(`  lemmes rattachés à une commune : ${lemmesLocalises}`)
    console.log(`  communes ayant au moins une forme attestée : ${communesServies.length} / ${nCommunes}`)
    console.log(`  témoignages portant une aire déclarée : ${avecAire}`)
    console.log(`  témoignages sans aucun lieu : ${nTemoignages - avecAire}`
        + `  — « personne n'a encore dit d'où ça vient »`)

    titre(echecs === 0 ? "Tout passe" : `${echecs} contrôle(s) en échec`)
    if (echecs) process.exitCode = 1
} finally {
    await prisma.$disconnect()
}
