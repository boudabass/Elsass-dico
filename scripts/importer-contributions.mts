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
 *   * les mots français créés par des membres (`parMembre`, 28/09/2026), sans
 *     auteur ;
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
 * Depuis le 04/11/2026, les gestes de l'admin aussi (`moderations`) : une forme
 * remise masquée, une forme validée pour le défi, et leur annulation. Le
 * dernier geste d'une forme donne son état ; le fichier est en ordre
 * chronologique, c'est lui qui le dit. Un retrait de vote n'a rien à rejouer
 * de plus : son événement `retrait` est déjà dans le journal.
 *
 * Depuis le 07/11/2026, le retrait de la catégorie « insulte » (`categorie_insulte_retiree`)
 * aussi : le mot est recréé sous son contexte final, puis le geste en garde la trace.
 *
 * **Ne devine rien** : un lemme, une variante de source ou un village
 * introuvable est compté et signalé, jamais recréé à peu près. Une ligne d'un
 * type inconnu n'est ni rejouée ni supprimée : elle est comptée et signalée.
 *
 *   pnpm exec tsx scripts/importer-contributions.mts
 */
import { existsSync, readFileSync } from "node:fs"

import type { TypeEvenement, TypeModeration, TypeTerme } from "../src/generated/prisma/client.ts"
import { ouvrirBase, parLots } from "./lib/base.mts"
import {
    FICHIER_JOURNAL,
    TYPES_CATEGORIE_JOURNAL,
    TYPES_EVENEMENT_JOURNAL,
    TYPES_MODERATION_JOURNAL,
    type LigneJournal,
} from "./lib/journal.mts"

if (!existsSync(FICHIER_JOURNAL)) {
    console.error(`${FICHIER_JOURNAL} introuvable : lancer d'abord exporter-contributions.mts.`)
    process.exit(1)
}

// Une ligne d'un type inconnu (un fichier plus récent que ce script) n'entre
// dans aucune table : elle est comptée à part, jamais écrite à moitié. C'est ce
// que faisait mal l'ancienne version : `createMany` rejetait l'enum, le script
// s'arrêtait en plein milieu, après les mots et les variantes déjà écrits.
const TYPES_EVENEMENT = new Set<string>(TYPES_EVENEMENT_JOURNAL)
const TYPES_MODERATION = new Set<string>(TYPES_MODERATION_JOURNAL)
const TYPES_CATEGORIE = new Set<string>(TYPES_CATEGORIE_JOURNAL)

const lignesLues: LigneJournal[] = readFileSync(FICHIER_JOURNAL, "utf-8")
    .split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
const lignes = lignesLues.filter((l) => TYPES_EVENEMENT.has(l.type) || TYPES_MODERATION.has(l.type))
// Le retrait de la catégorie « insulte » (07/11/2026) : il ne porte pas de forme.
// Il vise le mot sous son contexte FINAL, pour que le mot se recrée une seule fois.
const categories = lignesLues.filter((l) => TYPES_CATEGORIE.has(l.type))
const lignesMot: LigneJournal[] = [
    ...lignes,
    ...categories.map((c) => ({ ...c, lemme: { ...c.lemme, contexte: c.nouveauContexte ?? "" } })),
]
const typesInconnus = lignesLues.length - lignes.length - categories.length

const prisma = ouvrirBase()
const SEP = "\u0000"

// --- Lemmes, par clé naturelle -------------------------------------------------
const lemmes = new Map<string, string>()
const lemmesIntrouvables = new Set<string>()
let lemmesRecrees = 0
for (const l of lignesMot) {
    const cle = [l.lemme.cle, l.lemme.contexte, l.lemme.type].join(SEP)
    if (lemmes.has(cle) || lemmesIntrouvables.has(cle)) continue
    const lemme = await prisma.lemme.findUnique({
        where: { cle_contexte_type: { cle: l.lemme.cle, contexte: l.lemme.contexte, type: l.lemme.type as TypeTerme } },
        select: { id: true },
    })
    if (lemme) { lemmes.set(cle, lemme.id); continue }
    // Un mot créé par un membre (28/09/2026) n'existe dans aucune source : il se
    // recrée, anonyme, avec son libellé exporté. Un lemme de source absent, lui,
    // reste signalé et jamais recréé à peu près.
    if (l.lemme.parMembre && l.lemme.francais) {
        const cree = await prisma.lemme.create({
            data: {
                francais: l.lemme.francais, cle: l.lemme.cle, contexte: l.lemme.contexte,
                type: l.lemme.type as TypeTerme, parMembre: true,
            },
            select: { id: true },
        })
        lemmes.set(cle, cree.id)
        lemmesRecrees++
        continue
    }
    lemmesIntrouvables.add(cle)
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
        data: {
            lemmeId, forme: l.forme, cleForme: l.cleForme,
            // L'article n'est repris que s'il redonne la forme octet pour octet
            // (CHECK de reconstruction) : sinon, rien plutôt qu'un à-peu-près.
            ...(l.article && l.forme.startsWith(l.article)
                ? { article: l.article, formeSansArticle: l.forme.slice(l.article.length) }
                : {}),
        },
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
const evenements = rejouables.filter((l) => TYPES_EVENEMENT.has(l.type))
const moderations = rejouables.filter((l) => TYPES_MODERATION.has(l.type))
const retires = new Set(evenements.filter((l) => l.type === "retrait").map((l) => l.temoignageId))
const actives = evenements.filter((l) => l.type === "pose" && !retires.has(l.temoignageId) && communeDe(l) !== null)

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
await parLots(evenements, 1000, async (lot) => {
    const r = await prisma.evenementContribution.createMany({
        data: lot.map((l) => ({
            id: l.id, type: l.type as TypeEvenement, varianteId: varianteDe(l)!, temoignageId: l.temoignageId,
            communeId: communeDe(l), ancienneForme: l.ancienneForme, nouvelleForme: l.nouvelleForme,
            le: date(l),
        })),
        skipDuplicates: true,
    })
    evenementsCrees += r.count
})

// --- Gestes de l'admin : les lignes, puis l'état de chaque forme ----------------
// Le journal de modération est rejoué dans l'ordre du fichier. Le dernier geste
// d'une forme dit son état : masquée ou non, validée pour le défi ou non. Rejouer
// deux fois donne le même état, donc rien ne se double.
let moderationsCreees = 0
await parLots(moderations, 1000, async (lot) => {
    const r = await prisma.moderation.createMany({
        data: lot.map((l) => ({
            id: l.id, type: l.type as TypeModeration, varianteId: varianteDe(l)!,
            temoignageId: l.temoignageId, le: date(l),
        })),
        skipDuplicates: true,
    })
    moderationsCreees += r.count
})

// --- Retraits de la catégorie « insulte » : la trace, sur le mot déjà recréé ----
// Le mot est sous sa clé finale (contexte vide) depuis la première boucle. Un
// geste rejoué deux fois ne se double pas (id stable, skipDuplicates).
let categoriesRetirees = 0
const categoriesIntrouvables: string[] = []
await parLots(categories, 1000, async (lot) => {
    const donnees = []
    for (const c of lot) {
        const lemmeId = lemmes.get([c.lemme.cle, c.nouveauContexte ?? "", c.lemme.type].join(SEP))
        if (!lemmeId) { categoriesIntrouvables.push(c.id); continue }
        donnees.push({
            id: c.id, lemmeId, ancienContexte: c.lemme.contexte,
            nouveauContexte: c.nouveauContexte ?? "", le: date(c),
        })
    }
    const r = await prisma.changementCategorie.createMany({ data: donnees, skipDuplicates: true })
    categoriesRetirees += r.count
})

const etatDesFormes = new Map<string, { masquee?: boolean; valideeDefiLe?: Date | null }>()
for (const l of moderations) {
    const id = varianteDe(l)!
    const etat = etatDesFormes.get(id) ?? {}
    if (l.type === "masquage") etat.masquee = true
    else if (l.type === "demasquage") etat.masquee = false
    else if (l.type === "validation_defi") etat.valideeDefiLe = date(l)
    else if (l.type === "annulation_validation_defi") etat.valideeDefiLe = null
    etatDesFormes.set(id, etat)
}
let formesModerees = 0
for (const [id, etat] of etatDesFormes) {
    await prisma.variante.update({ where: { id }, data: etat })
    formesModerees++
}

console.log(`${lignesLues.length} ligne(s) lue(s) dans ${FICHIER_JOURNAL}`)
console.log(`  mots recréés              ${lemmesRecrees}`)
console.log(`  variantes recréées        ${variantesRecreees}`)
console.log(`  témoignages créés         ${temoignagesCrees}\t(${actives.length} actifs dans le journal)`)
console.log(`  événements créés          ${evenementsCrees}\t(${evenements.length} rejouables)`)
console.log(`  gestes de l'admin créés   ${moderationsCreees}\t(${moderations.length} rejouables)`)
console.log(`  formes remises à leur état  ${formesModerees}`)
console.log(`  catégories insulte retirées ${categoriesRetirees}\t(${categories.length} dans le journal)`)
const manques = [
    [lemmesIntrouvables.size, "lemme(s) introuvable(s)"],
    [variantesIntrouvables.size, "variante(s) de source introuvable(s)"],
    [communesIntrouvables.length, `village(s) introuvable(s) : ${communesIntrouvables.join(", ")}`],
    [typesInconnus, "ligne(s) d'un type inconnu : ce script est plus ancien que le journal, non rejoué(s)"],
] as const
for (const [n, quoi] of manques) if (n) console.log(`  ATTENTION ${n} ${quoi}`)

await prisma.$disconnect()
