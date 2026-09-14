#!/usr/bin/env -S npx tsx
/**
 * Charge le référentiel des 1 605 communes d'Alsace-Moselle dans la base.
 *
 * `data/communes/communes.json` fait foi : ce script ne calcule rien, il
 * recopie. La seule valeur qu'il ajoute est le `slug` d'URL, et il porte le
 * code INSEE — deux communes portent le même nom dans deux départements
 * (Bouxwiller 67 et 68), et un slug dérivé du seul nom en perdrait une.
 *
 * Idempotent : rejouable sans rien dupliquer ni rien effacer.
 *
 *   pnpm exec tsx scripts/seed-communes.mts
 */
import { readFileSync } from "node:fs"

import { ouvrirBase, parLots, slugifier, titre } from "./lib/base.mts"

interface CommuneJson {
    code: string
    nom: string
    departement: string
    codesPostaux: string[]
    population: number | null
    latitude: number
    longitude: number
    aireLinguistique: string | null
}

const prisma = ouvrirBase()

try {
    const communes: CommuneJson[] = JSON.parse(
        readFileSync("data/communes/communes.json", "utf-8"),
    )
    titre(`Référentiel : ${communes.length} communes`)

    const lignes = communes.map((c) => ({
        id: Number(c.code),
        slug: `${slugifier(c.nom)}-${c.code}`,
        nom: c.nom,
        departement: c.departement,
        codesPostaux: c.codesPostaux,
        population: c.population,
        latitude: c.latitude,
        longitude: c.longitude,
        aireLinguistique: c.aireLinguistique,
    }))

    // Un code INSEE non numérique casserait la clé primaire en silence. Aucun
    // n'existe en 57/67/68 (la Corse en a, elle : 2A/2B), mais le vérifier
    // coûte une ligne et l'oubli coûterait une commune.
    const invalides = lignes.filter((l) => !Number.isInteger(l.id))
    if (invalides.length) {
        throw new Error(`Codes INSEE non numériques : ${invalides.length}`)
    }
    const slugs = new Set(lignes.map((l) => l.slug))
    if (slugs.size !== lignes.length) {
        throw new Error(`Slugs en collision : ${lignes.length - slugs.size}`)
    }

    await parLots(lignes, 500, (lot) =>
        prisma.commune.createMany({ data: lot, skipDuplicates: true }))

    // Recompté en base, jamais pris au rapport du script — c'est la règle de
    // maison, et elle a rattrapé une erreur à chacune des cinq campagnes.
    const total = await prisma.commune.count()
    const parDep = await prisma.commune.groupBy({
        by: ["departement"], _count: true, orderBy: { departement: "asc" },
    })
    const sansAire = await prisma.commune.count({ where: { aireLinguistique: null } })

    titre("Contrôle en base")
    console.log(`  communes : ${total}`)
    for (const d of parDep) console.log(`    ${d.departement} : ${d._count}`)
    console.log(`  sans aire linguistique (toute la Moselle) : ${sansAire}`)
} finally {
    await prisma.$disconnect()
}
