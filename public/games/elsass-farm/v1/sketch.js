// Fonction utilitaire pour obtenir les données de la zone actuelle
function getCurrentZone() {
    const zoneId = window.ElsassFarm.state.currentZoneId;
    return Config.zones.find(z => z.id === zoneId);
}

// Fonction de changement de zone (Rendue globale)
window.changeZone = function(newZoneId, entryPoint) {
    const newZone = Config.zones.find(z => z.id === newZoneId);
    if (!newZone) {
        console.error(`Zone ID ${newZoneId} non trouvée.`);
        return;
    }
    
    console.log(`Transition de ${window.ElsassFarm.state.currentZoneId} vers ${newZoneId}`);
    window.ElsassFarm.state.currentZoneId = newZoneId;
    
    // Réinitialiser la position de la caméra dans la nouvelle zone
    // Si la transition vient de la minimap (entryPoint est null), on centre la caméra.
    if (entryPoint === 'N') camera.y = Config.zoneHeight - 100;
    else if (entryPoint === 'S') camera.y = 100;
    else if (entryPoint === 'W') camera.x = Config.zoneWidth - 100;
    else if (entryPoint === 'E') camera.x = 100;
    else {
        // Spawn par défaut au centre (utilisé par la minimap)
        camera.x = Config.zoneWidth / 2;
        camera.y = Config.zoneHeight / 2;
    }
    
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
    stroke(0);
    strokeWeight(2);
    rect(0, 0, Config.zoneWidth, Config.zoneHeight);
    
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

function mouseClicked() {
    if (mouseY < 60) return;
    
    const worldX = camera.mouse.x;
    const worldY = camera.mouse.y;
    
    const zone = getCurrentZone();
    const { zoneWidth, zoneHeight, portal, tileSize } = Config;
    
    // Recalcul des marges et tailles basées sur tileSize=40
    const size = tileSize * 3;
    const margin = tileSize * 3;
    
    // Vérification des portails (logique conservée pour la robustesse, mais non visible)
    
    // Nord
    if (zone.neighbors.N && worldX > zoneWidth / 2 - size / 2 && worldX < zoneWidth / 2 + size / 2 && worldY < margin) {
        window.changeZone(zone.neighbors.N, 'S');
        return;
    }
    
    // Sud
    if (zone.neighbors.S && worldX > zoneWidth / 2 - size / 2 && worldX < zoneWidth / 2 + size / 2 && worldY > zoneHeight - margin) {
        window.changeZone(zone.neighbors.S, 'N');
        return;
    }
    
    // Ouest
    if (zone.neighbors.W && worldY > zoneHeight / 2 - size / 2 && worldY < zoneHeight / 2 + size / 2 && worldX < margin) {
        window.changeZone(zone.neighbors.W, 'E');
        return;
    }
    
    // Est
    if (zone.neighbors.E && worldY > zoneHeight / 2 - size / 2 && worldY < zoneHeight / 2 + size / 2 && worldX > zoneWidth - margin) {
        window.changeZone(zone.neighbors.E, 'W');
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
    stroke(0);
    strokeWeight(1 / camera.zoom);
    
    const step = Config.tileSize; // Utilisation de 40
    
    for (let x = 0; x <= Config.zoneWidth; x += step) {
        line(x, 0, x, Config.zoneHeight);
    }
    for (let y = 0; y <= Config.zoneHeight; y += step) {
        line(0, y, Config.zoneWidth, y);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}