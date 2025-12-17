# 🏗️ Patterns : Structure & Architecture

Ce guide consolide les bonnes pratiques d'architecture observées dans nos jeux (Forest, Asteroids, Breakout).

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
