// Fonction utilitaire pour obtenir les données de la zone actuelle
function getCurrentZone() {
    const zoneId = window.ElsassFarm.state.currentZoneId;
    return Config.zones.find(z => z.id === zoneId);
}

// Fonction de changement de zone (Rendue globale)
window.changeZone = function(newZoneId, entryPoint = 'C') { // Définit 'C' comme défaut pour la minimap
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
        // Centre par défaut (Minimap)
        camera.x = Config.zoneWidth / 2;
        camera.y = Config.zoneHeight / 2;
    }
    
    // Forcer le redessinage
    if (window.p5Instance) window.p5Instance.loop();
}

function setup() {
    // Stocker l'instance p5 pour les appels externes
    window.p5Instance = this; 
    createCanvas(windowWidth, windowHeight);
    
    // Rendre redraw accessible globalement
    window.redraw = () => { loop(); };
    noLoop(); 
    
    world.gravity.y = 0; 
    
    camera.x = Config.zoneWidth / 2;
    camera.y = Config.zoneHeight / 2;
    camera.zoom = Config.zoom.start;
    
    if (window.GameSystem && window.GameSystem.Lifecycle) {
        window.GameSystem.Lifecycle.notifyReady();
    }
    
    loop();
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
    
    // Mise à jour des coordonnées de debug
    if (Config.debug && window.ElsassFarm.systems.ui) {
        window.ElsassFarm.systems.ui.updateDebugCoords(camera.mouse.x, camera.mouse.y);
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
    
    // Affichage conditionnel de la grille
    if (Config.debug && window.ElsassFarm.state.showGrid) {
        drawSimpleGrid();
    }
    
    allSprites.draw();
    camera.off();
}

function mouseClicked() {
    if (mouseY < 60) return;
    
    const worldX = camera.mouse.x;
    const worldY = camera.mouse.y;
    
    const zone = getCurrentZone();
    const { zoneWidth, zoneHeight, portal } = Config;
    const { size, margin } = portal;
    
    // Logique de transition de zone (invisible)
    if (zone.neighbors.N && worldX > zoneWidth / 2 - size / 2 && worldX < zoneWidth / 2 + size / 2 && worldY < margin) {
        window.changeZone(zone.neighbors.N, 'S');
        return;
    }
    if (zone.neighbors.S && worldX > zoneWidth / 2 - size / 2 && worldX < zoneWidth / 2 + size / 2 && worldY > zoneHeight - margin) {
        window.changeZone(zone.neighbors.S, 'N');
        return;
    }
    if (zone.neighbors.W && worldY > zoneHeight / 2 - size / 2 && worldY < zoneHeight / 2 + size / 2 && worldX < margin) {
        window.changeZone(zone.neighbors.W, 'E');
        return;
    }
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
    stroke(Config.colors.gridLines);
    strokeWeight(max(0.5, 1 / camera.zoom)); 
    
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