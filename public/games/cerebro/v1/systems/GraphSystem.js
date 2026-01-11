const GraphSystem = {
    nodes: [],
    links: [],

    init: function () {
        console.log("GraphSystem initialized");
        // Test Data
        this.createNode(0, 0, 'text');
    },

    createNode: function (x = 0, y = 0, type = 'text') {
        const node = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            x: x,
            y: y,
            type: type,
            content: {},
            radius: Config.NODE_RADIUS,
            selected: false,
            state: 'active' // 'active' or 'memory'
        };
        this.nodes.push(node);
        return node;
    },

    // --- Links Management ---
    createLink: function (fromNode, toNode, type = 'analogy') {
        const link = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            from: fromNode.id,
            to: toNode.id,
            type: type, // 'analogy', 'cause', 'oppose'...
            weight: 0.5,
            selected: false
        };
        this.links.push(link);
        return link;
    },

    drawLinks: function () {
        this.links.forEach(link => {
            const fromNode = this.getNodeById(link.from);
            const toNode = this.getNodeById(link.to);
            if (!fromNode || !toNode) return;

            // Get Style Configuration
            const typeKey = (link.type || 'analogy').toUpperCase();
            const typeConfig = Config.LINK_TYPES[typeKey] || Config.LINK_TYPES.ANALOGY;

            push();

            // 1. Color & Weight
            const baseColor = link.selected ? Config.NODE_SELECTED_COLOR : typeConfig.color;
            stroke(baseColor);
            strokeWeight(Config.LINK_WIDTH_DEFAULT * (0.5 + link.weight * 2));

            // 2. Line Style (Dashed/Dotted)
            if (typeConfig.style === 'dashed') {
                drawingContext.setLineDash([10, 10]);
            } else if (typeConfig.style === 'dotted') {
                drawingContext.setLineDash([3, 5]);
            } else {
                drawingContext.setLineDash([]);
            }

            noFill();

            // 3. Orthogonal Routing (Manhattan)
            const midX = (fromNode.x + toNode.x) / 2;

            beginShape();
            vertex(fromNode.x, fromNode.y);
            vertex(midX, fromNode.y);
            vertex(midX, toNode.y);
            vertex(toNode.x, toNode.y);
            endShape();

            // Reset Dash for Arrow
            drawingContext.setLineDash([]);

            // 4. Arrowhead
            // Calculate direction vector for the last segment: (midX, toNode.y) -> (toNode.x, toNode.y)
            // But if midX == toNode.x (vertical alignment), the last segment is (midX, fromNode.y) -> (midX, toNode.y) ?
            // Actually, the path is:
            // A(fromNode.x, fromNode.y) -> B(midX, fromNode.y) -> C(midX, toNode.y) -> D(toNode.x, toNode.y)

            // We want the arrow at D, coming from C.
            // C = (midX, toNode.y)
            // D = (toNode.x, toNode.y)

            let prevX = midX;
            let prevY = toNode.y;

            // If C and D are the same point (vertical line case where midX == toNode.x)
            // Then the segment is B->C.
            // B = (midX, fromNode.y)
            if (Math.abs(midX - toNode.x) < 1) {
                prevX = midX;
                prevY = fromNode.y;
            }

            const dx = toNode.x - prevX;
            const dy = toNode.y - prevY;
            const len = Math.sqrt(dx * dx + dy * dy);

            if (len > 0) {
                const nx = dx / len;
                const ny = dy / len;

                // Offset from center
                const offset = toNode.radius + 5;
                const tipX = toNode.x - nx * offset;
                const tipY = toNode.y - ny * offset;

                const s = 6 + link.weight * 4;

                push();
                translate(tipX, tipY);
                rotate(atan2(ny, nx));
                fill(baseColor);
                noStroke();

                // Draw Arrowhead
                triangle(-s, -s / 2, -s, s / 2, 0, 0);

                // If 'oppose', draw a cross or bar?
                // PRD: "oppose 🔴 ═X═" -> Red crossed
                if (link.type === 'oppose') {
                    // Draw X on the line center maybe? 
                    // For now, let's keep it simple as per MVP request on visuals. 
                    // But let's add a small perpendicular line at the arrow base for oppose?
                    // Or just rely on the red color for now.
                }

                pop();
            }

            pop();
        });

        // Reset Global Dash just in case
        drawingContext.setLineDash([]);
    },

    getNodeById: function (id) {
        return this.nodes.find(n => n.id === id);
    },

    drawNodes: function () {
        this.nodes.forEach(node => {
            if (node.state === 'memory') return;

            push();
            translate(node.x, node.y);

            const w = Config.NODE_WIDTH;
            const h = Config.NODE_HEIGHT;
            const r = 8; // Corner radius

            // 1. Selection Halo (Rectangle now)
            if (node.selected) {
                noFill();
                stroke(Config.NODE_SELECTED_COLOR);
                strokeWeight(4);
                rectMode(CENTER);
                rect(0, 0, w + 10, h + 10, r + 2);
            }

            // 2. Card Body (Background)
            const typeConfig = Config.NODE_TYPES[node.type.toUpperCase()] || Config.NODE_TYPES.TEXT;

            fill(255); // White background for readability
            stroke(typeConfig.color || Config.NODE_STROKE_DEFAULT);
            strokeWeight(2);
            rectMode(CENTER);
            rect(0, 0, w, h, r);

            // 3. Header Background (Type Color)
            fill(typeConfig.color);
            noStroke();
            // Draw header top half
            rect(0, -h / 2 + Config.NODE_HEADER_HEIGHT / 2, w - 2, Config.NODE_HEADER_HEIGHT, r, r, 0, 0); // inset stroke slightly? No, just draw over
            // Fix header shape to match rounded corners top
            // Simpler: just rect, but we need to clip or draw specifically. 
            // Let's rely on p5 rect with varied corners: tl, tr, br, bl
            rect(0, -h / 2 + Config.NODE_HEADER_HEIGHT / 2, w, Config.NODE_HEADER_HEIGHT, r, r, 0, 0);

            // 4. Content Text
            push(); // Isolate text style changes
            rectMode(CORNER); // Start text box from top-left
            textAlign(LEFT, TOP);
            noStroke();
            fill(0);

            // Title / Header Icon
            textSize(Config.NODE_FONT_SIZE_TITLE);
            // Title is single line, but let's keep consistency. 
            // Actually title was using text(val, x, y) which is fine with CENTER usually if alignment is handled, 
            // but let's stick to CORNER for everything inside text-wise to be safe.
            textAlign(LEFT, CENTER);
            const title = node.content.title ? node.content.title : (node.content.text ? node.content.text.substr(0, 15) + '...' : typeConfig.id);
            text(`${typeConfig.icon} ${title}`, -w / 2 + 10, -h / 2 + Config.NODE_HEADER_HEIGHT / 2);

            // Body Text
            fill(Config.NODE_TEXT_COLOR);
            textSize(Config.NODE_FONT_SIZE_BODY);
            textAlign(LEFT, TOP);

            let bodyText = node.content.text || "";
            // Truncation simple based on char count for MVP
            const maxChars = 80;
            if (bodyText.length > maxChars) bodyText = bodyText.substr(0, maxChars) + "...";

            // rect(x, y, w, h) for text wrapping now uses CORNER mode
            text(bodyText, -w / 2 + 10, -h / 2 + Config.NODE_HEADER_HEIGHT + 10, w - 20, h - Config.NODE_HEADER_HEIGHT - 20);

            // Image Indicator specific
            if (node.type === 'image' && node.content.url) {
                // Maybe draw thumbnail? For now just an icon indicator in body
                textSize(20);
                textAlign(CENTER, CENTER);
                text("🖼️", 0, 10);
            }
            pop(); // Restore previous styles (rectMode, etc.)
            pop(); // Restore previous transformation (translate)
        });
    },

    // Old placeholder removed


    getNodeAt: function (x, y) {
        // Reverse iterate to click top-most
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            if (n.state === 'memory') continue;

            // Old Radial Check: const d = dist(x, y, n.x, n.y); if (d < n.radius) return n;

            // New AABB Check (Rectangular)
            const w = Config.NODE_WIDTH;
            const h = Config.NODE_HEIGHT;

            // Node coordinates are CENTER based in drawNodes (rectMode(CENTER))
            if (x >= n.x - w / 2 && x <= n.x + w / 2 &&
                y >= n.y - h / 2 && y <= n.y + h / 2) {
                return n;
            }
        }
        return null;
    },

    getLinkAt: function (x, y) {
        const threshold = 10; // 10px tolerance

        for (let link of this.links) {
            const from = this.getNodeById(link.from);
            const to = this.getNodeById(link.to);
            if (!from || !to || from.state !== 'active' || to.state !== 'active') continue;

            // Orthogonal Path: (x1,y1) -> (midX, y1) -> (midX, y2) -> (x2, y2)
            const midX = (from.x + to.x) / 2;

            // Segment 1: Horizontal (from.x, from.y) -> (midX, from.y)
            if (this.pointLineDist(x, y, from.x, from.y, midX, from.y) < threshold) return link;

            // Segment 2: Vertical (midX, from.y) -> (midX, to.y)
            if (this.pointLineDist(x, y, midX, from.y, midX, to.y) < threshold) return link;

            // Segment 3: Horizontal (midX, to.y) -> (to.x, to.y)
            if (this.pointLineDist(x, y, midX, to.y, to.x, to.y) < threshold) return link;
        }
        return null;
    },

    pointLineDist: function (px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) // in case of 0 length line
            param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // --- Node Displacement Logic ---
    movingNodeId: null,
    originalPos: { x: 0, y: 0 },

    startDisplacement: function (nodeId) {
        const node = this.getNodeById(nodeId);
        if (!node) return;

        this.movingNodeId = nodeId;
        this.originalPos = { x: node.x, y: node.y };

        // Notify UI to switch modes (handled by UIManager usually, but here state is key)
        console.log(`Starting displacement for node ${nodeId}`);
    },

    moveNode: function (dx, dy) {
        if (!this.movingNodeId) return;
        const node = this.getNodeById(this.movingNodeId);
        if (!node) return;

        // Snap size from Config or hardcode 48px as per PRD
        const gridSize = Config.GRID_SIZE || 48; // Fallback 48 if undefined

        node.x += dx * gridSize;
        node.y += dy * gridSize;
    },

    commitDisplacement: function () {
        if (!this.movingNodeId) return;
        console.log(`Displacement committed for node ${this.movingNodeId}`);
        // Reset state
        this.movingNodeId = null;
        this.originalPos = { x: 0, y: 0 };
    },

    cancelDisplacement: function () {
        if (!this.movingNodeId) return;
        const node = this.getNodeById(this.movingNodeId);
        if (node) {
            // Restore original position
            node.x = this.originalPos.x;
            node.y = this.originalPos.y;
        }
        console.log(`Displacement cancelled for node ${this.movingNodeId}`);
        this.movingNodeId = null;
        this.originalPos = { x: 0, y: 0 };
    },

    removeLink: function (id) {
        this.links = this.links.filter(l => l.id !== id);
    }
};

window.GraphSystem = GraphSystem;
