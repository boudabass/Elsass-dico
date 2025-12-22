// systems/GridSystem.js
// Système de grille pour le puzzle Similitude

window.GridSystem = {
    // Grille de jeu (tableau 1D pour simplicité)
    grid: [],
    rows: Config.grid.rows,
    cols: Config.grid.cols,
    tileSize: Config.grid.tileSize,
    
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

    // Déplace un item de la source à la destination
    moveItem: function (fromCol, fromRow, toCol, toRow) {
        const fromTile = this.getTile(fromCol, fromRow);
        const toTile = this.getTile(toCol, toRow);

        if (!fromTile || !toTile || toTile.itemId !== null) {
            console.warn("Déplacement invalide.");
            return false;
        }

        // 1. Déplacement
        toTile.itemId = fromTile.itemId;
        fromTile.itemId = null;
        fromTile.state = 'NORMAL';
        
        // 2. Vérification de fusion (la gravité ne sera PAS appelée ici)
        this.checkAndProcessFusions();
        
        return true;
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
        let totalScore = 0;
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

        // 2. Calculer le score et marquer pour suppression
        const baseScore = 10;
        const comboLength = tilesToClear.length;
        const multiplier = comboLength >= 5 ? 3 : comboLength >= 4 ? 2 : 1;
        
        totalScore = baseScore * comboLength * multiplier;
        GameState.score += totalScore;
        
        console.log(`💥 Combo de ${comboLength} ! Score: +${totalScore} (x${multiplier})`);

        // 3. Supprimer les items
        tilesToClear.forEach(tile => {
            tile.itemId = null;
            tile.state = 'MATCHED'; // État temporaire pour l'animation (non implémentée ici)
        });

        // 4. Appliquer la gravité et le spawn (DÉSACTIVÉ)
        // this.applyGravity(); 
        
        // 5. Vérifier les réactions en chaîne (récursif)
        // Pour l'instant, on ne fait qu'une passe simple.

        return totalScore;
    },

    // Fait tomber les items et spawn de nouveaux en bas
    applyGravity: function () {
        // Cette fonction est maintenant inactive dans checkAndProcessFusions()
        // Elle est conservée ici pour le debug ou si la gravité est réactivée plus tard.
        for (let c = 0; c < this.cols; c++) {
            let emptyRow = this.rows - 1; // La ligne la plus basse vide
            
            // Parcourir de bas en haut
            for (let r = this.rows - 1; r >= 0; r--) {
                const tile = this.getTile(c, r);
                
                if (tile && tile.itemId !== null) {
                    if (r !== emptyRow) {
                        // Déplacer l'item vers la ligne vide la plus basse
                        const targetTile = this.getTile(c, emptyRow);
                        targetTile.itemId = tile.itemId;
                        tile.itemId = null;
                    }
                    emptyRow--; // La nouvelle ligne vide est au-dessus
                }
            }
            
            // Remplir les tuiles vides restantes (en haut) avec de nouveaux items
            for (let r = emptyRow; r >= 0; r--) {
                const tile = this.getTile(c, r);
                if (tile) {
                    tile.itemId = this.getRandomItem();
                }
            }
        }
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
                
                // Vérification critique si la tuile existe
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
                    fill(Config.colors.itemText);
                    
                    // Glow de sélection
                    if (tile.state === 'SELECTED') {
                        noFill();
                        stroke(Config.colors.selectionGlow);
                        strokeWeight(5);
                        rect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4, 8);
                        fill(Config.colors.itemText);
                    }
                    
                    text(tile.itemId, x + this.tileSize / 2, y + this.tileSize / 2 + 5);
                }
            }
        }
        pop();
    }
};

console.log("✅ GridSystem.js chargé");