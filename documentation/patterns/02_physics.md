# 🚀 Patterns : Physique & Mouvement (Standard Q5/P5Play)

## 1. Remplacement de p5.Vector manuel
Ancien paradigme p5.js : gestion manuelle des positions, vitesses et collisions avec `createVector()` et `add()`.

Nouveau paradigme p5play : propriétés intégrées `sprite.pos`, `sprite.vel`, `sprite.acc` mises à jour automatiquement chaque frame.

```javascript
// ❌ AVANT (p5.js manuel - Snake)
class Snake {
    constructor(x, y) {
        this.pos = createVector(x, y);      // Vector manuel
        this.vel = createVector(scl, 0);    // Vector manuel
    }
    
    update() {
        this.pos.add(this.vel);             // Calcul manuel
        this.vel.limit(scl);                // Limite manuelle
    }
}

// ✅ APRÈS (p5play)
let snake = sprite(width/2, height/2, scl);
snake.vel = vec2(0, scl);           // vec2() plus léger que createVector
// TOUT EST AUTOMATIQUE : pos += vel chaque frame
// vel.limit(scl) géré par p5play
```
## 2. Propriétés physiques principales (doc p5play)
| Propriété | Type | Description | Exemple Snake |
|---|---|---|---|
| `sprite.pos` | `vec2` | Position (x, y) | `snake.pos = vec2(width/2, height/2)` |
| `sprite.vel` | `vec2` | Vitesse (dx, dy) | `snake.vel = vec2(scl, 0)` |
| `sprite.acc` | `vec2` | Accélération | `snake.acc = vec2(0, 0.1)` (futur) |
| `sprite.oldPos` | `vec2` | Position précédente | Collision précise |
| `sprite.friction` | `number` | Résistance (0-1) | `snake.friction = 0.9` |

## 3. Gestion des bords d'écran intégrée
Fini les conditions manuelles `if(pos.x < 0) pos.x = width`.

```javascript
// ❌ AVANT (4 conditions if/else)
edges() {
    if(this.pos.x < 0) this.pos.x = width;
    else if(this.pos.x > width) this.pos.x = 0;
    // ... 6 lignes
}

// ✅ APRÈS (1 ligne)
snake.wrap();   // Wrap autour de l'écran (Asteroids-style)
snake.bounce(); // Rebond aux bords
snake.removeOnCollide(); // Mort aux bords
```
## 4. Flux physique automatique
```javascript
q5.setup = () => {
    new Canvas(windowWidth, windowHeight);
    snake = sprite(width/2, height/2, scl);
    snake.color = color(255);
    World.gravity.y = 0;    // Pas de gravité (Snake)
};

q5.draw = () => {
    clear();
    
    // PHYSIQUE 100% AUTOMATIQUE (aucune boucle manuelle !)
    // 1. Mise à jour positions (pos += vel)
    // 2. Vérification collisions
    // 3. Application friction
    // 4. Wrap/bounce si configuré
    
    allSprites.draw();  // Rendu automatique
};
```
## 5. Bonnes pratiques vérifiées (doc officielle)
Configuration World (une seule fois) :

```javascript
World.gravity = vec2(0, 0);     // Snake (pas de gravité)
World.drag = 0.9;               // Friction globale
allSprites.tileSize = scl;      // Grille uniforme
```
Contrôle directionnel Snake :

```javascript
q5.keyPress = () => {
    if(q5.key === 'left')  snake.vel.set(-scl, 0);
    if(q5.key === 'right') snake.vel.set(scl, 0);
    if(q5.key === 'up')    snake.vel.set(0, -scl);
    if(q5.key === 'down')  snake.vel.set(0, scl);
};
```
Limitation vitesse (optionnel) :

```javascript
snake.maxSpeed = scl;  // Plus propre que vel.limit()
```
Intégration GameSystem (inchangée)
```javascript
// Collision auto → GameSystem
snake.collides = () => {
    window.GameSystem.Score.submit(snake.life * 100);
    states.next('gameover');
};