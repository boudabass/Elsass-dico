// systems/InputManager.js
// Gère les interactions de la souris/touch pour le mouvement de la caméra.

window.InputManager = {
    // Initialisation (non nécessaire pour l'instant)
    init: function() {
        console.log("InputManager initialized.");
    },

    // Logique de Drag (appelée par p5.js mouseDragged)
    handleDrag: function() {
        // 1. Vérification du HUD (Zone morte)
        // Si la souris est sur le HUD (hauteur < 60px), on ignore le drag.
        if (mouseY < 60) {
            return;
        }

        // 2. Calcul du déplacement
        // Déplacement dans le sens opposé du mouvement de la souris, ajusté par le zoom.
        camera.x -= (mouseX - pmouseX) / camera.zoom;
        camera.y -= (mouseY - pmouseY) / camera.zoom;
    }
};