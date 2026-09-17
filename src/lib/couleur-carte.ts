// Couleur par forme, pour la carte des parlers : deux villages qui disent
// pareil se voient d'un coup d'œil (doc 20, étape 4). Déterministe — la même
// forme rend toujours la même couleur, sans état ni aller-retour serveur.
//
// Palette catégorielle (12 teintes), choisie pour rester lisible sur le fond
// pâle du maillage (#f8fafc) : rien de trop clair, rien qui se confonde avec
// le gris des frontières communales (#94a3b8).
const PALETTE = [
    "#C20000", "#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777",
    "#0891b2", "#65a30d", "#ea580c", "#4338ca", "#0d9488", "#be123c",
]

// djb2 : simple, stable entre deux rendus (jamais Math.random, interdit dans
// un composant serveur/client réhydraté).
function hacher(texte: string): number {
    let h = 5381
    for (let i = 0; i < texte.length; i++) {
        h = (h * 33) ^ texte.charCodeAt(i)
    }
    return h >>> 0
}

export function couleurDeForme(forme: string): string {
    if (!forme) return PALETTE[0]
    return PALETTE[hacher(forme) % PALETTE.length]
}
