// Outils communs aux scripts de la refonte. Exécutés par `tsx`, jamais par
// Next : le client Prisma généré importe ses modules sans extension de
// fichier, ce que l'ESM natif de Node refuse.
import { config as chargerEnv } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "../../src/generated/prisma/client.ts"

chargerEnv({ path: ".env.local" })
chargerEnv()

export function ouvrirBase(): PrismaClient {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error(
            "DATABASE_URL manquante. En local : une base de test Docker.\n" +
            "  docker run -d --name elsass-pg -e POSTGRES_PASSWORD=... " +
            "-e POSTGRES_DB=elsass_dico -p 55432:5432 postgres:18",
        )
    }
    return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

/** Normalisation typographique d'un nom de lieu FRANÇAIS, jamais d'une forme
 *  alsacienne. Minuscules, diacritiques et ligatures réduits, séparateurs
 *  unifiés : `Rœschwoog` et `Roeschwoog`, `Wingen-sur-Moder` et `Wingen sur
 *  Moder` deviennent la même chaîne.
 *
 *  Ce n'est PAS un rapprochement approché — aucune distance d'édition, aucune
 *  tolérance : deux noms qui diffèrent d'une lettre restent différents. Et le
 *  rattachement qui s'en sert exige en plus un candidat unique. */
export function nomNormalise(nom: string): string {
    return nom
        .toLowerCase()
        .replace(/œ/g, "oe")
        .replace(/æ/g, "ae")
        .normalize("NFD")
        .replace(/\p{Mn}+/gu, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
}

/** Fragment d'URL stable. Sert aux pages générées statiquement. */
export function slugifier(texte: string): string {
    return nomNormalise(texte).replace(/\s+/g, "-")
}

/** Port exact de public.cle_francais() (migration 20260907020000) : minuscules,
 *  espaces extérieurs et ponctuation finale neutralisés. NE désaccentue pas —
 *  `sur` et `sûr` sont deux lemmes (correctif du 24/08/2026) — et ne touche pas
 *  aux parenthèses. Pendant exact de cleDeForme() côté alsacien. */
export function cleFrancais(francais: string): string {
    return (francais ?? "").trim().toLowerCase().replace(/[.;,\s]+$/, "")
}

/** Exécute une insertion par paquets. Prisma envoie un seul INSERT par lot ;
 *  un lot trop gros dépasse la limite de paramètres de Postgres. */
export async function parLots<T>(
    lignes: T[],
    taille: number,
    action: (lot: T[]) => Promise<unknown>,
): Promise<void> {
    for (let i = 0; i < lignes.length; i += taille) {
        await action(lignes.slice(i, i + taille))
    }
}

export function titre(texte: string): void {
    console.log(`\n=== ${texte} ===`)
}
