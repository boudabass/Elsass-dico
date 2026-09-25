// Route machine-à-machine pour la chaîne de publication N8N (25/09/2026) :
// donne de quoi poster sur les réseaux sociaux à partir du jeu « Le défi du
// jour », sans jamais gâcher la partie en cours.
//
// Rend la RÉVÉLATION du défi de LA VEILLE (déjà clos, rien à gâcher), la
// révélation d'un défi précis via `?reveler=<numero>` (même garde-fou : un
// numéro pas encore clos rend `revelation: null`, jamais une erreur), et
// pour le défi du jour son numéro, son lien, et UNE manche en clair (les
// formes du village mystère + les 4 villages proposés, mélangés, sans dire
// lequel est juste) — exactement ce qu'un membre voit avant de répondre
// (`ManchePublique`, `src/app/actions/jeu.ts`), jamais la réponse elle-même.
//
// Lecture seule, zéro écriture. N'ajoute aucune logique métier : n'assemble
// que des fonctions déjà écrites et déjà vérifiées (`lib/jeu.ts`,
// `lib/lemmes.ts`, `lib/dictionnaire.ts`). Les 4 choix d'une manche existent
// déjà dans `manchesDuJour()` (tirage déterministe par date) — rien à
// reconstruire.

import { NextResponse, type NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"

import { LIBELLES_DEPARTEMENT } from "@/lib/dictionnaire"
import {
    chargerReserve,
    indiceDuJour,
    jourActuel,
    jourDuDefi,
    jourPrecedent,
    manchesDuJour,
    numeroDefi,
} from "@/lib/jeu"
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

/** La révélation complète d'un défi déjà clos : ses 5 villages, chacun avec
 *  toutes ses formes attestées et ce qui les fonde. Jamais appelée sur un
 *  défi encore en cours — les deux appelants ci-dessous le garantissent
 *  chacun à sa façon avant d'y arriver. */
async function reveleDefi(jour: string) {
    const manches = await manchesDuJour(jour)
    const villages = await Promise.all(
        manches.map(async (manche) => {
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
    return { numero: numeroDefi(jour), manches: villages.filter((v) => v !== null) }
}

export async function GET(request: NextRequest) {
    // Hors du try : un secret absent est une erreur de déploiement, elle doit
    // faire du bruit (500), jamais laisser passer une requête non protégée.
    const attendu = jetonAttendu()

    if (!autorise(request, attendu)) {
        return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 })
    }

    const jour = jourActuel()
    const numeroActuel = numeroDefi(jour)

    // Le tout premier jour du jeu (`LANCEMENT`), il n'existe pas encore de
    // veille : `indiceDuJour` plafonne à 0, et sans ce garde-fou la veille
    // recalculée serait le défi du jour lui-même, encore en cours pour tout
    // le monde — exactement ce que cette route doit ne jamais révéler.
    const veille = jourPrecedent(jour)
    const defiVeille = indiceDuJour(veille) < indiceDuJour(jour) ? await reveleDefi(veille) : null

    // `?reveler=<numero>` : le même garde-fou, généralisé à un numéro
    // quelconque plutôt qu'à « la veille » seulement — pour rappeler, dans un
    // post, le défi précédemment TEASÉ plutôt que celui d'hier au sens
    // calendaire (le rythme de publication n'est pas quotidien).
    const demande = Number(request.nextUrl.searchParams.get("reveler"))
    const numeroValide = Number.isInteger(demande) && demande >= 1 && demande < numeroActuel
    const revelation = numeroValide ? await reveleDefi(jourDuDefi(demande)) : null

    // Une manche du défi du jour, EN CLAIR mais sans réponse : les formes du
    // village mystère (l'indice) et les 4 villages proposés, mélangés — la
    // même chose qu'un membre voit avant de répondre. Toujours la même
    // position (la tranche la plus facile, indice 0 de `manchesDuJour()`) :
    // pas un choix arbitraire, la partie monte en difficulté dans cet ordre.
    const r = await chargerReserve()
    const cible = (await manchesDuJour(jour))[0]
    const villageCible = cible ? r.parId.get(cible.communeId) : undefined
    const manche = villageCible
        ? {
              formes: villageCible.formes,
              choix: cible.choix.flatMap((id) => {
                  const v = r.parId.get(id)
                  return v ? [{ nom: v.nom, departement: LIBELLES_DEPARTEMENT[v.departement] ?? v.departement }] : []
              }),
          }
        : null

    return NextResponse.json({
        defiVeille,
        revelation,
        defiDuJour: { numero: numeroActuel, url: URL_JEU, manche },
    })
}
