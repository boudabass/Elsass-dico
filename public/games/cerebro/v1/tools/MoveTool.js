const MoveTool = {
    name: 'move',
    activeNode: null,
    originalPos: { x: 0, y: 0 },
    isDragging: false,

    activate: function (node) {
        if (!node) return;
        this.activeNode = node;
        this.originalPos = { x: node.x, y: node.y };
        this.isDragging = true;

        console.log("MoveTool Activated on", node.id);

        // Show specific UI for moving (if any)? 
        // User asked for "chaque outils ouvre sont paneau qui lui suis dedier".
        // For move, maybe just the displacement arrows UI?
        UIManager.openDisplacementMode(node);
    },

    deactivate: function () {
        this.isDragging = false;
        this.activeNode = null;
        UIManager.closeDisplacementMode();
    },

    // Called by UI buttons or InputManager
    move: function (dx, dy) {
        if (!this.activeNode) return;

        const gridSize = Config.GRID_SIZE || 48;
        this.activeNode.x += dx * gridSize;
        this.activeNode.y += dy * gridSize;

        // Visual feedback
        SaveManager.save();
    },

    cancel: function () {
        if (this.activeNode) {
            this.activeNode.x = this.originalPos.x;
            this.activeNode.y = this.originalPos.y;
        }
        this.deactivate();
    }
};

// Auto-register
// Wait for ToolManager? It should be loaded before.
// We'll rely on script order in index.html, but let's be safe wrapping in event or just at end of file.
if (window.ToolManager) ToolManager.register('move', MoveTool);
window.MoveTool = MoveTool;
