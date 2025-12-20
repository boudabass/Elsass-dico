// systems/UIManager.js
// Contrôleur principal gérant les modales et les mises à jour du HUD.

window.UIManager = {
    // --- Fonctions de bascule de Modale ---
    
    toggleMenu: function() {
        const el = document.getElementById('menu-modal');
        el.classList.toggle('active');
    },
    
    toggleMap: function() {
        const el = document.getElementById('map-modal');
        el.classList.toggle('active');
        if (el.classList.contains('active')) {
            // Délégation du rendu à MinimapRenderer
            MinimapRenderer.render(this.toggleMap.bind(this));
        }
    },
    
    toggleDebug: function() {
        const el = document.getElementById('debug-modal');
        el.classList.toggle('active');
        
        if (el.classList.contains('active')) {
            document.getElementById('menu-modal').classList.remove('active');
            DebugManager.updateGridButton(); // Initialiser le texte du bouton
        }
    },

    toggleFullscreen: function() {
        if(window.GameSystem && window.GameSystem.Display) {
            window.GameSystem.Display.toggleFullscreen();
        }
        this.toggleMenu();
    },
    
    // --- Fonctions d'action ---
    
    toggleGrid: function() {
        Config.showGrid = !Config.showGrid;
        DebugManager.updateGridButton();
        
        // Forcer le moteur p5.js à redessiner
        if (window.redraw) window.redraw();
    },

    // --- Fonctions de mise à jour ---
    
    updateHUD: function(data) {
        document.getElementById('val-energy').innerText = data.energy || 0;
        document.getElementById('val-gold').innerText = data.gold || 0;
        document.getElementById('val-day').innerText = data.day || 1;
        document.getElementById('val-time').innerText = data.time || '6:00';
    },
    
    updateDebugInfo: function(info) {
        DebugManager.updateInfo(info);
    }
};