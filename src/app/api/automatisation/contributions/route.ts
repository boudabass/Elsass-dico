// Export automatique du journal des contributions (09/10/2026, plan validé
// par John le 28/09). N8N appelle cette route chaque nuit, compare le texte
// rendu au fichier `data/contributions/journal.jsonl` du dépôt, et ne commite
// sur `dev` que s'il a changé. Avant, l'export ne tournait que si Claude
// lançait `scripts/exporter-contributions.mts` en clôture de session ; et
// depuis la fermeture du port 5444, ce script demande d'ouvrir la base.
//
// Rend EXACTEMENT le contenu du fichier : même requête, même format
// (`lib/journal-contributions.ts`). Anonyme, aucun membre, dates au jour :
// le dépôt est public. Lecture seule.

import { NextResponse, type NextRequest } from "next/server"

import { autorise, jetonAttendu } from "@/lib/automatisation-serveur"
import { lignesDuJournal, texteDuJournal } from "@/lib/journal-contributions"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    // Hors du try : un secret absent est une erreur de déploiement, elle doit
    // faire du bruit (500), jamais laisser passer une requête non protégée.
    const attendu = jetonAttendu()

    if (!autorise(request, attendu)) {
        return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 })
    }

    const lignes = await lignesDuJournal(prisma)
    return new NextResponse(texteDuJournal(lignes), {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
        },
    })
}
