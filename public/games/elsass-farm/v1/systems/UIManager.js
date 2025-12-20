// systems/UIManager.js
// Gère l'affichage des modales (Menu, Map) et les interactions HUD.

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

window.UIManager = {
    toggleMenu: function() {
        const el = document.getElementById('menu-modal');
        el.classList.toggle('active');
    },
    
    toggleMap: function() {
        const el = document.getElementById('map-modal');
        el.classList.toggle('active');
        if (el.classList.contains('active')) {
            this.renderMinimap();
        }
    },
    
    toggleDebug: function() {
        const el = document.getElementById('debug-modal');
        el.classList.toggle('active');
        // Si on ouvre le debug, on ferme le menu
        if (el.classList.contains('active')) {
            document.getElementById('menu-modal').classList.remove('active');
        }
    },

    toggleFullscreen: function() {
        if(window.GameSystem && window.GameSystem.Display) {
            window.GameSystem.Display.toggleFullscreen();
        }
        this.toggleMenu();
    },
    
    toggleGrid: function() {
        Config.showGrid = !Config.showGrid;
        
        const btn = document.getElementById('toggle-grid-btn');
        if (btn) {
            btn.innerText = `Toggle Grid (${Config.showGrid ? 'ON' : 'OFF'})`;
        }
        
        // Forcer le moteur p5.js à redessiner
        if (window.redraw) window.redraw();
    },

    renderMinimap: function() {
        const grid = document.getElementById('minimap-grid');
        grid.innerHTML = ''; // Nettoyage
        const currentZoneId = window.ElsassFarm.state.currentZoneId;

        Config.zones.forEach(zone => {
            const tile = document.createElement('div');
            tile.className = 'minimap-tile';
            tile.style.backgroundColor = zone.bgColor;
            tile.setAttribute('data-zone-id', zone.id);

            if (zone.id === currentZoneId) {
                tile.classList.add('current');
            }

            // Contenu
            tile.innerHTML = `
                <span class="minimap-icon">${ZONE_ICONS[zone.id] || '❓'}</span>
                <span>${zone.name}</span>
            `;

            // Logique de clic (Téléportation)
            tile.onclick = () => {
                if (zone.id !== currentZoneId) {
                    // Simuler la transition (Fondu noir 0.2s)
                    document.body.style.transition = 'background-color 0.2s';
                    document.body.style.backgroundColor = 'black';
                    
                    setTimeout(() => {
                        if (window.changeZone) {
                            window.changeZone(zone.id, null); 
                        } else {
                            window.ElsassFarm.state.currentZoneId = zone.id;
                            if (window.redraw) window.redraw();
                        }
                        
                        this.toggleMap();
                        
                        // Réinitialiser la couleur de fond du body après la transition
                        document.body.style.backgroundColor = '#111';
                        document.body.style.transition = 'none';
                        
                    }, 200);
                }
            };

            grid.appendChild(tile);
        });
    },
    
    // Fonction pour mettre à jour les valeurs du HUD (à utiliser plus tard)
    updateHUD: function(data) {
        document.getElementById('val-energy').innerText = data.energy || 0;
        document.getElementById('val-gold').innerText = data.gold || 0;
        document.getElementById('val-day').innerText = data.day || 1;
        document.getElementById('val-time').innerText = data.time || '6:00';
    },
    
    // Nouvelle fonction pour mettre à jour les infos de debug
    updateDebugInfo: function(info) {
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            debugContent.innerHTML = `
                <strong>--- GAME STATE ---</strong><br>
                Zone ID: ${info.zoneId}<br>
                Zone Name: ${info.zoneName}<br>
                <br>
                <strong>--- CAMERA ---</strong><br>
                Zoom: ${info.zoom.toFixed(2)}<br>
                Cam X: ${Math.round(info.camX)}<br>
                Cam Y: ${Math.round(info.camY)}<br>
                <br>
                <strong>--- MOUSE (WORLD) ---</strong><br>
                World X: ${Math.round(info.worldX)}<br>
                World Y: ${Math.round(info.worldY)}<br>
                <br>
                <strong>--- INPUT ---</strong><br>
                Mouse Pressed: ${info.mousePressed ? 'TRUE' : 'FALSE'}<br>
                Mouse Y: ${info.mouseY}<br>
            `;
        }
    }
};