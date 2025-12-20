const Config = {
    debug: true,
    
    // Taille de la zone de jeu (chaque zone est un grand monde)
    zoneWidth: 3000,
    zoneHeight: 3000,
    worldMargin: 100, // Marge de vide visible autour du monde
    
    // Grille
    tileSize: 40, // Nouvelle taille de tuile
    
    // Zones de Transition (Portails) - Gardé pour la logique de clic, mais non dessiné
    portal: {
        size: 40 * 3, // 3 tuiles de large/haut
        margin: 40 * 3, // Marge pour centrer le portail
        color: 'rgba(255, 255, 255, 0.0)' // Rendu invisible
    },
    
    // Caméra
    zoom: {
        min: 0.5,
        max: 3.0,
        start: 1.0,
        sensitivity: 0.001
    },
    
    // Définition des 9 Zones (3x3) - Couleurs Pastels
    zones: [
        // Ligne 1 (Nord)
        { id: 'N_W', name: 'Mine', bgColor: '#a4b0be' }, // Gris clair/bleuté
        { id: 'N_C', name: 'Montagne', bgColor: '#c8d6e5' }, // Gris très clair
        { id: 'N_E', name: 'Forêt', bgColor: '#7bed9f' }, // Vert menthe
        // Ligne 2 (Centre)
        { id: 'C_W', name: 'Ville', bgColor: '#f9ca24' }, // Jaune doux
        { id: 'C_C', name: 'Ferme Principale', bgColor: '#55efc4' }, // Turquoise clair (Zone de départ)
        { id: 'C_E': 'Riviere', bgColor: '#70a1ff' }, // Bleu ciel
        // Ligne 3 (Sud)
        { id: 'S_W', name: 'Marais', bgColor: '#ff7979' }, // Rouge/Rose doux
        { id: 'S_C', name: 'Champs Sud', bgColor: '#ffbe76' }, // Orange pêche
        { id: 'S_E', name: 'Plage', bgColor: '#ffeaa7' } // Jaune sable
    ],
    
    // Couleurs
    colors: {
        gridLines: 'rgba(255, 255, 255, 0.1)'
    }
};

window.ElsassFarm = {
    state: {
        currentZoneId: 'C_C'
    }
};