// core/ChronoManager.js
// Gère le compte à rebours du niveau

window.ChronoManager = {
    // Décrémente le chrono d'une seconde
    tick: function () {
        if (GameState.currentState !== GameState.GAME_STATE.PLAYING) return;

        if (GameState.chrono > 0) {
            GameState.chrono--;
            if (window.refreshHUD) refreshHUD();
        }

        if (GameState.chrono <= 0) {
            GameState.currentState = GameState.GAME_STATE.GAMEOVER;
            console.log("⏱️ Temps écoulé ! Game Over.");
            // Déclencher la sauvegarde et l'affichage du modal Game Over
        }
    },

    // Formatte le temps en MM:SS
    getTimeString: function () {
        const minutes = floor(GameState.chrono / 60);
        const seconds = GameState.chrono % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
};

console.log("✅ ChronoManager.js chargé");