// Session côté serveur : cookies et base. Ce module lit `next/headers` et
// Prisma — il n'est donc JAMAIS importable depuis le middleware, qui doit
// rester sans I/O. Le middleware n'utilise que `session.ts`.

import { cache } from "react"
import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"
import {
    COOKIE_REFRESH,
    COOKIE_SESSION,
    DUREE_REFRESH_S,
    DUREE_SESSION_S,
    lireRefresh,
    lireSession,
    signerRefresh,
    signerSession,
    type Role,
    type Session,
} from "@/lib/session"

export interface CookieSession {
    nom: string
    valeur: string
    options: {
        httpOnly: boolean
        sameSite: "lax"
        secure: boolean
        path: string
        maxAge: number
    }
}

function options(dureeS: number): CookieSession["options"] {
    return {
        httpOnly: true,
        // `lax` et non `strict` : `strict` n'envoie pas le cookie quand on
        // arrive sur l'app par un lien externe — typiquement depuis le site
        // The Elsassisch — et l'utilisateur se croirait déconnecté.
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: dureeS,
    }
}

/** La session portée par le cookie. Sans accès à la base tant que le jeton
 *  court est valide, c'est-à-dire presque toujours.
 *
 *  Jeton court expiré mais renouvellement valide : on renouvelle ICI (07/10/2026).
 *  Le middleware renvoie une page vers `/api/session/refresh`, mais il laisse
 *  passer une Server Action : un 307 garde la méthode POST, et la route de
 *  renouvellement, en GET, répondait 405. Un écran resté ouvert plus de
 *  30 minutes voyait donc son premier chargement échouer. */
export async function sessionActuelle(): Promise<Session | null> {
    const bocal = await cookies()
    const session = await lireSession(bocal.get(COOKIE_SESSION)?.value)
    if (session) return session
    return renouveler(bocal.get(COOKIE_REFRESH)?.value)
}

// `cache` : une action qui relit la session plusieurs fois ne renouvelle
// qu'une fois par requête.
const renouveler = cache(async (jeton: string | undefined): Promise<Session | null> => {
    const membreId = await lireRefresh(jeton)
    if (!membreId) return null
    const prepare = await preparerSession(membreId)
    if (!prepare) return null
    try {
        // Permis dans une Server Action ou un Route Handler. Pendant le rendu
        // d'une page, Next refuse : la session vaut pour cette requête, et le
        // middleware renouvellera à la prochaine navigation.
        const bocal = await cookies()
        for (const c of prepare.cookies) bocal.set(c.nom, c.valeur, c.options)
    } catch {
        // rendu d'une page : rien à poser
    }
    return prepare.session
})

/** Signe les deux jetons à partir de l'état RÉEL du membre en base, sans rien
 *  écrire. C'est le seul endroit où le rôle entre dans un jeton, et il vient
 *  toujours de la base.
 *
 *  Rend les cookies plutôt que de les poser : une Server Action les pose par
 *  `cookies()`, un Route Handler les pose sur sa réponse. Poser par `cookies()`
 *  puis retourner une `NextResponse.redirect()` fabriquée à côté, c'est
 *  dépendre d'une fusion implicite — ici on applique, on ne parie pas. */
export async function preparerSession(
    membreId: string,
): Promise<{ session: Session; cookies: CookieSession[] } | null> {
    const membre = await prisma.membre.findUnique({
        where: { id: membreId },
        select: { id: true, email: true, nom: true, role: true, communeId: true },
    })
    if (!membre) return null

    const session: Session = {
        membreId: membre.id,
        email: membre.email,
        nom: membre.nom,
        role: membre.role,
        communeId: membre.communeId,
    }

    // Sert à savoir qui est réellement actif, jamais à autoriser quoi que ce
    // soit. Non bloquant : une écriture ratée ne doit pas refuser une connexion.
    await prisma.membre
        .update({ where: { id: membre.id }, data: { vuLe: new Date() } })
        .catch((erreur) => console.warn("[Session] vu_le non enregistré:", erreur))

    return {
        session,
        cookies: [
            {
                nom: COOKIE_SESSION,
                valeur: await signerSession(session),
                options: options(DUREE_SESSION_S),
            },
            {
                nom: COOKIE_REFRESH,
                valeur: await signerRefresh(membre.id),
                options: options(DUREE_REFRESH_S),
            },
        ],
    }
}

/** Version Server Action : prépare et pose. */
export async function ouvrirSession(membreId: string): Promise<Session | null> {
    const prepare = await preparerSession(membreId)
    if (!prepare) return null

    const bocal = await cookies()
    for (const c of prepare.cookies) bocal.set(c.nom, c.valeur, c.options)

    return prepare.session
}

export async function fermerSession(): Promise<void> {
    const bocal = await cookies()
    bocal.delete(COOKIE_SESSION)
    bocal.delete(COOKIE_REFRESH)
}

/** La barrière de LECTURE du dictionnaire (02/10/2026, décision de John).
 *  Le middleware ne suffit pas : Next expose sur chaque page toutes les
 *  Server Actions que ses composants importent, et `/jeu` (ouvert sans
 *  compte) embarque le parcours de contribution. Un `POST /jeu` avec
 *  l'identifiant de `rechercherAction`, lisible dans le JS public, rendait le
 *  dictionnaire à un visiteur anonyme (vérifié en production). Chaque action
 *  de lecture le relit donc elle-même. Vérification locale du jeton, sans
 *  requête en base : la lecture n'a pas besoin du rôle. */
export async function estConnecte(): Promise<boolean> {
    return (await sessionActuelle()) !== null
}

/** La vraie barrière d'administration : le rôle est relu EN BASE, jamais pris
 *  au cookie. Un jeton peut porter un rôle vieux d'une demi-heure ; une action
 *  d'admin ne s'autorise pas là-dessus.
 *
 *  Le contrôle du middleware, lui, ne sert qu'au confort de navigation — comme
 *  il l'a toujours fait, et comme il faut continuer de le lire. */
export async function adminExige(): Promise<{ membreId: string; role: Role } | null> {
    const session = await sessionActuelle()
    if (!session) return null

    const membre = await prisma.membre.findUnique({
        where: { id: session.membreId },
        select: { id: true, role: true },
    })
    if (!membre || membre.role !== "admin") return null

    return { membreId: membre.id, role: membre.role }
}
