#!/usr/bin/env -S npx tsx
/**
 * Réunit les fiches jumelles « mot » et « expression » (16/10/2026) : une même
 * locution (même `cle`, même `contexte`) que deux sources ont typée
 * différemment. La dérivation range désormais ces couples en expression
 * (deriver.mts) ; ce script fait la même chose sur les fiches déjà en base.
 *
 * Par couple (mot, expression) :
 *   * chaque variante du mot passe à l'expression ; si la même forme existe
 *     déjà chez l'expression, les deux se fondent en une seule ;
 *   * un témoignage suit sa variante. Un témoignage du MÊME membre que celui
 *     déjà présent sur la variante cible est retiré, avec un événement
 *     `retrait` au journal : sans lui, la `pose` restée au journal recréerait
 *     le témoignage au rejeu ;
 *   * un témoignage de source déjà présent (même attestation) est retiré sans
 *     événement : les témoignages de sources n'entrent pas au journal ;
 *   * les événements et les signalements suivent leur variante ;
 *   * la fiche « mot », alors vide, est supprimée.
 *
 * **Dry-run par défaut** : rien n'est écrit, le script dit ce qu'il ferait.
 * `--appliquer` écrit tout, dans une seule transaction : une erreur annule
 * tout. Après un `--appliquer`, relancer `exporter-contributions.mts` pour que
 * le journal ne cite plus les fiches « mot » (importer-contributions.mts ne
 * recrée pas une fiche de source absente : sans cette relance, les gestes de
 * ces fiches seraient signalés comme introuvables au rejeu).
 *
 *   pnpm exec tsx scripts/fusionner-jumeaux.mts
 *   pnpm exec tsx scripts/fusionner-jumeaux.mts --appliquer
 */
import { ouvrirBase } from "./lib/base.mts"

const APPLIQUER = process.argv.includes("--appliquer")
const SEP = "\u0000"
const prisma = ouvrirBase()

async function lireDetails(ids: string[]) {
    return prisma.lemme.findMany({
        where: { id: { in: ids } },
        select: {
            id: true, francais: true, cle: true, contexte: true, parMembre: true,
            variantes: {
                select: {
                    id: true, cleForme: true, forme: true,
                    temoignages: { select: { id: true, membreId: true, attestationId: true, communeId: true } },
                    evenements: { select: { id: true } },
                    signalements: { select: { id: true } },
                },
            },
        },
    })
}
type Fiche = Awaited<ReturnType<typeof lireDetails>>[number]
type Temoignage = Fiche["variantes"][number]["temoignages"][number]

// Ce que la fusion écrit, dans l'ordre. Rien n'est décidé pendant l'écriture :
// tout est calculé d'abord, affiché, puis joué tel quel.
type Operation =
    | { genre: "lemmeDeVariante"; variante: string; lemme: string }
    | { genre: "varianteDeTemoignage"; temoignage: string; variante: string }
    | { genre: "retraitDoublonMembre"; temoignage: Temoignage; variante: string }
    | { genre: "supprimerDoublonSource"; temoignage: string }
    | { genre: "varianteDeEvenements"; de: string; vers: string }
    | { genre: "varianteDeSignalements"; de: string; vers: string }
    | { genre: "supprimerVariante"; variante: string }
    | { genre: "supprimerLemme"; lemme: string }

interface Bilan {
    francais: string
    cle: string
    contexte: string
    deplacees: number
    fondues: number
    doublonsMembre: number
    doublonsSource: number
    temoignagesDeplaces: number
    evenements: number
    signalements: number
    formesDifferentes: string[]
    motParMembre: boolean
}

function planifier(mot: Fiche, expression: Fiche): { operations: Operation[]; bilan: Bilan } {
    const operations: Operation[] = []
    const bilan: Bilan = {
        francais: mot.francais, cle: mot.cle, contexte: mot.contexte,
        deplacees: 0, fondues: 0, doublonsMembre: 0, doublonsSource: 0, temoignagesDeplaces: 0,
        evenements: 0, signalements: 0, formesDifferentes: [], motParMembre: mot.parMembre,
    }

    for (const vm of mot.variantes) {
        const ve = expression.variantes.find((v) => v.cleForme === vm.cleForme)
        if (!ve) {
            operations.push({ genre: "lemmeDeVariante", variante: vm.id, lemme: expression.id })
            bilan.deplacees++
            continue
        }

        // La forme est déjà là des deux côtés : on garde celle de l'expression,
        // on signale seulement si l'écriture diffère.
        bilan.fondues++
        if (vm.forme !== ve.forme) bilan.formesDifferentes.push(`${vm.forme} / ${ve.forme}`)

        for (const t of vm.temoignages) {
            if (t.membreId && ve.temoignages.some((x) => x.membreId === t.membreId)) {
                operations.push({ genre: "retraitDoublonMembre", temoignage: t, variante: ve.id })
                bilan.doublonsMembre++
            } else if (t.attestationId && ve.temoignages.some((x) => x.attestationId === t.attestationId)) {
                operations.push({ genre: "supprimerDoublonSource", temoignage: t.id })
                bilan.doublonsSource++
            } else {
                operations.push({ genre: "varianteDeTemoignage", temoignage: t.id, variante: ve.id })
                bilan.temoignagesDeplaces++
            }
        }
        if (vm.evenements.length) {
            operations.push({ genre: "varianteDeEvenements", de: vm.id, vers: ve.id })
            bilan.evenements += vm.evenements.length
        }
        if (vm.signalements.length) {
            operations.push({ genre: "varianteDeSignalements", de: vm.id, vers: ve.id })
            bilan.signalements += vm.signalements.length
        }
        operations.push({ genre: "supprimerVariante", variante: vm.id })
    }

    operations.push({ genre: "supprimerLemme", lemme: mot.id })
    return { operations, bilan }
}

// --- Les couples -------------------------------------------------------------------

const mots = await prisma.lemme.findMany({
    where: { type: "mot" },
    select: { id: true, cle: true, contexte: true },
})
const expressions = await prisma.lemme.findMany({
    where: { type: "expression" },
    select: { id: true, cle: true, contexte: true },
})
const expressionDe = new Map(expressions.map((e) => [`${e.cle}${SEP}${e.contexte}`, e.id]))
const couples = mots
    .map((m) => ({ mot: m.id, expression: expressionDe.get(`${m.cle}${SEP}${m.contexte}`) }))
    .filter((c): c is { mot: string; expression: string } => !!c.expression)

if (couples.length === 0) {
    console.log("Aucune fiche jumelle mot/expression : rien à fusionner.")
    await prisma.$disconnect()
    process.exit(0)
}

const fichesMot = await lireDetails(couples.map((c) => c.mot))
const fichesExpression = await lireDetails(couples.map((c) => c.expression))
const ficheMot = new Map(fichesMot.map((f) => [f.id, f]))
const ficheExpression = new Map(fichesExpression.map((f) => [f.id, f]))

const operations: Operation[] = []
const bilans: Bilan[] = []
for (const c of couples) {
    const mot = ficheMot.get(c.mot)
    const expression = ficheExpression.get(c.expression)
    if (!mot || !expression) continue
    const plan = planifier(mot, expression)
    operations.push(...plan.operations)
    bilans.push(plan.bilan)
}

// --- Rapport -----------------------------------------------------------------------

console.log(`Couples mot / expression : ${bilans.length}`)
for (const b of bilans) {
    console.log(`\n« ${b.francais} »${b.contexte ? ` [${b.contexte}]` : ""}`)
    console.log(`  variantes déplacées : ${b.deplacees}, fondues avec une forme existante : ${b.fondues}`)
    console.log(`  témoignages déplacés : ${b.temoignagesDeplaces}`)
    console.log(`  doublons d'un même membre (retrait au journal, puis suppression) : ${b.doublonsMembre}`)
    console.log(`  doublons de source (suppression) : ${b.doublonsSource}`)
    console.log(`  événements au journal suivant la variante : ${b.evenements}, signalements : ${b.signalements}`)
    if (b.motParMembre) console.log("  ⚠ la fiche « mot » a été créée par un membre (parMembre) : vérifier le libellé")
    for (const f of b.formesDifferentes) console.log(`  ⚠ formes écrites différemment, on garde celle de l'expression : ${f}`)
}

const compte = (genre: Operation["genre"]) => operations.filter((o) => o.genre === genre).length
console.log("\nBilan :")
console.log(`  fiches « mot » supprimées : ${compte("supprimerLemme")}`)
console.log(`  variantes déplacées : ${compte("lemmeDeVariante")}, fusionnées dans une forme existante : ${compte("supprimerVariante")}`)
console.log(`  témoignages déplacés : ${compte("varianteDeTemoignage")}`)
console.log(`  retraits au journal : ${compte("retraitDoublonMembre")}, doublons de source supprimés : ${compte("supprimerDoublonSource")}`)

if (!APPLIQUER) {
    console.log("\nDry-run : rien n'a été écrit. Relancer avec --appliquer pour écrire.")
    await prisma.$disconnect()
    process.exit(0)
}

// --- Écriture : une seule transaction ----------------------------------------------

await prisma.$transaction(async (tx) => {
    for (const op of operations) {
        switch (op.genre) {
            case "lemmeDeVariante":
                await tx.variante.update({ where: { id: op.variante }, data: { lemmeId: op.lemme } })
                break
            case "varianteDeTemoignage":
                await tx.temoignage.update({ where: { id: op.temoignage }, data: { varianteId: op.variante } })
                break
            case "retraitDoublonMembre":
                // Le retrait part au journal avant la suppression : la pose qui
                // reste au journal se trouve alors retirée au rejeu, comme le
                // fait l'application quand un membre retire son vote.
                await tx.evenementContribution.create({
                    data: {
                        type: "retrait", varianteId: op.variante, temoignageId: op.temoignage.id,
                        communeId: op.temoignage.communeId, membreId: op.temoignage.membreId,
                    },
                })
                await tx.temoignage.delete({ where: { id: op.temoignage.id } })
                break
            case "supprimerDoublonSource":
                await tx.temoignage.delete({ where: { id: op.temoignage } })
                break
            case "varianteDeEvenements":
                await tx.evenementContribution.updateMany({ where: { varianteId: op.de }, data: { varianteId: op.vers } })
                break
            case "varianteDeSignalements":
                await tx.signalement.updateMany({ where: { varianteId: op.de }, data: { varianteId: op.vers } })
                break
            case "supprimerVariante":
                // Vidée par les opérations précédentes : la cascade ne doit rien emporter.
                await tx.variante.delete({ where: { id: op.variante } })
                break
            case "supprimerLemme": {
                const reste = await tx.variante.count({ where: { lemmeId: op.lemme } })
                if (reste) throw new Error(`La fiche ${op.lemme} porte encore ${reste} variante(s) : fusion annulée.`)
                await tx.lemme.delete({ where: { id: op.lemme } })
                break
            }
        }
    }
}, { timeout: 120_000 })

console.log(`\nÉcrit : ${bilans.length} couple(s) fusionné(s), ${compte("supprimerLemme")} fiche(s) « mot » supprimée(s).`)
console.log("Relancer exporter-contributions.mts, puis committer data/contributions/journal.jsonl.")
await prisma.$disconnect()
