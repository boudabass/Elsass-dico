// Middleware — AUCUN I/O. C'est le critère de sortie de l'étape 2 (doc 20), et
// il se vérifie au chrono, pas à la lecture.
//
// Ce qu'il faisait jusqu'au 12/09/2026 : un `supabase.auth.getUser()` — donc un
// aller-retour RÉSEAU — sur quasiment chaque requête, visiteur anonyme compris,
// plus un `select profiles` sur /admin. Sur un VPS sans limite CPU ni rate
// limiting (audit du 30/08), un simple robot d'indexation amplifiait la charge
// à chaque hit. Ce fichier ne fait plus que vérifier une signature locale.
//
// Attention à ce qu'il n'est pas : la vraie barrière d'administration est
// `adminExige()`, qui relit le rôle en base. Ici, c'est du confort de
// navigation — un cookie ne prouve rien qu'une Server Action ne revérifie.

import { NextResponse, type NextRequest } from "next/server"

import { COOKIE_REFRESH, COOKIE_SESSION, lireRefresh, lireSession } from "@/lib/session"

// Le compte est obligatoire (doc 20). Cette liste est donc l'exception, pas la
// règle. L'étape 3 y ajoutera `/village/[slug]` et `/prenom/[slug]`, les seules
// pages destinées à être indexées.
const PUBLIC = [
    "/login",
    "/sources",
    "/api/session/",
]

function estPublic(chemin: string): boolean {
    return PUBLIC.some((prefixe) => chemin === prefixe || chemin.startsWith(prefixe))
}

export async function middleware(request: NextRequest) {
    const chemin = request.nextUrl.pathname

    if (estPublic(chemin)) return NextResponse.next()

    const session = await lireSession(request.cookies.get(COOKIE_SESSION)?.value)

    if (!session) {
        // Jeton de session expiré (30 min) mais renouvellement encore valide :
        // on passe par la route de renouvellement, qui relit le rôle en base.
        // La vérification du jeton de renouvellement est locale elle aussi —
        // elle évite un aller-retour inutile quand les deux sont morts.
        const membreId = await lireRefresh(request.cookies.get(COOKIE_REFRESH)?.value)
        if (membreId) {
            const vers = new URL("/api/session/refresh", request.url)
            vers.searchParams.set("suite", chemin + request.nextUrl.search)
            return NextResponse.redirect(vers)
        }
        return NextResponse.redirect(new URL("/login", request.url))
    }

    if (chemin.startsWith("/admin") && session.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Tout sauf les fichiers servis tels quels. `topojson` est dans la
        // liste parce que le fond de carte (`/carte/contours.topojson`) est un
        // fichier statique de `public/` : le passer au middleware le rendrait
        // inaccessible sans cookie, et la carte serait vide.
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|topojson|json|txt|xml)$).*)",
    ],
}
