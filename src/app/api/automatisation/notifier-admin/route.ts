// Le soir, aux administrateurs : combien de textes de membres ont été ajoutés ou
// corrigés dans les 24 dernières heures (07/11/2026). N8N appelle cette route une
// fois par soir (main seulement, après le merge). `?simuler=1` compte sans rien envoyer.
//
// Même garde que `notifier-defi` : jeton porteur, 401 sans lui. Une route
// `/api/automatisation/` est déjà laissée passer par le middleware.

import { NextResponse, type NextRequest } from "next/server"

import { autorise, jetonAttendu } from "@/lib/automatisation-serveur"
import { annoncerContributionsAdmin, configurationVapid } from "@/lib/notifications-serveur"

export async function POST(request: NextRequest) {
    // Hors du try, comme les autres routes d'automatisation : un secret absent
    // doit faire du bruit (500), jamais laisser passer une requête.
    const attendu = jetonAttendu()

    if (!autorise(request, attendu)) {
        return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 })
    }

    if (!configurationVapid()) {
        return NextResponse.json(
            { erreur: "Clés VAPID absentes : VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY à renseigner dans Coolify." },
            { status: 503 },
        )
    }

    const simuler = request.nextUrl.searchParams.get("simuler") === "1"
    const bilan = await annoncerContributionsAdmin({ simuler })
    return NextResponse.json(bilan, {
        status: bilan.erreurs.length > 0 ? 502 : 200,
        headers: { "Cache-Control": "no-store" },
    })
}
