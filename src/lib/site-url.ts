import { headers } from "next/headers"

// URL publique de l'application, utilisée pour fabriquer les liens
// d'invitation et les redirections après vérification d'un jeton.
//
// La déduire des en-têtes ne convient pas : derrière le proxy Coolify,
// request.url porte l'adresse interne (localhost:3000), et l'en-tête Host est
// fourni par le client — un Host forgé ferait pointer un lien porteur de jeton
// vers un domaine tiers. SITE_URL est donc la source de vérité.
//
// Variable runtime Coolify (pas de préfixe NEXT_PUBLIC_ : elle n'est lue que
// côté serveur, et reste ainsi modifiable sans reconstruire l'image).
export async function urlDuSite(): Promise<string> {
    const configuree = process.env.SITE_URL?.trim()
    if (configuree) {
        return configuree.replace(/\/+$/, '')
    }

    // Repli tolérant pour ne pas casser le site si la variable manque encore.
    const entetes = await headers()
    const protocole = entetes.get('x-forwarded-proto') ?? 'https'
    const hote = entetes.get('x-forwarded-host') ?? entetes.get('host')
    console.warn(
        `[Config] SITE_URL absente, repli sur les en-têtes de la requête (${hote}). ` +
        `À définir dans les variables runtime Coolify.`,
    )
    return `${protocole}://${hote}`
}
