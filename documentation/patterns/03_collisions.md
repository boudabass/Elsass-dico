# 💥 Patterns : Collisions & Interactions

## Remplacement des calculs manuels de distance
Ancien paradigme p5.js pur : vérifications manuelles avec `dist()` et conditions `if`.

Nouveau paradigme p5play v3 : méthodes intégrées `overlaps()`, `collides()`, `overlapping()` avec hitboxes automatiques.

```javascript
// ❌ AVANT (p5.js manuel - Snake)
eat(food) {
    let d = dist(this.x, this.y, food.x, food.y);
    if(d < 1) {
        this.total++;
        return true;
    }
}

// ✅ APRÈS (p5play v3 - 1 ligne)
if(snake.overlaps(foodGroup)) {
    let eaten = snake.overlapping(foodGroup);
    eaten[0].remove();
    snake.life++;
}
```

## Méthodes de collision officielles p5play v3
| Méthode | Retour | Usage | Exemple Snake |
|---|---|---|---|
| `sprite.overlaps(other)` | `boolean` | Détection sans destruction | `snake.overlaps(foodGroup)` |
| `sprite.collides(other)` | `function` | Callback collision | `snake.collides = gameOver` |
| `sprite.overlapping(group)` | `array` | Liste sprites touchés | `snake.overlapping(foodGroup)` |
| `group.overlaps(group)` | `boolean` | Groupe vs groupe | `bullets.overlaps(enemies)` |

## Configuration des hitboxes (p5play v3)
```javascript
// Hitbox = taille sprite par défaut
let snake = new Sprite(100, 100, 20);  // Hitbox 20x20

// Hitbox personnalisée
snake.width = 15;   // Plus petite
snake.debug = true; // Hitbox visible (dev)

// Collision pixel-perfect (images)
snake.img = 'snake.png';
snake.imgHitbox = true;
```

## Callbacks de collision (gameplay)
```javascript
// 1. Callback global sur sprite
snake.collides = function() {
    if(window.GameSystem) {
        window.GameSystem.Score.submit(this.life * 100);
    }
    states.next('gameover');
};

// 2. Collision conditionnelle
snake.overlaps(foodGroup, function(food) {
    food.remove();
    createFood();
});

// 3. Collision avec filtre
if(snake.overlaps(enemies, true)) {
    snake.life--;
}
```

## Groupes vs collisions optimisées
```javascript
// ❌ MAUVAIS : vérifications individuelles
for(let enemy of enemies) {
    if(player.overlaps(enemy)) enemy.remove();
}

// ✅ BON : groupe optimisé
player.overlaps(enemiesGroup, function(enemy) {
    enemy.remove();
});

// Quadtree interne = O(1) vs O(n²)
```

## Flux de collision automatique
```javascript
function draw() {
    background(20);
    
    // TOUTES LES COLLISIONS AUTOMATIQUES
    // overlaps() / collides() vérifiées chaque frame
    // Callbacks exécutés auto
    
    // Rendu
}
```

## Bonnes pratiques p5play v3 vérifiées
**Configuration collision :**

```javascript
allSprites.collider = 'dynamic';  // Physique
foodGroup.collider = 'static';    // Immobile
```

**Debug collisions :**

```javascript
allSprites.debug = true;  // Hitbox + vecteurs
// Performance : max 500 sprites recommandés.
```

**Intégration GameSystem Snake**
```javascript
// Collision serpent → queue
snake.collides(tailGroup, function() {
    window.GameSystem.Score.submit(snake.life * 100);
    states.next('gameover');
});