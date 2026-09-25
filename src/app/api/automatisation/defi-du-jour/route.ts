// Route machine-à-machine pour la chaîne de publication N8N (25/09/2026) :
// donne de quoi poster sur les réseaux sociaux à partir du jeu « Le défi du
// jour », sans jamais gâcher la partie en cours.
//
// Rend la RÉVÉLATION du défi de LA VEILLE (déjà clos, rien à gâcher) et
// seulement le numéro + le lien du défi du jour, sans son contenu — la bonne
// réponse d'une manche ne doit quitter le serveur qu'après que quelqu'un y a
// joué (cf. `src/app/actions/jeu.ts`), et un défi encore en cours pour tout
// le monde ne fait pas exception.
//
// Lecture seule, zéro écriture. N'ajoute aucune logique métier : n'assemble
// que des fonctions déjà écrites et déjà vérifiées (`lib/jeu.ts`,
// `lib/lemmes.ts`, `lib/dictionnaire.ts`).

import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"

import { LIBELLES_DEPARTEMENT } from "@/lib/dictionnaire"
import { indiceDuJour, jourActuel, jourPrecedent, manchesDuJour, numeroDefi } from "@/lib/jeu"
import { chargerLemmeDetaille } from "@/lib/lemmes"

const URL_JEU = "https://elsass-dico.theelsassisch.com/jeu"

// Lu à l'APPEL et non au chargement du module : `next build` évalue le
// module en prérendu, où les variables runtime de Coolify n'existent pas
// encore (même motif que `SESSION_SECRET`, `src/lib/session.ts`).
function jetonAttendu(): string {
    const t = process.env.AUTOMATISATION_API_TOKEN
    if (!t || t.length < 32) {
        throw new Error(
            "AUTOMATISATION_API_TOKEN manquante ou trop courte (32 caractères minimum).",
        )
    }
    return t
}

function autorise(request: NextRequest, attendu: string): boolean {
    const entete = request.headers.get("authorization") ?? ""
    const fourni = entete.startsWith("Bearer ") ? entete.slice(7) : ""
    // Comparaison à temps constant : la longueur du jeton fourni ne doit rien
    // apprendre à qui essaie de le deviner.
    const a = Buffer.from(fourni)
    const b = Buffer.from(attendu)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}

export async function GET(request: NextRequest) {
    // Hors du try : un secret absent est une erreur de déploiement, elle doit
    // faire du bruit (500), jamais laisser passer une requête non protégée.
    const attendu = jetonAttendu()

    if (!autorise(request, attendu)) {
        return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 })
    }

    const jour = jourActuel()
    const veille = jourPrecedent(jour)

    // Le tout premier jour du jeu (`LANCEMENT`), il n'existe pas encore de
    // veille : `indiceDuJour` plafonne à 0, et sans ce garde-fou la veille
    // recalculée serait le défi du jour lui-même, encore en cours pour tout
    // le monde — exactement ce que cette route doit ne jamais révéler.
    const dejaUneVeille = indiceDuJour(veille) < indiceDuJour(jour)

    const defiVeille = dejaUneVeille
        ? {
              numero: numeroDefi(veille),
              manches: (
                  await Promise.all(
                      (await manchesDuJour(veille)).map(async (manche) => {
                          const lemme = await chargerLemmeDetaille({ communeId: manche.communeId })
                          if (!lemme?.commune) return null
                          return {
                              village: {
                                  nom: lemme.commune.nom,
                                  slug: lemme.commune.slug,
                                  departement: LIBELLES_DEPARTEMENT[lemme.commune.departement] ?? lemme.commune.departement,
                              },
                              formes: lemme.variantes.map((v) => ({
                                  forme: v.forme,
                                  nbSources: v.nbSources,
                                  nbVillages: v.nbVillages,
                                  sources: v.sources.map((s) => s.nom),
                              })),
                          }
                      }),
                  )
              ).filter((m) => m !== null),
          }
        : null

    return NextResponse.json({
        defiVeille,
        defiDuJour: { numero: numeroDefi(jour), url: URL_JEU },
    })
}
