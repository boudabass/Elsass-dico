# 🚀 Patterns : Physique & Mouvement

La plupart des jeux interactifs (Asteroids, Forest) nécessitent une simulation physique, même basique.

## 1. La Puissance des Vecteurs (`p5.Vector`)

Au lieu de gérer `x`, `y`, `speedX`, `speedY` séparément, utilisez `p5.Vector`. C'est le standard utilisé dans **Asteroids**.

### Le Trio Sacré :
1.  **Position (`pos`)** : Où je suis.
2.  **Vitesse (`vel`)** : De combien je bouge à chaque frame.
3.  **Accélération (`acc`)** : La force du moteur / gravité.

```javascript
/* Dans votre classe (ex: Ship.js) */
constructor() {
    this.pos = createVector(width/2, height/2);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
}

applyForce(force) {
    this.acc.add(force); // F = ma (si m=1)
}

update() {
    this.vel.add(this.acc); // La vitesse change selon l'accélération
    this.pos.add(this.vel); // La position change selon la vitesse
    this.acc.mult(0);       // On remet l'accélération à 0 pour la prochaine frame
}
```

## 2. Le Mouvement de Caméra ("Scrolling")

Pour un jeu plus grand que l'écran (comme **Forest**), on ne bouge pas la "caméra" (qui n'existe pas en 2D), on bouge **tout le monde** dans le sens inverse du joueur.

### Technique : `translate()`
Utilisez `push()` et `pop()` pour isoler ce mouvement du HUD (score, vies).

```javascript
/* Dans draw() */

// 1. Calcul du décalage (Le joueur doit rester au centre)
let camX = -player.x + width / 2;
let camY = -player.y + height / 2;

push(); 
    // Appliquer le décalage à tout ce qui est dessiné ensuite
    translate(camX, camY); 
    
    // Dessiner le monde
    ground.show();
    enemies.forEach(e => e.show());
    player.show(); 
pop();

// 2. Dessiner le HUD (Sans translate, donc fixe à l'écran)
fill(255);
text("Score: " + score, 20, 20);
```

## 3. L'Espace Infini ("Wrap Around")

Utilisé dans **Asteroids**. Si on sort à droite, on rentre à gauche.

```javascript
function wrapEdges(obj) {
    if (obj.pos.x > width)  obj.pos.x = 0;
    if (obj.pos.x < 0)      obj.pos.x = width;
    if (obj.pos.y > height) obj.pos.y = 0;
    if (obj.pos.y < 0)      obj.pos.y = height;
}
```
