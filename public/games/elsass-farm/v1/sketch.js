function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Config Physique
    world.gravity.y = 0; 
    
    // Spawn Centre
    camera.x = Config.worldWidth / 2;
    camera.y = Config.worldHeight / 2;
    
    if (window.GameSystem && window.GameSystem.Lifecycle) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    background(Config.colors.background);
    
    // 1. Déplacement Caméra (Drag & Pan)
    // On ne bouge que si la souris est en dessous de la barre HUD (60px)
    if (mouseIsPressed && mouseY > 60) {
        // Delta = Position actuelle - Position précédente
        // Pour "tirer" le monde, on déplace la caméra dans le sens OPPOSE du mouvement souris
        camera.x -= (mouseX - pmouseX);
        camera.y -= (mouseY - pmouseY);
    }
    
    // Contraintes Caméra (Ne pas sortir du monde)
    // camera.x = constrain(camera.x, width/2, Config.worldWidth - width/2);
    // camera.y = constrain(camera.y, height/2, Config.worldHeight - height/2);

    // 2. Rendu Monde
    camera.on();
    
    // Bordures Monde
    noFill();
    stroke(255);
    rect(0, 0, Config.worldWidth, Config.worldHeight);
    
    if (Config.debug) {
        drawSimpleGrid();
    }
    
    allSprites.draw();
    camera.off();
}

function drawSimpleGrid() {
    stroke(Config.colors.gridLines);
    strokeWeight(1);
    
    for (let x = 0; x <= Config.worldWidth; x += 64) {
        line(x, 0, x, Config.worldHeight);
    }
    for (let y = 0; y <= Config.worldHeight; y += 64) {
        line(0, y, Config.worldWidth, y);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}