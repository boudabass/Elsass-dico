// Renouvellement du jeton de session. Le middleware n'y envoie que lorsque le
// jeton court a expiré et que le jeton de renouvellement est encore valide.
//
// C'est ICI, et nulle part ailleurs, que le rôle est relu en base : le jeton de
// renouvellement ne le porte pas, exprès (cf. `src/lib/session.ts`). Une
// promotion faite dans /admin atteint donc le membre concerné en moins de
// 30 minutes, sans qu'il ait à se reconnecter.
//
// Une requête en base toutes les 30 minutes par membre actif — contre une par
// page vue avec `supabase.auth.getUser()`.

import { NextResponse, type NextRequest } from "next/server"

import { COOKIE_REFRESH, COOKIE_SESSION, lireRefresh } from "@/lib/session"
import { preparerSession } from "@/lib/session-serveur"

/** Une destination ne se prend jamais telle quelle dans l'URL : sans ce
 *  contrôle, `?suite=https://ailleurs` ferait de cette route une redirection
 *  ouverte, et un lien de phishing porterait notre domaine. */
function destinationSure(suite: string | null): string {
    if (!suite) return "/"
    if (!suite.startsWith("/")) return "/"
    // `//ailleurs.example` et `/\ailleurs.example` sont lus comme des URL
    // absolues par les navigateurs.
    if (suite.startsWith("//") || suite.startsWith("/\\")) return "/"
    return suite
}

/** Redirection RELATIVE, résolue par le navigateur sur le domaine qu'il est
 *  en train d'afficher. Pas `new URL(chemin, request.url)` : dans le conteneur
 *  (sortie standalone de Next, derrière le proxy de Coolify), `request.url`
 *  d'une route vaut `http://0.0.0.0:3000/…`, l'adresse d'écoute interne.
 *  Chaque session expirée renvoyait donc le membre vers `0.0.0.0:3000`, une
 *  page d'erreur. Le nouveau cookie, lui, était posé : un onglet neuf
 *  marchait, ce qui a fait passer le défaut pour un caprice de Chrome du 14 au
 *  24/09/2026. Le middleware n'a pas ce défaut : Next y reconstruit l'URL
 *  publique. */
function rediriger(chemin: string): NextResponse {
    return new NextResponse(null, { status: 307, headers: { Location: chemin } })
}

export async function GET(request: NextRequest) {
    const membreId = await lireRefresh(request.cookies.get(COOKIE_REFRESH)?.value)

    if (!membreId) {
        return rediriger("/login")
    }

    const prepare = await preparerSession(membreId)

    if (!prepare) {
        // Le membre n'existe plus : on efface, sinon le middleware renverrait
        // ici en boucle sur la foi d'un jeton qui ne désigne personne.
        const versLogin = rediriger("/login")
        versLogin.cookies.delete(COOKIE_SESSION)
        versLogin.cookies.delete(COOKIE_REFRESH)
        return versLogin
    }

    const reponse = rediriger(destinationSure(request.nextUrl.searchParams.get("suite")))
    for (const c of prepare.cookies) reponse.cookies.set(c.nom, c.valeur, c.options)
    return reponse
}
