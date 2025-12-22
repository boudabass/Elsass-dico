// systems/UIManager.js
// Contrôleur principal gérant les modales et les mises à jour du HUD.

window.UIManager = {
    lastCloseTime: 0,

    // Vérifie si une modale est ouverte (pour bloquer les clics monde)
    isAnyModalOpen: function () {
        const isOpen = document.querySelectorAll('.modal-overlay.active').length > 0;
        // Le délai de 150ms est conservé ici pour le bouclier anti-clic monde
        const justClosed = (Date.now() - this.lastCloseTime) < 150; 
        return isOpen || justClosed;
    },
    
    // Vérifie si une modale est VISIBLE (pour la reprise du jeu)
    isAnyModalVisible: function() {
        return document.querySelectorAll('.modal-overlay.active').length > 0;
    },

    _closeAllModals: function (exceptId) {
        const modals = ['menu-modal', 'debug-modal', 'gameover-modal', 'powerup-modal', 'shop-modal'];
        let modalClosed = false;

        modals.forEach(id => {
            if (id !== exceptId) {
                const el = document.getElementById(id);
                if (el && el.classList.contains('active')) {
                    el.classList.remove('active');
                    this.lastCloseTime = Date.now();
                    modalClosed = true;
                }
            }
        });
        
        // NOTE: La reprise du jeu est maintenant gérée par les fonctions toggle individuelles
        // (toggleMenu, toggleShop, etc.) après la fermeture de la modale.
        return modalClosed;
    },

    toggleMenu: function () {
        const el = document.getElementById('menu-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        
        this._closeAllModals('menu-modal');
        el.classList.toggle('active');
        
        if (becomingInactive) {
            this.lastCloseTime = Date.now();
            // Si le menu se ferme ET qu'aucune autre modale n'est visible, on reprend le jeu
            if (GameState.currentState === GameState.GAME_STATE.PAUSED && !this.isAnyModalVisible() && typeof startGame === 'function') {
                startGame(); // Reprend le jeu (met l'état à PLAYING et appelle loop())
                console.log("▶️ Jeu repris automatiquement (Menu).");
            }
        } else {
            // Pause le jeu si le menu s'ouvre
            if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
                GameState.currentState = GameState.GAME_STATE.PAUSED;
                window.toggleGameLoop(false); // PAUSE DE LA BOUCLE P5.JS
            }
        }
    },
    
    togglePowerUpWindow: function () {
        const el = document.getElementById('powerup-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        
        this._closeAllModals('powerup-modal');
        el.classList.toggle('active');
        
        if (becomingInactive) {
            this.lastCloseTime = Date.now();
            // Reprise automatique
            if (GameState.currentState === GameState.GAME_STATE.PAUSED && !this.isAnyModalVisible() && typeof startGame === 'function') {
                startGame();
                console.log("▶️ Jeu repris automatiquement (PowerUp).");
            }
        } else {
            // Pause le jeu et rend le contenu
            if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
                GameState.currentState = GameState.GAME_STATE.PAUSED;
                window.toggleGameLoop(false); // PAUSE DE LA BOUCLE P5.JS
            }
            this.renderPowerUpWindow();
        }
    },
    
    toggleShop: function() {
        const el = document.getElementById('shop-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        
        this._closeAllModals('shop-modal');
        el.classList.toggle('active');
        
        if (becomingInactive) {
            this.lastCloseTime = Date.now();
            // Reprise automatique
            if (GameState.currentState === GameState.GAME_STATE.PAUSED && !this.isAnyModalVisible() && typeof startGame === 'function') {
                startGame();
                console.log("▶️ Jeu repris automatiquement (Shop).");
            }
        } else {
            if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
                GameState.currentState = GameState.GAME_STATE.PAUSED;
                window.toggleGameLoop(false); // PAUSE DE LA BOUCLE P5.JS
            }
            this.renderShopWindow();
        }
    },

    toggleDebug: function () {
        const el = document.getElementById('debug-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        
        this._closeAllModals('debug-modal');
        el.classList.toggle('active');
        
        if (becomingInactive) {
            this.lastCloseTime = Date.now();
            // Reprise automatique
            if (GameState.currentState === GameState.GAME_STATE.PAUSED && !this.isAnyModalVisible() && typeof startGame === 'function') {
                startGame();
                console.log("▶️ Jeu repris automatiquement (Debug).");
            }
        } else {
            if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
                GameState.currentState = GameState.GAME_STATE.PAUSED;
                window.toggleGameLoop(false); // PAUSE DE LA BOUCLE P5.JS
            }
        }
    },
    
    showGameOver: function() {
        this._closeAllModals('gameover-modal');
        const el = document.getElementById('gameover-modal');
        if (!el) return;
        el.classList.add('active');
        
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

    // --- Rendu des Power-ups ---
    
    renderQuickSlots: function() {
        const container = document.getElementById('quick-slots-container');
        if (!container || !window.PowerUpManager) return;
        
        let html = '';
        
        GameState.equippedSlots.forEach((slot, index) => {
            const pu = PowerUpManager.getEquippedPowerUp(index);
            const qty = pu ? pu.qty : 0;
            const isActive = GameState.activePowerUpIndex === index;
            const isEmpty = qty === 0;
            
            html += `
                <div class="quick-slot ${isActive ? 'active-glow' : ''} ${isEmpty ? 'empty-slot' : ''}" 
                     onclick="event.stopPropagation(); PowerUpManager.toggleActive(${index})">
                    <span class="slot-icon">${slot.icon}</span>
                    <span class="slot-qty">x${qty}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    renderPowerUpWindow: function() {
        const container = document.getElementById('powerup-grid');
        if (!container || !window.PowerUpManager) return;
        
        let html = '';
        
        Config.powerUps.forEach((category, colIndex) => {
            category.forEach(pu => {
                const qty = GameState.powerUpStock[pu.id] || 0;
                const isEquipped = GameState.equippedSlots[colIndex].id === pu.id;
                
                html += `
                    <div class="pu-slot ${isEquipped ? 'equipped' : ''}" 
                         onclick="event.stopPropagation(); PowerUpManager.equipPowerUp('${pu.id}', ${colIndex})">
                        <span class="pu-icon">${pu.icon}</span>
                        <span class="pu-name">${pu.name}</span>
                        <span class="pu-qty">x${qty}</span>
                    </div>
                `;
            });
        });
        
        container.innerHTML = html;
    },
    
    renderShopWindow: function() {
        const container = document.getElementById('shop-grid');
        if (!container || !window.PowerUpManager) return;
        
        let html = '';
        
        Config.powerUps.forEach(category => {
            category.forEach(pu => {
                const qty = GameState.powerUpStock[pu.id] || 0;
                const canAfford = GameState.gold >= pu.cost;
                
                html += `
                    <div class="shop-item ${!canAfford ? 'cannot-afford' : ''}" 
                         onclick="event.stopPropagation(); PowerUpManager.buyPowerUp('${pu.id}')">
                        <div class="shop-icon">${pu.icon}</div>
                        <div class="shop-details">
                            <div class="shop-name">${pu.name}</div>
                            <div class="shop-price">💰 ${pu.cost}</div>
                        </div>
                        <div class="shop-stock">x${qty}</div>
                    </div>
                `;
            });
        });
        
        container.innerHTML = html;
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