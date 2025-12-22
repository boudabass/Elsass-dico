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
    ],
    
    // --- POWER-UPS (5x5 Structure) ---
    powerUps: [
        // Cat1: Explosion (Slot 1)
        [
            { id: 'bomb_3x3', name: 'Bombe 3x3', icon: '💣', category: 'Explosion', cost: 50 },
            { id: 'hammer_1x1', name: 'Marteau', icon: '🔨', category: 'Explosion', cost: 20 },
            { id: 'dynamite_burst', name: 'Dynamite', icon: '🧨', category: 'Explosion', cost: 80 },
            { id: 'lightning_strike', name: 'Foudre', icon: '🌩️', category: 'Explosion', cost: 120 },
            { id: 'bomb_5x5', name: 'Bombe 5x5', icon: '💥', category: 'Explosion', cost: 150 }
        ],
        // Cat2: Énergie (Slot 2)
        [
            { id: 'energy_30', name: '+30 Énergie', icon: '⚡', category: 'Énergie', cost: 40 },
            { id: 'energy_100', name: '+100 Énergie', icon: '🔋', category: 'Énergie', cost: 100 },
            { id: 'speed_boost', name: 'Vitesse x2', icon: '⏩', category: 'Énergie', cost: 70 },
            { id: 'shield', name: 'Bouclier', icon: '🛡️', category: 'Énergie', cost: 90 },
            { id: 'energy_max', name: 'Max Énergie', icon: '⚡', category: 'Énergie', cost: 180 }
        ],
        // Cat3: Zone (Slot 3)
        [
            { id: 'tornado_6x6', name: 'Tornade 6x6', icon: '🌪️', category: 'Zone', cost: 100 },
            { id: 'vortex_9x9', name: 'Vortex 9x9', icon: '🌀', category: 'Zone', cost: 150 },
            { id: 'color_bomb', name: 'Color Bomb', icon: '💫', category: 'Zone', cost: 130 },
            { id: 'black_hole', name: 'Trou Noir', icon: '🕳️', category: 'Zone', cost: 200 },
            { id: 'volcano_3x', name: 'Volcan x3', icon: '🌋', category: 'Zone', cost: 250 }
        ],
        // Cat4: Lignes (Slot 4)
        [
            { id: 'line_h', name: 'Ligne Horizontale', icon: '➡️', category: 'Lignes', cost: 60 },
            { id: 'line_v', name: 'Ligne Verticale', icon: '⬇️', category: 'Lignes', cost: 60 },
            { id: 'line_diag', name: 'Diagonale', icon: '↗️', category: 'Lignes', cost: 90 },
            { id: 'rotary', name: 'Giratoire', icon: '🔄', category: 'Lignes', cost: 110 },
            { id: 'precise_target', name: 'Cible Précise', icon: '🎯', category: 'Lignes', cost: 140 }
        ],
        // Cat5: Bonus (Slot 5)
        [
            { id: 'time_10s', name: '+10s Chrono', icon: '🕒', category: 'Bonus', cost: 30 },
            { id: 'time_pause_20s', name: 'Pause 20s', icon: '⏳', category: 'Bonus', cost: 80 },
            { id: 'vision', name: 'Vision', icon: '🔮', category: 'Bonus', cost: 50 },
            { id: 'score_x2', name: 'Score x2', icon: '⭐', category: 'Bonus', cost: 150 },
            { id: 'double_pts', name: 'Double Points', icon: '💎', category: 'Bonus', cost: 200 }
        ]
    ]
};