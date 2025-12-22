// systems/GridSystem.js
// Système de grille pour le puzzle Similitude

window.GridSystem = {
    // Grille de jeu (tableau 1D pour simplicité)
    grid: [],
    rows: Config.grid.rows,
    cols: Config.grid.cols,
    tileSize: Config.grid.tileSize,
    
    // Délai avant la suppression du combo (en millisecondes)
    COMBO_DELAY: 300, 
    
    // Vitesse de lissage (0.1 = lent, 1.0 = snap)
    ANIMATION_SPEED: 0.3, 
    
    // Initialisation de la grille
    init: function () {
        this.grid = [];
        const totalTiles = this.rows * this.cols;
        
        // 1. Remplir la grille entièrement avec des items aléatoires
        for (let i = 0; i < totalTiles; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);
            const worldPos = this.gridToWorld(col, row);

            this.grid.push({
                itemId: this.getRandomItem(),
                state: 'NORMAL', // NORMAL, SELECTED, MATCHED
                col: col,
                row: row,
                // Position de rendu (pour l'animation)
                renderX: worldPos.x,
                renderY: worldPos.y,
                // Position cible (où l'item doit être)
                targetX: worldPos.x,
                targetY: worldPos.y
            });
        }
        
        // 2. S'assurer qu'il n'y a pas de match au départ
        this.removeInitialMatches();

        // 3. Créer des cases vides initiales
        const emptySlots = Config.grid.initialEmptySlots;
        const indices = Array.from({ length: totalTiles }, (_, i) => i);
        
        // Mélanger les indices et prendre les 'emptySlots' premiers
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        for (let i = 0; i < emptySlots; i++) {
            const index = indices[i];
            if (this.grid[index]) {
                this.grid[index].itemId = null;
            }
        }
        
        console.log(`✅ Grille ${this.rows}x${this.cols} initialisée avec ${emptySlots} cases vides.`);
    },

    // Récupère un item aléatoire (limité par Config.grid.itemTypes)
    getRandomItem: function () {
        const index = Math.floor(Math.random() * Config.grid.itemTypes);
        return Config.seedIcons[index];
    },

    // Récupère une tuile par position grille
    getTile: function (col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
        const index = row * this.cols + col;
        return this.grid[index];
    },
    
    // Convertit coordonnées grille → monde (centre de la tuile)
    gridToWorld: function (col, row) {
        const gridWidth = this.cols * this.tileSize;
        const gridHeight = this.rows * this.tileSize;
        
        const offsetX = (width / 2) - (gridWidth / 2);
        const offsetY = (height / 2) - (gridHeight / 2);

        return {
            x: offsetX + col * this.tileSize + this.tileSize / 2,
            y: offsetY + row * this.tileSize + this.tileSize / 2
        };
    },

    // Supprime les matchs initiaux (pour ne pas commencer par un combo)
    removeInitialMatches: function () {
        let matched = true;
        while (matched) {
            matched = false;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const tile = this.getTile(c, r);
                    if (tile && this.checkMatch(c, r).length >= Config.grid.matchMin) {
                        tile.itemId = this.getRandomItem();
                        matched = true;
                    }
                }
            }
        }
    },

    // Convertit coordonnées monde → grille
    worldToGrid: function (worldX, worldY) {
        // La grille est centrée sur l'écran
        const gridWidth = this.cols * this.tileSize;
        const gridHeight = this.rows * this.tileSize;
        
        const offsetX = (width / 2) - (gridWidth / 2);
        const offsetY = (height / 2) - (gridHeight / 2);

        const col = Math.floor((worldX - offsetX) / this.tileSize);
        const row = Math.floor((worldY - offsetY) / this.tileSize);

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            return { col, row, valid: true };
        }
        return { col: -1, row: -1, valid: false };
    },

    // Déplace un item de la source à la destination (Snap libre vers case vide)
    moveItem: function (fromCol, fromRow, toCol, toRow) {
        const fromTile = this.getTile(fromCol, fromRow);
        const toTile = this.getTile(toCol, toRow);

        if (!fromTile || !toTile || toTile.itemId !== null) {
            console.warn("Déplacement invalide (cible non vide).");
            return false;
        }

        // 1. Déplacement logique
        toTile.itemId = fromTile.itemId;
        fromTile.itemId = null;
        fromTile.state = 'NORMAL';
        
        // 2. Mise à jour des positions cibles pour l'animation
        const targetPos = this.gridToWorld(toCol, toRow);
        fromTile.targetX = targetPos.x; // L'ancienne tuile prend la position cible
        fromTile.targetY = targetPos.y;
        
        // L'item est maintenant dans toTile, mais il faut animer l'item qui était dans fromTile
        // Pour cela, nous devons transférer les propriétés de rendu de fromTile à toTile
        toTile.renderX = fromTile.renderX;
        toTile.renderY = fromTile.renderY;
        toTile.targetX = targetPos.x;
        toTile.targetY = targetPos.y;
        
        // 3. Vérification de fusion
        this.checkAndProcessFusions();
        
        return true;
    },
    
    // Échange deux items (Swap) - TOUJOURS PERMANENT
    swapItems: function (col1, row1, col2, row2) {
        const tile1 = this.getTile(col1, row1);
        const tile2 = this.getTile(col2, row2);
        
        if (!tile1 || !tile2) return false;
        
        // 1. Préparation de l'animation (avant l'échange logique)
        const targetPos1 = this.gridToWorld(col1, row1);
        const targetPos2 = this.gridToWorld(col2, row2);
        
        // L'item 1 doit aller à la position 2, et vice-versa
        tile1.targetX = targetPos2.x;
        tile1.targetY = targetPos2.y;
        
        tile2.targetX = targetPos1.x;
        tile2.targetY = targetPos1.y;
        
        // 2. Échange des IDs (Logique)
        const tempId = tile1.itemId;
        tile1.itemId = tile2.itemId;
        tile2.itemId = tempId;
        
        // 3. Échange des positions de rendu (pour que l'animation commence au bon endroit)
        const tempRenderX = tile1.renderX;
        const tempRenderY = tile1.renderY;
        
        tile1.renderX = tile2.renderX;
        tile1.renderY = tile2.renderY;
        
        tile2.renderX = tempRenderX;
        tile2.renderY = tempRenderY;
        
        // Réinitialiser les états de sélection
        tile1.state = 'NORMAL';
        tile2.state = 'NORMAL';
        
        console.log(`🔄 Swap effectué: (${col1}, ${row1}) <-> (${col2}, ${row2})`);
        
        // 4. Vérification de fusion
        this.checkAndProcessFusions();
        
        return true; // Le swap est toujours réussi
    },

    // Vérifie les alignements et marque les tuiles
    checkMatch: function (col, row) {
        const tile = this.getTile(col, row);
        if (!tile || !tile.itemId) return [];

        const item = tile.itemId;
        let matchedTiles = [];

        // Vérification horizontale
        let horizontal = [tile];
        // Gauche
        for (let c = col - 1; c >= 0; c--) {
            const neighbor = this.getTile(c, row);
            if (neighbor && neighbor.itemId === item) horizontal.push(neighbor);
            else break;
        }
        // Droite
        for (let c = col + 1; c < this.cols; c++) {
            const neighbor = this.getTile(c, row);
            if (neighbor && neighbor.itemId === item) horizontal.push(neighbor);
            else break;
        }
        if (horizontal.length >= Config.grid.matchMin) matchedTiles.push(...horizontal);

        // Vérification verticale
        let vertical = [tile];
        // Haut
        for (let r = row - 1; r >= 0; r--) {
            const neighbor = this.getTile(col, r);
            if (neighbor && neighbor.itemId === item) vertical.push(neighbor);
            else break;
        }
        // Bas
        for (let r = row + 1; r < this.rows; r++) {
            const neighbor = this.getTile(col, r);
            if (neighbor && neighbor.itemId === item) vertical.push(neighbor);
            else break;
        }
        if (vertical.length >= Config.grid.matchMin) matchedTiles.push(...vertical);

        // Retourner les tuiles uniques
        return Array.from(new Set(matchedTiles));
    },

    // Traite les fusions trouvées
    checkAndProcessFusions: function () {
        let tilesToClear = [];

        // 1. Identifier toutes les tuiles à fusionner
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const matches = this.checkMatch(c, r);
                if (matches.length >= Config.grid.matchMin) {
                    tilesToClear.push(...matches);
                }
            }
        }
        
        // Rendre la liste unique
        tilesToClear = Array.from(new Set(tilesToClear));

        if (tilesToClear.length === 0) return 0;

        // 2. Marquer les tuiles comme MATCHED (pour le rendu visuel temporaire)
        tilesToClear.forEach(tile => {
            tile.state = 'MATCHED';
        });
        
        // 3. Calculer le score (avant la suppression)
        const baseScore = 10;
        const comboLength = tilesToClear.length;
        const multiplier = comboLength >= 5 ? 3 : comboLength >= 4 ? 2 : 1;
        const scoreGained = baseScore * comboLength * multiplier;
        
        GameState.score += scoreGained;
        
        console.log(`💥 Combo détecté de ${comboLength} ! Score: +${scoreGained} (x${multiplier})`);

        // 4. Délai avant la suppression et la cascade
        setTimeout(() => {
            // Suppression des items
            tilesToClear.forEach(tile => {
                tile.itemId = null;
                tile.state = 'NORMAL'; // Revenir à l'état normal (vide)
            });
            
            // Mise à jour du HUD
            if (window.refreshHUD) refreshHUD();
            
        }, this.COMBO_DELAY);

        return scoreGained;
    },

    // Fait tomber les items et spawn de nouveaux en bas (Inactif pour ce mode)
    applyGravity: function () {
        // ... (Inactif)
    },

    // --- Rendu ---

    draw: function () {
        const gridWidth = this.cols * this.tileSize;
        const gridHeight = this.rows * this.tileSize;
        
        const offsetX = (width / 2) - (gridWidth / 2);
        const offsetY = (height / 2) - (gridHeight / 2);

        push();
        translate(offsetX, offsetY);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.getTile(c, r);
                
                if (!tile) continue; 
                
                const x = c * this.tileSize;
                const y = r * this.tileSize;
                
                // 1. Dessin du fond de tuile
                noStroke();
                fill(Config.colors.background);
                rect(x, y, this.tileSize, this.tileSize);

                // 2. Dessin de la grille (lignes)
                if (Config.showGrid) {
                    stroke(Config.colors.gridLines);
                    strokeWeight(1);
                    line(x, y, x + this.tileSize, y);
                    line(x, y, x, y + this.tileSize);
                }
                
                // 3. Mise à jour de la position de rendu (Animation)
                if (tile.itemId) {
                    // La position cible est toujours le centre de la tuile logique
                    const targetPos = this.gridToWorld(tile.col, tile.row);
                    
                    // Lissage (Lerp)
                    tile.renderX = lerp(tile.renderX, tile.targetX, this.ANIMATION_SPEED);
                    tile.renderY = lerp(tile.renderY, tile.targetY, this.ANIMATION_SPEED);
                    
                    // 4. Dessin de l'item à la position de rendu animée
                    textAlign(CENTER, CENTER);
                    textSize(this.tileSize * 0.7);
                    
                    let itemColor = Config.colors.itemText;
                    let glowColor = Config.colors.selectionGlow;
                    
                    // Effet visuel pour le combo en cours
                    if (tile.state === 'MATCHED') {
                        itemColor = color(255, 255, 0); // Jaune vif
                        glowColor = color(255, 0, 0); // Rouge pour l'explosion
                        
                        // Dessiner un contour rouge pour le combo
                        noFill();
                        stroke(glowColor);
                        strokeWeight(8);
                        // Dessiner le contour à la position logique (x, y)
                        rect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 8);
                    }
                    
                    fill(itemColor);
                    
                    // Glow de sélection (si l'item est sélectionné ET n'est pas en cours de match)
                    if (tile.state === 'SELECTED') {
                        noFill();
                        stroke(glowColor);
                        strokeWeight(5);
                        // Dessiner le contour à la position logique (x, y)
                        rect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 8);
                        fill(itemColor);
                    }
                    
                    // Dessiner l'emoji à la position animée (renderX, renderY)
                    text(tile.itemId, tile.renderX - offsetX, tile.renderY - offsetY + 5);
                }
            }
        }
        pop();
    }
};

console.log("✅ GridSystem.js chargé");