// systems/DebugManager.js
// Gère l'affichage des informations de debug et les options de bascule.

window.DebugManager = {
    // Met à jour le texte de la console de debug
    updateInfo: function(info) {
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
    },
    
    // Met à jour le texte du bouton Toggle Grid
    updateGridButton: function() {
        const btn = document.getElementById('toggle-grid-btn');
        if (btn) {
            btn.innerText = `Toggle Grid (${Config.showGrid ? 'ON' : 'OFF'})`;
        }
    }
};