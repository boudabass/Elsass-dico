// Garde des routes machine-à-machine `/api/automatisation/*` (N8N). Sortie de
// la route du défi le 09/10/2026, quand la route d'export des contributions
// en a eu besoin aussi : une seule façon de vérifier le jeton.

import { timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"

// Lu à l'APPEL et non au chargement du module : `next build` évalue le
// module en prérendu, où les variables runtime de Coolify n'existent pas
// encore (même motif que `SESSION_SECRET`, `src/lib/session.ts`).
export function jetonAttendu(): string {
    const t = process.env.AUTOMATISATION_API_TOKEN
    if (!t || t.length < 32) {
        throw new Error(
            "AUTOMATISATION_API_TOKEN manquante ou trop courte (32 caractères minimum).",
        )
    }
    return t
}

export function autorise(request: NextRequest, attendu: string): boolean {
    const entete = request.headers.get("authorization") ?? ""
    const fourni = entete.startsWith("Bearer ") ? entete.slice(7) : ""
    // Comparaison à temps constant : la longueur du jeton fourni ne doit rien
    // apprendre à qui essaie de le deviner.
    const a = Buffer.from(fourni)
    const b = Buffer.from(attendu)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}
