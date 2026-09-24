#!/usr/bin/env -S npx tsx
/**
 * Exporte le journal des contributions dans le dépôt, sous forme anonyme.
 *
 * La doctrine du 12/09/2026 dit « la source de vérité est le dépôt, la base se
 * reconstruit des JSONL ». C'était vrai des attestations, faux des
 * contributions des membres, qui ne vivaient qu'en base : une reconstruction à
 * neuf comme celle du 12/09 les aurait effacées. Ce script les ramène sous la
 * règle ; `importer-contributions.mts` les rejoue.
 *
 * **Anonyme, et le dépôt est public.** Aucun identifiant de membre ne sort. Ce
 * qui sort, c'est ce que le site montre déjà (une forme, un village) plus le
 * jour du geste, jamais l'heure.
 *
 * **Clés naturelles, jamais des UUID de lemme ou de variante** : ceux-là ne
 * survivent pas à une redérivation (leçon du 12/09). Un lemme se désigne par
 * `(cle, contexte, type)`, une variante par sa `cleForme` sur ce lemme, un
 * village par son code INSEE. Tous les événements d'une variante portent sa
 * forme ACTUELLE : c'est celle qu'on retrouve au rejeu, même après une
 * modification.
 *
 * Sortie triée et stable : deux exports sans nouveau geste donnent le même
 * fichier, donc un diff vide.
 *
 *   pnpm exec tsx scripts/exporter-contributions.mts
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

import { ouvrirBase } from "./lib/base.mts"
import { FICHIER_JOURNAL, type LigneJournal } from "./lib/journal.mts"

const prisma = ouvrirBase()

const evenements = await prisma.evenementContribution.findMany({
    select: {
        id: true, type: true, le: true, temoignageId: true, communeId: true,
        ancienneForme: true, nouvelleForme: true,
        variante: {
            select: {
                cleForme: true, forme: true,
                lemme: { select: { cle: true, contexte: true, type: true } },
            },
        },
    },
    // L'heure ordonne encore l'export, même si elle n'en sort pas : une pose et
    // son retrait du même jour restent dans l'ordre où ils ont eu lieu.
    orderBy: [{ le: "asc" }, { id: "asc" }],
})

const lignes: LigneJournal[] = evenements.map((e) => ({
    id: e.id,
    type: e.type,
    jour: e.le.toISOString().slice(0, 10),
    lemme: { cle: e.variante.lemme.cle, contexte: e.variante.lemme.contexte, type: e.variante.lemme.type },
    cleForme: e.variante.cleForme,
    forme: e.variante.forme,
    temoignageId: e.temoignageId,
    commune: e.communeId,
    ancienneForme: e.ancienneForme,
    nouvelleForme: e.nouvelleForme,
}))

mkdirSync(dirname(FICHIER_JOURNAL), { recursive: true })
writeFileSync(FICHIER_JOURNAL, lignes.map((l) => JSON.stringify(l)).join("\n") + (lignes.length ? "\n" : ""))

const parType = new Map<string, number>()
for (const l of lignes) parType.set(l.type, (parType.get(l.type) ?? 0) + 1)
console.log(`${lignes.length} événement(s) écrit(s) dans ${FICHIER_JOURNAL}`)
for (const [type, n] of parType) console.log(`  ${type} : ${n}`)

await prisma.$disconnect()
