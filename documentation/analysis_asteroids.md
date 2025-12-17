# Analyse Pédagogique : Asteroids

Ce document décompose le jeu **Asteroids** pour comprendre une approche plus "Orientée Objet" et mathématique.

## 1. Structure Orientée Objet (OOP)

Contrairement à Forest qui est très scindé par scènes, Asteroids repose massivement sur des objets intelligents qui s'autogèrent.

*   **`GameService.js`** : Le "Chef d'Orchestre". Il contient la liste de tous les astéroïdes et du vaisseau.
    *   `init()` : Prépare le plateau.
    *   `gameLoop()` : Appelé par `draw()`, il dit à tout le monde de bouger.

```javascript
// GameService.js (Concept)
class GameService {
    constructor() {
        this.ship = new Ship();
        this.asteroids = []; // Une liste dynamique !
    }

    gameLoop() {
        // 1. Bouger le vaisseau
        this.ship.render();

        // 2. Bouger chaque astéroïde
        for (let asteroid of this.asteroids) {
            asteroid.render();
            // Si détruit, on le retire de la liste
            if (asteroid.isDestroyed) { 
                this.splitAsteroid(asteroid); 
            }
        }
    }
}
```

## 2. Physique & Vecteurs (`p5.Vector`)

Asteroids utilise intensivement `p5.Vector` pour gérer le mouvement. C'est la façon "pro" de faire bouger des choses.

*   **Position (`pos`)** : Où je suis (x, y).
*   **Vitesse (`velocity`)** : Où je vais.
*   **Accélération** : Comment ma vitesse change (quand j'appuie sur le moteur).

```javascript
// Dans Ship.js
move() {
    this.velocity.add(this.acceleration); // On accélère
    this.pos.add(this.velocity);          // On bouge
    this.velocity.mult(0.99);             // On freine un peu (friction espace)
}
```

## 3. Les Collisions (Quadtree)

Pour détecter si un tir touche un astéroïde, on ne compare pas chaque tir avec chaque astéroïde (trop lent si 100 astéroïdes).
Le jeu utilise un **Quadtree** (`Quadtree.js`).

*   *Concept :* On divise l'écran en 4 carrés. Si le tir est en haut à gauche, on ne vérifie que les astéroïdes en haut à gauche.
*   C'est une optimisation avancée, mais essentielle pour la performance.

## 4. L'Infinité (Wrap Around)

Le jeu a un effet "Pac-Man" : si on sort à droite, on revient à gauche.

```javascript
// GameService.js : wrapObjectAround(obj)
if (obj.x > largeur_ecran) {
    obj.x = 0; // Téléportation à gauche
}
```

---

### Résumé pour nos futurs jeux
Ce que **Asteroids** nous apprend de plus que **Forest** :
1.  **Listes Dynamiques :** Utiliser des tableaux (`[]`) pour gérer un nombre variable d'ennemis.
2.  **Vecteurs :** Utiliser `createVector()` pour des mouvements fluides et réalistes.
3.  **Gestionnaire Central :** Une classe `GameService` ou `GameManager` est très utile pour séparer la logique pure de l'affichage p5.js.
