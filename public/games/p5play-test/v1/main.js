let square;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    
    // Test Sprite p5play
    square = new Sprite(width/2, height/2, 100, 100);  // largeur, hauteur
    square.color = 'coral';
    square.collider = 'static';
    
    console.log("✅ p5play OK:", square);
    
    if(window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    background(20);
    // Rendu AUTO p5play
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if(square) {
        square.x = width/2;
        square.y = height/2;
    }
}