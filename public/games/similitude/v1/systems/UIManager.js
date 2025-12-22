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
        const modals = ['menu-modal', 'debug-modal', 'gameover-modal', 'powerup-modal', 'shop-modal'];
        modals.forEach(id => {
            if (id !== exceptId) {
                const el = document.getElementById(id);
                if (el && el.classList.contains('active')) {
                    el.classList.remove('active');
                    this.lastCloseTime = Date.now();
                }
            }
        });
        // Reprendre le jeu si toutes les modales bloquantes sont fermées
        if (exceptId !== 'gameover-modal' && !this.isAnyModalOpen() && GameState.currentState === GameState.GAME_STATE.PAUSED) {
            GameState.currentState = GameState.GAME_STATE.PLAYING;
        }
    },

    toggleMenu: function () {
        this._closeAllModals('menu-modal');
        const el = document.getElementById('menu-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        el.classList.toggle('active');
        
        if (becomingInactive) {
            this.lastCloseTime = Date.now();
        } else {
            // Pause le jeu si le menu s'ouvre
            if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
                GameState.currentState = GameState.GAME_STATE.PAUSED;
            }
        }
    },
    
    togglePowerUpWindow: function () {
        this._closeAllModals('powerup-modal');
        const el = document.getElementById('powerup-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        el.classList.toggle('active');
        
        if (becomingInactive) {
            this.lastCloseTime = Date.now();
        } else {
            // Pause le jeu et rend le contenu
            if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
                GameState.currentState = GameState.GAME_STATE.PAUSED;
            }
            this.renderPowerUpWindow();
        }
    },
    
    toggleShop: function() {
        this._closeAllModals('shop-modal');
        const el = document.getElementById('shop-modal');
        if (!el) return;
        const becomingInactive = el.classList.contains('active');
        el.classList.toggle('active');
        
        if (becomingInactive) {
            this.lastCloseTime = Date.now();
        } else {
            if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
                GameState.currentState = GameState.GAME_STATE.PAUSED;
            }
            this.renderShopWindow();
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