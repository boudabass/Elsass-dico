# 🚀 Patterns : Physique & Mouvement

## 1. La Puissance des Vecteurs (`p5.Vector`)

### Remplacement de p5.Vector manuel
Ancien paradigme p5.js pur : gestion manuelle des positions, vitesses avec `createVector()`.

Nouveau paradigme p5play : propriétés intégrées `sprite.pos`, `sprite.vel`, `sprite.acc` mises à jour automatiquement.

```javascript
// ❌ AVANT (p5.js manuel - Snake)
class Snake {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(scl, 0);
    }
    update() {
        this.pos.add(this.vel);
    }
}

// ✅ APRÈS (p5play v3)
let snake = new Sprite(width/2, height/2, scl);
snake.vel = { x: scl, y: 0 };  // TOUT AUTO
// pos += vel chaque frame automatiquement
```

### Propriétés physiques principales (p5play v3)
| Propriété | Type | Description | Exemple Snake |
|---|---|---|---|
| `sprite.x`, `sprite.y` | `number` | Position | `snake.x = width/2` |
| `sprite.vx`, `sprite.vy` | `number` | Vitesse | `snake.vx = scl` |
| `sprite.ax`, `sprite.ay` | `number` | Accélération | `snake.ay = 0.1` |
| `sprite.friction` | `number` | Résistance (0-1) | `snake.friction = 0.9` |

### Gestion des bords d'écran intégrée
```javascript
// ❌ AVANT (6 lignes if/else)
if(pos.x < 0) pos.x = width;
// ...

// ✅ APRÈS (1 ligne)
snake.wrap();    // Wrap autour écran (Asteroids)
snake.bounce();  // Rebond
// snake.removeOnCollide();  // Mort aux bords
```

### Flux physique automatique p5play
```javascript
function setup() {
    createCanvas(windowWidth, windowHeight);
    snake = new Sprite(width/2, height/2, scl);
    snake.color = color(255);
    
    // Config World une seule fois
    allSprites.friction = 0.9;  // Friction globale
}

function draw() {
    background(20);
    
    // PHYSIQUE 100% AUTOMATIQUE
    // 1. pos += vel
    // 2. Friction appliquée
    // 3. Wrap/bounce
    // 4. Collisions vérifiées
    
    // Rendu auto
}
```

### Contrôle directionnel Snake
```javascript
function keyPressed() {
    if(keyCode === LEFT_ARROW)  snake.vx = -scl;
    if(keyCode === RIGHT_ARROW) snake.vx = scl;
    if(keyCode === UP_ARROW)    snake.vy = -scl;
    if(keyCode === DOWN_ARROW)  snake.vy = scl;
}
```

### Bonnes pratiques p5play v3 vérifiées
**Configuration globale :**
```javascript
allSprites.friction = 0.9;     // Friction tous sprites
allSprites.bounce = 0;         // Pas de rebond (Snake)
allSprites.tileSize = scl;     // Grille uniforme
```

**Limitation vitesse :**
```javascript
snake.maxSpeed = scl;  // Plus propre que vx.limit()
```

**Debug physique :**
```javascript
snake.debug = true;  // Vecteurs vitesse visibles
allSprites.debug = true;
```

### Intégration GameSystem (inchangée)
```javascript
snake.collides = function() {
    window.GameSystem.Score.submit(this.life * 100);
};