// core/GameState.js
// État global du jeu - Source unique de vérité pour toutes les données

window.GameState = {
    // --- États du Jeu ---
    GAME_STATE: {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAMEOVER: 'GAMEOVER'
    },
    currentState: 'MENU',

    // --- Ressources Joueur ---
    energy: 0,        // Limite de clics
    maxEnergy: Config.initialEnergy,
    gold: 0,          // Monnaie du jeu
    score: 0,         // Score actuel
    chrono: 0,        // Temps restant en secondes

    // --- Logique de Puzzle ---
    selectedTile: null, // { col, row, itemId } de l'item sélectionné
    
    // --- Méthodes utilitaires ---

    // Dépense de l'énergie (retourne false si pas assez)
    spendEnergy: function (amount) {
        if (this.energy >= amount) {
            this.energy -= amount;
            return true;
        }
        console.warn(`Pas assez d'énergie! Requis: ${amount}, Disponible: ${this.energy}`);
        return false;
    },

    // Récupération d'énergie
    restoreEnergy: function (amount) {
        this.energy = Math.min(this.energy + amount, this.maxEnergy);
    },

    // Ajoute de l'or
    addGold: function (amount) {
        this.gold += amount;
    },

    // Réinitialise l'état pour une nouvelle partie
    reset: function () {
        this.energy = Config.initialEnergy;
        this.gold = 0;
        this.score = 0;
        this.chrono = Config.levelTime;
        this.selectedTile = null;
        this.currentState = this.GAME_STATE.MENU;
    }
};

console.log("✅ GameState.js chargé");