const EditTool = {
    name: 'edit',

    activate: function (node) {
        if (!node) return;
        console.log("EditTool Activated on", node.id);

        // Just opens the existing UIManager editor
        UIManager.openEditor(node);
    },

    deactivate: function () {
        UIManager.closeEditor();
    }
};

if (window.ToolManager) ToolManager.register('edit', EditTool);
window.EditTool = EditTool;
