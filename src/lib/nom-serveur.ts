// Le nom d'un membre, côté serveur. Vit dans `lib/` et non dans `actions/` : un
// fichier `'use server'` n'exporte que des actions (voir CLAUDE.md).
import { prisma } from "@/lib/prisma"

// Affiché en toast : l'éditeur de forme n'a pas de champ du nom, donc le membre
// renvoie vers Mon espace. Le toaster est monté dans le layout racine.
export const MESSAGE_NOM_REQUIS =
    "Écris ton prénom et ton nom dans Mon espace avant d'ajouter ou de corriger un mot. Ton nom sera affiché à côté de ce que tu ajoutes."

/** Vrai si le membre a confirmé son nom dans Mon espace. Sans cette trace, il
 *  ne peut pas écrire de texte : le nom ne s'affiche qu'une fois confirmé. */
export async function nomConfirme(membreId: string): Promise<boolean> {
    const membre = await prisma.membre.findUnique({
        where: { id: membreId },
        select: { nomConfirmeLe: true },
    })
    return membre?.nomConfirmeLe != null
}
