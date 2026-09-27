'use server'

import { revalidatePath } from "next/cache"

import { REFUS_VILLAGE_REQUIS, type EchecContribution } from "@/lib/contribution"
import { poserVariante, validerSaisie, villageDuMembre, type SaisieForme } from "@/lib/contribution-serveur"
import { cleDeForme } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"
import { classerSaisie } from "@/lib/saisie-forme"
import { sessionActuelle } from "@/lib/session-serveur"

// Doc 20, étape 5 : « ça se dit autrement chez moi » → forme + village, sur un
// mot qui a déjà une fiche. Distinct du bouton `+` (votes.ts), qui revendique
// une forme EXISTANTE — ici le membre en écrit une nouvelle.
//
// Verbatim (règle 1) : ce que le membre tape est enregistré tel quel, jamais
// recadré vers l'ORTHAL ni « corrigé ». Depuis le 28/09/2026, l'article arrive
// À PART (bouton, ou détaché du champ par src/lib/saisie-forme.ts) : il est
// stocké décomposé comme celui de culture_alsace, et `article +
// formeSansArticle` redonne la forme octet pour octet.
//
// La variante et son témoignage se posent dans la même transaction : le doc
// dit « forme + village », pas deux gestes séparés. Sans ça, la forme naîtrait
// à 0 source et 0 village, et il faudrait revoter dessus soi-même juste après.

type Resultat =
    | { succes: true; varianteId: string }
    | EchecContribution

export async function creerVarianteAction(lemmeId: string, saisie: SaisieForme): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connecte-toi pour continuer" }

    const valide = validerSaisie(saisie)
    if (!valide.ok) return { succes: false, erreur: valide.erreur }

    const communeId = await villageDuMembre(session.membreId)
    if (!communeId) return REFUS_VILLAGE_REQUIS

    const lemme = await prisma.lemme.findUnique({ where: { id: lemmeId }, select: { id: true } })
    if (!lemme) return { succes: false, erreur: "Mot introuvable" }

    // La vérification de la feuille se refait ici : le navigateur ne fait pas
    // autorité. Une forme IDENTIQUE (article mis de côté, cf. saisie-forme.ts)
    // renvoie vers « Chez moi aussi » ; une forme seulement proche passe, le
    // membre a dit qu'elle était différente. Les formes masquées comptent
    // aussi, avec un message qui ne révèle jamais qu'une forme a été modérée.
    const connues = await prisma.variante.findMany({
        where: { lemmeId },
        select: { forme: true, masquee: true },
    })
    const identique =
        connues.find((c) => cleDeForme(c.forme) === valide.cle)
        ?? (() => {
            const r = classerSaisie(valide.forme, connues)
            return r.statut === "identique" ? r.candidat : null
        })()
    if (identique) {
        return identique.masquee
            ? { succes: false, erreur: "Cette forme est déjà connue de la base" }
            : { succes: false, erreur: "Cette forme existe déjà. Ajoute plutôt ton village avec « Chez moi aussi »" }
    }

    try {
        const varianteId = await prisma.$transaction((tx) =>
            poserVariante(tx, { lemmeId, forme: valide.forme, cle: valide.cle, membreId: session.membreId, communeId }),
        )
        revalidatePath(`/entree/${lemmeId}`)
        return { succes: true, varianteId }
    } catch (erreur) {
        console.error("[Variantes] Non créée:", erreur)
        return { succes: false, erreur: "Enregistrement impossible, réessaie dans un instant" }
    }
}

// Doc 20, « Correction » : « l'auteur édite sa variante tant que personne
// d'autre ne l'a revendiquée ». Le verrou n'est pas un statut dédié, il se lit
// en comptant les témoignages (schema.prisma, en-tête du fichier, point 4) :
// tant qu'il n'y en a qu'un — celui de l'auteur, posé à la création, retiré ou
// non — personne d'autre n'a cliqué `+` dessus. Un second témoignage ferme
// l'édition, pour ne jamais réécrire une forme qu'un autre village a
// entre-temps revendiquée.

type ResultatSimple =
    | { succes: true }
    | { succes: false; erreur: string }

export async function modifierVarianteAction(varianteId: string, saisie: SaisieForme): Promise<ResultatSimple> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connecte-toi pour continuer" }

    // Recomposée comme à la création (28/09/2026) : réécrire `forme` sans
    // toucher à l'article ferait échouer le CHECK sur toute forme qui en porte un.
    const valide = validerSaisie(saisie)
    if (!valide.ok) return { succes: false, erreur: valide.erreur }
    const { forme: composee, cle: cleFormeCalculee } = valide
    const forme = composee.forme

    const variante = await prisma.variante.findUnique({
        where: { id: varianteId },
        select: {
            lemmeId: true,
            forme: true,
            creeParId: true,
            masquee: true,
            _count: { select: { temoignages: true } },
        },
    })
    if (!variante || variante.masquee) return { succes: false, erreur: "Forme introuvable" }
    if (variante.creeParId !== session.membreId) {
        return { succes: false, erreur: "Tu ne peux modifier que tes propres contributions" }
    }
    if (variante._count.temoignages > 1) {
        return { succes: false, erreur: "Quelqu'un d'autre a déjà revendiqué cette forme, elle ne se modifie plus" }
    }

    // Rien n'a changé : pas d'écriture, donc pas de fausse modification au journal.
    if (forme === variante.forme) return { succes: true }

    const existante = await prisma.variante.findUnique({
        where: { lemmeId_cleForme: { lemmeId: variante.lemmeId, cleForme: cleFormeCalculee } },
        select: { id: true },
    })
    if (existante && existante.id !== varianteId) {
        return { succes: false, erreur: "Cette forme existe déjà sur ce mot" }
    }

    try {
        // La forme écrasée part au journal (24/09/2026) : corrigée, elle n'est
        // plus perdue. Même transaction, sinon le journal peut mentir.
        await prisma.$transaction([
            prisma.variante.update({
                where: { id: varianteId },
                data: {
                    forme,
                    cleForme: cleFormeCalculee,
                    article: composee.article,
                    formeSansArticle: composee.formeSansArticle,
                },
            }),
            prisma.evenementContribution.create({
                data: {
                    type: "modification",
                    varianteId,
                    membreId: session.membreId,
                    ancienneForme: variante.forme,
                    nouvelleForme: forme,
                },
            }),
        ])
    } catch (erreur) {
        console.error("[Variantes] Non modifiée:", erreur)
        return { succes: false, erreur: "Enregistrement impossible, réessaie dans un instant" }
    }

    revalidatePath(`/entree/${variante.lemmeId}`)
    return { succes: true }
}
