# Exemples Officiels p5.js : Formes & Primitives

Ces exemples montrent comment utiliser les fonctions de dessin de base (`rect`, `ellipse`, `line`, etc.).

## Exemple : Shape Primitives
**Source** : p5.js Official Examples
**Description** : Démonstration complète de toutes les primitives 2D disponibles (carré, rectangle, ellipse, cercle, arc, ligne, triangle, quadrilatère).

```javascript
function setup() {
  // Create screen reader accessible description
  textOutput();

  createCanvas(720, 400);

  // Use degrees as units for angles
  // The arc() function uses angles
  angleMode(DEGREES);

  // Draw a light gray background
  background(220);

  // Draw square
  // x, y, size
  square(20, 20, 100);

  // Draw rectangle on top of square
  // This appears in front of the square because the function is called
  // after (further down)
  // Switching the order of square and rect will make the square appear on
  // top of the rectangle
  // x, y, width, height
  rect(100, 40, 200, 100);

  // Draw eye shape with ellipse, circle, and arc

  // Draw ellipse as outer eye shape
  // x, y, width, height
  ellipse(540, 100, 300, 100);

  // Draw circle as pupil
  // x, y, diameter
  circle(560, 100, 100);

  // Draw arc (compare to ellipse()) as eyelid
  // x, y, width, heght, start angle, stop angle, mode
  arc(540, 100, 300, 100, 180, 360, CHORD);

  // Draw line
  // x1, y1, x2, y2
  line(20, 200, 200, 350);

  // Draw triangle
  // x1, y1, x2, y2, x3, y3
  triangle(250, 350, 350, 200, 450, 350);

  // Draw quadrilateral
  // x1, y1, x2, y2, x3, y3, x4, y4
  quad(500, 250, 550, 200, 700, 300, 650, 350);
}
```

## Exemple : Bezier
**Source** : p5.js Official Examples
**Description** : Utilisation de `bezier()` pour créer des courbes complexes en utilisant des points d'ancrage et des points de contrôle.

```javascript
// Define strokeHue as a global variable. This variable
// will be used to color each line.
let strokeHue = 20;

function setup() {
  createCanvas(720, 400);

  // Remove the bezier stroke fills and establish a new
  // stroke weight. Change the color mode to HSB.
  noFill();
  strokeWeight(2);
  colorMode(HSB);
}

function draw() {
  describe(
    'Ten rainbow-colored lines in a bezier curve formation. The top anchors of the curves move with the cursor as it hovers over the black canvas.'
  );

  background(5);

  // Create 10 bezier lines with anchor points moving
  // with the X coordinate of the cursor.
  for (let i = 0; i < 200; i += 20) {
    // Add 10 to the line's hue value during
    // each iteration.
    strokeColor = i + 10;

    stroke(strokeColor, 50, 60);

    bezier(mouseX - i / 2, 0 + i, 410, 20, 440, 300, 240 - i / 16, 300 + i / 8);
  }
}