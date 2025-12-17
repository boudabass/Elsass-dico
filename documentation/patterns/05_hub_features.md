# 🎮 Patterns : Le Hub & Fonctionnalités Système

Ce guide détaille les fonctionnalités centralisées par le **GameSystem** (le Hub).
Il remplace les implémentations ad-hoc trouvées dans les anciens jeux (Asteroids, Forest) par un standard robuste.

## 1. Interface Système (Automatique)

Désormais, le **GameSystem injecte automatiquement une interface standard** par-dessus votre jeu.
Vous n'avez rien à coder !

Cette interface contient :
*   Un bouton **Menu (☰)** en haut à gauche.
*   Un bouton **Plein Écran**.
*   (Futur) Bouton Quitter, Redémarrer.

## 2. Gestion de l'Écran (Display)

### Le Redimensionnement (Resizing)
Le jeu doit toujours occuper 100% de la fenêtre (`windowWidth`, `windowHeight`).

**Code Standard (p5.js) :**
```javascript
function setup() {
    createCanvas(windowWidth, windowHeight);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
```

### Le Plein Écran
Est géré par le bouton du menu système. Vous n'avez plus besoin d'ajouter votre propre bouton "Fullscreen".
Vous pouvez toujours le déclencher par code si voulu : `window.GameSystem.Display.toggleFullscreen()`.

## 2. Gestion du Score (Scoring)

### Sauvegarde & Leaderboard
Plus besoin de `fetch()` manuels compliqués.

**Soumettre un score :**
```javascript
// En fin de partie
window.GameSystem.Score.submit(points);
```

**Afficher le Leaderboard (Optionnel) :**
Vous pouvez récupérer les meilleurs scores pour les afficher dans vos menus.
```javascript
let topScores = await window.GameSystem.Score.getLeaderboard();
// returns [{ playerName: "Bob", score: 1500 }, ...]
```

## 3. Cycle de Vie (Lifecycle)

Permet au Hub de savoir ce que fait le jeu (Pause, Chargement fini).

### Signaler "Prêt"
Dans votre `setup()`, une fois que tout est chargé :
```javascript
function setup() {
    createCanvas(...);
    // ... chargement ...
    
    // Dit au Hub "C'est bon, tu peux enlever l'écran de chargement" (Futur)
    if(window.GameSystem.Lifecycle) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}
```

### Gestion de la Pause
Le Hub pourra demander au jeu de se mettre en pause (ex: menu overlay).
*Note : Cette fonctionnalité standardise la variable `isGamePaused` vue dans Asteroids.*

```javascript
window.GameSystem.Lifecycle.onPause(() => {
    noLoop(); // Stoppe la boucle p5.js
    musique.pause();
});

window.GameSystem.Lifecycle.onResume(() => {
    loop(); // Reprend la boucle p5.js
    musique.play();
});
```
