import { config as chargerEnv } from "dotenv"
import { defineConfig } from "prisma/config"

// Le projet met ses secrets dans `.env.local` (jamais commité) et non `.env` —
// convention déjà suivie par scripts/ingest_attestations.py. `dotenv/config`
// seul ne lirait que `.env`, et la CLI échouerait sur un DATABASE_URL absent
// alors qu'il est là.
chargerEnv({ path: ".env.local" })
chargerEnv()

// Prisma 7 : la CLI (migrate, db, studio) lit sa connexion ici, plus dans le
// bloc `datasource` du schéma. Le client applicatif, lui, passe par l'adapter
// `@prisma/adapter-pg` — cf. src/lib/prisma.ts.
// `prisma generate` tourne pendant le build de l'image Coolify, où
// DATABASE_URL n'existe volontairement PAS : c'est une variable runtime, la
// marquer disponible au build graverait le mot de passe de la base dans
// l'image. Or `env()` de prisma/config exige la variable et ferait échouer le
// build entier. D'où ce repli — et il est bruyant exprès : toute commande qui
// touche réellement la base (migrate, studio) échouera sur un hôte nommé
// `database-url-absente`, lisible d'un coup d'œil, plutôt que sur un timeout.
const url = process.env.DATABASE_URL ?? "postgresql://database-url-absente:5432/absente"

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: { url },
})
