// systems/AnimationSystem.js
// Gère les animations fluides (déplacement, fusion) en utilisant frameCount.

window.AnimationSystem = {
    animations: [], // [{id, type, startFrame, duration, fromX, fromY, toX, toY, itemId, progress}]
    
    // Variables pour le centrage de la grille (doivent être mises à jour par sketch.js)
    gridOffsetX: 0,
    gridOffsetY: 0,
    
    // Ajoute une animation de déplacement
    addMove: function(fromCol, fromRow, toCol, toRow, itemId) {
        const tileSize = Config.grid.tileSize;
        const halfTile = tileSize / 2;
        
        // Les coordonnées de départ et d'arrivée sont calculées ici
        const fromX = fromCol * tileSize + this.gridOffsetX + halfTile;
        const fromY = fromRow * tileSize + this.gridOffsetY + halfTile;
        const toX = toCol * tileSize + this.gridOffsetX + halfTile;
        const toY = toRow * tileSize + this.gridOffsetY + halfTile;
        
        this.animations.push({
            id: `move_${Date.now()}`,
            type: 'MOVE',
            startFrame: frameCount,
            duration: 20, // frames (0.33s)
            fromX, fromY, toX, toY,
            itemId,
            progress: 0
        });
    },
    
    // Ajoute animation fusion
    addFusion: function(col, row, itemId) {
        this.animations.push({
            id: `fusion_${col}_${row}_${Date.now()}`,
            type: 'FUSION',
            startFrame: frameCount,
            duration: 15, // frames (0.25s)
            col, row,
            itemId,
            scale: 1,
            rotation: 0,
            alpha: 1
        });
    },
    
    // Ajoute alerte énergie
    addEnergyWarning: function() {
        // Évite d'ajouter plusieurs fois l'alerte
        if (this.animations.some(a => a.type === 'ENERGY_WARN')) return;
        
        this.animations.push({
            id: 'energy_warn',
            type: 'ENERGY_WARN',
            startFrame: frameCount,
            duration: 30,
            shakeOffset: 0
        });
        
        // Déclencher l'effet CSS sur le HUD
        const energyEl = document.getElementById('val-energy');
        if (energyEl) {
            energyEl.classList.add('warning-pulse');
            setTimeout(() => {
                energyEl.classList.remove('warning-pulse');
            }, 500); // Durée du pulse CSS
        }
    },
    
    // Met à jour TOUTES les animations (appel dans draw())
    update: function() {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            anim.progress = (frameCount - anim.startFrame) / anim.duration;
            
            if (anim.progress >= 1) {
                this.animations.splice(i, 1); // Finie
                continue;
            }
        }
    },
    
    // Dessine les animations PAR-DESSUS la grille
    draw: function() {
        push();
        textAlign(CENTER, CENTER);
        textSize(Config.grid.tileSize * 0.7);
        
        this.animations.forEach(anim => {
            const progress = constrain(anim.progress, 0, 1);
            const easeProgress = progress * progress * (3 - 2 * progress); // Smooth ease-in-out
            
            if (anim.type === 'MOVE') {
                const x = lerp(anim.fromX, anim.toX, easeProgress);
                const y = lerp(anim.fromY, anim.toY, easeProgress);
                
                fill(Config.colors.itemText);
                text(anim.itemId, x, y + 5); // +5 pour centrage vertical emoji
            }
            
            if (anim.type === 'FUSION') {
                const tileSize = Config.grid.tileSize;
                const halfTile = tileSize / 2;
                
                const x = anim.col * tileSize + this.gridOffsetX + halfTile;
                const y = anim.row * tileSize + this.gridOffsetY + halfTile;
                
                // Scale + rotation + fade
                const scaleFactor = 1 + (1 - progress) * 1.5; // De 2.5x à 1x
                const rotation = progress * TWO_PI * 0.5; // Rotation 180 degrés
                const alpha = 1 - progress;
                
                push();
                translate(x, y);
                rotate(rotation);
                scale(scaleFactor);
                
                // Dessin de l'item en fondu
                fill(255, 255, 0, alpha * 255);
                text(anim.itemId, 0, 5); // Centré à (0, 0) après translate
                pop();
            }
            
            if (anim.type === 'ENERGY_WARN') {
                // Pas de rendu Canvas nécessaire, l'effet est géré par CSS/DOM
            }
        });
        pop();
    }
};

console.log("✅ AnimationSystem.js chargé");