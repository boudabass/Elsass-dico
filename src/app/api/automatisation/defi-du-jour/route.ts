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

import { autorise, jetonAttendu } from "@/lib/automatisation-serveur"
import { LIBELLES_DEPARTEMENT } from "@/lib/dictionnaire"
import {
    indiceDuJour,
    jourActuel,
    jourDuDefi,
    jourPrecedent,
    mancheOuverteDuJour,
    manchesDuJour,
    numeroDefi,
} from "@/lib/jeu"
import { chargerLemmeDetaille } from "@/lib/lemmes"

const URL_JEU = "https://elsass-dico.theelsassisch.com/jeu"

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
    // La home publique montre la même (`mancheOuverteDuJour()`, 26/09/2026).
    const ouverte = await mancheOuverteDuJour(jour)
    const manche = ouverte
        ? {
              formes: ouverte.formes,
              choix: ouverte.choix.map((c) => ({
                  nom: c.nom,
                  departement: LIBELLES_DEPARTEMENT[c.departement] ?? c.departement,
              })),
          }
        : null

    return NextResponse.json({
        defiVeille,
        revelation,
        defiDuJour: { numero: numeroActuel, url: URL_JEU, manche },
    })
}
