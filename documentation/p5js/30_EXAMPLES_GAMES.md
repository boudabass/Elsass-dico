# Exemples Officiels p5.js : Jeux Complets

Ces exemples fournissent des implémentations complètes de jeux classiques, servant de référence pour la structure de nos propres Templates.

## Exemple : Snake
**Source** : p5.js Official Examples
**Description** : Reproduction du jeu d'arcade Snake, utilisant des vecteurs pour les segments, une grille logique, et la gestion des collisions.

```javascript
// The snake moves along a grid, one space at a time
// The grid is smaller than the canvas, and its dimensions
//  are stored in these variables
let gridWidth = 30;
let gridHeight = 30;

let gameStarted = false;

// How many segments snake starts with
let startingSegments = 10;

// Starting coordinates for first segment
let xStart = 0;
let yStart = 15;

// Starting direction of motion
let startDirection = 'right';

// Current direction of motion
let direction = startDirection;

// The snake is divided into small segments,
// stored as vectors in this array
let segments = [];

let score = 0;
let highScore;

// The fruit's position is stored as a vector
// in this variable
let fruit;

function setup() {
  createCanvas(500, 500);

  // Adjust frame rate to set movement speed
  frameRate(10);

  textAlign(CENTER, CENTER);
  textSize(2);

  // Check for saved high score in local browser storage
  // If no score has been stored, this will be undefined
  highScore = getItem('high score');

  describe(
    'A reproduction of the arcade game Snake, in which a snake, represented by a green line on a black background, is controlled by the arrow keys. Users move the snake toward a fruit, represented by a red dot, but the snake must not hit the sides of the window or itself.'
  );
}

function draw() {
  background(0);

  // Set scale so that the game grid fills canvas
  scale(width / gridWidth, height / gridHeight);
  if (gameStarted === false) {
    showStartScreen();
  } else {
    // Shift over so that snake and fruit are still on screen
    // when their coordinates are 0
    translate(0.5, 0.5);
    showFruit();
    showSegments();
    updateSegments();
    checkForCollision();
    checkForFruit();
  }
}

function showStartScreen() {
  noStroke();
  fill(32);
  rect(2, gridHeight / 2 - 5, gridWidth - 4, 10, 2);
  fill(255);
  text(
    'Click to play.\nUse arrow keys to move.',
    gridWidth / 2,
    gridHeight / 2
  );
  noLoop();
}

function mousePressed() {
  if (gameStarted === false) {
    startGame();
  }
}

function startGame() {
  // Put the fruit in a random place
  updateFruitCoordinates();

  // Start with an empty array for segments
  segments = [];

  // Start with x at the starting position and repeat until specified
  // number of segments have been created, increasing x by 1 each time
  for (let x = xStart; x < xStart + startingSegments; x += 1) {
    // Create a new vector at the current position
    let segmentPosition = createVector(x, yStart);

    // Add it to the beginning of the array
    segments.unshift(segmentPosition);
  }

  direction = startDirection;
  score = 0;
  gameStarted = true;
  loop();
}

function showFruit() {
  stroke(255, 64, 32);
  point(fruit.x, fruit.y);
}

function showSegments() {
  noFill();
  stroke(96, 255, 64);
  beginShape();
  for (let segment of segments) {
    vertex(segment.x, segment.y);
  }
  endShape();
}

function updateSegments() {
  // Remove last segment
  segments.pop();

  // Copy current head of snake
  let head = segments[0].copy();

  // Insert the new snake head at the beginning of the array
  segments.unshift(head);

  // Adjust the head's position based on the current direction
  switch (direction) {
    case 'right':
      head.x = head.x + 1;
      break;
    case 'up':
      head.y = head.y - 1;
      break;
    case 'left':
      head.x = head.x - 1;
      break;
    case 'down':
      head.y = head.y + 1;
      break;
  }
}

function checkForCollision() {
  // Store first segment in array as head
  let head = segments[0];

  // If snake's head...
  if (
    // hit right edge or
    head.x >= gridWidth ||
    // hit left edge or
    head.x < 0 ||
    // hit bottom edge or
    head.y >= gridHeight ||
    // hit top edge or
    head.y < 0 ||
    // collided with itself
    selfColliding() === true
  ) {
    // show game over screen
    gameOver();
  }
}

function gameOver() {
  noStroke();
  fill(32);
  rect(2, gridHeight / 2 - 5, gridWidth - 4, 12, 2);
  fill(255);

  // Set high score to whichever is larger: current score or previous
  // high score
  highScore = max(score, highScore);

  // Put high score in local storage. This will be be stored in browser
  // data, even after the user reloads the page.
  storeItem('high score', highScore);
  text(
    `Game over!
Your score: ${score}
High score: ${highScore}
Click to play again.`,
    gridWidth / 2,
    gridHeight / 2
  );
  gameStarted = false;
  noLoop();
}

function selfColliding() {
  // Store the last segment as head
  let head = segments[0];

  // Store every segment except the first
  let segmentsAfterHead = segments.slice(1);

  // Check each of the other segments
  for (let segment of segmentsAfterHead) {
    // If segment is in the same place as head
    if (segment.equals(head) === true) {
      return true;
    }
  }
  return false;
}

function checkForFruit() {
  // Store first segment as head
  let head = segments[0];

  // If the head segment is in the same place as the fruit
  if (head.equals(fruit) === true) {
    // Give player a point
    score = score + 1;

    // Duplicate the tail segment
    let tail = segments[segments.length - 1];
    let newSegment = tail.copy();

    // Put the duplicate in the beginning of the array
    segments.push(newSegment);

    // Reset fruit to a new location
    updateFruitCoordinates();
  }
}

function updateFruitCoordinates() {
  // Pick a random new coordinate for the fruit
  // and round it down using floor().
  // Because the segments move in increments of 1,
  // in order for the snake to hit the same position
  // as the fruit, the fruit's coordinates must be
  // integers, but random() returns a float
  let x = floor(random(gridWidth));
  let y = floor(random(gridHeight));
  fruit = createVector(x, y);
}

// When an arrow key is pressed, switch the snake's direction of movement,
// but if the snake is already moving in the opposite direction,
// do nothing.
function keyPressed() {
  switch (keyCode) {
    case LEFT_ARROW:
      if (direction !== 'right') {
        direction = 'left';
      }
      break;
    case RIGHT_ARROW:
      if (direction !== 'left') {
        direction = 'right';
      }
      break;
    case UP_ARROW:
      if (direction !== 'down') {
        direction = 'up';
      }
      break;
    case DOWN_ARROW:
      if (direction !== 'up') {
        direction = 'down';
      }
      break;
  }
}
```

## Exemple : Snowflakes
**Source** : p5.js Official Examples
**Description** : Démonstration d'un système de particules pour simuler la chute de flocons de neige, utilisant une classe `Snowflake` et des fonctions trigonométriques pour le mouvement.

```javascript
// Define array to hold snowflake objects
let snowflakes = [];

function setup() {
  createCanvas(400, 600);

  angleMode(DEGREES);

  // Create snowflake objects
  for (let i = 0; i < 300; i++) {
    // Add a new snowflake object to the array
    snowflakes.push(new Snowflake());
  }

  // Create screen reader accessible description
  describe('Snowflakes falling on a black background.');
}

function draw() {
  background(0);

  // Update and display each snowflake in the array
  let currentTime = frameCount / 60;

  for (let flake of snowflakes) {
    // Update each snowflake position and display
    flake.update(currentTime);
    flake.display();
  }
}

// Define the snowflake class

class Snowflake {
  constructor() {
    this.posX = 0;
    this.posY = random(-height, 0);
    this.initialAngle = random(0, 360);
    this.size = random(2, 5);
    this.radius = sqrt(random(pow(width / 2, 2)));
    this.color = color(random(200, 256), random(200, 256), random(200, 256));
  }

  update(time) {
    // Define angular speed (degrees / second)
    let angularSpeed = 35;

    // Calculate the current angle
    let angle = this.initialAngle + angularSpeed * time;

    // x position follows a sine wave
    this.posX = width / 2 + this.radius * sin(angle);

    // Different size snowflakes fall at different y speeds
    let ySpeed = 8 / this.size;
    this.posY += ySpeed;

    // When snowflake reaches the bottom, move it to the top
    if (this.posY > height) {
      this.posY = -50;
    }
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.posX, this.posY, this.size);
  }
}
```

## Exemple : Connected Particles
**Source** : p5.js Official Examples
**Description** : Système de particules avancé utilisant des classes imbriquées (`Path` et `Particle`) pour dessiner des lignes connectées qui s'estompent.

```javascript
// Array of path objects, each containing an array of particles
let paths = [];

// How long until the next particle
let framesBetweenParticles = 5;
let nextParticleFrame = 0;

// Location of last created particle
let previousParticlePosition;

// How long it takes for a particle to fade out
let particleFadeFrames = 300;

function setup() {
  createCanvas(720, 400);
  colorMode(HSB);

  // Start with a default vector and then use this to save the position
  // of the last created particle
  previousParticlePosition = createVector();
  describe(
    'When the cursor drags along the black background, it draws a pattern of multicolored circles outlined in white and connected by white lines. The circles and lines fade out over time.'
  );
}

function draw() {
  background(0);

  // Update and draw all paths
  for (let path of paths) {
    path.update();
    path.display();
  }
}

// Create a new path when mouse is pressed
function mousePressed() {
  nextParticleFrame = frameCount;
  paths.push(new Path());

  // Reset previous particle position to mouse
  // so that first particle in path has zero velocity
  previousParticlePosition.set(mouseX, mouseY);
  createParticle();
}

// Add particles when mouse is dragged
function mouseDragged() {
  // If it's time for a new point
  if (frameCount >= nextParticleFrame) {
    createParticle();
  }
}

function createParticle() {
  // Grab mouse position
  let mousePosition = createVector(mouseX, mouseY);

  // New particle's velocity is based on mouse movement
  let velocity = p5.Vector.sub(mousePosition, previousParticlePosition);
  velocity.mult(0.05);

  // Add new particle
  let lastPath = paths[paths.length - 1];
  lastPath.addParticle(mousePosition, velocity);

  // Schedule next particle
  nextParticleFrame = frameCount + framesBetweenParticles;

  // Store mouse values
  previousParticlePosition.set(mouseX, mouseY);
}

// Path is a list of particles
class Path {
  constructor() {
    this.particles = [];
  }

  addParticle(position, velocity) {
    // Add a new particle with a position, velocity, and hue
    let particleHue = (this.particles.length * 30) % 360;
    this.particles.push(new Particle(position, velocity, particleHue));
  }

  // Update all particles
  update() {
    for (let particle of this.particles) {
      particle.update();
    }
  }

  // Draw a line between two particles
  connectParticles(particleA, particleB) {
    let opacity = particleA.framesRemaining / particleFadeFrames;
    stroke(255, opacity);
    line(
      particleA.position.x,
      particleA.position.y,
      particleB.position.x,
      particleB.position.y
    );
  }

  // Display path
  display() {
    // Loop through backwards so that when a particle is removed,
    // the index number for the next loop will match up with the
    // particle before the removed one
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      // Remove this particle if it has no frames remaining
      if (this.particles[i].framesRemaining <= 0) {
        this.particles.splice(i, 1);

        // Otherwise, display it
      } else {
        this.particles[i].display();

        // If there is a particle after this one
        if (i < this.particles.length - 1) {
          // Connect them with a line
          this.connectParticles(this.particles[i], this.particles[i + 1]);
        }
      }
    }
  }
}

// Particle along a path
class Particle {
  constructor(position, velocity, hue) {
    this.position = position.copy();
    this.velocity = velocity.copy();
    this.hue = hue;
    this.drag = 0.95;
    this.framesRemaining = particleFadeFrames;
  }

  update() {
    // Move it
    this.position.add(this.velocity);

    // Slow it down
    this.velocity.mult(this.drag);

    // Fade it out
    this.framesRemaining = this.framesRemaining - 1;
  }

  // Draw particle
  display() {
    let opacity = this.framesRemaining / particleFadeFrames;
    noStroke();
    fill(this.hue, 80, 90, opacity);
    circle(this.position.x, this.position.y, 24);
  }
}
```

## Exemple : Flocking
**Source** : p5.js Official Examples
**Description** : Simulation de comportement de groupe (boids) utilisant des vecteurs et des règles complexes (séparation, alignement, cohésion).

```javascript
let flock;

function setup() {
  createCanvas(640, 360);
  createP('Drag the mouse to generate new boids.');

  flock = new Flock();

  // Add an initial set of boids into the system
  for (let i = 0; i < 100; i++) {
    let b = new Boid(width / 2, height / 2);
    flock.addBoid(b);
  }

  describe(
    'A group of bird-like objects, represented by triangles, moving across the canvas, modeling flocking behavior.'
  );
}

function draw() {
  background(0);
  flock.run();
}

// On mouse drag, add a new boid to the flock
function mouseDragged() {
  flock.addBoid(new Boid(mouseX, mouseY));
}

// Flock class to manage the array of all the boids
class Flock {
  constructor() {
    // Initialize the array of boids
    this.boids = [];
  }

  run() {
    for (let boid of this.boids) {
      // Pass the entire list of boids to each boid individually
      boid.run(this.boids);
    }
  }

  addBoid(b) {
    this.boids.push(b);
  }
}

class Boid {
  constructor(x, y) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = createVector(x, y);
    this.size = 3.0;

    // Maximum speed
    this.maxSpeed = 3;

    // Maximum steering force
    this.maxForce = 0.05;
    colorMode(HSB);
    this.color = color(random(256), 255, 255);
  }

  run(boids) {
    this.flock(boids);
    this.update();
    this.borders();
    this.render();
  }

  applyForce(force) {
    // We could add mass here if we want: A = F / M
    let f = p5.Vector.div(force, this.mass);
    this.acceleration.add(f);
  }

  // We accumulate a new acceleration each time based on three rules
  flock(boids) {
    let separation = this.separate(boids);
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);

    // Arbitrarily weight these forces
    separation.mult(1.5);
    alignment.mult(1.0);
    cohesion.mult(1.0);

    // Add the force vectors to acceleration
    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
  }

  // Method to update location
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);

    // Limit speed
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);

    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  seek(target) {
    // A vector pointing from the location to the target
    let desired = p5.Vector.sub(target, this.position);

    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxSpeed);

    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);

    // Limit to maximum steering force
    steer.limit(this.maxForce);
    return steer;
  }

  render() {
    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading() + radians(90);
    fill(this.color);
    stroke(255);
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);
    beginShape();
    vertex(0, -this.size * 2);
    vertex(-this.size, this.size * 2);
    vertex(this.size, this.size * 2);
    endShape(CLOSE);
    pop();
  }

  // Wraparound
  borders() {
    if (this.position.x < -this.size) {
      this.position.x = width + this.size;
    }

    if (this.position.y < -this.size) {
      this.position.y = height + this.size;
    }

    if (this.position.x > width + this.size) {
      this.position.x = -this.size;
    }

    if (this.position.y > height + this.size) {
      this.position.y = -this.size;
    }
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate(boids) {
    let desiredSeparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;

    // For every boid in the system, check if it's too close
    for (let boid of boids) {
      let distanceToNeighbor = p5.Vector.dist(this.position, boid.position);

      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if (distanceToNeighbor > 0 && distanceToNeighbor < desiredSeparation) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, boid.position);
        diff.normalize();

        // Scale by distance
        diff.div(distanceToNeighbor);
        steer.add(diff);

        // Keep track of how many
        count++;
      }
    }

    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align(boids) {
    let neighborDistance = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if (d > 0 && d < neighborDistance) {
        sum.add(boids[i].velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxForce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion
  // For the average location (i.e., center) of all nearby boids, calculate steering vector towards that location
  cohesion(boids) {
    let neighborDistance = 50;
    let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if (d > 0 && d < neighborDistance) {
        sum.add(boids[i].position); // Add location
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }
} // class Boid
```

## Exemple : Non-Orthogonal Reflection
**Source** : p5.js Official Examples
**Description** : Calcul de rebonds sur des surfaces inclinées en utilisant les méthodes vectorielles (`dot`, `sub`, `mult`).

```javascript
// Declare variables for position of left and right sides of floor
let baseLeft;
let baseRight;
let baseColor;

// Declare variables related to moving ball
let position;
let velocity;
let radius = 6;
let speed = 3.5;
let circleColor;


function setup() {
  createCanvas(710, 400);
  colorMode(HSB, 360, 100, 100);

  baseLeft = createVector(0, height - 150);
  baseRight = createVector(width, height);
  setColors();

  // Set initial position to middle of canvas
  position = createVector(width/2, height/2);

  // Set the velocity with a random direction
  velocity = p5.Vector.random2D();
  velocity.mult(speed);

  // Create screen reader accessible description
  describe('A simulation of a ball bouncing on slanted surfaces.');
}


function setColors() {
  // Choose random hues
  baseColor = color(random(30, 180), 70, 70);
  circleColor = color(random(30, 180), 90, 90);
}


function draw() {

  // Clear background, using alpha for fade effect
  background(30, 50);
  frameRate(30);

  // Draw the base
  fill(baseColor);
  noStroke();
  quad(baseLeft.x, baseLeft.y, baseRight.x, baseRight.y, width, height, 0, height);

  // Draw the circle
  fill(circleColor);
  circle(position.x, position.y, 2*radius);

  // Move the circle
  position.add(velocity);

  // Handle collisions
  handleBaseCollision();
  handleBoundaryCollision();
}


function handleBaseCollision() {
  // Calculate the normal vector and intercept for the base line
  let baseDirection = p5.Vector.sub(baseRight, baseLeft);
  baseDirection.normalize();
  let normal = createVector(baseDirection.y, -baseDirection.x);
  let intercept = baseLeft.dot(normal);

  // Detect and handle collision with base
  if (position.dot(normal) < intercept) {
    // Calculate the reflected velocity vector: v -= 2 * v.dot(n) * n
    let dot = velocity.dot(normal);
    let bounce = p5.Vector.mult(normal, 2*dot);
    velocity.sub(bounce);

    // Draw the normal vector at collision point
    stroke(255);
    strokeWeight(5);
    line(position.x, position.y,
      position.x + normal.x * 100, position.y + normal.y * 100
    );
  }
}


function handleBoundaryCollision() {
  // Handle side bounce:  
  //
  // If the ball has reached the left wall
  // or the ball has reached the right wall,
  // bounce by negating the ball's x velocity.
  //
  // Note: the ball's y velocity is unchanged when it hits
  // the side wall.
  
  if (position.x < radius || position.x > width-radius) {
    velocity.x *= -1;
  }

  // Handle top bounce:
  // If the ball has reached the top, bounce by negating
  // its y velocity.
  if (position.y < radius) {
    velocity.y *= -1;

    // Randomize base and colors
    baseLeft.y = random(height - 100, height);
    baseRight.y = random(height - 100, height);
    setColors();
  }
}
```

## Exemple : Soft Body
**Source** : p5.js Official Examples
**Description** : Simulation physique d'un corps mou (soft body) utilisant des courbes (`curveVertex`, `curveTightness`) et des calculs de ressort (`springing`, `damping`).

```javascript
// Declare variables for the physics calculations
let centerX = 0.0;
let centerY = 0.0;
let radius = 45;
let rotAngle = -90;
let accelX = 0.0;
let accelY = 0.0;
let deltaX = 0.0;
let deltaY = 0.0;
let springing = 0.0009;
let damping = 0.98;

// Declare variables for specifying vertex locations
let nodes = 5;
let nodeStartX = [];
let nodeStartY = [];
let nodeX = [];
let nodeY = [];
let angle = [];
let frequency = [];

// Declare the variable for the curve tightness
let organicConstant = 1.0;

function setup() {
  createCanvas(710, 400);

  // Start in the center of the canvas
  centerX = width / 2;
  centerY = height / 2;

  // Initialize arrays to 0
  for (let i = 0; i < nodes; i++) {
    nodeStartX[i] = 0;
    nodeStartY[i] = 0;
    nodeX[i] = 0;
    nodeY[i] = 0;
    angle[i] = 0;
  }

  // Initialize frequencies for corner nodes
  for (let i = 0; i < nodes; i++) {
    frequency[i] = random(5, 12);
  }

  noStroke();
  angleMode(DEGREES);
}

function draw() {
  // Use alpha blending for fade effect
  background(0, 50);

  // Draw and move the shape
  drawShape();
  moveShape();
}

function drawShape() {
  // Calculate node starting locations
  for (let i = 0; i < nodes; i++) {
    nodeStartX[i] = centerX + cos(rotAngle) * radius;
    nodeStartY[i] = centerY + sin(rotAngle) * radius;
    rotAngle += 360.0 / nodes;
  }

  // Draw the polygon

  curveTightness(organicConstant);
  let shapeColor = lerpColor(color('red'), color('yellow'), organicConstant);
  fill(shapeColor);

  beginShape();
  for (let i = 0; i < nodes; i++) {
    curveVertex(nodeX[i], nodeY[i]);
  }
  endShape(CLOSE);
}

function moveShape() {
  // Move center point
  deltaX = mouseX - centerX;
  deltaY = mouseY - centerY;

  // Create springing effect
  deltaX *= springing;
  deltaY *= springing;
  accelX += deltaX;
  accelY += deltaY;

  // Move center
  centerX += accelX;
  centerY += accelY;

  // Slow down springing
  accelX *= damping;
  accelY *= damping;

  // Change curve tightness based on the overall acceleration;
  // use abs() to avoid dependence on direction of acceleration
  organicConstant = 1 - (abs(accelX) + abs(accelY)) * 0.1;

  // Move nodes
  for (let i = 0; i < nodes; i++) {
    nodeX[i] = nodeStartX[i] + sin(angle[i]) * (accelX * 2);
    nodeY[i] = nodeStartY[i] + sin(angle[i]) * (accelY * 2);
    angle[i] += frequency[i];
  }
}
```

## Exemple : Forces
**Source** : p5.js Official Examples
**Description** : Démonstration de l'application de forces multiples (gravité, résistance des fluides/drag) sur des objets mobiles, illustrant la deuxième loi de Newton (`F = M * A`).

```javascript
// Declare array to store the moving bodies
let movers = [];

// Declare variable for the Liquid object
let liquid;

function setup() {
  createCanvas(720, 400);
  colorMode(HSB, 9, 100, 100);
  initializeMovers();

  // Create Liquid object
  liquid = new Liquid(0, height / 2, width, height / 2, 0.1);

  describe(
    'Nine grey balls drop from the top of the canvas and slow down as they reach the bottom half of the canvas.'
  );
}

function draw() {
  background(20);

  // Draw water
  liquid.display();

  for (let mover of movers) {
    // Check whether the mover is in the liquid
    if (liquid.contains(mover)) {
      // Calculate drag force
      let dragForce = liquid.calculateDrag(mover);

      // Apply drag force to Mover
      mover.applyForce(dragForce);
    }

    // Gravitational force is proportional to the mass
    let gravity = createVector(0, 0.1 * mover.mass);

    // Apply gravitational force
    mover.applyForce(gravity);

    // Update and display
    mover.update();
    mover.display();
    mover.checkEdges();
  }
}

function mousePressed() {
  initializeMovers();
}

function initializeMovers() {
  // Calculate the spacing based on the width of the canvas
  let xSpacing = width / 9;

  // Fill the movers array with 9 Mover objects with random masses
  for (let i = 0; i < 9; i += 1) {
    let mass = random(0.5, 3);
    let xPosition = xSpacing * i + xSpacing / 2;
    movers[i] = new Mover(mass, xPosition, 0, color(i, 100, 100));
  }
}

class Liquid {
  constructor(x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;
  }

  // Check whether the Mover in the Liquid
  contains(m) {
    let l = m.position;
    return (
      l.x > this.x &&
      l.x < this.x + this.w &&
      l.y > this.y &&
      l.y < this.y + this.h
    );
  }

  // Calculate drag force
  calculateDrag(m) {
    // The drag force magnitude is coefficient * speed squared
    let speed = m.velocity.mag();
    let dragMagnitude = this.c * speed * speed;

    // Create the drag force vector (opposite direction of velocity)
    let dragForce = m.velocity.copy();
    dragForce.mult(-1);

    // Scale the drag force vector to the magnitude calculated above
    dragForce.setMag(dragMagnitude);

    return dragForce;
  }

  display() {
    noStroke();
    fill(50);
    rect(this.x, this.y, this.w, this.h);
  }
} // class Liquid

class Mover {
  constructor(m, x, y, c) {
    this.mass = m;
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.color = c;
  }

  // Apply force according to Newton's 2nd law: F = M * A
  // or A = F / M
  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acceleration.add(f);
  }

  update() {
    // Change the velocity by the acceleration
    this.velocity.add(this.acceleration);

    // Change the position by the velocity
    this.position.add(this.velocity);

    // Clear the acceleration each frame
    this.acceleration.mult(0);
  }

  display() {
    stroke(0);
    strokeWeight(2);
    fill(this.color);
    ellipse(this.position.x, this.position.y, this.mass * 16, this.mass * 16);
  }

  // Make the balls bounce at the bottom
  checkEdges() {
    if (this.position.y > height - this.mass * 8) {
      // A little dampening when hitting the bottom
      this.velocity.y *= -0.9;
      this.position.y = height - this.mass * 8;
    }
  }
} // class Mover
```

## Exemple : Smoke Particles
**Source** : p5.js Official Examples
**Description** : Système de particules de fumée, utilisant des classes pour la gestion des particules et l'application de forces (vent).

```javascript
// Declare variables for the particle system and texture
let particleTexture;
let particleSystem;

function preload() {
  // NOTE: Requires 'assets/particle_texture.png' file to exist
  particleTexture = loadImage('assets/particle_texture.png');
}

function setup() {
  // Set the canvas size
  createCanvas(720, 400);
  colorMode(HSB);

  // Initialize the particle system
  particleSystem = new ParticleSystem(
    0,
    createVector(width / 2, height - 60),
    particleTexture
  );

  describe(
    'White circle gives off smoke in the middle of the canvas, with wind force determined by the cursor position.'
  );
}

function draw() {
  background(20);

  // Calculate the wind force based on the mouse x position
  let dx = map(mouseX, 0, width, -0.2, 0.2);
  let wind = createVector(dx, 0);

  // Apply the wind and run the particle system
  particleSystem.applyForce(wind);
  particleSystem.run();
  for (let i = 0; i < 2; i += 1) {
    particleSystem.addParticle();
  }

  // Draw an arrow representing the wind force
  drawVector(wind, createVector(width / 2, 50, 0), 500);
}

// Display an arrow to show a vector magnitude and direction
function drawVector(v, loc, scale) {
  push();
  let arrowSize = 4;
  translate(loc.x, loc.y);
  stroke(255);
  strokeWeight(3);
  rotate(v.heading());

  let length = v.mag() * scale;
  line(0, 0, length, 0);
  line(length, 0, length - arrowSize, +arrowSize / 2);
  line(length, 0, length - arrowSize, -arrowSize / 2);
  pop();
}

class ParticleSystem {
  constructor(particleCount, origin, textureImage) {
    this.particles = [];

    // Make a copy of the input vector
    this.origin = origin.copy();
    this.img = textureImage;
    for (let i = 0; i < particleCount; ++i) {
      this.particles.push(new Particle(this.origin, this.img));
    }
  }

  run() {
    // Loop through and run each particle
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      let particle = this.particles[i];
      particle.run();

      // Remove dead particles
      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Apply force to each particle
  applyForce(dir) {
    for (let particle of this.particles) {
      particle.applyForce(dir);
    }
  }

  addParticle() {
    this.particles.push(new Particle(this.origin, this.img));
  }
} // class ParticleSystem

class Particle {
  constructor(pos, imageTexture) {
    this.loc = pos.copy();

    let xSpeed = randomGaussian() * 0.3;
    let ySpeed = randomGaussian() * 0.3 - 1.0;

    this.velocity = createVector(xSpeed, ySpeed);
    this.acceleration = createVector();
    this.lifespan = 100.0;
    this.texture = imageTexture;
    this.color = color(frameCount % 256, 255, 255);
  }

  // Update and draw the particle
  run() {
    this.update();
    this.render();
  }

  // Draw the particle
  render() {
    imageMode(CENTER);
    tint(this.color, this.lifespan);
    image(this.texture, this.loc.x, this.loc.y);
  }

  applyForce(f) {
    // Add the force vector to the current acceleration vector
    this.acceleration.add(f);
  }

  isDead() {
    return this.lifespan <= 0.0;
  }

  // Update the particle's position, velocity, lifespan
  update() {
    this.velocity.add(this.acceleration);
    this.loc.add(this.velocity);
    this.lifespan -= 2.5;

    // Set the acceleration to zero
    this.acceleration.mult(0);
  }
} // class Particle
```

## Exemple : Game of Life
**Source** : p5.js Official Examples
**Description** : Simulation de l'automate cellulaire "Game of Life" de John Conway, utilisant des tableaux 2D et des règles de voisinage.

```javascript
let cellSize = 20;
let columnCount;
let rowCount;
let currentCells = [];
let nextCells = [];

function setup() {
  // Set simulation framerate to 10 to avoid flickering
  frameRate(10);
  createCanvas(720, 400);

  // Calculate columns and rows
  columnCount = floor(width / cellSize);
  rowCount = floor(height / cellSize);

  // Set each column in current cells to an empty array
  // This allows cells to be added to this array
  // The index of the cell will be its row number
  for (let column = 0; column < columnCount; column++) {
    currentCells[column] = [];
  }

  // Repeat the same process for the next cells
  for (let column = 0; column < columnCount; column++) {
    nextCells[column] = [];
  }

  noLoop();
  describe(
    "Grid of squares that switch between white and black, demonstrating a simulation of John Conway's Game of Life. When clicked, the simulation resets."
  );
}

function draw() {
  generate();
  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      // Get cell value (0 or 1)
      let cell = currentCells[column][row];

      // Convert cell value to get black (0) for alive or white (255 (white) for dead
      fill((1 - cell) * 255);
      stroke(0);
      rect(column * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
}

// Reset board when mouse is pressed
function mousePressed() {
  randomizeBoard();
  loop();
}

// Fill board randomly
function randomizeBoard() {
  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      // Randomly select value of either 0 (dead) or 1 (alive)
      currentCells[column][row] = random([0, 1]);
    }
  }
}

// Create a new generation
function generate() {
  // Loop through every spot in our 2D array and count living neighbors
  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      // Column left of current cell
      // if column is at left edge, use modulus to wrap to right edge
      let left = (column - 1 + columnCount) % columnCount;

      // Column right of current cell
      // if column is at right edge, use modulus to wrap to left edge
      let right = (column + 1) % columnCount;

      // Row above current cell
      // if row is at top edge, use modulus to wrap to bottom edge
      let above = (row - 1 + rowCount) % rowCount;

      // Row below current cell
      // if row is at bottom edge, use modulus to wrap to top edge
      let below = (row + 1) % rowCount;

      // Count living neighbors surrounding current cell
      let neighbours =
        currentCells[left][above] +
        currentCells[column][above] +
        currentCells[right][above] +
        currentCells[left][row] +
        currentCells[right][row] +
        currentCells[left][below] +
        currentCells[column][below] +
        currentCells[right][below];

      // Rules of Life
      // 1. Any live cell with fewer than two live neighbours dies
      // 2. Any live cell with more than three live neighbours dies
      if (neighbours < 2 || neighbours > 3) {
        nextCells[column][row] = 0;
        // 4. Any dead cell with exactly three live neighbours will come to life.
      } else if (neighbours === 3) {
        nextCells[column][row] = 1;
        // 3. Any live cell with two or three live neighbours lives, unchanged, to the next generation.
      } else nextCells[column][row] = currentCells[column][row];
    }
  }

  // Swap the current and next arrays for next generation
  let temp = currentCells;
  currentCells = nextCells;
  nextCells = temp;
}
```

## Exemple : Mandelbrot Set
**Source** : p5.js Official Examples
**Description** : Rendu de l'ensemble de Mandelbrot, utilisant la manipulation directe du tableau `pixels[]` et des fonctions mathématiques complexes.

```javascript
function setup() {
  createCanvas(710, 400);
  pixelDensity(1);
  describe('Colorful rendering of the Mandelbrot set.');
  background(0);

  // Establish a range of values on the complex plane
  // Different width values change the zoom level
  let w = 4;
  let h = (w * height) / width;

  // Start at negative half the width and height
  let xMin = -w / 2;
  let yMin = -h / 2;

  // Access the pixels[] array
  loadPixels();

  // Set the maximum number of iterations for each point on the complex plane
  let maxIterations = 100;

  // x goes from xMin to xMax
  let xMax = xMin + w;

  // y goes from yMin to yMax
  let yMax = yMin + h;

  // Calculate amount we increment x,y for each pixel
  let dx = (xMax - xMin) / width;
  let dy = (yMax - yMin) / height;

  // Start y
  let y = yMin;
  for (let j = 0; j < height; j += 1) {
    // Start x
    let x = xMin;
    for (let i = 0; i < width; i += 1) {
      // Test whether iteration of z = z^2 + cm diverges
      let a = x;
      let b = y;
      let iterations = 0;
      while (iterations < maxIterations) {
        let aSquared = pow(a, 2);
        let bSquared = pow(b, 2);
        let twoAB = 2.0 * a * b;
        a = aSquared - bSquared + x;
        b = twoAB + y;

        // If the values are too big, stop iteration
        if (dist(aSquared, bSquared, 0, 0) > 16) {
          break;
        }
        iterations += 1;
      }

      // Color each pixel based on how long it takes to get to infinity

      let index = (i + j * width) * 4;

      // Convert number of iterations to range of 0-1
      let normalized = map(iterations, 0, maxIterations, 0, 1);

      // Use square root of normalized value for color interpolation
      let lerpAmount = sqrt(normalized);

      // Set default color to black
      let pixelColor = color(0);

      // Blue
      let startColor = color(47, 68, 159);

      // Light yellow
      let endColor = color(255, 255, 128);

      // If iteration is under the maximum, interpolate a color
      if (iterations < maxIterations) {
        pixelColor = lerpColor(startColor, endColor, lerpAmount);
      }

      // Copy the RGBA values from the color to the pixel
      for (let i = 0; i < 4; i += 1) {
        pixels[index + i] = pixelColor.levels[i];
      }

      x += dx;
    }
    y += dy;
  }
  updatePixels();
}