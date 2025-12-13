# Exemples Officiels p5.js : Transformations

Ces exemples montrent comment manipuler le système de coordonnées (déplacement, rotation, mise à l'échelle) pour positionner et orienter les objets.

## Exemple : Translate
**Source** : p5.js Official Examples
**Description** : Démonstration de l'utilisation de `translate()` pour déplacer l'origine du système de coordonnées, et de `push()`/`pop()` pour sauvegarder et restaurer les transformations.

```javascript
function setup() {
  // Create the canvas
  createCanvas(720, 400);

  // Create screen reader accessible description
  textOutput();
}

function draw() {
  // Clear the background
  background(0);

  // Draw shapes (rectangle and circle) in the upper left corner
  // Set fill color to green
  fill(90, 189, 60);
  rect(0, 0, 200, 50);
  circle(225, 25, 50);

  // Draw shapes in the middle of the canvas

  // Save current coordinate system and color
  push();

  // Translate origin to middle of canvas
  translate(width / 2, height / 2);

  // Set fill color to blue
  fill(57, 102, 191);

  // Draw at (0,0) in new coordinate system
  rect(0, 0, 200, 50);
  circle(225, 25, 50);

  // Restore coordinate system and color
  pop();

  // Draw shapes at the mouse position
  push();
  translate(mouseX, mouseY);
  rect(0, 0, 200, 50);
  circle(225, 25, 50);
  pop();
}
```

## Exemple : Rotate
**Source** : p5.js Official Examples
**Description** : Démonstration de `rotate()` pour faire pivoter le système de coordonnées autour d'une origine translatée.

```javascript
function setup() {
  // Create the canvas
  createCanvas(720, 400);

  // Set angle mode to degrees
  angleMode(DEGREES);

  // Set text color, size, and alignment
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);

  // Set the color mode to hue-saturation-brightness (HSB)
  colorMode(HSB);

  // Create screen reader accessible description
  describe('line segments rotated around center of canvas');
}


function draw() {
  // Clear the background
  background(0);

  // Loop through angles 0, 30, 60, 90 degrees
  for (let angle=0; angle <= 90; angle += 30) {
      // Save current coordinate system
      push();                       

      // Translate to center of canvas and rotate by angle
      translate(width/2, height/2);
      rotate(angle);

      // Set color based on angle and draw line along x-axis
      stroke(angle+100, 100, 100);
      strokeWeight(5);
      line(0, 0, 150, 0);

      // Display the angle
      strokeWeight(1);              
      text(angle, 170, 0);

      // Restore coordinate system
      pop();                        
  }

  // Draw the animated line
  translate(width/2, height/2);
  rotate(frameCount);
  stroke(255);
  strokeWeight(5);
  line(0, 0, 150, 0);
}
```

## Exemple : Scale
**Source** : p5.js Official Examples
**Description** : Mise à l'échelle du système de coordonnées.

```javascript
function setup() {
  // Create the canvas
  createCanvas(720, 400);

  // Create screen reader accessible description
  textOutput();
}

function draw() {
  // Clear the background
  background(0);

  // Draw blue square
  // Save current coordinate system
  push();

  // Scale by 2
  scale(2);

  // Set color to blue
  fill(33, 89, 194);

  // Draw square at origin, size 200
  square(0, 0, 200);

  // Restore coordinate system
  pop();

  // Draw white square
  // Set color to white
  fill(255);

  // Draw square at origin, size 200
  square(0, 0, 200);

  // Draw green square
  // Save current coordinate system
  push();

  // Scale by .5 in x and .75 in y
  scale(0.5, 0.75);

  // Set color to green
  fill(42, 150, 60);

  // Draw square at origin, size 200
  square(0, 0, 200);

  // Restore coordinate system
  pop();
}
```

## Exemple : Kaleidoscope
**Source** : p5.js Official Examples
**Description** : Utilisation avancée des transformations (`translate`, `rotate`, `scale`) combinées avec `push()` et `pop()` pour créer des symétries de kaléidoscope.

```javascript
// Define the global variables.
// The symmetry variable will define how many reflective sections the canvas
// is split into.
let symmetry = 6;

// The angle button will calculate the angle at which each section is rotated.
let angle = 360 / symmetry;

function setup() {
  describe(
    `Dark grey canvas that reflects the lines drawn within it in ${symmetry} sections.`
  );
  createCanvas(720, 400);
  angleMode(DEGREES);
  background(50);
}

function draw() {
  // Move the 0,0 coordinates of the canvas to the center, instead of in
  // the top left corner.
  translate(width / 2, height / 2);

  // If the cursor is within the limits of the canvas...
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    // Translate the current position and the previous position of the
    // cursor to the new coordinates set with the translate() function above.
    let lineStartX = mouseX - width / 2;
    let lineStartY = mouseY - height / 2;
    let lineEndX = pmouseX - width / 2;
    let lineEndY = pmouseY - height / 2;

    // And, if the mouse is pressed while in the canvas...
    if (mouseIsPressed === true) {
      // For every reflective section the canvas is split into, draw the cursor's
      // coordinates while pressed...
      for (let i = 0; i < symmetry; i++) {
        rotate(angle);
        stroke(255);
        strokeWeight(3);
        line(lineStartX, lineStartY, lineEndX, lineEndY);

        // ... and reflect the line within the symmetry sections as well.
        push();
        scale(1, -1);
        line(lineStartX, lineStartY, lineEndX, lineEndY);
        pop();
      }
    }
  }
}