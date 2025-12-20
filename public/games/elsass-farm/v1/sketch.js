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
    // La logique de spawn est conservée même si la transition se fait par la minimap
    if (entryPoint === 'N') camera.y = Config.zoneHeight - 100;
    else if (entryPoint === 'S') camera.y = 100;
    else if (entryPoint === 'W') camera.x = Config.zoneWidth - 100;
    else if (entryPoint === 'E') camera.x = 100;
    else {
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
    stroke(255);
    strokeWeight(2);
    rect(0, 0, Config.zoneWidth, Config.zoneHeight);
    
    // drawPortals(currentZone); <-- SUPPRIMÉ
    
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

// drawPortals() est supprimée car elle n'est plus utilisée pour le rendu.

function mouseClicked() {
    // La logique de clic pour les portails est conservée ici, 
    // mais elle est désormais invisible et redondante si la minimap est utilisée.
    if (mouseY < 60) return;
    
    const worldX = camera.mouse.x;
    const worldY = camera.mouse.y;
    
    const zone = getCurrentZone();
    const { zoneWidth, zoneHeight, portal } = Config;
    const { size, margin } = portal;
    
    // Vérification des portails (logique conservée pour la robustesse, mais non visible)
    
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