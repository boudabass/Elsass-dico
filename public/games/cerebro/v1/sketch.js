// Variables Globales p5.js
let canvas;

function setup() {
    // 1. Création Canvas Plein Écran
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('app-container');

    // 2. Configuration p5
    pixelDensity(1); // Performance mobile/retina
    frameRate(60);

    // 3. Initialisation Systèmes
    if (window.GraphSystem) GraphSystem.init();
    if (window.ViewSystem) ViewSystem.init();
    if (window.InputManager) InputManager.init();

    // 4. Chargement Données
    if (window.SaveManager) SaveManager.load();

    console.log("🧠 Cerebro v1 Initialisé");
}

function draw() {
    background(Config.BACKGROUND_COLOR);

    // Transformation Caméra (Managed by ViewSystem)
    push();
    if (window.ViewSystem) ViewSystem.applyTransform();

    // 1. Grille Infini
    drawGrid();

    // 2. Graphe (Neurones + Synapses)
    if (window.GraphSystem) {
        GraphSystem.drawLinks(); // Synapses dessous
        GraphSystem.drawNodes(); // Neurones dessus
    }

    // 3. Interactions (Drag visualization, selection ring...)
    if (window.InputManager) InputManager.drawDebug();

    pop();

    // 4. UI Overlay (si besoin de trucs non-DOM)
    // Update Context Menu Position (Sync with camera)
    if (window.UIManager) UIManager.updateContextMenuPos();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Helper: Grille Infinie
// Helper: Grille Infinie
function drawGrid() {
    const gridSize = Config.GRID_SIZE;
    const view = ViewSystem;

    // Calculate visible range in World Coordinates
    const topLeft = view.screenToWorld(0, 0);
    const bottomRight = view.screenToWorld(width, height);

    // Snap start/end to grid
    const startX = Math.floor(topLeft.x / gridSize) * gridSize;
    const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
    const startY = Math.floor(topLeft.y / gridSize) * gridSize;
    const endY = Math.ceil(bottomRight.y / gridSize) * gridSize;

    stroke(Config.GRID_COLOR);
    strokeWeight(1);

    // Draw Vertical Lines
    for (let x = startX; x <= endX; x += gridSize) {
        line(x, startY, x, endY);
    }

    // Draw Horizontal Lines
    for (let y = startY; y <= endY; y += gridSize) {
        line(startX, y, endX, y);
    }
}

// Hooks Inputs Globales (Delegation to InputManager)
function mousePressed() { InputManager.handleStart(); }
function mouseDragged() { InputManager.handleMove(); }
function mouseReleased() { InputManager.handleEnd(); }
function mouseWheel(e) { InputManager.handleWheel(e); return false; }
