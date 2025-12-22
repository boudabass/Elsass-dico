// systems/UIManager.js
// Contrôleur principal gérant les modales et les mises à jour du HUD.

window.UIManager = {
    lastCloseTime: 0,

    // Vérifie si une modale est ouverte.
    isAnyModalOpen: function () {
        const isOpen = document.querySelectorAll('.modal-overlay.active').length > 0;
        const justClosed = (Date.now() - this.lastCloseTime) < 150;
        return isOpen || justClosed;
    },

    _closeAllModals: function (exceptId) {
        const modals = ['menu-modal', 'debug-modal', 'gameover-modal'];
        modals.forEach(id => {
            if (id !== exceptId) {
                const el = document.getElementById(id);
                if (el && el.classList.contains('active')) {
                    el.classList.remove('active');
                    this.lastCloseTime = Date.now();
                }
            }
        });
    },

    toggleMenu: function () {
        this._closeAllModals('menu-modal');
        const el = document.getElementById('menu-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        el.classList.toggle('active');
        if (becomingInactive) this.lastCloseTime = Date.now();
        
        // Pause/Reprise du jeu
        if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
            GameState.currentState = GameState.GAME_STATE.PAUSED;
        } else if (GameState.currentState === GameState.GAME_STATE.PAUSED) {
            GameState.currentState = GameState.GAME_STATE.PLAYING;
        }
    },

    toggleDebug: function () {
        this._closeAllModals('debug-modal');
        const el = document.getElementById('debug-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        el.classList.toggle('active');
        if (becomingInactive) this.lastCloseTime = Date.now();

        if (el.classList.contains('active') && window.DebugManager) {
            DebugManager.updateGridButton();
        }
    },
    
    showGameOver: function() {
        this._closeAllModals('gameover-modal');
        const el = document.getElementById('gameover-modal');
        if (!el) return;
        el.classList.add('active');
        
        // Mettre à jour le score final
        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) finalScoreEl.innerText = GameState.score;
    },

    toggleFullscreen: function () {
        if (window.GameSystem && window.GameSystem.Display) {
            window.GameSystem.Display.toggleFullscreen();
        }
        this.toggleMenu();
    },

    toggleGrid: function () {
        if (typeof Config !== 'undefined') {
            Config.showGrid = !Config.showGrid;
            if (window.DebugManager) DebugManager.updateGridButton();
            if (window.redraw) window.redraw();
        }
    },

    // --- Fonctions de mise à jour (Sécurisées) ---

    updateHUD: function (data) {
        const elEnergy = document.getElementById('val-energy');
        const elGold = document.getElementById('val-gold');
        const elScore = document.getElementById('val-score');
        const elChrono = document.getElementById('val-chrono');

        if (elEnergy) elEnergy.innerText = data.energy !== undefined ? data.energy : 0;
        if (elGold) elGold.innerText = data.gold !== undefined ? data.gold : 0;
        if (elScore) elScore.innerText = data.score !== undefined ? data.score : 0;
        if (elChrono) elChrono.innerText = data.chrono || '00:00';
    },

    updateDebugInfo: function (info) {
        if (window.DebugManager) {
            DebugManager.updateInfo(info);
        }
    }
};