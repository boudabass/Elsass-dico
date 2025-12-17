# Analyse Pédagogique : The Healing Forest

Ce document décompose le jeu **Forest** pour comprendre comment un jeu **p5.js** est structuré.

## 1. La Boucle Principale (Le Moteur)

Tout jeu p5.js repose sur deux fonctions vitales (dans `main.js`) :

*   **`setup()`** : S'exécute **une seule fois** au démarrage.
    *   *Rôle :* Créer la zone de dessin (`createCanvas`), charger les assets, créer les objets (Joueur, Décors).
*   **`draw()`** : S'exécute **60 fois par seconde** (boucle infinie).
    *   *Rôle :* Effacer l'écran (`background`), calculer les nouvelles positions, et tout redessiner. C'est ici que la magie de l'animation opère.

```javascript
// Squelette simplifié de Forest
function setup() {
  createCanvas(windowWidth, windowHeight);
  scene1 = new Scene1(); // Intro
  scene2 = new Scene2(); // Jeu
}

function draw() {
  // Machine à états simple
  if (sceneCounter === 0) scene1.show();
  else if (sceneCounter === 1) scene2.show();
  else scene3.show();
}
```

## 2. La Gestion des Scènes

Le jeu est divisé en 3 "Mondes" (Classes) distincts pour ne pas mélanger le code :

1.  **`Scene1` (Intro)** : Affiche le texte et le bouton Start.
2.  **`Scene2` (Le Jeu)** : C'est là que tout se passe (Mouvements, Collisions).
3.  **`Scene3` (Fin)** : Affiche "Game Over" ou "Win".

👉 ** Astuce :** Chaque scène a sa propre méthode `.show()` qui est appelée par `draw()`. Cela garde le `main.js` propre.

## 3. La Caméra (Le Scrolling)

Forest n'utilise pas une "vraie" caméra, mais une astuce mathématique : **Tout le monde bouge sauf le joueur.**

*   Le joueur (`player`) reste souvent au centre.
*   Le monde (`ground`, `trees`) se décale dans la direction opposée à la souris.
*   Variables clés : `camX`, `camY`.

```javascript
// Dans scene2.show()
push();           // Sauvegarde la position normale
translate(camX, camY); // Décale tout le repère 
ground.show();    // Dessine le sol décalé
trees.show();     // Dessine les arbres décalés
pop();            // Restaure la position pour le HUD (Score)
```

## 4. Les Objets (Classes)

Chaque élément du jeu est un fichier séparé (`trees.js`, `player.js`).
Une classe p5.js typique ressemble à ça :

```javascript
class Player {
  constructor() {
    this.x = 0; // Position X
    this.y = 0; // Position Y
  }

  show() {
    // Dessine le joueur à sa position actuelle
    ellipse(this.x, this.y, 20, 20);
  }
}
```

## 5. L'Effet de Lumière (Vignette)

L'effet "torche" dans le noir est créé avec une **Image dynamique** (`createImage`).
On dessine une image noire transparente au centre, et opaque sur les bords, puis on la colle par-dessus le jeu à la position de la souris.

---

### Résumé pour nos futurs jeux
Pour créer un jeu similaire, il nous faut :
1.  Un `main.js` avec `setup()` et `draw()`.
2.  Un système de **Scenes** (Switch case) pour gérer Intro/Jeu/Fin.
3.  Des **Classes** séparées pour chaque élément (Arbre, Hero, Ennemi).
4.  Une variable globale (ex: `GameSystem`) pour gérer le score entre les scènes.
