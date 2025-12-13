# Exemples Officiels p5.js : Entrée/Sortie (Fichiers & DOM)

Ces exemples montrent comment interagir avec le navigateur pour gérer les fichiers, les éléments DOM et les entrées utilisateur complexes.

## Exemple : Image Drop
**Source** : p5.js Official Examples
**Description** : Utilisation de la méthode `drop()` sur le canvas pour permettre aux utilisateurs de déposer des fichiers image, les charger et les afficher.

```javascript
// Define canvasText as a global variable.
let canvasText = 'Drag an image file onto the canvas.';

function setup() {
  // Assign the dropArea variable to the canvas.
  let dropArea = createCanvas(710, 400);

  // Add the drop() method to the canvas. Call the gotFile
  // function when a file is dropped into the canvas.
  dropArea.drop(gotFile);
  noLoop();
}

function draw() {
  background(100);

  // Add instructions for dropping an image file in the canvas.
  fill(255);
  noStroke();
  textSize(24);
  textAlign(CENTER);
  text(canvasText, width / 2, height / 2);

  describe(`Grey canvas with the text "${canvasText}" in the center.`);
}

function gotFile(file) {
  // If the file dropped into the canvas is an image,
  // create a variable called img to contain the image.
  // Remove this image file from the DOM and only
  // draw the image within the canvas.
  if (file.type === 'image') {
    // Pass in an empty string for the alt text. This should only be done with
    // decorative photos.
    let img = createImg(file.data, '').hide();
    image(img, 0, 0, width, height);
  } else {
    // If the file dropped into the canvas is not an image,
    // change the instructions to 'Not an image file!'
    canvasText = 'Not an image file!';
    redraw();
  }
}
```

## Exemple : Input and Button
**Source** : p5.js Official Examples
**Description** : Utilisation de `createElement()`, `createInput()`, et `createButton()` pour capturer une entrée utilisateur et l'afficher sur le canvas.

```javascript
// Define the global variables: input, button, and greeting.
let nameInput;
let button;
let greeting;

function setup() {
  createCanvas(710, 400);
  background(255);

  // Use the greeting variable to ask for the person's name.
  greeting = createElement('h2', 'What is your name?');
  greeting.position(20, 5);

  // Create the input and button in the canvas.
  nameInput = createInput();
  nameInput.position(20, 65);

  button = createButton('submit');
  button.position(nameInput.x + nameInput.width, 65);

  // Use the mousePressed() method to call the greet()
  // function when the button is pressed.
  button.mousePressed(greet);

  // Also call greet when input is changed and enter/return button is pressed
  nameInput.changed(greet);
}

function greet() {
  // Refresh the canvas background to clear any
  // previous inputs.
  background(255);

  // Connect the name variable to the input's value.
  let name = nameInput.value();

  // Update the greeting to state the person's name.
  greeting.html(`Hello, ${name}!`);

  // Clear the input's value.
  nameInput.value('');

  // Draw name on the canvas
  textSize(100);
  textAlign(CENTER, CENTER);
  text(name, width / 2, height / 2);

  describe(`The name ${name} in large black text on a white background.`);
}
```

## Exemple : Form Elements
**Source** : p5.js Official Examples
**Description** : Démonstration de la création de formulaires DOM complexes (`createInput`, `createSelect`, `createRadio`) et de leur interaction avec le canvas.

```javascript
// Define the inputs for this form as global variables.
let nameInput;
let fontSelect;
let foodRadio;

function setup() {
  createCanvas(720, 400);

  // Assign an input box to nameInput.
  nameInput = createInput();
  nameInput.position(25, 115);

  // Assign radio buttons to foodRadio.
  foodRadio = createRadio();
  foodRadio.position(25, 215);

  // List the radio options for foodRadio, along
  // with the background color associated with each selection.
  foodRadio.option('#F7F5BC', 'Cranberries');
  foodRadio.option('#B8E3FF', 'Almonds');
  foodRadio.option('#C79A9A', 'Gouda');

  // Assign a select dropdown to fontSelect.
  fontSelect = createSelect();
  fontSelect.position(25, 300);

  // List out the dropdown options for fontSelect.
  fontSelect.option('Sans-serif');
  fontSelect.option('Serif');
  fontSelect.option('Cursive');

  // If the fontSelect selection is changed, call the
  // fontChanged function.
  fontSelect.changed(fontChanged);
}

function draw() {
  describe(
    'A form with "Welcome to p5.js!" for a header, a text input with the label "What is your name?", and a set of radio buttons with the label "What is your favorite food?", with the options of "Cranberries," "Almonds," or "Gouda." The text submitted through the input appears next to its label. The radio button selection changes the canvas background color. The select element changes the form font.'
  );

  // Set the background color to the current foodRadio value.
  let backgroundColor = foodRadio.value();
  background(backgroundColor);

  // Create the header for the form.
  textSize(25);
  text('Welcome to p5.js!', 25, 50);

  // Create the text inputs that will update with the
  // new user inputs.
  textSize(20);
  text(`What is your name? ${nameInput.value()}`, 25, 100);
  text('What is your favorite food?', 25, 200);
}

function fontChanged() {
  // When the fontSelect value is changed,
  // update the canvas's font selection to the
  // new value.
  let fontSelection = fontSelect.value();
  textFont(fontSelection);
}
```

## Exemple : Local Storage
**Source** : p5.js Official Examples
**Description** : Utilisation de `getItem()` et `storeItem()` pour sauvegarder et recharger des données (bulles) dans le stockage local du navigateur.

```javascript
// Global array to hold all bubble objects
let bubbles;

// Store mouse press position so that a bubble can be created there
let mousePressX = 0;
let mousePressY = 0;

// Remember whether bubble is currently being created
let creatingBubble = false;

// Convert saved Bubble data into Bubble Objects
function loadData(bubblesData) {
  bubbles = [];
  for (let bubble of bubblesData) {
    // Get x,y from position
    let x = bubble.x;
    let y = bubble.y;

    // Get radius and name
    let radius = bubble.radius;
    let name = bubble.name;

    // Put object in array
    bubbles.push(new Bubble(x, y, radius, name));
  }
}

function setup() {
  let p5Canvas = createCanvas(640, 360);

  // Get saved data
  let savedData = getItem('bubbles');

  // If no data has been saved yet
  if (savedData === null) {
    // Use an empty array to start
    loadData([]);
  } else {
    // Otherwise convert the data to Bubble objects
    loadData(savedData);
  }

  // When canvas is clicked, call saveMousePress()
  p5Canvas.mousePressed(saveMousePress);

  ellipseMode(RADIUS);
  textSize(20);

  describe(
    'When the cursor clicks on the canvas, drags, and releases, a black outline circle representing a bubble appears on the white background. A prompt asks to name the bubble, and this name appears under the circle when the cursor hovers over it.'
  );
}

function draw() {
  background(255);

  // Display all bubbles
  for (let bubble of bubbles) {
    bubble.display();
  }

  // Display bubble in progress
  if (creatingBubble === true) {
    let radius = dist(mousePressX, mousePressY, mouseX, mouseY);
    noFill();
    stroke(0);
    strokeWeight(4);
    circle(mousePressX, mousePressY, radius);
  }

  // Label directions at bottom
  textAlign(LEFT, BOTTOM);
  fill(0);
  noStroke();
  text('Click and drag to add bubbles.', 10, height - 10);
}

// Save current mouse position to use as next bubble position
function saveMousePress() {
  mousePressX = mouseX;
  mousePressY = mouseY;
  creatingBubble = true;
}

// Add a bubble if in the process of creating one
function mouseReleased() {
  if (creatingBubble === true) {
    addBubble();
    creatingBubble = false;
  }
}

// Create a new bubble each time the mouse is clicked.
function addBubble() {
  // Add radius and label to bubble
  let radius = dist(mousePressX, mousePressY, mouseX, mouseY);
  let name = prompt('Enter a name for the new bubble');

  // If the user pressed 'Okay' and not 'Cancel'
  if (name !== null) {
    // Append the new JSON bubble object to the array
    bubbles.push(new Bubble(mousePressX, mousePressY, radius, name));
    storeItem('bubbles', bubbles);
  }
}

// Bubble class
class Bubble {
  constructor(x, y, radius, name) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.name = name;
  }

  // Check if mouse is over the bubble
  mouseOver() {
    let mouseDistance = dist(mouseX, mouseY, this.x, this.y);
    return mouseDistance < this.radius;
  }

  // Display the bubble
  display() {
    stroke(0);
    noFill();
    strokeWeight(4);
    circle(this.x, this.y, this.radius);
    if (this.mouseOver() === true) {
      fill(0);
      noStroke();
      textAlign(CENTER);
      text(this.name, this.x, this.y + this.radius + 30);
    }
  }
}
```

## Exemple : JSON
**Source** : p5.js Official Examples
**Description** : Chargement de données structurées (JSON) via `loadJSON()` pendant `preload()`, et sauvegarde des données mises à jour via `save()`.

```javascript
// Global array to hold all bubble objects
let bubbles;

// Store mouse press position so that a bubble can be created there
let mousePressX = 0;
let mousePressY = 0;

// Remember whether bubble is currently being created
let creatingBubble = false;

// Put any asynchronous data loading in preload to complete before "setup" is run
function preload() {
  // Load the JSON file and then call the loadData() function below
  // NOTE: Requires 'assets/bubbles.json' file to exist
  loadJSON('assets/bubbles.json', loadData);
}

// Convert saved bubble data into Bubble Objects
function loadData(bubblesData) {
  bubbles = [];
  for (let bubble of bubblesData) {
    // Get x,y from position
    let x = bubble.x;
    let y = bubble.y;

    // Get radius and name
    let radius = bubble.radius;
    let name = bubble.name;

    // Put object in array
    bubbles.push(new Bubble(x, y, radius, name));
  }
}

function setup() {
  let p5Canvas = createCanvas(640, 360);

  // When canvas is clicked, call saveMousePress()
  p5Canvas.mousePressed(saveMousePress);

  ellipseMode(RADIUS);
  textSize(20);

  // Add download button and call downloadBubbleData() when pressed
  let downloadButton = createButton('Download bubble data');
  downloadButton.mousePressed(downloadBubbleFile);

  // Add load button to load downloaded data file
  let loadButton = createFileInput(loadBubbleFile);

  // Only accept files with .json extension
  loadButton.attribute('accept', '.json');

  describe(
    'When the cursor clicks on the canvas, drags, and releases, a black outline circle representing a bubble appears on the white background. A prompt asks to name the bubble, and this name appears under the circle when the cursor hovers over it.'
  );
}

function draw() {
  background(255);

  // Display all bubbles
  for (let bubble of bubbles) {
    bubble.display();
  }

  // Display bubble in progress
  if (creatingBubble === true) {
    let radius = dist(mousePressX, mousePressY, mouseX, mouseY);
    noFill();
    stroke(0);
    strokeWeight(4);
    circle(mousePressX, mousePressY, radius);
  }

  // Label directions at bottom
  textAlign(LEFT, BOTTOM);
  fill(0);
  noStroke();
  text('Click and drag to add bubbles.', 10, height - 10);
}

// Save current mouse position to use as next bubble position
function saveMousePress() {
  mousePressX = mouseX;
  mousePressY = mouseY;
  creatingBubble = true;
}

// Add a bubble if in the process of creating one
function mouseReleased() {
  if (creatingBubble === true) {
    addBubble();
    creatingBubble = false;
  }
}

// Create a new bubble each time the mouse is clicked.
function addBubble() {
  // Add radius and label to bubble
  let radius = dist(mousePressX, mousePressY, mouseX, mouseY);
  let name = prompt('Enter a name for the new bubble');

  // If the user pressed 'Okay' and not 'Cancel'
  if (name !== null) {
    // Append the new JSON bubble object to the array
    bubbles.push(new Bubble(mousePressX, mousePressY, radius, name));
  }
}

// Load bubble data from JSON file
function loadBubbleFile(file) {
  loadData(file.data);
}

// Download bubble data as JSON file
function downloadBubbleFile() {
  save(bubbles, 'bubbles.json');
}

// Bubble class
class Bubble {
  constructor(x, y, radius, name) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.name = name;
  }

  // Check if mouse is over the bubble
  mouseOver() {
    let mouseDistance = dist(mouseX, mouseY, this.x, this.y);
    return mouseDistance < this.radius;
  }

  // Display the bubble
  display() {
    stroke(0);
    noFill();
    strokeWeight(4);
    circle(this.x, this.y, this.radius);
    if (this.mouseOver() === true) {
      fill(0);
      noStroke();
      textAlign(CENTER);
      text(this.name, this.x, this.y + this.radius + 30);
    }
  }
}
```

## Exemple : Table (CSV)
**Source** : p5.js Official Examples
**Description** : Chargement de données tabulaires (CSV) via `loadTable()` et manipulation des données via l'objet `p5.Table`.

```javascript
// Global object to hold results from the loadTable call
let table;

// Global array to hold all bubble objects
let bubbles;

// Store mouse press position so that a bubble can be created there
let mousePressX = 0;
let mousePressY = 0;

// Remember whether bubble is currently being created
let creatingBubble = false;

// Put any asynchronous data loading in preload to complete before "setup" is run
function preload() {
  // NOTE: Requires 'assets/bubbles.csv' file to exist
  table = loadTable('assets/bubbles.csv', 'header', loadData);
}

// Convert saved Bubble data into Bubble Objects
function loadData(table) {
  bubbles = [];
  let tableRows = table.getRows();
  for (let row of tableRows) {
    // Get position, diameter, name,
    let x = row.getNum('x');
    let y = row.getNum('y');
    let radius = row.getNum('radius');
    let name = row.getString('name');

    // Put object in array
    bubbles.push(new Bubble(x, y, radius, name));
  }
}

function setup() {
  let p5Canvas = createCanvas(640, 360);

  // When canvas is clicked, call saveMousePress()
  p5Canvas.mousePressed(saveMousePress);

  ellipseMode(RADIUS);
  textSize(20);

  // Add download button and call downloadBubbleData() when pressed
  let downloadButton = createButton('Download bubble data');
  downloadButton.mousePressed(downloadBubbleFile);

  // Add load button to load downloaded data file
  let loadButton = createFileInput(loadBubbleFile);

  // Only accept files with .csv extension
  loadButton.attribute('accept', '.csv');

  describe(
    'When the cursor clicks on the canvas, drags, and releases, a black outline circle representing a bubble appears on the white background. A prompt asks to name the bubble, and this name appears under the circle when the cursor hovers over it.'
  );
}

function draw() {
  background(255);

  // Display all bubbles
  for (let bubble of bubbles) {
    bubble.display();
  }

  // Display bubble in progress
  if (creatingBubble === true) {
    let radius = dist(mousePressX, mousePressY, mouseX, mouseY);
    noFill();
    stroke(0);
    strokeWeight(4);
    circle(mousePressX, mousePressY, radius);
  }

  // Label directions at bottom
  textAlign(LEFT, BOTTOM);
  fill(0);
  noStroke();
  text('Click to add bubbles.', 10, height - 10);
}

// Save current mouse position to use as next bubble position
function saveMousePress() {
  mousePressX = mouseX;
  mousePressY = mouseY;
  creatingBubble = true;
}

// Add a bubble if in the process of creating one
function mouseReleased() {
  if (creatingBubble === true) {
    addBubble();
    creatingBubble = false;
  }
}

// Create a new Bubble
function addBubble() {
  // Create a new row
  let row = table.addRow();

  // Add radius and label to bubble
  let radius = dist(mousePressX, mousePressY, mouseX, mouseY);
  let name = prompt('Enter a name for the new bubble');

  // Set the values of that row
  row.setNum('x', mousePressX);
  row.setNum('y', mousePressY);
  row.setNum('radius', radius);
  row.setString('name', name);

  bubbles.push(new Bubble(mousePressX, mousePressY, radius, name));
}

// Load bubble data from CSV file
function loadBubbleFile(file) {
  loadTable(file.data, 'csv', 'header', loadData);
}

// Download bubble data as CSV file
function downloadBubbleFile() {
  saveTable(table, 'bubbles.csv');
}

// Bubble class
class Bubble {
  constructor(x, y, radius, name) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.name = name;
  }

  // Check if mouse is over the bubble
  mouseOver() {
    let mouseDistance = dist(mouseX, mouseY, this.x, this.y);
    return mouseDistance < this.radius;
  }

  // Display the bubble
  display() {
    stroke(0);
    noFill();
    strokeWeight(4);
    circle(this.x, this.y, this.radius);
    if (this.mouseOver() === true) {
      fill(0);
      noStroke();
      textAlign(CENTER);
      text(this.name, this.x, this.y + this.radius + 30);
    }
  }
}