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
        this.syncDebugState();
    }

    initListeners() {
        // Rendre les fonctions globales pour les appels onclick dans index.html
        window.toggleMenu = this.toggleMenu.bind(this);
        window.toggleMap = this.toggleMap.bind(this);
        window.toggleFullscreen = this.toggleFullscreen.bind(this);
        window.toggleDebugOptions = this.toggleDebugOptions.bind(this);
        window.toggleDebugGrid = this.toggleDebugGrid.bind(this);
    }
    
    syncDebugState() {
        const gridToggle = document.getElementById('toggle-grid');
        if (gridToggle) {
            gridToggle.checked = window.ElsassFarm.state.showGrid;
        }
    }

    updateHUD() {
        const state = window.ElsassFarm.state;
        
        document.getElementById('val-energy').innerText = state.energy || 100;
        document.getElementById('val-gold').innerText = state.gold || 0;
        document.getElementById('val-day').innerText = state.day || 1;
        document.getElementById('val-time').innerText = state.time || '6:00';
    }
    
    updateDebugCoords(worldX, worldY) {
        const el = document.getElementById('debug-coords');
        if (el && Config.debug) {
            el.innerText = `X: ${Math.round(worldX)}, Y: ${Math.round(worldY)}`;
        }
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
    
    // --- Gestion Debug ---
    
    toggleDebugOptions() {
        const el = document.getElementById('debug-options');
        el.classList.toggle('active');
    }
    
    toggleDebugGrid(checked) {
        window.ElsassFarm.state.showGrid = checked;
        // Utiliser window.changeZone pour forcer le redessinage
        if (window.changeZone) window.changeZone(window.ElsassFarm.state.currentZoneId);
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

            tile.onclick = () => {
                if (zone.id !== currentZoneId) {
                    document.body.style.transition = 'background-color 0.2s';
                    document.body.style.backgroundColor = 'black';
                    
                    setTimeout(() => {
                        // Appel direct à la fonction globale changeZone
                        if (window.changeZone) {
                            window.changeZone(zone.id, 'C');
                        }
                        
                        this.toggleMap();
                        
                        document.body.style.backgroundColor = '#111';
                        document.body.style.transition = 'none';
                        
                    }, 200);
                }
            };

            grid.appendChild(tile);
        });
    }
}

window.UIManager = UIManager;