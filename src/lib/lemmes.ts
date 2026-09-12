// Accès en lecture aux lemmes, partagé par la recherche et le parcours A-Z.
//
// Vit dans `lib/` et non dans un fichier `'use server'` : ces fonctions sont
// appelées PAR des Server Actions, elles n'ont pas à devenir elles-mêmes des
// points d'entrée appelables depuis le navigateur.

import type { FormeApercu } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"

/** Les formes de plusieurs lemmes, avec ce qui fonde chacune, en UNE requête.
 *
 *  Une liste de 30 résultats qui interroge la base une fois par ligne, c'est 31
 *  allers-retours pour un écran — et ce projet tourne sur un VPS sans limite CPU
 *  ni rate limiting (audit du 30/08/2026). */
export async function apercusParLemme(ids: string[]): Promise<Map<string, FormeApercu[]>> {
    if (!ids.length) return new Map()

    const variantes = await prisma.variante.findMany({
        where: { lemmeId: { in: ids }, masquee: false },
        select: {
            lemmeId: true,
            forme: true,
            temoignages: { select: { sourceId: true, communeId: true } },
        },
        // Ordre stable : deux chargements de la même liste doivent montrer les
        // formes dans le même ordre. La leçon du 12/09 — des UUID tirés au
        // hasard rendaient la dérivation non reproductible — vaut à l'affichage.
        orderBy: [{ forme: "asc" }],
    })

    const parLemme = new Map<string, FormeApercu[]>()

    for (const v of variantes) {
        // Comptés SÉPARÉMENT et par identité distincte : une source qui atteste
        // deux fois la même forme reste une source, deux membres d'un même
        // village restent un village. Et les deux chiffres ne s'additionnent
        // jamais — c'est le bug de la PR #41, trouvé en production le 09/09.
        const sources = new Set<string>()
        const villages = new Set<number>()
        for (const t of v.temoignages) {
            if (t.sourceId) sources.add(t.sourceId)
            if (t.communeId) villages.add(t.communeId)
        }

        const apercu: FormeApercu = {
            forme: v.forme,
            nbSources: sources.size,
            nbVillages: villages.size,
        }

        const liste = parLemme.get(v.lemmeId)
        if (liste) liste.push(apercu)
        else parLemme.set(v.lemmeId, [apercu])
    }

    // La forme la mieux attestée d'abord — ce n'est pas « la bonne », c'est celle
    // que le plus de témoins écrivent. Plus de forme canonique depuis le
    // 11/09/2026 ; l'ordre présente, il ne tranche pas. Les deux comptes
    // départagent en cascade, jamais par leur somme.
    // `forEach` et non `for...of` sur l'itérateur : la cible TypeScript de ce
    // projet est es5, qui ne sait pas parcourir un Map.values().
    parLemme.forEach((liste) => {
        liste.sort((a, b) =>
            b.nbSources - a.nbSources
            || b.nbVillages - a.nbVillages
            || a.forme.localeCompare(b.forme, "fr"))
    })

    return parLemme
}
