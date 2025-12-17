# Guide migration p5.js pur → p5.js + p5play v3
Objectif : transformer sketches p5.js en jeux p5play en 20 minutes max.

## Étape 1 : Mise à jour index.html (2 min)
```xml
<!-- ❌ AVANT (p5.js pur) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
<script src="snake.js"></script>

<!-- ✅ APRÈS (p5.js + p5play) -->
<script src="https://cdn.jsdelivr.net/npm/p5@1.11.4/lib/p5.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5@1.11.4/lib/addons/p5.sound.min.js"></script>
<script src="https://p5play.org/v3/planck.min.js"></script>
<script src="https://p5play.org/v3/p5play.js"></script>
<script>window.DyadGame = { id: 'snake-p5play', version: 'v1' };</script>
<script src="../../system/system.js"></script>
<script src="snake.js"></script>
```

## Étape 2 : Remplacements globaux (3 min)
| Ancien (p5.js pur) | Nouveau (p5play) |
|---|---|
| `class Snake {}` | `new Sprite()` |
| `createVector()` | `sprite.x`, `sprite.y` |
| `dist()` | `overlaps()` |
| Arrays manuels | `new Group()` |
| `if/else` states | `states.add()` |

Recherche/remplacement rapide :
```text
new Snake → new Sprite
dist( → overlaps(
createVector → (supprimé)
```

## Étape 3 : Refactorisation Snake (10 min)
```javascript
// ❌ TON SNAKE ORIGINAL (150 lignes)
// class Snake, update(), death(), edges()...

// ✅ SNAKE P5PLAY (25 lignes)
let snake, foodGroup, scl = 20;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(10);
    
    snake = new Sprite(width/2, height/2, scl);
    snake.color = 'lime';
    snake.layer = 1;
    snake.wrap(); // Bordures auto
    
    foodGroup = new Group();
    for(let i = 0; i < 25; i++) createFood();
    
    if(window.GameSystem) window.GameSystem.Lifecycle.notifyReady();
}

function draw() {
    background(20);
    // PHYSIQUE/COLLISIONS 100% AUTO
}

function keyPressed() {
    if(keyCode === LEFT_ARROW)  snake.vx = -scl;
    if(keyCode === RIGHT_ARROW) snake.vx = scl;
    if(keyCode === UP_ARROW)    snake.vy = -scl;
    if(keyCode === DOWN_ARROW)  snake.vy = scl;
}

function createFood() {
    let f = new Sprite(random(width), random(height), scl);
    f.color = color(255, 0, 100);
    foodGroup.add(f);
}

// COLLISION NOURRITURE AUTO
snake.overlaps(foodGroup, function(food) {
    food.remove();
    createFood();
    snake.life++;
});

// GAME OVER → GAMESYSTEM INTACT
snake.collides = function() {
    window.GameSystem.Score.submit(snake.life * 100);
    setTimeout(setup, 1000); // Restart
};
```

## Étape 4 : Ajout états (3 min)
```javascript
states.add('menu', {
    draw: function() {
        background(0);
        textAlign(CENTER);
        text('SNAKE v2 - ENTER pour jouer', width/2, height/2);
    },
    update: function() {
        if(key === 'Enter') states.next('game');
    }
});

states.add('gameover', {
    draw: function() {
        background(0);
        textAlign(CENTER);
        text('GAME OVER\nScore: ' + snake.life * 100 + '\nR: Rejouer', width/2, height/2);
    },
    update: function() {
        if(key === 'r') states.restart();
    }
});

function setup() {
    // ... sprites
    states.enable = true;
    states.load('menu');
}
```

## Étape 5 : Test & Debug (2 min)
```javascript
function keyPressed() {
    if(key === 'f1') {
        allSprites.debug = !allSprites.debug;
        console.log('Debug toggled');
    }
}
```

## Checklist migration ✅
- [ ] `index.html` : p5.js + p5play + system.js
- [ ] `new Sprite()` au lieu de classes
- [ ] `overlaps()` au lieu de `dist()`
- [ ] `new Group()` au lieu d'arrays
- [ ] `states.add()` pour menu/gameover
- [ ] `snake.collides()` → GameSystem
- [ ] Test : menu ☰ + scores OK