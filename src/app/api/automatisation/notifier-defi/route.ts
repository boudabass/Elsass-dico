// Annonce du défi du jour sur les téléphones (Odoo 930, 09/10/2026). Le
// workflow N8N `DEFI_DICO_NOTIF_10H` appelle cette route chaque jour à 10 h,
// heure de Paris ; `TEST_NOTIF_DEFI_DICO` l'appelle à la main avec
// `?simuler=1`, qui compte sans rien envoyer.
//
// N8N n'appelle que `main` : dev partage la base, donc les abonnés, et un
// second appel enverrait deux fois (la réservation de `dernierDefi` l'empêche
// quand même, mais rien ne sert de compter dessus).

import { NextResponse, type NextRequest } from "next/server"

import { autorise, jetonAttendu } from "@/lib/automatisation-serveur"
import { annoncerDefi, configurationVapid } from "@/lib/notifications-serveur"

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
    const bilan = await annoncerDefi({ simuler })
    return NextResponse.json(bilan, {
        status: bilan.erreurs.length > 0 ? 502 : 200,
        headers: { "Cache-Control": "no-store" },
    })
}
