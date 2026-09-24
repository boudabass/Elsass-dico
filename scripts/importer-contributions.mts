#!/usr/bin/env -S npx tsx
/**
 * Rejoue le journal des contributions exporté (`data/contributions/journal.jsonl`)
 * sur une base dérivée : l'autre moitié de `exporter-contributions.mts`.
 *
 * À lancer APRÈS `importer-data.mts` et `deriver.mts` quand on reconstruit une
 * base à neuf : les lemmes et les variantes des sources doivent déjà exister,
 * ce script n'y ajoute que ce que les membres ont apporté.
 *
 * Ce qu'il recrée :
 *   * les variantes écrites par des membres (événement `creation`), sous leur
 *     forme actuelle, sans auteur (l'export est anonyme) ;
 *   * les témoignages encore actifs : une `pose` sans `retrait` apparié par
 *     `temoignageId`. Sans membre, ce que le CHECK autorise depuis le 24/09 :
 *     un témoignage parlé se reconnaît à son village ;
 *   * le journal lui-même, daté au jour.
 *
 * **Rejouable** : tout s'identifie par une clé stable (id d'événement, id de
 * témoignage, `(lemme, cleForme)` pour une variante), donc un second passage,
 * ou un passage sur la base qui a produit l'export, ne crée rien.
 *
 * **Ne devine rien** : un lemme, une variante de source ou un village
 * introuvable est compté et signalé, jamais recréé à peu près.
 *
 *   pnpm exec tsx scripts/importer-contributions.mts
 */
import { existsSync, readFileSync } from "node:fs"

import type { TypeTerme } from "../src/generated/prisma/client.ts"
import { ouvrirBase, parLots } from "./lib/base.mts"
import { FICHIER_JOURNAL, type LigneJournal } from "./lib/journal.mts"

if (!existsSync(FICHIER_JOURNAL)) {
    console.error(`${FICHIER_JOURNAL} introuvable : lancer d'abord exporter-contributions.mts.`)
    process.exit(1)
}

const lignes: LigneJournal[] = readFileSync(FICHIER_JOURNAL, "utf-8")
    .split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))

const prisma = ouvrirBase()
const SEP = "\u0000"

// --- Lemmes, par clé naturelle -------------------------------------------------
const lemmes = new Map<string, string>()
const lemmesIntrouvables = new Set<string>()
for (const l of lignes) {
    const cle = [l.lemme.cle, l.lemme.contexte, l.lemme.type].join(SEP)
    if (lemmes.has(cle) || lemmesIntrouvables.has(cle)) continue
    const lemme = await prisma.lemme.findUnique({
        where: { cle_contexte_type: { cle: l.lemme.cle, contexte: l.lemme.contexte, type: l.lemme.type as TypeTerme } },
        select: { id: true },
    })
    if (lemme) lemmes.set(cle, lemme.id)
    else lemmesIntrouvables.add(cle)
}

// --- Variantes : retrouvées, ou recréées si un membre les a écrites ------------
const creees = new Set(lignes.filter((l) => l.type === "creation")
    .map((l) => [l.lemme.cle, l.lemme.contexte, l.lemme.type, l.cleForme].join(SEP)))
const variantes = new Map<string, string>()
const variantesIntrouvables = new Set<string>()
let variantesRecreees = 0
for (const l of lignes) {
    const cleLemme = [l.lemme.cle, l.lemme.contexte, l.lemme.type].join(SEP)
    const cle = [cleLemme, l.cleForme].join(SEP)
    const lemmeId = lemmes.get(cleLemme)
    if (!lemmeId || variantes.has(cle) || variantesIntrouvables.has(cle)) continue

    const existante = await prisma.variante.findUnique({
        where: { lemmeId_cleForme: { lemmeId, cleForme: l.cleForme } },
        select: { id: true },
    })
    if (existante) { variantes.set(cle, existante.id); continue }
    if (!creees.has(cle)) { variantesIntrouvables.add(cle); continue } // variante de source absente
    const v = await prisma.variante.create({
        data: { lemmeId, forme: l.forme, cleForme: l.cleForme },
        select: { id: true },
    })
    variantes.set(cle, v.id)
    variantesRecreees++
}

// --- Villages ------------------------------------------------------------------
const codes = [...new Set(lignes.map((l) => l.commune).filter((c): c is number => c !== null))]
const connues = new Set((await prisma.commune.findMany({ where: { id: { in: codes } }, select: { id: true } }))
    .map((c) => c.id))
const communesIntrouvables = codes.filter((c) => !connues.has(c))

// --- Journal et témoignages actifs ---------------------------------------------
const varianteDe = (l: LigneJournal) =>
    variantes.get([l.lemme.cle, l.lemme.contexte, l.lemme.type, l.cleForme].join(SEP))
const communeDe = (l: LigneJournal) => (l.commune !== null && connues.has(l.commune) ? l.commune : null)
const date = (l: LigneJournal) => new Date(`${l.jour}T00:00:00Z`)

const rejouables = lignes.filter((l) => varianteDe(l))
const retires = new Set(rejouables.filter((l) => l.type === "retrait").map((l) => l.temoignageId))
const actives = rejouables.filter((l) => l.type === "pose" && !retires.has(l.temoignageId) && communeDe(l) !== null)

let temoignagesCrees = 0
await parLots(actives, 1000, async (lot) => {
    const r = await prisma.temoignage.createMany({
        data: lot.map((l) => ({
            id: l.temoignageId!, varianteId: varianteDe(l)!, communeId: communeDe(l)!, creeLe: date(l),
        })),
        skipDuplicates: true,
    })
    temoignagesCrees += r.count
})

let evenementsCrees = 0
await parLots(rejouables, 1000, async (lot) => {
    const r = await prisma.evenementContribution.createMany({
        data: lot.map((l) => ({
            id: l.id, type: l.type, varianteId: varianteDe(l)!, temoignageId: l.temoignageId,
            communeId: communeDe(l), ancienneForme: l.ancienneForme, nouvelleForme: l.nouvelleForme,
            le: date(l),
        })),
        skipDuplicates: true,
    })
    evenementsCrees += r.count
})

console.log(`${lignes.length} événement(s) lu(s) dans ${FICHIER_JOURNAL}`)
console.log(`  variantes recréées        ${variantesRecreees}`)
console.log(`  témoignages créés         ${temoignagesCrees}\t(${actives.length} actifs dans le journal)`)
console.log(`  événements créés          ${evenementsCrees}\t(${rejouables.length} rejouables)`)
const manques = [
    [lemmesIntrouvables.size, "lemme(s) introuvable(s)"],
    [variantesIntrouvables.size, "variante(s) de source introuvable(s)"],
    [communesIntrouvables.length, `village(s) introuvable(s) : ${communesIntrouvables.join(", ")}`],
] as const
for (const [n, quoi] of manques) if (n) console.log(`  ATTENTION ${n} ${quoi}, non rejoué(s)`)

await prisma.$disconnect()
