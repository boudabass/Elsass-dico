const InputManager = {
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0,

    init: function () {
        console.log("InputManager initialized");
    },

    mode: 'default', // 'default', 'link'
    linkSource: null,

    handleStart: function () {
        this.isDragging = true;
        this.dragStartX = mouseX;
        this.dragStartY = mouseY;
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;

        // Hit Test Node
        const worldPos = ViewSystem.screenToWorld(mouseX, mouseY);
        const node = GraphSystem.getNodeAt(worldPos.x, worldPos.y);

        if (this.mode === 'link') {
            if (node) {
                if (!this.linkSource) {
                    // Select Source
                    this.linkSource = node;
                    node.selected = true;
                    console.log("Link Source Selected:", node.id);
                } else {
                    if (node !== this.linkSource) {
                        // Create Link
                        GraphSystem.createLink(this.linkSource, node);
                        console.log("Link Created!");

                        // Reset Mode (1 action done)
                        this.mode = 'default';
                        this.linkSource.selected = false;
                        this.linkSource = null;
                        document.body.style.cursor = 'default';
                        return; // Stop here
                    }
                }
                return; // Consume click
            } else {
                // Clicked background -> Cancel Link Mode
                this.mode = 'default';
                if (this.linkSource) this.linkSource.selected = false;
                this.linkSource = null;
                document.body.style.cursor = 'default';
                return;
            }
        }

        // If not in special mode
        if (node) {
            console.log("Clicked Node:", node);
            GraphSystem.nodes.forEach(n => n.selected = false);
            GraphSystem.links.forEach(l => l.selected = false); // Deselect links
            node.selected = true;
            this.draggedNode = node;

            // New Interaction: Context Menu
            UIManager.showContextMenu(node);

            // Old interaction removed: UIManager.openEditor(node);
        } else {
            // Check Link Click
            const link = GraphSystem.getLinkAt(worldPos.x, worldPos.y);
            if (link) {
                console.log("Clicked Link:", link);
                GraphSystem.nodes.forEach(n => n.selected = false);
                GraphSystem.links.forEach(l => l.selected = false);
                link.selected = true;

                // Open Link Editor (TODO)
                UIManager.openLinkEditor(link);
            } else {
                // Background Click
                GraphSystem.nodes.forEach(n => n.selected = false);
                GraphSystem.links.forEach(l => l.selected = false);
                this.draggedNode = null;
                UIManager.closeEditor(); // Close editor panels
                UIManager.hideContextMenu(); // Close context menu

                // Also close add menu if open?
                // document.getElementById('add-menu').classList.add('hidden');
            }
        }
    },

    handleMove: function () {
        if (this.isDragging) {
            // Delta Screen
            const dx = mouseX - this.lastMouseX;
            const dy = mouseY - this.lastMouseY;

            // Pan View ONLY (PRD: Pas de drag & drop pour les neurones)
            ViewSystem.pan(dx, dy);

            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
        }
    },

    handleEnd: function () {
        this.isDragging = false;
        this.draggedNode = null;
    },

    handleWheel: function (e) {
        ViewSystem.zoomAt(mouseX, mouseY, -e.deltaY * Config.ZOOM_SENSITIVITY);
    },

    setLinkMode: function (sourceNode = null) {
        this.mode = 'link';
        this.linkSource = sourceNode;
        if (sourceNode) sourceNode.selected = true;
        document.body.style.cursor = 'crosshair';
        console.log("Mode: Link Creation", sourceNode ? "(Source Pre-selected)" : "");
    },

    drawDebug: function () {
        // Debug Visuals if needed
    }
};

window.InputManager = InputManager;
