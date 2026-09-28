// Couleurs de la carte des parlers.
//
// Revue du 28/09/2026 : la carte des villages colorait chaque point par un
// hachage de sa première forme. Deux voisins de même couleur ne partageaient
// donc rien, sans légende, et le lecteur cherchait un motif qui n'existait
// pas. Désormais :
//   - sans recherche, tous les villages ont la même couleur (COULEUR_VILLAGE) :
//     un point dit seulement « ce village a une forme connue » ;
//   - sur la carte d'un mot ou d'une forme, chaque variante (ou chaque sens)
//     reçoit une couleur par son RANG dans la liste du panneau, qui sert de
//     légende. Par rang et non par hachage : deux variantes d'un même mot ne
//     peuvent plus tomber sur la même teinte.
//
// Ni rouge ni bleu dans la palette : dans l'app connectée, ce sont les couleurs
// des deux langues (27/09/2026). Choisie pour rester lisible sur le fond pâle
// du maillage (#f8fafc) et distincte du gris des frontières (#94a3b8).
export const COULEUR_VILLAGE = "#57534e"

const PALETTE = [
    "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2",
    "#65a30d", "#ea580c", "#0d9488", "#a16207", "#9333ea",
]

export function couleurParRang(rang: number): string {
    return PALETTE[rang % PALETTE.length]
}
