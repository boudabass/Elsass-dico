# 🏗️ Patterns : Structure & Architecture

## 1. La Boucle Vital (Game Loop)
En p5.js, la structure de base est imposée mais nous la structurons ainsi pour rester propre :

**Fichier : `main.js` ou `sketch.js`**
```javascript
let game; // Instance unique du jeu

function setup() {
    createCanvas(windowWidth, windowHeight);
    // Initialisation du Manager Principal
    game = new GameService(); 
    game.init();
}

function draw() {
    background(0); // Nettoyage
    game.update(); // Logique (Mouvement, Règles)
    game.render(); // Affichage
}
```

## 2. Approches de Gestion d'État

Nous avons identifié deux patterns principaux pour gérer la complexité.

### A. Le "Scene Manager" (Modèle : Forest)
Idéal pour les jeux avec des phases distinctes (Intro -> Jeu -> Fin).

*   **Principe :** Une variable `currentScene` détermine quel objet est actif.
*   **Avantage :** Code très cloisonné. Chaque scène gère ses propres clics et affichages.

```javascript
// Pattern Scene
function draw() {
    if (sceneState === 'INTRO') intro.draw();
    else if (sceneState === 'GAME') gameLevel.draw();
    else if (sceneState === 'GAMEOVER') gameOver.draw();
}
```

### B. Le "Entity Manager" (Modèle : Asteroids, Breakout)
Idéal pour les jeux "Arcade" sur un seul écran avec beaucoup d'objets.

*   **Principe :** Une classe `GameService` contient des listes d'objets.
*   **Avantage :** Gestion facile des interactions entre objets (collisions).

```javascript
class GameService {
    constructor() {
        this.entities = []; // Joueur, Ennemis, Balles...
    }

    update() {
        // Boucle polymorphique : tout le monde bouge
        this.entities.forEach(e => e.move());
        this.checkCollisions();
    }
}
```

## 3. Modularité (Classes)
Ne **jamais** tout écrire dans le fichier principal.
Chaque entité doit avoir son fichier (ex: `Ball.js`, `Ship.js`).

**Règle d'Or :** Une entité doit savoir se dessiner (`render`) et se déplacer (`update`) elle-même. Le `main.js` ne fait que les coordonner.

## 4. Remplacement du "Scene Manager" manuel (p5play v3)
Ancien paradigme p5.js pur : gestion manuelle des états via variables globales.

Nouveau paradigme p5play v3 : utilisation des États de Jeu (`addState()`) et Scènes (`states`).

```javascript
// ❌ AVANT (p5.js manuel)
let state = 'menu';
function draw() {
    if(state === 'menu') drawMenu();
    else if(state === 'game') gameLoop();
}

// ✅ APRÈS (p5play v3)
states.add('menu', { 
    start: () => console.log('Menu chargé'),
    update: drawMenu,
    draw: drawMenu 
});
states.add('game', { 
    start: () => snake = new Sprite(width/2, height/2),
    update: gameLoop,
    draw: () => { background(20); allSprites.draw(); }
});
states.enable = true;
states.load('menu');
```

## 5. Remplacement des listes manuelles par Groupes de Sprites
Ancien : arrays manuels + boucles for.

Nouveau : `new Group()` de p5play avec itération automatique.

```javascript
// ❌ AVANT (Snake p5.js)
let food = [];
for(let i = 0; i < 25; i++) {
    food[i] = createVector(random(width), random(height));
}

// ✅ APRÈS (p5play v3)
let foodGroup = new Group();
for(let i = 0; i < 25; i++) {
    let f = new Sprite(random(width), random(height), 20);
    f.color = color(255, 0, 100);
    foodGroup.add(f);
}

// Rendu AUTOMATIQUE
foodGroup.draw();  // Une ligne !

// Collision auto
if(snake.overlaps(foodGroup)) {
    let eaten = snake.overlapping(foodGroup);
    eaten[0].remove();
}
```

## 6. Flux de structure recommandé p5play
```text
function setup()
├── createCanvas(windowWidth, windowHeight)
├── states.add('menu', {...})
├── states.add('game', {...})
└── states.load('menu')

function draw()
├── background(20)
├── currentScene.draw()  // Auto via states
└── allSprites.draw()    // Tous sprites auto
```

## 7. Bonnes pratiques vérifiées (p5play v3)
**Ordre des scripts (index.html) :**

```xml
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
<script src="https://unpkg.com/p5play@3/build/p5play.min.js"></script>
<script>window.DyadGame = { id: 'snake-v2' };</script>
<script src="../../system/system.js"></script>
<script src="snake.js"></script>
```

**Activation des systèmes :**

```javascript
function setup() {
    createCanvas(800, 600);
    states.enable = true;        // États activés
    allSprites.layer = 0;        // Calque par défaut
};
```

**Intégration GameSystem :**

```javascript
states.gameover = {
    start: () => {
        if(window.GameSystem) {
            window.GameSystem.Score.submit(snake.life * 100);
        }
    }
};