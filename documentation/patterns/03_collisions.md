# 💥 Patterns : Collisions & Interactions

Détecter quand deux objets se touchent est crucial. Voici les méthodes du simple au complexe.

## 1. Cercle vs Cercle (Le plus simple)
Utilisé pour les balles, astéroïdes, ou personnages ronds.
Très rapide à calculer (distance).

```javascript
// p5.js offre la fonction dist()
let d = dist(obj1.x, obj1.y, obj2.x, obj2.y);

// Si la distance est plus petite que la somme des rayons -> BOOM
if (d < obj1.radius + obj2.radius) {
    return true; // Collision !
}
```

## 2. Rectangle vs Rectangle (AABB)
Utilisé dans **Breakout** ou les platformers classiques (Mario).
On vérifie si les boîtes se chevauchent.

```javascript
if (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.y + rect1.h > rect2.y
) {
    return true; // Collision !
}
```

## 3. Optimisation : Le Quadtree (Pour beaucoup d'objets)
Si vous avez 100 astéroïdes et 50 balles, faire 5000 vérifications par frame va faire laguer le jeu.
**Solution :** Le Quadtree (utilisé dans **Asteroids**).

*   **Principe :** Diviser l'écran en 4 zones, récursivement.
*   **Logique :** "Si je suis en haut à gauche, je ne teste la collision qu'avec les objets en haut à gauche."

*Note : Une librairie `Quadtree.js` est souvent utilisée plutôt que de le recoder soi-même.*

## 4. Gestion des "Hitbox"
Souvent, l'image (sprite) est carrée mais l'objet est rond.
**Conseil :** Découplez l'affichage de la logique.

```javascript
class Enemy {
    show() {
        image(this.sprite, this.x, this.y); // Affiche l'image
        
        // Debug : voir la hitbox réelle
        // noFill(); stroke(255, 0, 0); ellipse(this.x, this.y, this.radius * 2); 
    }
}
```
