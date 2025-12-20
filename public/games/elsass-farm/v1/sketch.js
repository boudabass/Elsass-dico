// Fonction utilitaire pour obtenir les données de la zone actuelle
function getCurrentZone() {
    const zoneId = window.ElsassFarm.state.currentZoneId;
    return Config.zones.find(z => z.id === zoneId);
}

// Fonction de changement de zone
function changeZone(newZoneId, entryPoint) {
    const newZone = Config.zones.find(z => z.id === newZoneId);
    if (!newZone) {
        console.error(`Zone ID ${newZoneId} non trouvée.`);
        return;
    }
    
    console.log(`Transition de ${window.ElsassFarm.state.currentZoneId} vers ${newZoneId}`);
    window.ElsassFarm.state.currentZoneId = newZoneId;
    
    // Réinitialiser la position de la caméra dans la nouvelle zone
    if (entryPoint === 'N') camera.y = Config.zoneHeight - 100;
    else if (entryPoint === 'S') camera.y = 100;
    else if (entryPoint === 'W') camera.x = Config.zoneWidth - 100;
    else if (entryPoint === 'E') camera.x = 100;
    else {
        camera.x = Config.zoneWidth / 2;
        camera.y = Config.zoneHeight / 2;
    }
    
    // Forcer un redraw pour la nouvelle couleur de fond
    redraw();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Config Physique
    world.gravity.y = 0; 
    
    // Init Caméra au centre de la zone 3000x3000
    camera.x = Config.zoneWidth / 2;
    camera.y = Config.zoneHeight / 2;
    camera.zoom = Config.zoom.start;
    
    if (window.GameSystem && window.GameSystem.Lifecycle) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    const currentZone = getCurrentZone();
    
    // 1. Fond de la zone
    background(currentZone.bgColor);
    
    // 2. Déplacement Caméra (Drag & Pan)
    if (mouseIsPressed && mouseY > 60) {
        camera.x -= (mouseX - pmouseX) / camera.zoom;
        camera.y -= (mouseY - pmouseY) / camera.zoom;
    }
    
    // 3. Contraintes Caméra
    const margin = Config.worldMargin;
    
    const minX = (width / 2) / camera.zoom - margin;
    const maxX = Config.zoneWidth + margin - (width / 2) / camera.zoom;
    const minY = (height / 2) / camera.zoom - margin;
    const maxY = Config.zoneHeight + margin - (height / 2) / camera.zoom;

    camera.x = constrain(camera.x, minX, maxX);
    camera.y = constrain(camera.y, minY, maxY);

    // 4. Rendu Monde
    camera.on();
    
    // Dessin du monde réel (la zone active)
    noFill();
    stroke(255);
    strokeWeight(2);
    rect(0, 0, Config.zoneWidth, Config.zoneHeight);
    
    // --- ORDRE DE RENDU CORRIGÉ ---
    
    // Dessin des portails (zones cliquables)
    if (Config.debug) {
        drawPortals(currentZone); 
    }
    
    // Dessin de la grille (doit être après les portails si les portails sont opaques, 
    // ou avant si les portails sont transparents et on veut voir la grille à travers)
    // Je dessine la grille après pour qu'elle soit visible sur le fond de la zone.
    if (Config.debug) {
        drawSimpleGrid();
    }
    
    allSprites.draw();
    camera.off();
    
    // Debug Info
    if (Config.debug) {
        fill(255);
        noStroke();
        textSize(12);
        textAlign(LEFT, BOTTOM);
        text(`Zone: ${currentZone.name} (${currentZone.id}) | Zoom: ${camera.zoom.toFixed(2)}`, 10, height - 10);
    }
}

// Dessine les zones de transition cliquables
function drawPortals(zone) {
    const { zoneWidth, zoneHeight, portal } = Config;
    const { size, margin, color } = portal;
    
    // Dessin des zones cliquables (rectangles transparents)
    fill(color);
    noStroke();
    
    // Nord (Y=0)
    if (zone.neighbors.N) {
        rect(zoneWidth / 2 - size / 2, 0, size, margin);
    }
    
    // Sud (Y=zoneHeight)
    if (zone.neighbors.S) {
        rect(zoneWidth / 2 - size / 2, zoneHeight - margin, size, margin);
    }
    
    // Ouest (X=0)
    if (zone.neighbors.W) {
        rect(0, zoneHeight / 2 - size / 2, margin, size);
    }
    
    // Est (X=zoneWidth)
    if (zone.neighbors.E) {
        rect(zoneWidth - margin, zoneHeight / 2 - size / 2, margin, size);
    }
    
    // Dessin du texte (doit être fait après pour ne pas être écrasé par le fill)
    fill(255);
    textSize(20 / camera.zoom); // Taille du texte ajustée au zoom
    textAlign(CENTER, CENTER);
    
    if (zone.neighbors.N) {
        text(Config.zones.find(z => z.id === zone.neighbors.N).name, zoneWidth / 2, margin / 2);
    }
    if (zone.neighbors.S) {
        text(Config.zones.find(z => z.id === zone.neighbors.S).name, zoneWidth / 2, zoneHeight - margin / 2);
    }
    if (zone.neighbors.W) {
        // Rotation du texte pour les bords latéraux (optionnel, mais plus lisible)
        push();
        translate(margin / 2, zoneHeight / 2);
        rotate(PI / 2);
        text(Config.zones.find(z => z.id === zone.neighbors.W).name, 0, 0);
        pop();
    }
    if (zone.neighbors.E) {
        push();
        translate(zoneWidth - margin / 2, zoneHeight / 2);
        rotate(PI / 2);
        text(Config.zones.find(z => z.id === zone.neighbors.E).name, 0, 0);
        pop();
    }
}

function mouseClicked() {
    // Ignorer les clics sur le HUD
    if (mouseY < 60) return;
    
    // Convertir les coordonnées écran en coordonnées monde
    const worldX = camera.mouse.x;
    const worldY = camera.mouse.y;
    
    const zone = getCurrentZone();
    const { zoneWidth, zoneHeight, portal } = Config;
    const { size, margin } = portal;
    
    // Vérification des portails
    
    // Nord
    if (zone.neighbors.N && worldX > zoneWidth / 2 - size / 2 && worldX < zoneWidth / 2 + size / 2 && worldY < margin) {
        changeZone(zone.neighbors.N, 'S');
        return;
    }
    
    // Sud
    if (zone.neighbors.S && worldX > zoneWidth / 2 - size / 2 && worldX < zoneWidth / 2 + size / 2 && worldY > zoneHeight - margin) {
        changeZone(zone.neighbors.S, 'N');
        return;
    }
    
    // Ouest
    if (zone.neighbors.W && worldY > zoneHeight / 2 - size / 2 && worldY < zoneHeight / 2 + size / 2 && worldX < margin) {
        changeZone(zone.neighbors.W, 'E');
        return;
    }
    
    // Est
    if (zone.neighbors.E && worldY > zoneHeight / 2 - size / 2 && worldY < zoneHeight / 2 + size / 2 && worldX > zoneWidth - margin) {
        changeZone(zone.neighbors.E, 'W');
        return;
    }
    
    console.log(`Clic Monde: ${Math.round(worldX)}, ${Math.round(worldY)}`);
}

function mouseWheel(event) {
    if (mouseY < 60) return true;

    let zoomAmount = event.delta * Config.zoom.sensitivity;
    camera.zoom -= zoomAmount;
    
    camera.zoom = constrain(camera.zoom, Config.zoom.min, Config.zoom.max);
    
    return false;
}

function drawSimpleGrid() {
    stroke(Config.colors.gridLines);
    strokeWeight(1 / camera.zoom);
    
    for (let x = 0; x <= Config.zoneWidth; x += 64) {
        line(x, 0, x, Config.zoneHeight);
    }
    for (let y = 0; y <= Config.zoneHeight; y += 64) {
        line(0, y, Config.zoneWidth, y);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}