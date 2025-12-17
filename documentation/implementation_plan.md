# Plan d'Implémentation - GameSystem Standard (v2 - Strict)

## 📌 Changement de Philosophie
Abandon de l'approche "compatible avec tout" (magie noire d'injection HTML).
**Nouvelle Approche :** "Le Jeu s'adapte au Système".
Chaque jeu intégré doit respecter **strictement** le standard `GameSystem`.

## 🏗️ Architecture Standardisée

### 1. Le "Cœur" : `public/games/system/system.js`
Script unique, stable, chargé par tous les jeux.

```javascript
window.GameSystem = {
    // Info du jeu
    config: { id, version, env: 'dev'|'prod' },

    // Gestion du Score
    Score: {
        // Envoie le score au serveur (Return Promise<bool>)
        submit(value, playerName?), 
        
        // Récupère le Top 10 (Return Promise<Array>)
        getLeaderboard()
    },

    // Gestion de l'Affichage
    Display: {
        // Demande le plein écran (natif JS API)
        requestFullscreen(),
        exitFullscreen()
    },

    // Cycle de vie (Hooks pour le wrapper React)
    Lifecycle: {
        ready(), // Appelé quand le jeu a fini de charger ses assets
        pause(), // Appelé par le wrapper quand le joueur met pause
        resume()
    }
};
```

### 2. Le Contrat "Fichier Index" (`index.html`)
Chaque jeu **DOIT** avoir cette structure minimale dans son `index.html` :

```html
<!-- 1. Configuration (Générée ou Hardcodée en Dev) -->
<script>
  window.__GAME_CONFIG__ = { id: 'mon-jeu-v1', version: '1.0' };
</script>

<!-- 2. Chargement du Système (Chemin Relatif Standard) -->
<script src="../../system/system.js"></script>

<!-- 3. Jeu -->
<script src="main.js"></script>
```

## 📝 Plan d'Action

### Phase 1 : Documentation & Standard (Immédiat)
*   Créer `documentation/Developer_Guide.md` expliquant comment adapter un jeu p5.js (ou autre) pour ce système.

### Phase 2 : Nettoyage Backend
*   **`game-manager.ts`** :
    *   Supprimer la fonction `generateIndexHtml` complexe (celle qui parse et injecte).
    *   La remplacer par une création de fichier simple (pour les nouveaux jeux) qui écrit le template standard ci-dessus.
    *   Lors de l'upload de fichier : Ne plus rien modifier. On suppose que le dév a suivi le guide.

### Phase 3 : Implémentation `system.js`
*   Coder le namespace `GameSystem` propre.
*   Ajouter des logs verbeux pour aider au débogage (`[GameSystem] Score submitted...`).

### Phase 4 : Mise à niveau des Jeux (Preuve de concept)
*   **Test-Hub** : Mettre à jour pour valider la V2.
*   **Forest** : Ouvrir `main.js`, remplacer `GameAPI` par `GameSystem.Score`.
*   **Asteroids** : Ajouter un score arbitraire (+10 points quand astéroïde détruit) et brancher sur `GameSystem.Score`.

## ✅ Critères de Succès
*   Un développeur peut lire le guide et adapter un jeu en < 10 minutes.
*   Les jeux `Forest` et `Asteroids` sauvegardent leurs scores dans `db.json`.
*   Le code backend est simplifié et maintenable.
