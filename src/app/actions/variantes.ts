'use server'

import { revalidatePath } from "next/cache"

import { cleDeForme } from "@/lib/dictionnaire"
import { prisma } from "@/lib/prisma"
import { sessionActuelle } from "@/lib/session-serveur"

// Doc 20, étape 5, dernier morceau de la contribution qui restait à faire :
// « ça se dit autrement chez moi » → forme + village, sur un mot qui a déjà
// une fiche. Distinct du bouton `+` (votes.ts), qui revendique une forme
// EXISTANTE — ici le membre en écrit une nouvelle.
//
// Verbatim (règle 1) : ce que le membre tape est enregistré tel quel, jamais
// recadré vers l'ORTHAL ni « corrigé ». C'est un témoignage de locuteur, pas
// une transcription de source — la décomposition d'article (article.mts) ne
// s'applique donc pas, elle est réservée à culture_alsace.
//
// La variante et son témoignage se posent dans la même transaction : le doc
// dit « forme + village », pas deux gestes séparés. Sans ça, la forme naîtrait
// à 0 source et 0 village, et il faudrait revoter dessus soi-même juste après.

const FORME_MAX = 200

type Resultat =
    | { succes: true; varianteId: string }
    | { succes: false; erreur: string }

export async function creerVarianteAction(lemmeId: string, formeBrute: string): Promise<Resultat> {
    const session = await sessionActuelle()
    if (!session) return { succes: false, erreur: "Connexion requise" }

    const forme = formeBrute.trim()
    if (!forme) return { succes: false, erreur: "Écris une forme avant d'envoyer" }
    if (forme.length > FORME_MAX) return { succes: false, erreur: "Trop long pour une forme" }

    // Relu en base, comme le vote (votes.ts) : le jeton de session dure 30 min
    // et ne se resynchronise pas au fil de l'eau — un village tout juste choisi
    // doit pouvoir servir tout de suite.
    const membre = await prisma.membre.findUnique({
        where: { id: session.membreId },
        select: { communeId: true },
    })
    if (!membre?.communeId) {
        return { succes: false, erreur: "Choisis d'abord ton village, dans Mon espace" }
    }

    const lemme = await prisma.lemme.findUnique({ where: { id: lemmeId }, select: { id: true } })
    if (!lemme) return { succes: false, erreur: "Mot introuvable" }

    const cleFormeCalculee = cleDeForme(forme)
    if (!cleFormeCalculee) return { succes: false, erreur: "Écris une forme avant d'envoyer" }

    // Le CHECK d'unicité (lemmeId, cleForme) couvre aussi les formes masquées :
    // vérifié à l'avance pour rendre un message utile plutôt qu'une erreur de
    // contrainte, et pour ne jamais suggérer de voter sur une forme masquée.
    const existante = await prisma.variante.findUnique({
        where: { lemmeId_cleForme: { lemmeId, cleForme: cleFormeCalculee } },
        select: { masquee: true },
    })
    if (existante) {
        return existante.masquee
            ? { succes: false, erreur: "Cette forme est déjà connue de la base" }
            : { succes: false, erreur: "Cette forme existe déjà — ajoute plutôt ton village avec le bouton +" }
    }

    try {
        const variante = await prisma.$transaction(async (tx) => {
            const v = await tx.variante.create({
                data: { lemmeId, forme, cleForme: cleFormeCalculee, creeParId: session.membreId },
                select: { id: true },
            })
            await tx.temoignage.create({
                data: { varianteId: v.id, membreId: session.membreId, communeId: membre.communeId },
            })
            return v
        })

        revalidatePath(`/entree/${lemmeId}`)
        return { succes: true, varianteId: variante.id }
    } catch (erreur) {
        console.error("[Variantes] Non créée:", erreur)
        return { succes: false, erreur: "Enregistrement impossible" }
    }
}
