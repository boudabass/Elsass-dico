const LinkTool = {
    name: 'link',
    sourceNode: null,

    activate: function (node) {
        if (!node) {
            console.warn("LinkTool needs a source node");
            return;
        }
        this.sourceNode = node;
        console.log("LinkTool Activated. Source:", node.id);

        // Set InputManager to Link Mode
        InputManager.setLinkMode(node);
        // The InputManager handles the second click to complete link.
    },

    deactivate: function () {
        this.sourceNode = null;
        // InputManager automatically resets usually, but we can force it
        InputManager.mode = 'default';
        document.body.style.cursor = 'default';
        if (GraphSystem.nodes) GraphSystem.nodes.forEach(n => n.selected = false);
    }
};

if (window.ToolManager) ToolManager.register('link', LinkTool);
window.LinkTool = LinkTool;
