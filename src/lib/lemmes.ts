// Accès en lecture aux lemmes, partagé par la recherche et le parcours A-Z.
//
// Vit dans `lib/` et non dans un fichier `'use server'` : ces fonctions sont
// appelées PAR des Server Actions et par des pages serveur (les fiches
// publiques /village, /prenom), elles n'ont pas à devenir elles-mêmes des
// points d'entrée appelables depuis le navigateur.

import type { FormeApercu, LemmeDetaille, VarianteDetaillee } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

/** La fiche d'un lemme : toutes ses variantes, et pour chacune ce qui la
 *  fonde — sources écrites d'un côté, villages de l'autre. Jamais additionnés.
 *
 *  Prend un sélecteur unique plutôt qu'un id : la même fiche se charge par
 *  identifiant (/entree/[id], authentifié) ou par slug (/prenom/[slug],
 *  public et généré statiquement) — un toponyme s'y ajoute par `communeId`
 *  depuis la page village. */
export async function chargerLemmeDetaille(
    where: Prisma.LemmeWhereUniqueInput,
): Promise<LemmeDetaille | null> {
    const lemme = await prisma.lemme.findUnique({
        where,
        select: {
            id: true,
            francais: true,
            contexte: true,
            type: true,
            commune: { select: { id: true, nom: true, slug: true, departement: true } },
            variantes: {
                where: { masquee: false },
                select: {
                    id: true,
                    forme: true,
                    article: true,
                    formeSansArticle: true,
                    temoignages: {
                        select: {
                            source: { select: { nom: true, url: true } },
                            commune: { select: { id: true, nom: true, slug: true } },
                        },
                    },
                },
            },
        },
    })

    if (!lemme) return null

    const variantes: VarianteDetaillee[] = lemme.variantes.map((v) => {
        // Dédoublonnage par identité, et séparément : une source qui atteste
        // deux fois la même forme reste UNE source (règle 2 telle qu'elle
        // survit — l'affichage de ce qui fonde), et deux membres d'un même
        // village restent un village.
        const sources = new Map<string, { nom: string; url: string | null }>()
        const villages = new Map<number, { id: number; nom: string; slug: string }>()

        for (const t of v.temoignages) {
            if (t.source) sources.set(t.source.nom, t.source)
            if (t.commune) villages.set(t.commune.id, t.commune)
        }

        return {
            id: v.id,
            forme: v.forme,
            article: v.article,
            formeSansArticle: v.formeSansArticle,
            nbSources: sources.size,
            nbVillages: villages.size,
            sources: Array.from(sources.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
            villages: Array.from(villages.values()).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
        }
    })

    // La forme la mieux attestée d'abord — ce n'est pas « la bonne », c'est
    // celle que le plus de témoins écrivent. Plus de forme canonique depuis le
    // 11/09/2026 : toutes coexistent, et l'ordre ne fait que présenter.
    //
    // Les deux comptes se comparent en CASCADE, jamais en somme. `nbSources +
    // nbVillages` aurait été le chiffre unique que la doctrine interdit — une
    // source écrite et un village ne sont pas deux unités du même genre. Ici
    // les sources départagent d'abord, les villages ensuite.
    variantes.sort((a, b) =>
        b.nbSources - a.nbSources
        || b.nbVillages - a.nbVillages
        || a.forme.localeCompare(b.forme, 'fr'))

    return {
        id: lemme.id,
        francais: lemme.francais,
        contexte: lemme.contexte,
        type: lemme.type,
        commune: lemme.commune,
        variantes,
    }
}

/** Les prénoms qui ont une forme alsacienne visible — ce que
 *  `generateStaticParams` de /prenom/[slug] pré-rend (doc 20, étape 3). Tout
 *  lemme `prenom` porte un slug (`scripts/deriver.mts`) ; le filtre sur
 *  `variantes` est défensif, pour le jour où une modération en aurait masqué
 *  la dernière. */
export async function slugsPrenomsAttestes(): Promise<string[]> {
    const lemmes = await prisma.lemme.findMany({
        where: { type: "prenom", slug: { not: null }, variantes: { some: { masquee: false } } },
        select: { slug: true },
    })
    return lemmes.map((l) => l.slug!)
}

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
