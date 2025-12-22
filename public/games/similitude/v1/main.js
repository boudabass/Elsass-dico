// main.js
// Point d'entrée principal - Initialisation de tous les managers

console.log("🧩 Similitude v1 Initializing...");

// Vérification du chargement des dépendances
(function checkDependencies() {
    if (window.LoadingManager) LoadingManager.advanceStep("Vérification des dépendances...");
    
    const required = [
        { name: 'Config', obj: typeof Config !== 'undefined' ? Config : null },
        { name: 'GameState', obj: window.GameState },
        { name: 'ChronoManager', obj: window.ChronoManager },
        { name: 'InputManager', obj: window.InputManager },
        { name: 'UIManager', obj: window.UIManager },
        { name: 'DebugManager', obj: window.DebugManager },
        { name: 'GridSystem', obj: window.GridSystem },
        { name: 'AnimationSystem', obj: window.AnimationSystem },
        { name: 'PowerUpManager', obj: window.PowerUpManager }, // NOUVEAU
    ];

    const missing = required.filter(dep => !dep.obj);

    if (missing.length > 0) {
        console.error("❌ Dépendances manquantes:", missing.map(d => d.name).join(', '));
        if (window.LoadingManager) LoadingManager.updateStatus(`ERREUR: ${missing.map(d => d.name).join(', ')} manquants.`);
        return false;
    }

    if (window.LoadingManager) LoadingManager.advanceStep("✅ Toutes les dépendances chargées.");
    return true;
})();

// Initialisation du HUD avec les valeurs de GameState
function initializeHUD() {
    if (window.LoadingManager) LoadingManager.advanceStep("Initialisation de l'interface HUD...");
    UIManager.updateHUD({
        energy: GameState.energy,
        gold: GameState.gold,
        score: GameState.score,
        chrono: ChronoManager.getTimeString()
    });
    if (window.LoadingManager) LoadingManager.advanceStep("✅ HUD initialisé.");
}

// Fonction globale pour mettre à jour le HUD (appelée par d'autres modules)
window.refreshHUD = function () {
    UIManager.updateHUD({
        energy: GameState.energy,
        gold: GameState.gold,
        score: GameState.score,
        chrono: ChronoManager.getTimeString()
    });
    // Mettre à jour les slots de power-up rapides
    if (window.PowerUpManager && window.UIManager) {
        UIManager.renderQuickSlots();
    }
};

// Fonction d'initialisation finale (appelée après le chargement de la sauvegarde)
window.finalizeGameSetup = function () {
    if (window.LoadingManager) LoadingManager.advanceStep("Finalisation des systèmes de jeu...");
    
    // Initialisation de la grille (pour que les dimensions soient prêtes)
    if (window.GridSystem) {
        GridSystem.init();
        if (window.LoadingManager) LoadingManager.advanceStep("Grille de puzzle initialisée.");
    }
    
    // NOTE: GameState.reset() est maintenant appelé par startGame()
    
    // Reste des étapes de progression pour atteindre 50
    for (let i = LoadingManager.currentStep; i < LoadingManager.MAX_STEPS - 1; i++) {
        LoadingManager.advanceStep("Préparation des assets et du rendu...");
    }

    if (window.LoadingManager) LoadingManager.advanceStep("Démarrage du moteur p5.js...");
    
    // Déclencher la fin du chargement
    LoadingManager.finishLoading();
    
    console.log("✅ main.js: Finalisation OK.");
};


// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', async function () {
    // 1. Initialisation synchrone des managers
    initializeHUD();
    
    // 2. Finalisation après l'initialisation
    finalizeGameSetup();
});

console.log("✅ main.js chargé");