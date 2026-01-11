const ToolManager = {
    currentTool: null,
    tools: {},

    register: function (name, toolInstance) {
        this.tools[name] = toolInstance;
        console.log(`Tool Registered: ${name}`);
    },

    activate: function (name, context = null) {
        if (this.currentTool) {
            this.currentTool.deactivate();
        }

        const tool = this.tools[name];
        if (tool) {
            this.currentTool = tool;

            // Close context menu if open
            if (window.UIManager) UIManager.hideContextMenu();

            tool.activate(context);
            console.log(`Tool Activated: ${name}`);
        }
    },

    deactivateCurrent: function () {
        if (this.currentTool) {
            this.currentTool.deactivate();
            this.currentTool = null;
        }
    },

    // Helper to get specific tool
    get: function (name) {
        return this.tools[name];
    }
};

window.ToolManager = ToolManager;
