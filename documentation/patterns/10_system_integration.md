# 🔗 Patterns : Intégration GameSystem

## Intégration transparente GameSystem + p5play v3
Principe : system.js (UI globale) + p5play (moteur jeu) = complémentarité parfaite.

Contrat inchangé : tous les jeux appellent `window.GameSystem.Score.submit()`.

```xml
<!-- index.html (IDENTIQUE) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
<script src="https://unpkg.com/p5play@3/build/p5play.min.js"></script>
<script>window.DyadGame = { id: 'snake-p5play', version: 'v1' };</script>
<script src="../../system/system.js"></script>
<script src="snake.js"></script>
```

## Événements p5play → GameSystem (callbacks propres)
```javascript
// ❌ AVANT : death() manuelle avec dist()
death() {
    for(let t of tail) {
        if(dist(pos, t) < 1) GameSystem.Score.submit(total);
    }
}

// ✅ APRÈS : collision callback p5play
snake.collides = function() {
    window.GameSystem.Score.submit(snake.life * 100);
    states.next('gameover');
};

// Nourriture (overlap auto)
snake.overlaps(foodGroup, function(food) {
    food.remove();
    createFood();
});
```

## Cycle de vie scène + GameSystem hooks
```javascript
states.add('menu', {
    start: function() {
        window.GameSystem.Lifecycle.notifyReady();  // Signal prêt
    },
    update: function() {
        if(key === 'Enter') states.next('game');
    }
});

states.add('gameover', {
    start: function(finalScore) {
        window.GameSystem.Score.submit(finalScore);  // Auto-submit
        // Leaderboard auto
        window.GameSystem.Score.getLeaderboard().then(scores => {
            states.gameover.scores = scores.slice(0, 5);
        });
    }
});
```

## Pause globale (menu ☰ ↔ p5play)
```javascript
// system.js appelle ça via global
window.GameSystem.pauseGame = function() {
    allSprites.paused = true;     // Pause physique/collisions
    states.current.paused = true;
};

// Reprise
window.GameSystem.resumeGame = function() {
    allSprites.paused = false;
};
```

## Debug unifié (GameSystem + p5play)
```javascript
// Ajouté dans system.js (bouton menu ☰)
window.GameSystem.debugToggle = function() {
    allSprites.debug = !allSprites.debug;
    camera.debug = !camera.debug;
    console.log('Debug:', allSprites.debug);
};

// Inputs debug (F1)
function keyPressed() {
    if(key === 'f1') window.GameSystem.debugToggle();
}
```

## Leaderboard en scène gameover
```javascript
states.gameover = {
    draw: function() {
        background(0);
        textAlign(CENTER);
        text('GAME OVER', width/2, height/2 - 60);
        text('Score: ' + states.gameover.finalScore, width/2, height/2 - 20);
        
        // Top 5 live (async dans update)
    }
};
```

## Fullscreen + responsive GameSystem
```javascript
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    camera.viewSize = { width: windowWidth, height: windowHeight };
}

// system.js fullscreen → p5play adaptatif
window.GameSystem.Display.toggleFullscreen = function() {
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};
```

## Flux intégration complet (Snake p5play)
```javascript
function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(10);
    states.enable = true;
    states.load('menu');  // GameSystem menu ☰ injecté auto
}

states.game.start = function() {
    snake = new Sprite(width/2, height/2, scl);
    createFoodGroup();
    
    // Contrôles unifiés
    // GameSystem prêt
    window.GameSystem.Lifecycle.notifyReady();
};

snake.collides = function() {
    window.GameSystem.Score.submit(snake.life * 100);
    states.next('gameover');
};
```

## Bonnes pratiques intégration vérifiées
**Ordre chargement critique :**

```text
1. p5.js (rendu)
2. p5play v3 (moteur)
3. system.js (UI globale) 
4. jeu.js (logique)
```

**Événements lifecycle :**

```javascript
states.gameover.start = function() { GameSystem.Score.submit(); }
function setup() { GameSystem.Lifecycle.notifyReady(); }