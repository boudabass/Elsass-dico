# Exemples Officiels p5.js : Mathématiques & Utilitaires

Ces exemples montrent comment utiliser les fonctions mathématiques de p5.js pour le mouvement, le mapping et la génération aléatoire.

## Exemple : Linear Interpolation (lerp)
**Source** : p5.js Official Examples
**Description** : Utilisation de `lerp()` pour calculer une valeur entre deux points à un incrément constant, créant un mouvement fluide de l'ellipse vers le curseur.

```javascript
let x = 0;
let y = 0;

function setup() {
  createCanvas(720, 400);
  noStroke();
  textOutput();
}

function draw() {
  background(51);

  // lerp() calculates a number between two numbers at a specific increment.
  // The amt parameter is the amount to interpolate between the two values
  // where 0.0 is equal to the first point, 0.1 is very near the first point, 0.5
  // is halfway in between, etc.

  // Move 5% of the way to the mouse location each frame
  x = lerp(x, mouseX, 0.05);
  y = lerp(y, mouseY, 0.05);

  fill(255);
  stroke(255);
  ellipse(x, y, 66, 66);
}
```

## Exemple : Map
**Source** : p5.js Official Examples
**Description** : Utilisation de `map()` pour convertir une valeur d'une plage à une autre (ex: position X de la souris vers la teinte HSB).

```javascript
function setup() {
  createCanvas(720, 400);
  colorMode(HSB);
  noStroke();
  textOutput();
}

function draw() {
  background(0);

  // Scale the mouseX value from 0 to 720 to a range between 0 and 360
  let circleHue = map(mouseX, 0, width, 0, 360);

  // Scale the mouseY value from 0 to 400 to a range between 20 and 300
  let diameter = map(mouseY, 0, height, 20, 300);

  fill(circleHue, 80, 90);
  circle(width / 2, height / 2, diameter);
}
```

## Exemple : Random
**Source** : p5.js Official Examples
**Description** : Utilisation de `random()` pour générer des nombres aléatoires pour la position et la couleur.

```javascript
// Declare variables for the position and color of the circle

let circleX;
let circleY;
let circleColor;

function setup() {
  createCanvas(710, 400);

  // Set the initial position and color of the circle
  setPositionAndColor();

  describe(
    'A circle whose position and color change randomly when the user clicks the canvas.'
  );
}

function setPositionAndColor() {
  // Set the position to a random value (within the canvas)
  circleX = random(0, width);
  circleY = random(0, height);

  // Set R, G, and B to random values in the range (100, 256)
  circleColor = color(random(100, 256), random(100, 256), random(100, 256));
}

function draw() {
  background(10);

  // Draw a circle at (x,y) with color c
  fill(circleColor);
  circle(circleX, circleY, 100);
}

function mousePressed() {
  // On mouse press (re)set the position and color
  setPositionAndColor();
}
```

## Exemple : Constrain
**Source** : p5.js Official Examples
**Description** : Utilisation de `constrain()` pour limiter la position d'un objet (ici, un cercle) à l'intérieur d'une zone définie (ici, un rectangle).

```javascript
// Circle's radius
let radius = 24;

// Distance between edge of rectangle and edge of canvas
let edge = 100;

// Distance between center of circle and edge of canvas
// when circle is at edge of rectangle
let inner = edge + radius;

function setup() {
  createCanvas(720, 400);
  noStroke();

  // Use radius mode to pass in radius as 3rd parameter for circle()
  ellipseMode(RADIUS);

  // Use corners mode to pass in rectangle corner coordinates
  rectMode(CORNERS);

  describe(
    'Pink rectangle on a grey background. The cursor moves a white circle within the pink rectangle.'
  );
}

function draw() {
  background(230);

  // Draw rectangle
  fill(237, 34, 93);
  rect(edge, edge, width - edge, height - edge);

  // Calculate circle coordinates constrained to rectangle
  let circleX = constrain(mouseX, inner, width - inner);
  let circleY = constrain(mouseY, inner, height - inner);

  // Draw circle
  fill(255);
  circle(circleX, circleY, radius);
}
```

## Exemple : Recursive Tree
**Source** : p5.js Official Examples
**Description** : Utilisation de la récursivité et des transformations (`translate`, `rotate`, `push`, `pop`) pour dessiner un arbre fractal dont l'angle est contrôlé par la souris.

```javascript
let angle;

function setup() {
  createCanvas(710, 400);
  colorMode(HSB);
  angleMode(DEGREES);
}

function draw() {
  background(0);

  // Calculate the angle based on the mouse position, maximum 90 degrees
  angle = (mouseX / width) * 90;
  angle = min(angle, 90);

  // Start the tree from the bottom of the screen
  translate(width / 2, height);

  // Draw a line 120 pixels
  stroke(0, 255, 255);
  line(0, 0, 0, -120);

  // Move to the end of that line
  translate(0, -120);

  // Start the recursive branching
  branch(120, 0);

  describe(
    'A tree drawn by recursively drawing branches, with angle determined by the user mouse position.'
  );
}

function branch(h, level) {
  // Set the hue based on the recursion level
  stroke(level * 25, 255, 255);

  // Each branch will be 2/3 the size of the previous one
  h *= 0.66;

  // Draw if our branch length > 2, otherwise stop the recursion
  if (h > 2) {
    // Draw the right branch
    // Save the current coordinate system
    push();

    // Rotate by angle
    rotate(angle);

    // Draw the branch
    line(0, 0, 0, -h);

    // Move to the end of the branch
    translate(0, -h);

    // Call branch() recursively
    branch(h, level + 1);

    // Restore the saved coordinate system
    pop();

    // Draw the left branch
    push();
    rotate(-angle);
    line(0, 0, 0, -h);
    translate(0, -h);
    branch(h, level + 1);
    pop();
  }
}
```

## Exemple : Sine and Cosine
**Source** : p5.js Official Examples
**Description** : Démonstration de l'utilisation des fonctions trigonométriques (`sin`, `cos`) pour le mouvement circulaire et les courbes.

```javascript
let circleX = 200;
let circleY = 150;
let circleRadius = 75;

let graphX = 50;
let graphY = 300;
let graphAmplitude = 50;
let graphPeriod = 300;

function setup() {
  createCanvas(400, 400);
  angleMode(DEGREES);
  describe(
    'Animated demonstration of a point moving around the unit circle, together with the corresponding sine and cosine values moving along their graphs.'
  );
}

function draw() {
  background(0);

  // Set angle based on frameCount, and display current value

  let angle = frameCount % 360;

  fill(255);
  textSize(20);
  textAlign(LEFT, CENTER);
  text(`angle: ${angle}`, 25, 25);

  // Draw circle and diameters

  noFill();
  stroke(128);
  strokeWeight(3);
  circle(circleX, circleY, 2 * circleRadius);
  line(circleX, circleY - circleRadius, circleX, circleY + circleRadius);
  line(circleX - circleRadius, circleY, circleX + circleRadius, circleY);

  // Draw moving points

  let pointX = circleX + circleRadius * cos(angle);
  let pointY = circleY - circleRadius * sin(angle);

  line(circleX, circleY, pointX, pointY);

  noStroke();

  fill('white');
  circle(pointX, pointY, 10);

  fill('orange');
  circle(pointX, circleY, 10);

  fill('red');
  circle(circleX, pointY, 10);

  // Draw graph

  stroke('grey');
  strokeWeight(3);
  line(graphX, graphY, graphX + 300, graphY);
  line(graphX, graphY - graphAmplitude, graphX, graphY + graphAmplitude);
  line(
    graphX + graphPeriod,
    graphY - graphAmplitude,
    graphX + graphPeriod,
    graphY + graphAmplitude
  );

  fill('grey');
  strokeWeight(1);
  textAlign(CENTER, CENTER);
  text('0', graphX, graphY + graphAmplitude + 20);
  text('360', graphX + graphPeriod, graphY + graphAmplitude + 20);
  text('1', graphX / 2, graphY - graphAmplitude);
  text('0', graphX / 2, graphY);
  text('-1', graphX / 2, graphY + graphAmplitude);

  fill('orange');
  text('cos', graphX + graphPeriod + graphX / 2, graphY - graphAmplitude);
  fill('red');
  text('sin', graphX + graphPeriod + graphX / 2, graphY);

  // Draw cosine curve

  noFill();
  stroke('orange');
  beginShape();
  for (let t = 0; t <= 360; t++) {
    let x = map(t, 0, 360, graphX, graphX + graphPeriod);
    let y = graphY - graphAmplitude * cos(t);
    vertex(x, y);
  }
  endShape();

  // Draw sine curve

  noFill();
  stroke('red');
  beginShape();
  for (let t = 0; t <= 360; t++) {
    let x = map(t, 0, 360, graphX, graphX + graphPeriod);
    let y = graphY - graphAmplitude * sin(t);
    vertex(x, y);
  }
  endShape();

  // Draw moving line

  let lineX = map(angle, 0, 360, graphX, graphX + graphPeriod);
  stroke('grey');
  line(lineX, graphY - graphAmplitude, lineX, graphY + graphAmplitude);

  // Draw moving points on graph

  let orangeY = graphY - graphAmplitude * cos(angle);
  let redY = graphY - graphAmplitude * sin(angle);

  noStroke();

  fill('orange');
  circle(lineX, orangeY, 10);

  fill('red');
  circle(lineX, redY, 10);
}
```

## Exemple : Aim
**Source** : p5.js Official Examples
**Description** : Utilisation de `atan2()` pour calculer l'angle de visée entre deux points.

```javascript
function setup() {
  createCanvas(400, 400);
  colorMode(HSB);

  // Set angle mode so that atan2() returns angles in degrees
  angleMode(DEGREES);

  describe('Two eyes that follow the cursor.');
}

function draw() {
  background(0);

  // Draw left eye

  let leftX = 150;
  let leftY = 200;

  // Calculate angle between left eye and mouse
  let leftAngle = atan2(mouseY - leftY, mouseX - leftX);

  push();
  translate(leftX, leftY);
  fill(255);
  ellipse(0, 0, 50, 50);
  rotate(leftAngle);
  fill(0);
  ellipse(12.5, 0, 25, 25);
  pop();

  // Draw right eye

  let rightX = 250;
  let rightY = 200;

  // Calculate angle between right eye and angle
  let rightAngle = atan2(mouseY - rightY, mouseX - rightX);

  push();
  translate(rightX, rightY);
  fill(255);
  ellipse(0, 0, 50, 50);
  rotate(rightAngle);
  fill(0);
  ellipse(12.5, 0, 25, 25);
  pop();
}