# 🎛️ Patterns : Entrées, Audio & Intégration

## 1. Gestion des Entrées (Inputs)

### Inputs unifiés p5.js + p5play v3
Ancien : gestion manuelle `keyPressed()` avec `keyCode` numérique.

Nouveau : `keyPressed()` + propriétés `sprite.key[]` + gamepad natif.

```javascript
// ❌ AVANT (p5.js pur)
function keyPressed() {
    if(keyCode === UP_ARROW) snake.dir(0, -1);
    if(keyCode === 87) player.jump();  // 'W' = 87
}

// ✅ APRÈS (p5play v3)
function keyPressed() {
    // Direction Snake
    if(keyCode === LEFT_ARROW)  snake.vx = -scl;
    if(keyCode === RIGHT_ARROW) snake.vx = scl;
    if(keyCode === UP_ARROW)    snake.vy = -scl;
    if(keyCode === DOWN_ARROW)  snake.vy = scl;
    
    // Actions
    if(key === ' ') player.jump();
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

### Sauvegarde du Score
Dès la fin de partie, envoyez le score. C'est asynchrone, mais on n'attend souvent pas la réponse pour afficher "Game Over".

```javascript
// ❌ AVANT : death() manuelle
death() {
    if(dist(head, tail) < 1) {
        window.GameSystem.Score.submit(this.total * 100);
    }
}

// ✅ APRÈS : callback collision p5play
snake.collides = function() {
    window.GameSystem.Score.submit(snake.life * 100);
    states.next('gameover');
};

// Fin de scène
states.gameover = {
    start: function() {
        window.GameSystem.Score.submit(finalScore);
    }
};
```

### Cycle de vie jeu + GameSystem
```javascript
function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    
    states.add('menu', { 
        start: () => window.GameSystem.Lifecycle.notifyReady()
    });
    states.load('menu');
}

function draw() {
    // Physique + collisions auto
}
```

### Responsive + redimensionnement
```javascript
function setup() {
    createCanvas(windowWidth, windowHeight);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Sprites repositionnés AUTO par p5play
}
```

### Leaderboard + menu système
```javascript
states.gameover = {
    draw: function() {
        background(0);
        textAlign(CENTER);
        text(`Score: ${snake.life * 100}`, width/2, height/2);
        
        // Leaderboard GameSystem
        // (async dans update())
    }
};
```

### Bonnes pratiques d'intégration vérifiées
**Ordre des callbacks :**

```javascript
function draw() {
    // Physique auto p5play
    background(20);
    allSprites.draw();
}
```
**Debug intégré :**

```javascript
function keyPressed() {
    if(key === 'f1') {
        allSprites.debug = !allSprites.debug;
    }
}
```
**Pause globale (menu ☰ GameSystem) :**

```javascript
window.GameSystem.pauseGame = () => {
    allSprites.paused = true;
};
```
**Exemple Snake complet intégré**
```javascript
snake.collides = function() {
    window.GameSystem.Score.submit(snake.life * 100);
};

foodGroup.overlaps(snake, function(food) {
    food.remove();
    createFood();
});