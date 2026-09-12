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

export async function GET(request: NextRequest) {
    const membreId = await lireRefresh(request.cookies.get(COOKIE_REFRESH)?.value)

    if (!membreId) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    const prepare = await preparerSession(membreId)

    if (!prepare) {
        // Le membre n'existe plus : on efface, sinon le middleware renverrait
        // ici en boucle sur la foi d'un jeton qui ne désigne personne.
        const versLogin = NextResponse.redirect(new URL("/login", request.url))
        versLogin.cookies.delete(COOKIE_SESSION)
        versLogin.cookies.delete(COOKIE_REFRESH)
        return versLogin
    }

    const reponse = NextResponse.redirect(
        new URL(destinationSure(request.nextUrl.searchParams.get("suite")), request.url),
    )
    for (const c of prepare.cookies) reponse.cookies.set(c.nom, c.valeur, c.options)
    return reponse
}
