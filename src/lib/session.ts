// Session applicative — signature et vérification, rien d'autre.
//
// Ce module est importé par le MIDDLEWARE autant que par les Server Actions. Il
// ne doit donc dépendre ni de `next/headers` (indisponible en middleware) ni de
// Prisma (aucun I/O en middleware, c'est le critère de l'étape 2 du doc 20).
// Tout ce qui touche aux cookies ou à la base vit dans `session-serveur.ts`.
//
// Deux jetons, et la distinction compte :
//
//   - `ed_session` (30 min) porte l'identité ET le rôle. C'est lui que le
//     middleware vérifie, localement, sans un seul appel réseau.
//   - `ed_refresh` (30 jours) ne porte QUE l'identifiant du membre. Le rôle en
//     est délibérément absent : sinon une promotion ou une rétrogradation
//     n'atteindrait jamais un membre déjà connecté, son jeton la recopiant de
//     renouvellement en renouvellement. Le rôle est donc relu en base à chaque
//     renouvellement — une requête toutes les 30 minutes par membre actif, pas
//     une par page vue comme le faisait `supabase.auth.getUser()`.
//
// `jose` signe et vérifie (HS256). Jamais de HMAC écrit à la main.

// Sous-chemins et non le paquet entier : `from "jose"` tire tout l'index, donc
// le déchiffrement JWE, donc `CompressionStream` — une API Node que l'Edge
// Runtime n'a pas. Next le signale à chaque build, et le middleware embarquait
// du code qu'il n'exécutera jamais. On ne signe et ne vérifie que des JWS.
import { SignJWT } from "jose/jwt/sign"
import { jwtVerify } from "jose/jwt/verify"

export const COOKIE_SESSION = "ed_session"
export const COOKIE_REFRESH = "ed_refresh"

export const DUREE_SESSION_S = 30 * 60
export const DUREE_REFRESH_S = 30 * 24 * 60 * 60

/** Les deux rôles de la refonte (doc 20) : tout membre contribue. */
export type Role = "membre" | "admin"

export interface Session {
    membreId: string
    email: string
    nom: string | null
    role: Role
    /** Village par défaut du profil. Pré-remplit le « + », il ne le décide pas. */
    communeId: number | null
}

// Le secret est lu à l'APPEL et non au chargement du module : `next build`
// évalue le module en prérendu, où les variables runtime de Coolify n'existent
// pas encore. Même motif que `src/lib/odoo.ts`.
function cle(): Uint8Array {
    const secret = process.env.SESSION_SECRET
    if (!secret || secret.length < 32) {
        throw new Error(
            "SESSION_SECRET manquante ou trop courte (32 caractères minimum).",
        )
    }
    return new TextEncoder().encode(secret)
}

// Un jeton de renouvellement ne doit jamais pouvoir servir de jeton de session :
// il n'a pas de rôle, et un `role` absent lu comme « membre » serait une
// rétrogradation silencieuse — ou, si le défaut penchait de l'autre côté, une
// escalade. La distinction est donc portée par une revendication signée.
const TYPE_SESSION = "session"
const TYPE_REFRESH = "refresh"

export async function signerSession(session: Session): Promise<string> {
    return new SignJWT({
        typ: TYPE_SESSION,
        email: session.email,
        nom: session.nom,
        role: session.role,
        communeId: session.communeId,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(session.membreId)
        .setIssuedAt()
        .setExpirationTime(`${DUREE_SESSION_S}s`)
        .sign(cle())
}

export async function signerRefresh(membreId: string): Promise<string> {
    return new SignJWT({ typ: TYPE_REFRESH })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(membreId)
        .setIssuedAt()
        .setExpirationTime(`${DUREE_REFRESH_S}s`)
        .sign(cle())
}

/** Rend la session portée par un jeton, ou `null` — jeton absent, expiré,
 *  signé avec une autre clé, ou de mauvais type. Aucune exception ne remonte :
 *  un jeton illisible n'est pas une panne, c'est un visiteur non connecté. */
export async function lireSession(jeton: string | undefined): Promise<Session | null> {
    if (!jeton) return null
    // `cle()` est appelée HORS du try : un secret absent est une erreur de
    // déploiement, elle doit faire du bruit. Avalée ici, elle déconnecterait
    // tout le monde en silence — et le site répondrait 200, exactement le mode
    // de panne qui a coûté trois incidents de migration à ce projet.
    const secret = cle()
    try {
        const { payload } = await jwtVerify(jeton, secret)
        if (payload.typ !== TYPE_SESSION) return null
        if (typeof payload.sub !== "string") return null

        const role = payload.role
        if (role !== "membre" && role !== "admin") return null

        return {
            membreId: payload.sub,
            email: typeof payload.email === "string" ? payload.email : "",
            nom: typeof payload.nom === "string" ? payload.nom : null,
            role,
            communeId: typeof payload.communeId === "number" ? payload.communeId : null,
        }
    } catch {
        return null
    }
}

/** Rend l'identifiant du membre porté par un jeton de renouvellement. */
export async function lireRefresh(jeton: string | undefined): Promise<string | null> {
    if (!jeton) return null
    const secret = cle()
    try {
        const { payload } = await jwtVerify(jeton, secret)
        if (payload.typ !== TYPE_REFRESH) return null
        return typeof payload.sub === "string" ? payload.sub : null
    } catch {
        return null
    }
}
