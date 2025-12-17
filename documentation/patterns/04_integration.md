# 🎛️ Patterns : Entrées, Audio & Intégration

Ce guide couvre les interactions avec le joueur et le système central (Hub).

## 1. Gestion des Entrées (Inputs)

### Clavier & Souris (p5.js)
Ne gérez pas les inputs n'importe où. Centralisez-les.

```javascript
function keyPressed() {
    if (key === ' ') ship.fire();
    if (keyCode === UP_ARROW) ship.thrust(true);
}

function keyReleased() {
    if (keyCode === UP_ARROW) ship.thrust(false);
}
```

### Mobile & Touch
Pour le mobile, gérer `touchStarted` est souvent insuffisant (pas de multitouch facile).
**Conseil :** Utilisez une librairie dédiée comme `p5.touchgui` (utilisée dans Asteroids) ou créez des boutons virtuels simples.

## 2. Audio (p5.sound)

Charger les sons dans `preload()` pour éviter les bugs de chargement.

```javascript
let jumpSound;

function preload() {
    soundFormats('mp3', 'ogg');
    jumpSound = loadSound('assets/jump.mp3');
}

function jump() {
    if (jumpSound.isLoaded()) {
        jumpSound.play();
    }
}
```

## 3. Intégration Système (Hub)

Tous nos jeux doivent communiquer avec `window.GameSystem`.

### Configuration (index.html)
C'est le contrat d'entrée.

```html
<script>
    window.DyadGame = { id: 'mon-jeu-v1', version: '1.0' };
</script>
<script src="../../system/system.js"></script>
```

### Sauvegarde du Score
Dès la fin de partie, envoyez le score. C'est asynchrone, mais on n'attend souvent pas la réponse pour afficher "Game Over".

```javascript
function gameOver() {
    // Affiche l'écran de fin
    // ...
    
    // Sauvegarde en arrière-plan
    if (window.GameSystem) {
        window.GameSystem.Score.submit(score);
    }
}
```
