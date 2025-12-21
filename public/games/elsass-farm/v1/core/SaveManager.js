Si vide, récupération DB + Synchro locale.">
// core/SaveManager.js
// Gestion de la persistance (Local + Serveur/DB)

window.SaveManager = {
    // Clé de sauvegarde locale
    SAVE_KEY: 'elsass-farm-save',

    // Sauvegarde l'état actuel (Inchangé)
    save: async function () {
        const saveData = {
            // État du joueur
            energy: GameState.energy,
            gold: GameState.gold,

            // Temps
            day: GameState.day,
            hour: GameState.hour,
            minute: GameState.minute,
            season: GameState.season,

            // Position
            currentZoneId: GameState.currentZoneId,

            // Grilles de farming
            grids: window.GridSystem ? GridSystem.export() : {},

            // Inventaire
            inventory: window.Inventory ? Inventory.export() : {},

            // Métadonnées
            savedAt: new Date().toISOString(),
            version: '1.1'
        };

        // 1. Sauvegarde Locale (Instantanée & Secours)
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            console.log("💾 Sauvegarde locale effectuée.");
        } catch (e) {
            console.error("Erreur sauvegarde locale:", e);
        }

        // 2. Sauvegarde Serveur (Vers db.json)
        const gameId = window.DyadGame ? window.DyadGame.id : null;
        if (gameId) {
            try {
                // On ne met pas 'await' bloquant pour ne pas figer le jeu
                fetch('/api/storage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameId: gameId,
                        data: saveData
                    })
                }).then(res => {
                    if (res.ok) console.log("☁️ Sauvegarde serveur (db.json) réussie.");
                    else console.warn("⚠️ Échec sauvegarde serveur.");
                });
            } catch (e) {
                console.error("Erreur connexion serveur:", e);
            }
        }

        return true;
    },

    // Charge une sauvegarde existante (Logique modifiée : Local > Serveur > Synchro)
    load: async function () {
        let saveData = null;
        let source = "None";
        const gameId = window.DyadGame ? window.DyadGame.id : null;

        console.log("📂 Tentative de chargement...");

        // 1. Vérification LocalStorage (Priorité 1)
        try {
            const localStr = localStorage.getItem(this.SAVE_KEY);
            if (localStr) {
                saveData = JSON.parse(localStr);
                source = "LocalStorage";
                console.log("💾 Sauvegarde locale trouvée.");
            }
        } catch (e) {
            console.warn("⚠️ Erreur lecture LocalStorage, essai serveur...");
        }

        // 2. Si pas de local, récupération Serveur (Priorité 2)
        if (!saveData && gameId) {
            console.log("☁️ Pas de local, recherche sur serveur...");
            try {
                const res = await fetch(`/api/storage?gameId=${gameId}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        saveData = json.data;
                        source = "Serveur";
                        console.log("☁️ Sauvegarde serveur trouvée.");

                        // 3. Synchronisation : Création de la save locale depuis le serveur
                        localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
                        console.log("🔄 Synchronisation : Sauvegarde copiée en LocalStorage.");
                    }
                }
            } catch (e) {
                console.warn("⚠️ Impossible de joindre le serveur.");
            }
        }

        // 4. Application des données
        if (saveData) {
            this.applyData(saveData);
            console.log(`✅ Jeu chargé avec succès (Source: ${source})`);
            return true;
        }

        console.log("📂 Aucune sauvegarde trouvée nulle part (Nouveau jeu).");
        return false;
    },

    // Applique les données au jeu
    applyData: function (saveData) {
        // Restaurer l'état
        GameState.energy = saveData.energy ?? 100;
        GameState.gold = saveData.gold ?? 0;
        GameState.day = saveData.day ?? 1;
        GameState.hour = saveData.hour ?? 6;
        GameState.minute = saveData.minute ?? 0;
        GameState.season = saveData.season ?? 'SPRING';
        GameState.currentZoneId = saveData.currentZoneId ?? 'C_C';

        // Restaurer les grilles de farming
        if (saveData.grids && window.GridSystem) {
            GridSystem.import(saveData.grids);
        }

        // Restaurer l'inventaire
        if (saveData.inventory && window.Inventory) {
            Inventory.import(saveData.inventory);
        }

        // Rafraîchir le HUD
        if (window.refreshHUD) window.refreshHUD();
    },

    // Supprime la sauvegarde locale
    clear: function () {
        localStorage.removeItem(this.SAVE_KEY);
        console.log("🗑️ Sauvegarde locale effacée");
    },

    // Vérifie si une sauvegarde existe (localement)
    hasSave: function () {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
};

console.log("✅ SaveManager.js chargé");