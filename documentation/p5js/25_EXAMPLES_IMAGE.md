# Exemples Officiels p5.js : Images & Pixels

Ces exemples montrent comment manipuler des images, les charger et modifier leurs pixels pour créer des effets visuels.

## Exemple : Copy Image Data
**Source** : p5.js Official Examples
**Description** : Utilisation de la méthode `copy()` pour simuler le coloriage d'une image. On copie des régions d'une image source (couleur) vers le canvas (affichant l'image N&B) à la position de la souris. Utilise aussi `cursor()` pour une icône personnalisée.

```javascript
// Define the global variables: bottomImg and topImg.
let bottomImg, topImg;

function preload() {
  // Preload the images from the canvas's assets directory.
  // The bottomImg is the photograph with color,
  // and the topImg is the black-and-white photograph.
  // Note: Ensure these files exist in your assets folder
  bottomImg = loadImage('assets/parrot-color.png');
  topImg = loadImage('assets/parrot-bw.png');
}

function setup() {
  describe(
    'Black-and-white photograph of a parrot. The cursor, when dragged across the canvas, adds color to the photograph.'
  );

  createCanvas(720, 400);

  // Hide the cursor and replace it with a picture of
  // a paintbrush.
  noCursor();
  cursor('assets/brush.png', 20, -10);

  // Load the top image (the black-and-white image).
  image(topImg, 0, 0);
}

function mouseDragged() {
  // Using the copy() function, copy the bottom image
  // on top of the top image when you drag your cursor
  // across the canvas.
  // copy(srcImage, sx, sy, sw, sh, dx, dy, dw, dh)
  copy(bottomImg, mouseX, mouseY, 20, 20, mouseX, mouseY, 20, 20);
}