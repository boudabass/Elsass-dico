// Les messages de l'équipe aux membres (07/11/2026). Sans Prisma : l'écran
// (Mon espace, la fiche admin) s'en sert aussi, donc les constantes ne vivent pas
// dans le fichier serveur.

/** Un message fait entre 1 et 2000 caractères, une fois les espaces du bord ôtés. */
export const MESSAGE_TEXTE_MAX = 2000

/** Messages envoyés par heure et par admin. Au-delà, il faut attendre. */
export const MESSAGES_PAR_HEURE = 20

/** La signature d'un message, ajoutée à l'affichage : le message lui-même reste du texte brut. */
export const SIGNATURE_MESSAGE = "L'équipe The Elsassisch"

/** jj/mm/aaaa, à la main (voir admin/page.tsx pour la raison). */
export function dateMessage(iso: string): string {
    const d = new Date(iso)
    const deux = (n: number) => String(n).padStart(2, "0")
    return `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()}`
}
