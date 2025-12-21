# 💾 Save System — Elsass Farm (Cloud Master)

Architecture de persistance axée sur la portabilité (Cross-Device).

## 1. Philosophie "Cloud Master"
Pour garantir qu'un joueur retrouve sa progression en changeant d'appareil (PC ↔ Mobile), la **Base de Données (DB)** est la source de vérité absolue.

### 🔄 Cycle de Vie des Données

1.  **Démarrage (Load 1X)** :
    *   Le jeu interroge **immédiatement** l'API `/api/storage`.
    *   Si une sauvegarde existe en DB, elle **écrase** le cache local du navigateur.
    *   Le jeu charge ensuite depuis ce cache local synchronisé.

2.  **En Jeu (Runtime Local)** :
    *   Toutes les actions (Planter, Dormir, Changer de zone) sauvegardent **uniquement** dans le `localStorage` (Rapide, pas de latence).
    *   Aucun appel réseau n'est fait pendant le gameplay pour garantir la fluidité.

3.  **Fermeture (Save 1X)** :
    *   Lorsque le joueur appuie sur "Quitter" (ou ferme proprement), le jeu prend l'état final du `localStorage`.
    *   Il envoie ce paquet complet vers l'API `/api/storage` pour mise à jour de la DB.

## 2. Modèle de Données (JSON Unifié v2)

```javascript
const GameSave = {
  meta: {
    version: "1.1",
    timestamp: 1715620000
  },
  // État Global
  manager: {
    gold: 500,
    energy: 100,
    xp: 0,
    level: 1
  },
  // Temps
  time: {
    day: 1,
    season: "spring",
    year: 1
  },
  // Stocks UNIFIÉS
  inventory: {
    // Les clés sont les IDs uniques (potato, carrot...)
    plants: { 
        "potato": 5, 
        "carrot": 0
    },
    resources: { 
        "wood": 50, 
        "stone": 20 
    },
    tools: {
        "hoe": 1,
        "watering_can": 2
    }
  },
  // Le Monde (Grille)
  world: {
    tiles: {
      "10_15": { 
          state: "growing", 
          plantId: "potato",
          growth: 4, 
          watered: true 
      }
    }
  },
  unlocks: {
    zones: ["start_zone", "forest_entry"]
  }
};