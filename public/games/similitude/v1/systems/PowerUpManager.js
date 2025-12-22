// systems/PowerUpManager.js
// Gère l'inventaire 5x5, l'équipement et l'utilisation des power-ups.

window.PowerUpManager = {
    // Récupère la définition complète d'un power-up par ID
    getPowerUpDefinition: function (id) {
        for (const category of Config.powerUps) {
            const pu = category.find(p => p.id === id);
            if (pu) return pu;
        }
        return null;
    },

    // Récupère le power-up équipé dans un slot (Ligne 2)
    getEquippedPowerUp: function (index) {
        const slot = GameState.equippedSlots[index];
        if (!slot) return null;
        
        const definition = this.getPowerUpDefinition(slot.id);
        if (!definition) return null;

        return {
            ...definition,
            qty: GameState.powerUpStock[slot.id] || 0,
            index: index
        };
    },

    // Équipe un power-up dans un slot de la Ligne 2
    equipPowerUp: function (powerUpId, slotIndex) {
        if (slotIndex < 0 || slotIndex >= GameState.equippedSlots.length) return false;
        
        const definition = this.getPowerUpDefinition(powerUpId);
        if (!definition) return false;
        
        // Mettre à jour le slot
        GameState.equippedSlots[slotIndex].id = powerUpId;
        GameState.equippedSlots[slotIndex].icon = definition.icon;
        
        // Désactiver le mode ACTIF si un autre power-up était actif
        GameState.activePowerUpIndex = -1;
        
        // Rafraîchir l'UI
        if (window.UIManager) UIManager.renderPowerUpWindow();
        if (window.refreshHUD) refreshHUD();
        
        console.log(`✅ Équipé ${definition.name} dans le slot ${slotIndex + 1}`);
        return true;
    },

    // Active/Désactive le mode GLOW (prêt à utiliser)
    toggleActive: function (index) {
        if (index === GameState.activePowerUpIndex) {
            // Désélectionner
            GameState.activePowerUpIndex = -1;
        } else {
            const pu = this.getEquippedPowerUp(index);
            if (pu && pu.qty > 0) {
                // Sélectionner
                GameState.activePowerUpIndex = index;
                // Désélectionner l'item de la grille si un power-up est actif
                if (GameState.selectedTile) {
                    const tile = GridSystem.getTile(GameState.selectedTile.col, GameState.selectedTile.row);
                    if (tile) tile.state = 'NORMAL';
                    GameState.selectedTile = null;
                }
            } else {
                // Stock vide -> Ouvre la boutique
                if (window.UIManager) UIManager.toggleShop();
                return false;
            }
        }
        if (window.refreshHUD) refreshHUD();
        return true;
    },

    // Utilise le power-up actif sur la grille (appelé par sketch.js)
    useActivePowerUp: function (col, row) {
        const index = GameState.activePowerUpIndex;
        if (index === -1) return false;

        const pu = this.getEquippedPowerUp(index);
        if (!pu || pu.qty <= 0) return false;

        // 1. Consommer le power-up
        GameState.powerUpStock[pu.id]--;
        GameState.activePowerUpIndex = -1; // Désactiver le mode GLOW

        // 2. Appliquer l'effet (Logique simplifiée pour le prototype)
        let scoreBonus = 0;
        let message = `Utilisé ${pu.name} à (${col}, ${row}).`;

        switch (pu.id) {
            case 'bomb_3x3':
                scoreBonus = this.applyExplosion(col, row, 1); // 3x3
                message = `💥 Explosion 3x3 ! Score: +${scoreBonus}`;
                break;
            case 'energy_30':
                GameState.restoreEnergy(30);
                message = `⚡ +30 Énergie !`;
                break;
            case 'time_10s':
                GameState.chrono += 10;
                message = `🕒 +10 secondes !`;
                break;
            // Ajoutez d'autres cas ici...
            default:
                // Par défaut, supprime la tuile ciblée
                GridSystem.clearTile(col, row);
                scoreBonus = 100;
                message = `Utilisé ${pu.name} (Effet par défaut).`;
                break;
        }
        
        GameState.score += scoreBonus;
        console.log(message);

        // 3. Rafraîchir l'UI
        if (window.refreshHUD) refreshHUD();
        if (window.UIManager) UIManager.renderPowerUpWindow(); // Pour mettre à jour le stock dans la fenêtre ouverte
        
        return true;
    },
    
    // Logique d'explosion (supprime les tuiles dans un rayon)
    applyExplosion: function(col, row, radius) {
        let clearedCount = 0;
        const scorePerTile = 50;
        
        for (let r = row - radius; r <= row + radius; r++) {
            for (let c = col - radius; c <= col + radius; c++) {
                const tile = GridSystem.getTile(c, r);
                if (tile && tile.itemId) {
                    GridSystem.clearTile(c, r);
                    clearedCount++;
                }
            }
        }
        // Après la suppression, on vérifie si cela a créé de nouveaux combos (cascade)
        GridSystem.checkAndProcessFusions();
        return clearedCount * scorePerTile;
    },
    
    // --- Boutique (Simplifiée) ---
    buyPowerUp: function(powerUpId) {
        const pu = this.getPowerUpDefinition(powerUpId);
        if (!pu) return false;
        
        if (GameState.gold >= pu.cost) {
            GameState.spendGold(pu.cost);
            GameState.powerUpStock[pu.id] = (GameState.powerUpStock[pu.id] || 0) + 1;
            
            if (window.refreshHUD) refreshHUD();
            if (window.UIManager) UIManager.renderPowerUpWindow();
            
            console.log(`Achat réussi: +1 ${pu.name}`);
            return true;
        }
        console.warn("Achat échoué: Pas assez d'or.");
        return false;
    }
};

console.log("✅ PowerUpManager.js chargé");