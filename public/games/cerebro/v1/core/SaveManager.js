const SaveManager = {
    itemsKey: 'cerebro_v1_data',

    save: function () {
        const data = {
            nodes: GraphSystem.nodes,
            links: GraphSystem.links,
            view: { x: ViewSystem.x, y: ViewSystem.y, zoom: ViewSystem.zoom }
        };
        localStorage.setItem(this.itemsKey, JSON.stringify(data));
        console.log("Saved to LocalStorage");

        // Feedback visuel rapide
        // Feedback visuel (Optionnel, ou via toast plus tard)
        // const btn = document.querySelector('.tool-btn:last-child');
        // if(btn) { ... }
    },

    load: function () {
        const raw = localStorage.getItem(this.itemsKey);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                GraphSystem.nodes = data.nodes || [];
                GraphSystem.links = data.links || [];

                if (data.view) {
                    ViewSystem.x = data.view.x;
                    ViewSystem.y = data.view.y;
                    ViewSystem.zoom = data.view.zoom;
                }
                console.log("Loaded from LocalStorage");
            } catch (e) {
                console.error("Save Load Error", e);
            }
        }
    }
};

window.SaveManager = SaveManager;
