// systems/GridSystem.js
// Système de grille pour le farming - Gestion des tuiles et cultures

window.GridSystem = {
    // Constantes v1.3
    GRID_SIZE: 4,            // 4x4 = 16 tuiles (Optimisation DB)
    TILE_SIZE: 160,          // 160px (Gros tap mobile)
    GROWTH_DURATION: 10,     // 10 Jours pour maturité

    // États possibles d'une tuile
    STATES: {
        EMPTY: 'EMPTY',           // Terre vide
        PLANTED: 'PLANTED',       // Graine plantée (J0)
        GROWING: 'GROWING',       // En croissance (J1-9)
        READY: 'READY',           // Prêt à récolter (J10)
        HARVESTED: 'HARVESTED'    // Récolté (reset immédiat)
    },

    // Grilles par zone (stockées dans GameState pour persistance)
    grids: {},

    // Initialise une grille vide pour une zone
    initGrid: function (zoneId) {
        if (this.grids[zoneId]) {
            console.log(`Grille ${zoneId} déjà initialisée`);
            return this.grids[zoneId];
        }

        const grid = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                grid.push({
                    id: row * this.GRID_SIZE + col,
                    row: row,
                    col: col,
                    state: this.STATES.EMPTY,
                    watered: false,
                    seedType: null,
                    growthStage: 0, // Compteur précis (0 à 10)
                    season: null
                });
            }
        }

        this.grids[zoneId] = grid;
        console.log(`✅ Grille ${zoneId} initialisée (${grid.length} tuiles)`);
        return grid;
    },

    // Récupère la grille active (zone courante)
    getActiveGrid: function () {
        const zoneId = GameState.currentZoneId;
        if (!this.grids[zoneId]) {
            this.initGrid(zoneId);
        }
        return this.grids[zoneId];
    },

    // Récupère une tuile par position grille
    getTile: function (col, row) {
        const grid = this.getActiveGrid();
        const index = row * this.GRID_SIZE + col;
        return grid[index] || null;
    },

    // Convertit coordonnées monde → grille
    worldToGrid: function (worldX, worldY) {
        // Offset pour centrer la grille dans la zone
        const offsetX = (Config.zoneWidth - this.GRID_SIZE * this.TILE_SIZE) / 2;
        const offsetY = (Config.zoneHeight - this.GRID_SIZE * this.TILE_SIZE) / 2;

        const col = Math.floor((worldX - offsetX) / this.TILE_SIZE);
        const row = Math.floor((worldY - offsetY) / this.TILE_SIZE);

        // Vérifier les limites
        if (col >= 0 && col < this.GRID_SIZE && row >= 0 && row < this.GRID_SIZE) {
            return { col, row, valid: true };
        }
        return { col: -1, row: -1, valid: false };
    },

    // Convertit coordonnées grille → monde (centre de la tuile)
    gridToWorld: function (col, row) {
        const offsetX = (Config.zoneWidth - this.GRID_SIZE * this.TILE_SIZE) / 2;
        const offsetY = (Config.zoneHeight - this.GRID_SIZE * this.TILE_SIZE) / 2;

        return {
            x: offsetX + col * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: offsetY + row * this.TILE_SIZE + this.TILE_SIZE / 2
        };
    },

    // --- Actions sur les tuiles ---

    // Planter une graine
    plant: function (col, row, seedType) {
        const tile = this.getTile(col, row);
        if (!tile) return { success: false, message: "Tuile invalide" };

        if (tile.state !== this.STATES.EMPTY) {
            return { success: false, message: "Cette tuile n'est pas vide" };
        }

        // Vérifier Compatibilité Saison
        let seedSeason = null;
        if (window.Inventory && Inventory.player && Inventory.player.seeds) {
            for (let s in Inventory.player.seeds) {
                const found = Inventory.player.seeds[s].find(seed => seed.id === seedType);
                if (found) {
                    seedSeason = s;
                    break;
                }
            }
        }

        if (seedSeason && seedSeason !== GameState.season) {
            return { success: false, message: "Mauvaise saison !" };
        }

        // Vérifier l'énergie
        const energyCost = 4;
        if (!GameState.spendEnergy(energyCost)) {
            return { success: false, message: "Pas assez d'énergie" };
        }

        tile.state = this.STATES.PLANTED;
        tile.seedType = seedType;
        tile.growthStage = 0; // J0
        tile.season = GameState.season;
        tile.watered = false;

        if (window.refreshHUD) window.refreshHUD();
        console.log(`🌱 Planté ${seedType} à (${col}, ${row})`);

        return { success: true, message: "Plante plantée ! (-1 Stock)" };
    },

    // Arroser une tuile
    water: function (col, row) {
        const tile = this.getTile(col, row);
        if (!tile) return { success: false, message: "Tuile invalide" };

        if (tile.state === this.STATES.EMPTY || tile.state === this.STATES.HARVESTED) {
            return { success: false, message: "Rien à arroser ici" };
        }

        if (tile.watered) {
            return { success: false, message: "Déjà arrosée aujourd'hui" };
        }

        // Vérifier l'énergie
        const energyCost = 2;
        if (!GameState.spendEnergy(energyCost)) {
            return { success: false, message: "Pas assez d'énergie" };
        }

        tile.watered = true;

        if (window.refreshHUD) window.refreshHUD();
        console.log(`💧 Arrosé (${col}, ${row})`);

        return { success: true, message: "Tuile arrosée !" };
    },

    // Récolter une tuile
    harvest: function (col, row) {
        const tile = this.getTile(col, row);
        if (!tile) return { success: false, message: "Tuile invalide" };

        if (tile.state !== this.STATES.READY) {
            return { success: false, message: "Cette culture n'est pas prête" };
        }

        // Vérifier l'énergie
        const energyCost = 1;
        if (!GameState.spendEnergy(energyCost)) {
            return { success: false, message: "Pas assez d'énergie" };
        }

        const harvestedType = tile.seedType;

        // Reset la tuile
        tile.state = this.STATES.EMPTY;
        tile.seedType = null;
        tile.growthStage = 0;
        tile.watered = false;
        tile.season = null;

        // Ajouter au stock UNIFIÉ
        if (window.Inventory) {
            Inventory.addLoot(harvestedType, 2);
        }

        if (window.refreshHUD) window.refreshHUD();
        console.log(`🌾 Récolté ${harvestedType} à (${col}, ${row})`);

        return { success: true, message: `${harvestedType} récolté ! (+2 Stock)`, item: harvestedType };
    },

    // --- Cycle journalier ---

    processNightCycle: function () {
        let growthCount = 0;
        let readyCount = 0;

        for (const zoneId in this.grids) {
            const grid = this.grids[zoneId];

            for (const tile of grid) {
                const wasWatered = tile.watered;
                tile.watered = false; // Reset arrosage

                // LOGIQUE DE POUSSE
                if (wasWatered && tile.state !== this.STATES.EMPTY && tile.state !== this.STATES.READY) {
                    if (!tile.growthStage) tile.growthStage = 0;
                    tile.growthStage++;
                    growthCount++;

                    if (tile.growthStage >= this.GROWTH_DURATION) {
                        tile.state = this.STATES.READY;
                        readyCount++;
                    } else if (tile.growthStage > 0) {
                        tile.state = this.STATES.GROWING;
                    }
                }
            }
        }
        console.log(`🌙 Cycle nuit: ${growthCount} cultures ont poussé, ${readyCount} prêtes.`);
    },

    // --- Rendu ---

    draw: function () {
        const offsetX = (Config.zoneWidth - this.GRID_SIZE * this.TILE_SIZE) / 2;
        const offsetY = (Config.zoneHeight - this.GRID_SIZE * this.TILE_SIZE) / 2;
        const grid = this.getActiveGrid();

        push();
        for (const tile of grid) {
            const x = offsetX + tile.col * this.TILE_SIZE;
            const y = offsetY + tile.row * this.TILE_SIZE;
            this.drawTile(x, y, tile);
        }
        pop();
    },

    // Dessine une tuile individuelle
    drawTile: function (x, y, tile) {
        // Alias pour la fonction p5.js rect
        const p5Rect = rect; 
        
        // --- LOGIQUE VISUELLE v1.3 ---
        // Sol = État du terrain (Sec/Mouillé), Pas Maturité
        
        let fillColor = color(139, 90, 43); // Marron Clair (Terre sèche vide)

        switch (tile.state) {
            case this.STATES.PLANTED:
                fillColor = color(101, 67, 33);  // Marron foncé (Terre retournée)
                break;
            case this.STATES.GROWING:
                fillColor = color(101, 67, 33);  // Marron foncé (RESTE DE LA TERRE !)
                break;
            case this.STATES.READY:
                fillColor = color(34, 139, 34);  // Vert forêt (Seulement quand prêt)
                break;
        }

        // Effet Arrosage (Filtre Bleu)
        // Visible si arrosé ET pas encore prêt (le prêt est vert)
        if (tile.watered && tile.state !== this.STATES.READY) {
            fillColor = lerpColor(fillColor, color(50, 50, 200), 0.4); 
        }

        // Dessin du Sol
        fill(fillColor);
        stroke(60, 40, 20);
        strokeWeight(2);
        p5Rect(x, y, this.TILE_SIZE, this.TILE_SIZE, 8);

        // Dessin de la Plante (Taille Dynamique)
        if (tile.state !== this.STATES.EMPTY) {
            textAlign(CENTER, CENTER);
            noStroke();
            fill(255);

            // Calcul Taille Dynamique
            // J0 = 30px -> J10 = 100px
            let size = 30;
            if (tile.state === this.STATES.READY) {
                size = 100;
            } else {
                let stage = tile.growthStage || 0;
                if(stage > 10) stage = 10;
                size = 30 + (70 * (stage / this.GROWTH_DURATION));
            }
            
            textSize(size);

            let icon = this.getSeedIcon(tile.seedType, tile.state);
            text(icon, x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2);
        }
    },

    getSeedIcon: function (seedType, state) {
        const seedIcons = {
            'potato': { planted: '🥔', growing: '🌿', ready: '🥔' },
            'leek': { planted: '🧅', growing: '🌱', ready: '🧅' },
            'cabbage': { planted: '🥬', growing: '🥬', ready: '🥬' },
            'radish': { planted: '🌱', growing: '🌿', ready: '🥗' },
            'blueberry': { planted: '🫐', growing: '🫐', ready: '🫐' },
            'beans': { planted: '🫘', growing: '🫘', ready: '🫘' },
            'pepper': { planted: '🌶️', growing: '🌶️', ready: '🌶️' },
            'melon': { planted: '🍈', growing: '🍈', ready: '🍈' },
            'eggplant': { planted: '🍆', growing: '🍆', ready: '🍆' },
            'pumpkin': { planted: '🎃', growing: '🎃', ready: '🎃' },
            'mushroom': { planted: '🍄', growing: '🍄', ready: '🍄' },
            'garlic': { planted: '🧄', growing: '🧄', ready: '🧄' }
        };

        const stateKey = state === this.STATES.PLANTED ? 'planted' :
            state === this.STATES.GROWING ? 'growing' : 'ready';

        if (seedIcons[seedType]) {
            return seedIcons[seedType][stateKey];
        }

        switch (state) {
            case this.STATES.PLANTED: return '🌱';
            case this.STATES.GROWING: return '🌿';
            case this.STATES.READY: return '🌾';
            default: return '';
        }
    },

    // --- Sauvegarde ---

    export: function () {
        return JSON.parse(JSON.stringify(this.grids));
    },

    import: function (data) {
        if (data && typeof data === 'object') {
            // SÉCURITÉ v1.3 : Détection d'incompatibilité
            const firstKey = Object.keys(data)[0];
            if(firstKey && data[firstKey].length !== (this.GRID_SIZE * this.GRID_SIZE)) {
                console.warn("⚠️ Ancienne grille 10x10 détectée. Réinitialisation forcée en 4x4.");
                this.grids = {}; 
            } else {
                this.grids = data;
                console.log("📦 Grilles importées");
            }
        }
    }
};

console.log("✅ GridSystem.js chargé");