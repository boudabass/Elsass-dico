# 📘 Guide Technique & Architecture - Game Center

Ce document est la référence technique unique pour la plateforme. Il définit comment les données sont structurées et comment les jeux doivent être codés pour fonctionner parfaitement avec le système.

**Source de Vérité :** Le code fonctionnel situé dans `public/games/learn/etape10/`.

---

## 1. Architecture des Données (Backend & Fichiers)

La plateforme distingue le **Stockage Physique** (Fichiers) du **Catalogue Logique** (Base de données).

### A. Stockage Physique (GameProject)
Les jeux sont stockés statiquement sur le disque.
*   **Chemin :** `public/games/{gameId}/{version}/`
*   **Structure :** Chaque dossier de version doit être autonome (contient son propre `index.html`, ses assets, ses scripts).

### B. Base de Données (GameRelease)
Le fichier `data/db.json` (Lowdb) est la source de vérité pour l'affichage et les scores.
Il ne stocke pas d'arborescence, mais une liste plate de "Releases" jouables.

```typescript
// Modèle de données (dans db.json)
{
  "games": [
    {
      "id": "snake-v1",          // ID Unique
      "name": "Snake",           // Nom d'affichage
      "version": "v1",           // Version
      "path": "snake/v1",        // Chemin relatif vers le dossier (sans public/games/)
      "width": 800,
      "height": 600,
      "description": "..."
    }
  ],
  "scores": [...]
}
```

---

## 2. Standard de Développement de Jeu (Le Modèle "Étape 10")

Pour garantir la stabilité, tous les jeux doivent suivre l'architecture modulaire validée lors du programme d'apprentissage.

### A. Stack Technique
*   **Moteur :** p5.js + p5.play v3 (via CDN).
*   **Architecture :** Modulaire (Fichiers séparés).
*   **Gestion d'États :** Switch/Case natif (Pas de librairie externe).

### B. Template `index.html` (Strict)
Ce template assure le chargement correct des librairies et du système.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Jeu</title>
    <style>
        body { margin: 0; overflow: hidden; background: #1a1a1a; display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { display: block; }
    </style>
    
    <!-- 1. LIBRAIRIES (Ordre Critique) -->
    <script src="https://cdn.jsdelivr.net/npm/p5@1.11.4/lib/p5.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.11.4/lib/addons/p5.sound.min.js"></script>
    <script src="https://p5play.org/v3/planck.min.js"></script>
    <script src="https://p5play.org/v3/p5play.js"></script>

    <!-- 2. CONFIGURATION SYSTEM -->
    <script>
        window.DyadGame = { id: 'mon-jeu-v1', version: 'v1' };
    </script>
    <script src="../../system/system.js"></script>

    <!-- 3. MODULES DU JEU -->
    <script src="config.js"></script>
    <script src="player.js"></script>
    <script src="enemy.js"></script>
    <script src="sketch.js"></script>
</head>
<body>
</body>
</html>
```

### C. Structure des Fichiers JS
Ne jamais tout mettre dans un seul fichier.

1.  **`config.js`** : Contient toutes les constantes (Couleurs, Gravité, Vitesses, Timers). Facilite le réglage du "Game Feel".
2.  **`player.js` / `enemy.js`** : Classes encapsulant la logique des entités (création du sprite, update, méthodes spécifiques).
3.  **`sketch.js`** : Le chef d'orchestre. Il initialise le jeu et gère les états.

### D. Gestion des États (Pattern Validé)
N'utilisez pas `states.add()` de p5.play (instable sur certaines versions). Utilisez ce pattern robuste :

```javascript
// Dans sketch.js
const GameState = {
    MENU: 'menu',
    GAME: 'game',
    GAMEOVER: 'gameover'
};
let currentState = GameState.MENU;

function draw() {
    switch (currentState) {
        case GameState.MENU:
            drawMenu();
            break;
        case GameState.GAME:
            updateGame(); // Logique
            drawGame();   // Rendu (camera.on/off)
            break;
        case GameState.GAMEOVER:
            drawGameOver();
            break;
    }
}
```

---

## 3. Intégration GameSystem (API)

Le jeu communique avec la plateforme via l'objet global `window.GameSystem`.

### Démarrage
Signaler à la plateforme que le jeu est chargé (cache l'écran de chargement).
```javascript
function setup() {
    // ... init ...
    if(window.GameSystem) window.GameSystem.Lifecycle.notifyReady();
}
```

### Sauvegarde du Score
Envoyer le score à la fin de la partie (Game Over).
```javascript
function endGame() {
    // ... logique de fin ...
    if(window.GameSystem) window.GameSystem.Score.submit(score);
}
```

---

## 4. Règles de Gameplay & Physique (Rappel)

*   **Caméra :** Utiliser `camera.on()` et `camera.off()` pour séparer le monde du HUD.
*   **Collisions :** Utiliser des vérifications manuelles (AABB) pour la logique critique (comme la détection de vide pour les ennemis) si `overlap` est capricieux.
*   **Contrôles :** Implémenter le **Coyote Time** et le **Jump Buffer** pour une meilleure jouabilité (voir `base_parametre.md`).