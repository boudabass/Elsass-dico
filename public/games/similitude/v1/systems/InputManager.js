// systems/InputManager.js
// Gère les interactions de la souris/touch pour le jeu de puzzle.

window.InputManager = {
    // Similitude n'utilise pas le drag de caméra, mais nous conservons
    // la logique de détection de clic pur pour ignorer les mouvements involontaires.
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    hasMoved: false,
    DRAG_THRESHOLD: 30, // Seuil de pixels pour considérer un mouvement comme un drag (mobile-friendly)

    init: function () {
        console.log("InputManager initialized (Click Only).");
    },

    // Démarre le drag (appelé par mousedown/touchstart)
    startDrag: function (x, y) {
        this.dragStartX = x;
        this.dragStartY = y;
        this.isDragging = true;
        this.hasMoved = false;
    },

    // Gère le mouvement (appelé par mousemove/touchmove)
    moveDrag: function (x, y) {
        if (!this.isDragging) return;

        const totalDeltaX = Math.abs(x - this.dragStartX);
        const totalDeltaY = Math.abs(y - this.dragStartY);

        if (totalDeltaX > this.DRAG_THRESHOLD || totalDeltaY > this.DRAG_THRESHOLD) {
            this.hasMoved = true;
        }
    },

    // Termine le drag et retourne si c'était un clic pur
    endDrag: function () {
        this.isDragging = false;
        const wasClick = !this.hasMoved;
        this.hasMoved = false;
        return wasClick;
    },
};