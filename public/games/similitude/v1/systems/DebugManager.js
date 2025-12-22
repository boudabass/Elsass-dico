// systems/DebugManager.js
// Gestion avancée du Debug (Onglets + Actions)

window.DebugManager = {
    activeTab: 'general',

    // Change l'onglet actif
    switchTab: function (tabId) {
        this.activeTab = tabId;

        // Mettre à jour les boutons
        document.querySelectorAll('.debug-tabs .hud-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = btn.id === `tab-${tabId}` ? '#e74c3c' : '#34495e';
        });

        // Masquer tous les panneaux
        document.querySelectorAll('.debug-panel').forEach(p => p.style.display = 'none');

        // Afficher le bon
        const panel = document.getElementById(`panel-${tabId}`);
        if (panel) panel.style.display = 'block';

        this.refreshPanel(tabId);
    },

    // Rafraîchit les données de l'onglet actif
    refreshPanel: function (tabId) {
        if (tabId === 'time') {
            const display = document.getElementById('dbg-time-display');
            if (display && window.ChronoManager) {
                display.innerText = `Temps restant: ${ChronoManager.getTimeString()}`;
            }
        }
    },

    // Exécute une action de debug
    action: function (actionName) {
        console.log(`🔧 Debug Action: ${actionName}`);

        switch (actionName) {
            // --- TIME ---
            case 'addTime':
                GameState.chrono += 30;
                break;
            case 'endGame':
                GameState.chrono = 1;
                break;

            // --- PUZZLE ---
            case 'forceFusion':
                if (window.GridSystem) {
                    GridSystem.checkAndProcessFusions();
                    console.log("💥 Fusion forcée !");
                }
                break;
            case 'resetGrid':
                if (window.GridSystem) {
                    GridSystem.init();
                    console.log("🔄 Grille réinitialisée !");
                }
                break;

            // --- RESSOURCES ---
            case 'addEnergy':
                GameState.restoreEnergy(10);
                break;
            case 'addGold':
                GameState.addGold(100);
                break;
            case 'addScore':
                GameState.score += 500;
                break;
        }

        // Rafraichir le HUD après action
        if (window.refreshHUD) window.refreshHUD();
        this.refreshPanel(this.activeTab);
    },

    // Met à jour la console (Appelé par sketch.js draw loop)
    updateInfo: function (info) {
        if (this.activeTab === 'time') this.refreshPanel('time');

        const debugContent = document.getElementById('debug-content');
        if (debugContent && this.activeTab === 'general') {
            debugContent.innerHTML = `
                <strong>--- GAME STATE ---</strong><br>
                State: ${GameState.currentState}<br>
                Score: ${GameState.score}<br>
                Energy: ${GameState.energy}/${GameState.maxEnergy}<br>
                Gold: ${GameState.gold}<br>
                <br>
                <strong>--- SELECTION ---</strong><br>
                Selected: ${GameState.selectedTile ? \`(\${GameState.selectedTile.col}, \${GameState.selectedTile.row})\` : 'NONE'}<br>
                <br>
                <strong>--- MOUSE (SCREEN) ---</strong><br>
                Mouse X: ${Math.round(info.screenX)}<br>
                Mouse Y: ${Math.round(info.screenY)}<br>
            `;
        }
    },

    // Met à jour le texte du bouton Toggle Grid
    updateGridButton: function () {
        const btn = document.getElementById('toggle-grid-btn');
        if (btn) {
            btn.innerText = `Toggle Grid (${Config.showGrid ? 'ON' : 'OFF'})`;
        }
    }
};