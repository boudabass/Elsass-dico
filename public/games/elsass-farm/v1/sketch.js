function setup() {
    // Le canvas prend toute la taille de l'iframe/fenêtre
    createCanvas(windowWidth, windowHeight);
    
    // Configuration p5.play
    world.gravity.y = 0; 
    
    // Caméra démarre au centre du monde (ou spawn joueur)
    camera.x = Config.worldWidth / 2;
    camera.y = Config.worldHeight / 2;
    
    // Signal Ready
    if (window.GameSystem && window.GameSystem.Lifecycle) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    background(Config.colors.background);
    
    // 1. Déplacement Caméra (Temporaire pour test: Flèches ou Souris aux bords)
    // Dans la version finale, la caméra suivra le joueur
    if (mouseIsPressed) {
        camera.x += (mouseX - width/2) * 0.05;
        camera.y += (mouseY - height/2) * 0.05;
    }

    // 2. Rendu Monde (Soumis à la caméra)
    camera.on();
    
    // Dessin limites monde
    noFill();
    stroke(255);
    rect(0, 0, Config.worldWidth, Config.worldHeight);
    
    // Dessin Grille simple (Repère visuel)
    if (Config.debug) {
        drawSimpleGrid();
    }
    
    allSprites.draw();
    camera.off();
    
    // 3. UI (Overlay HTML géré par index.html, rien ici)
}

function drawSimpleGrid() {
    stroke(Config.colors.gridLines);
    strokeWeight(1);
    
    // Lignes verticales
    for (let x = 0; x <= Config.worldWidth; x += 64) {
        line(x, 0, x, Config.worldHeight);
    }
    // Lignes horizontales
    for (let y = 0; y <= Config.worldHeight; y += 64) {
        line(0, y, Config.worldWidth, y);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}