// Le lien vers l'écran d'arbitrage d'un candidat. Partagé par la file, la liste
// des entrées et l'onglet des recoupées, qui désignent tous une entrée par le
// couple (clé normalisée, contexte) — le contexte sépare les homonymes.
export function lienArbitrage(cle: string, contexte: string) {
    const query = contexte ? `?contexte=${encodeURIComponent(contexte)}` : "";
    return `/admin/arbitrage/${encodeURIComponent(cle)}${query}`;
}
