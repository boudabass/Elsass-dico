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
    MOVE_DURATION_MS: 333, // 20 frames à 60fps
    
    // Initialisation de la grille
    init: function () {
        this.grid = [];
        const totalTiles = this.rows * this.cols;
        
        // 1. Remplir la grille entièrement avec des items aléatoires
        for (let i = 0; i < totalTiles; i++) {
            this.grid.push({
                itemId: this.getRandomItem(),
                state: 'NORMAL', // NORMAL, SELECTED, MATCHED
                col: i % this.cols,
                row: Math.floor(i / this.cols)
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
    
    // Supprime l'item d'une tuile
    clearTile: function (col, row) {
        const tile = this.getTile(col, row);
        if (tile) {
            tile.itemId = null;
            tile.state = 'NORMAL';
        }
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
        
        const itemId = fromTile.itemId;

        // 1. Animation
        if (window.AnimationSystem) {
            AnimationSystem.addMove(fromCol, fromRow, toCol, toRow, itemId);
        }
        
        // 2. Retirer l'item de la grille pendant l'animation
        fromTile.itemId = null;
        fromTile.state = 'NORMAL';
        
        // 3. Délai pour le swap physique et la vérification
        setTimeout(() => {
            // Swap physique
            toTile.itemId = itemId;
            
            // Vérification de fusion
            this.checkAndProcessFusions();
        }, this.MOVE_DURATION_MS);
        
        return true;
    },
    
    // Échange deux items (Swap) - TOUJOURS PERMANENT
    swapItems: function (col1, row1, col2, row2) {
        const tile1 = this.getTile(col1, row1);
        const tile2 = this.getTile(col2, row2);
        
        if (!tile1 || !tile2) return false;
        
        const itemId1 = tile1.itemId;
        const itemId2 = tile2.itemId;
        
        // 1. Animation (avant le swap physique)
        if (window.AnimationSystem) {
            AnimationSystem.addMove(col1, row1, col2, row2, itemId1);
            AnimationSystem.addMove(col2, row2, col1, row1, itemId2);
        }
        
        // 2. Retirer les items de la grille pendant l'animation
        tile1.itemId = null;
        tile2.itemId = null;
        tile1.state = 'NORMAL';
        tile2.state = 'NORMAL';
        
        console.log(`🔄 Swap initié: (${col1}, ${row1}) <-> (${col2}, ${row2})`);
        
        // 3. Délai pour le swap physique et la vérification
        setTimeout(() => {
            // Swap physique
            tile1.itemId = itemId2;
            tile2.itemId = itemId1;
            
            // Vérification de fusion
            this.checkAndProcessFusions();
        }, this.MOVE_DURATION_MS);
        
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
            // Déclencher l'animation de fusion
            if (window.AnimationSystem) {
                AnimationSystem.addFusion(tile.col, tile.row, tile.itemId);
            }
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

        // Mettre à jour les offsets pour le système d'animation
        if (window.AnimationSystem) {
            AnimationSystem.gridOffsetX = offsetX;
            AnimationSystem.gridOffsetY = offsetY;
        }

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

                // 3. Dessin de l'item
                if (tile.itemId) {
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
                        rect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 8);
                    }
                    
                    fill(itemColor);
                    
                    // Glow de sélection (si l'item est sélectionné ET n'est pas en cours de match)
                    if (tile.state === 'SELECTED') {
                        noFill();
                        stroke(glowColor);
                        strokeWeight(5);
                        rect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 8);
                        fill(itemColor);
                    }
                    
                    // L'item est déjà masqué par tile.itemId = null s'il est en mouvement.
                    text(tile.itemId, x + this.tileSize / 2, y + this.tileSize / 2 + 5);
                }
            }
        }
        pop();
    }
};

console.log("✅ GridSystem.js chargé");