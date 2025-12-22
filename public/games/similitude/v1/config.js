const Config = {
    debug: true,
    showGrid: true,
    
    // --- PARAMÈTRES DE GRILLE ---
    grid: {
        rows: 9,
        cols: 9,
        tileSize: 64, // Taille de tuile standard
        matchMin: 3,  // Minimum pour fusion
        itemTypes: 8, // Nombre de types d'items différents utilisés dans la grille
        initialEmptySlots: 5, // NOUVEAU: Nombre de cases vides au départ
    },

    // --- PARAMÈTRES DE JEU ---
    levelTime: 120, // Temps initial en secondes
    initialEnergy: 20, // Nombre de clics/actions disponibles
    
    // --- COULEURS ---
    colors: {
        background: '#1e272e',
        gridLines: 'rgba(255, 255, 255, 0.1)',
        selectionGlow: '#f39c12',
        itemText: '#ecf0f1'
    },

    // --- ITEMS (50 icônes disponibles) ---
    seedIcons: [
        '🥔', '🧅', '🥬', '🌱', '🫐', '🫘', '🌶️', '🍈', '🍆', '🎃', 
        '🍄', '🧄', '🥕', '🍅', '🍓', '🍎', '🍌', '🍇', '🍍', '🥝',
        '🍒', '🍑', '🥭', '🥥', '🥑', '🥦', '🌽', '🍠', '🥜', '🌰',
        '🍞', '🧀', '🥚', '🥓', '🥩', '🍗', '🍤', '🍣', '🍕', '🍔',
        '🍟', '🌭', '🌮', '🌯', '🍜', '🍝', '🍛', '🍚', '🥟', '🥠'
    ]
};