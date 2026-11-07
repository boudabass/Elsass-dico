// Le blocage d'un membre, côté serveur (07/11/2026). Vit dans `lib/` et non dans
// `actions/` : un fichier `'use server'` n'exporte que des actions (voir CLAUDE.md).
//
// Un compte bloqué lit le dictionnaire et fait le défi. Il n'écrit plus : chaque
// action d'écriture appelle `refusSiBloque()` juste après la session. Rien n'est
// masqué ni effacé : le blocage ne touche que ce qui reste à écrire.
import { MESSAGE_BLOQUE } from "@/lib/blocage"
import { prisma } from "@/lib/prisma"

/** Le message à montrer si ce membre est bloqué, `null` sinon. */
export async function refusSiBloque(membreId: string): Promise<string | null> {
    const membre = await prisma.membre.findUnique({
        where: { id: membreId },
        select: { bloqueLe: true },
    })
    return membre?.bloqueLe ? MESSAGE_BLOQUE : null
}
