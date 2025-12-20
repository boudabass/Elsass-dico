// systems/MinimapRenderer.js
// Gère la construction et l'interaction de la grille 3x3 de la minimap.

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

window.MinimapRenderer = {
    render: function(toggleMapCallback) {
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
                        
                        toggleMapCallback(); // Fermer la map via le callback UIManager
                        
                        // Réinitialiser la couleur de fond du body après la transition
                        document.body.style.backgroundColor = '#111';
                        document.body.style.transition = 'none';
                        
                    }, 200);
                }
            };

            grid.appendChild(tile);
        });
    }
};