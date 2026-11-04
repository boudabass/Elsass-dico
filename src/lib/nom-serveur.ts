// Le nom d'un membre, côté serveur. Vit dans `lib/` et non dans `actions/` : un
// fichier `'use server'` n'exporte que des actions (voir CLAUDE.md).
import { prisma } from "@/lib/prisma"

export const MESSAGE_NOM_REQUIS =
    "Écris ton prénom et ton nom avant d'ajouter une forme. Ton nom sera affiché à côté de ce que tu ajoutes."

/** Vrai si le membre a confirmé son nom dans Mon espace. Sans cette trace, il
 *  ne peut pas écrire de texte : le nom ne s'affiche qu'une fois confirmé. */
export async function nomConfirme(membreId: string): Promise<boolean> {
    const membre = await prisma.membre.findUnique({
        where: { id: membreId },
        select: { nomConfirmeLe: true },
    })
    return membre?.nomConfirmeLe != null
}
