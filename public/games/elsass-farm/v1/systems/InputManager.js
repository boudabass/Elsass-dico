// systems/InputManager.js
// Gère les interactions de la souris/touch pour le mouvement de la caméra.

window.InputManager = {
    touchStartTime: null,
    touchStartX: null,
    touchStartY: null,
    hasMoved: false,
    DRAG_THRESHOLD: 15, // Seuil de pixels pour considérer un mouvement comme un drag

    init: function () {
        console.log("InputManager initialized.");
        this.touchStartTime = null;
        this.touchStartX = null;
        this.touchStartY = null;
        this.hasMoved = false;
    },

    // Fonction appelée à chaque frame par sketch.js
    updateCamera: function (camera, mouseIsPressed, mouseX, pmouseX, mouseY, pmouseY, width, height) {
        
        // Détection de Drag (Desktop & Mobile)
        if (mouseIsPressed && mouseY > 60) {
            
            // Calculer le delta de déplacement depuis la frame précédente
            const deltaX = mouseX - pmouseX;
            const deltaY = mouseY - pmouseY;

            // Si un mouvement significatif est détecté (pour différencier clic/drag)
            if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
                
                // Si c'est un drag, on met à jour hasMoved
                if (this.touchStartX !== null) {
                    // Mobile: Vérifier le mouvement total depuis touchStarted
                    const totalDeltaX = Math.abs(mouseX - this.touchStartX);
                    const totalDeltaY = Math.abs(mouseY - this.touchStartY);
                    if (totalDeltaX > this.DRAG_THRESHOLD || totalDeltaY > this.DRAG_THRESHOLD) {
                        this.hasMoved = true;
                    }
                } else {
                    // Desktop: tout mouvement est un drag
                    this.hasMoved = true;
                }
            }

            if (this.hasMoved) {
                // Appliquer le déplacement (divisé par le zoom pour rester cohérent)
                camera.x -= deltaX / camera.zoom;
                camera.y -= deltaY / camera.zoom;
            }
        }
        
        // 4. Contraintes Caméra (Limitation du mouvement)
        const margin = Config.worldMargin;
        const zoneWidth = Config.zoneWidth;
        const zoneHeight = Config.zoneHeight;

        const minX = (width / 2) / camera.zoom - margin;
        const maxX = zoneWidth + margin - (width / 2) / camera.zoom;
        const minY = (height / 2) / camera.zoom - margin;
        const maxY = zoneHeight + margin - (height / 2) / camera.zoom;

        camera.x = constrain(camera.x, minX, maxX);
        camera.y = constrain(camera.y, minY, maxY);
    }
};