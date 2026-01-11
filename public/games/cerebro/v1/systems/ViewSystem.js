const ViewSystem = {
    x: 0,
    y: 0,
    zoom: 1.0,

    init: function () {
        this.x = width / 2;
        this.y = height / 2;
        console.log("ViewSystem initialized");
    },

    applyTransform: function () {
        translate(this.x, this.y);
        scale(this.zoom);
    },

    screenToWorld: function (mx, my) {
        return {
            x: (mx - this.x) / this.zoom,
            y: (my - this.y) / this.zoom
        };
    },

    worldToScreen: function (wx, wy) {
        return {
            x: wx * this.zoom + this.x,
            y: wy * this.zoom + this.y
        };
    },

    pan: function (dx, dy) {
        this.x += dx;
        this.y += dy;
    },

    zoomAt: function (x, y, amount) {
        const newZoom = constrain(this.zoom + amount, Config.ZOOM_MIN, Config.ZOOM_MAX);
        // Zoom vers la souris (maths classiques)
        // Zoom factor
        const zoomFactor = newZoom / this.zoom;

        this.x = x - (x - this.x) * zoomFactor;
        this.y = y - (y - this.y) * zoomFactor;

        this.zoom = newZoom;
    }
};

window.ViewSystem = ViewSystem;
