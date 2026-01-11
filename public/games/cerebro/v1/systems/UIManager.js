const UIManager = {
    activeNode: null,

    toggleMemory: function () {
        const drawer = document.getElementById('memory-drawer');
        const content = drawer.querySelector('.drawer-content');

        if (drawer.style.transform === 'translateY(0%)') {
            drawer.style.transform = 'translateY(-90%)';
        } else {
            drawer.style.transform = 'translateY(0%)';
            // Populate
            this.renderMemoryList(content);
        }
    },

    renderMemoryList: function (container) {
        container.innerHTML = '';
        const memoryNodes = GraphSystem.nodes.filter(n => n.state === 'memory');

        if (memoryNodes.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Mémoire vide</div>';
            return;
        }

        memoryNodes.forEach(node => {
            const el = document.createElement('div');
            el.className = 'memory-item';
            el.innerText = (Config.NODE_TYPES[node.type.toUpperCase()]?.icon || '❓') + ' ' + (node.content.text || node.id);
            el.onclick = () => {
                // Move to Reasoning (Active)
                node.state = 'active';
                node.x = ViewSystem.x; // Center view? Or random?
                node.y = ViewSystem.y;
                SaveManager.save();
                this.toggleMemory(); // Close
            };
            container.appendChild(el);
        });
    },

    toggleDreamMode: function () {
        alert("Mode Rêve (IA) non implémenté dans cette version.");
    },

    openEditor: function (node) {
        this.activeNode = node;
        const panel = document.getElementById('node-editor');
        const title = document.getElementById('editor-title');
        const content = document.getElementById('node-content-text');

        const typeConfig = Config.NODE_TYPES[node.type.toUpperCase()] || { icon: '?' };
        title.innerText = `${typeConfig.icon} Neurone ${node.id.substr(0, 4)}`;

        content.value = node.content.text || "";
        // Simple MVP: Text is always editable in the textarea, visuals handled elsewhere

        panel.classList.remove('hidden');
        content.focus();
    },

    closeEditor: function () {
        document.getElementById('node-editor').classList.add('hidden');
        this.activeNode = null;
    },

    validateEdit: function () {
        if (this.activeNode) {
            if (this.activeNode.type === 'image') {
                const urlInput = document.getElementById('node-content-url');
                if (urlInput) {
                    this.activeNode.content.url = urlInput.value;
                }
            } else {
                const textInput = document.getElementById('node-content-text');
                if (textInput) {
                    this.activeNode.content.text = textInput.value;
                }
            }
            SaveManager.save(); // Auto-save
            this.closeEditor();
        }
    },

    openLinkEditor: function (link) {
        this.activeLink = link;
        const panel = document.getElementById('link-editor');
        const title = document.getElementById('link-editor-title');
        const typeSelect = document.getElementById('link-type-select');
        const weightSlider = document.getElementById('link-weight-slider');

        title.innerText = `🔗 Synapse ${link.id.substr(0, 4)}`;
        typeSelect.value = link.type || 'analogy';
        weightSlider.value = link.weight || 0.5;

        panel.classList.remove('hidden');
    },

    closeLinkEditor: function () {
        document.getElementById('link-editor').classList.add('hidden');
        this.activeLink = null;
    },

    validateLink: function () {
        if (this.activeLink) {
            const typeSelect = document.getElementById('link-type-select');
            const weightSlider = document.getElementById('link-weight-slider');

            if (typeSelect && weightSlider) {
                this.activeLink.type = typeSelect.value;
                this.activeLink.weight = parseFloat(weightSlider.value);
                SaveManager.save();
            }

            this.closeLinkEditor();
        }
    },

    deleteLink: function () {
        if (this.activeLink && confirm("Supprimer cette synapse ?")) {
            GraphSystem.removeLink(this.activeLink.id);
            SaveManager.save();
            this.closeLinkEditor();
        }
    },

    startLinkFromActive: function () {
        if (this.activeNode) {
            const nodeId = this.activeNode.id;
            InputManager.setLinkMode(this.activeNode);
            this.closeEditor();
            // Feedback visuel ou console uniquement
            console.log("Mode Synapse activé depuis", nodeId);
        }
    },

    // --- Displacement Mode ---
    openDisplacementMode: function (node) {
        if (!node && !this.activeNode) return;
        const targetNode = node || this.activeNode;

        const nodeId = targetNode.id;

        // 1. Close Node Editor (which clears activeNode)
        this.closeEditor();

        // 2. Start Logic
        GraphSystem.startDisplacement(nodeId);

        // 3. Show UI
        const ui = document.getElementById('displacement-ui');
        if (ui) ui.classList.remove('hidden');
    },

    closeDisplacementMode: function () {
        const ui = document.getElementById('displacement-ui');
        if (ui) ui.classList.add('hidden');
    },

    moveNode: function (dx, dy) {
        GraphSystem.moveNode(dx, dy);
    },

    validateDisplacement: function () {
        GraphSystem.commitDisplacement();
        SaveManager.save();
        this.closeDisplacementMode();
        // Re-open editor? PRD says "Sauvegarde + sortie mode". 
        // Let's go back to nothing selected or maybe re-select the node to see it?
        // Logic convention usually implies going back to base state.
    },

    cancelDisplacement: function () {
        GraphSystem.cancelDisplacement();
        this.closeDisplacementMode();
    },

    // --- Context Menu ---
    contextNode: null,

    showContextMenu: function (node) {
        this.contextNode = node;
        const menu = document.getElementById('node-context-menu');

        // Calculate Screen Position
        this.updateContextMenuPos();
        menu.classList.remove('hidden');
    },

    updateContextMenuPos: function () {
        if (!this.contextNode) return;
        const menu = document.getElementById('node-context-menu');
        if (menu.classList.contains('hidden')) return;

        const screenPos = ViewSystem.worldToScreen(this.contextNode.x, this.contextNode.y);
        menu.style.left = screenPos.x + 'px';
        menu.style.top = (screenPos.y - Config.NODE_HEIGHT / 2 * ViewSystem.zoom - 10) + 'px';
    },

    hideContextMenu: function () {
        const menu = document.getElementById('node-context-menu');
        if (menu) menu.classList.add('hidden');
        this.contextNode = null;
    },

    // --- FAB ---
    toggleAddMenu: function () {
        const menu = document.getElementById('add-menu');
        const btn = document.getElementById('add-btn');
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            btn.style.transform = 'rotate(45deg)';
        } else {
            menu.classList.add('hidden');
            btn.style.transform = 'rotate(0deg)';
        }
    },

    activeLink: null
};

window.UIManager = UIManager;
