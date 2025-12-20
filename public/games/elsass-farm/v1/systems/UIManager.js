// Mappage Icônes pour la minimap
const ZONE_ICONS = {
    'N_W': '⛏', // Mine
    'N_C': '⛰', // Montagne
    'N_E': '🌲', // Forêt
    'C_W': '🏙', // Ville
    'C_C': '🏚', // Ferme Principale (Maison)
    'C_E': '🌊', // Riviere
    'S_W': '🐊', // Marais
    'S_C': '🌾', // Champs Sud
    'S_E': '🏖'  // Plage
};

class UIManager {
    constructor() {
        this.initListeners();
        this.updateHUD();
    }

    initListeners() {
        // Rendre les fonctions globales pour les appels onclick dans index.html
        window.toggleMenu = this.toggleMenu.bind(this);
        window.toggleMap = this.toggleMap.bind(this);
        window.toggleFullscreen = this.toggleFullscreen.bind(this);
    }

    updateHUD() {
        // Mise à jour des valeurs du HUD (Énergie, Or, Temps)
        // Cette fonction sera appelée par TimeManager et GameState
        const state = window.ElsassFarm.state;
        
        // Placeholder pour l'instant
        document.getElementById('val-energy').innerText = state.energy || 100;
        document.getElementById('val-gold').innerText = state.gold || 0;
        document.getElementById('val-day').innerText = state.day || 1;
        document.getElementById('val-time').innerText = state.time || '6:00';
    }

    // --- Gestion des Modals ---

    toggleMenu() {
        const el = document.getElementById('menu-modal');
        el.classList.toggle('active');
    }

    toggleMap() {
        const el = document.getElementById('map-modal');
        el.classList.toggle('active');
        if (el.classList.contains('active')) {
            this.renderMinimap();
        }
    }

    toggleFullscreen() {
        if(window.GameSystem && window.GameSystem.Display) {
            window.GameSystem.Display.toggleFullscreen();
        }
        this.toggleMenu();
    }

    renderMinimap() {
        const grid = document.getElementById('minimap-grid');
        grid.innerHTML = '';
        const currentZoneId = window.ElsassFarm.state.currentZoneId;

        Config.zones.forEach(zone => {
            const tile = document.createElement('div');
            tile.className = 'minimap-tile';
            tile.style.backgroundColor = zone.bgColor;
            tile.setAttribute('data-zone-id', zone.id);

            if (zone.id === currentZoneId) {
                tile.classList.add('current');
            }

            tile.innerHTML = `
                <span class="minimap-icon">${ZONE_ICONS[zone.id] || '❓'}</span>
                <span>${zone.name}</span>
            `;

            // Logique de clic (Téléportation)
            tile.onclick = () => {
                if (zone.id !== currentZoneId) {
                    // Transition visuelle
                    document.body.style.transition = 'background-color 0.2s';
                    document.body.style.backgroundColor = 'black';
                    
                    setTimeout(() => {
                        // Appel à la fonction globale du moteur (sketch.js)
                        if (window.changeZone) {
                            window.changeZone(zone.id, 'C'); // 'C' pour Centre (spawn par défaut)
                        }
                        
                        this.toggleMap();
                        
                        // Réinitialiser la couleur de fond du body
                        document.body.style.backgroundColor = '#111';
                        document.body.style.transition = 'none';
                        
                    }, 200);
                }
            };

            grid.appendChild(tile);
        });
    }
}

// Rendre la classe accessible pour l'instanciation dans main.js
window.UIManager = UIManager;