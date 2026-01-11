const RemoveTool = {
    name: 'remove',

    activate: function (node) {
        if (!node) return;

        if (confirm("Supprimer ce neurone et ses connexions ?")) {
            // Remove links first
            GraphSystem.links = GraphSystem.links.filter(l => l.from !== node.id && l.to !== node.id);

            // Remove node
            GraphSystem.nodes = GraphSystem.nodes.filter(n => n.id !== node.id);

            console.log("Node removed:", node.id);
            SaveManager.save();
        }

        // Immediately deactivate
        ToolManager.deactivateCurrent();
    },

    deactivate: function () {
        // Nothing to cleanup
    }
};

if (window.ToolManager) ToolManager.register('remove', RemoveTool);
window.RemoveTool = RemoveTool;
