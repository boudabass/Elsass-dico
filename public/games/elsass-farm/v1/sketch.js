// Fonction utilitaire pour obtenir les données de la zone actuelle
function getCurrentZone() {
    const zoneId = GameState.currentZoneId;
    return Config.zones.find(z => z.id === zoneId) || Config.zones[0]; // Fallback sur première zone si non trouvée
}

// Fonction de changement de zone (Rendue globale)
window.changeZone = function (newZoneId, entryPoint) {
    const newZone = Config.zones.find(z => z.id === newZoneId);
    if (!newZone) {
        console.error(`Zone ID ${newZoneId} non trouvée.`);
        return;
    }

    console.log(`Transition de ${GameState.currentZoneId} vers ${newZoneId}`);
    GameState.currentZoneId = newZoneId;

    // Réinitialiser la position de la caméra dans la nouvelle zone
    if (entryPoint === 'N') camera.y = Config.zoneHeight - 100;
    else if (entryPoint === 'S') camera.y = 100;
    else if (entryPoint === 'W') camera.x = Config.zoneWidth - 100;
    else if (entryPoint === 'E') camera.x = 100;
    else {
        camera.x = Config.zoneWidth / 2;
        camera.y = Config.zoneHeight / 2;
    }

    // Force le redraw - nécessaire pour mobile
    if (typeof redraw === 'function') {
        redraw();
    }
}

function setup() {
    new Canvas(windowWidth, windowHeight);

    world.gravity.y = 0;

    // S'assurer qu'allSprites existe
    if (typeof allSprites === 'undefined') {
        allSprites = new Group();
    }

    camera.x = Config.zoneWidth / 2;
    camera.y = Config.zoneHeight / 2;
    camera.zoom = Config.zoom.start;

    if (window.GameSystem && window.GameSystem.Lifecycle) {
        window.GameSystem.Lifecycle.notifyReady();
    }

    InputManager.init();

    // Initialiser les raccourcis (Refactorisé)
    if (window.QuickAction && QuickAction.refresh) {
        QuickAction.refresh();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Force un redraw après redimensionnement pour mobile
    if (typeof redraw === 'function') {
        redraw();
    }
}

// Fonction globale redraw pour compatibilité (utilisée par MinimapRenderer et autres)
window.redraw = function() {
    if (typeof redraw === 'function') {
        redraw();
    }
};

function draw() {
    const currentZone = getCurrentZone();

    // 1. Fond de la zone
    background(currentZone.bgColor);

    // 2. Rendu Monde (Active la transformation de la caméra)
    camera.on();

    // Dessin du monde réel (la zone active)
    noFill();
    stroke(0);
    strokeWeight(2);
    rect(0, 0, Config.zoneWidth, Config.zoneHeight);

    if (Config.debug && Config.showGrid) {
        drawSimpleGrid();
    }

    // Dessiner la grille de farming (si dans une zone de ferme)
    if (GridSystem && (GameState.currentZoneId === 'C_C' ||
        GameState.currentZoneId.includes('N') ||
        GameState.currentZoneId.includes('S'))) {
        GridSystem.draw();
    }

    allSprites.draw();
    camera.off(); // Désactive la transformation

    // 3. Mise à jour de la caméra (Déplacement et Contraintes)
    // Appel après camera.off() pour utiliser les coordonnées écran (mouseX, mouseY)
    InputManager.updateCamera(
        camera,
        mouseIsPressed,
        mouseX,
        pmouseX,
        mouseY,
        pmouseY,
        width,
        height
    );

    // 4. Mise à jour automatique du temps (Game Loop)
    if (window.TimeManager) {
        // Initialiser lastTimeCheck si nécessaire
        if (typeof window.lastTimeCheck === 'undefined') {
            window.lastTimeCheck = millis();
        }

        // Vérifier si 1 seconde réelle s'est écoulée
        if (millis() - window.lastTimeCheck >= 1000) {
            window.lastTimeCheck = millis();
            // Avancer de X minutes (Configuré dans TimeManager)
            TimeManager.advanceMinutes(TimeManager.MINUTES_PER_REAL_SECOND);
        }
    }

    // 5. Mise à jour des infos de debug dans le UIManager
    if (Config.debug && window.UIManager) {
        UIManager.updateDebugInfo({
            zoneId: currentZone.id,
            zoneName: currentZone.name,
            zoom: camera.zoom,
            camX: camera.x,
            camY: camera.y,
            worldX: mouse.x,
            worldY: mouse.y,
            mousePressed: mouseIsPressed,
            mouseY: mouseY
        });
    }
}

function mousePressed() {
    // Définir le flag pour ignorer le delta du premier frame
    if (InputManager) {
        InputManager.ignoreNextDelta = true;
    }
    // Laisser p5.js gérer le reste
}

// Logique de clic du monde (extraite pour être réutilisée)
function handleWorldClick() {
    // Ne pas traiter le clic si une modale est ouverte
    if (UIManager && UIManager.isAnyModalOpen()) {
        InputManager.hasMoved = false; // Réinitialiser
        return;
    }
    // Ignorer le clic si on clique sur la barre du HUD
    if (mouseY < 60) {
        InputManager.hasMoved = false; // Réinitialiser
        return;
    }
    
    // Si InputManager a détecté un mouvement significatif (drag), ignorer le clic
    if (InputManager.hasMoved) {
        console.log('Clic ignoré - c\'était un drag');
        InputManager.hasMoved = false; // Réinitialiser
        return;
    }
    
    console.log('Clic détecté !');
    
    // Réinitialiser le flag après utilisation
    InputManager.hasMoved = false;

    const worldX = mouse.x;
    const worldY = mouse.y;

    console.log(`Clic Monde: ${Math.round(worldX)}, ${Math.round(worldY)}`);

    // Vérifier si le clic est sur la grille de farming
    if (GridSystem) {
        const gridPos = GridSystem.worldToGrid(worldX, worldY);

        if (gridPos.valid) {
            console.log(`Clic Grille: (${gridPos.col}, ${gridPos.row})`);

            const tile = GridSystem.getTile(gridPos.col, gridPos.row);
            const tool = Inventory ? Inventory.getSelectedTool() : null;
            const seed = Inventory ? Inventory.getSelectedSeed() : null;

            let result;

            // Action selon l'état de la tuile et l'outil
            if (tile.state === GridSystem.STATES.EMPTY && seed && seed.qty > 0) {
                // Planter
                result = GridSystem.plant(gridPos.col, gridPos.row, seed.id);
                if (result.success && Inventory) {
                    Inventory.useSeed(seed.id);
                }
            } else if (tile.state === GridSystem.STATES.READY) {
                // Récolter
                result = GridSystem.harvest(gridPos.col, gridPos.row);
                if (result.success && result.item && Inventory) {
                    // Inventory.addLoot ajoute +2 à la récolte, donc on ajoute 1 ici pour le +2 total
                    Inventory.addLoot(result.item, 1); 
                }
            } else if (tool && tool.id === 'watering_can' &&
                (tile.state === GridSystem.STATES.PLANTED ||
                    tile.state === GridSystem.STATES.GROWING)) {
                // Arroser
                result = GridSystem.water(gridPos.col, gridPos.row);
            }

            if (result) {
                console.log(result.message);
            }
        }
    }
}

function mouseClicked() {
    // Sur desktop, p5.js appelle mouseClicked après un clic simple
    handleWorldClick();
}

function mouseWheel(event) {
    if (mouseY < 60) return true;

    let zoomAmount = event.delta * Config.zoom.sensitivity;
    camera.zoom -= zoomAmount;

    camera.zoom = constrain(camera.zoom, Config.zoom.min, Config.zoom.max);
}

// Fonctions touch pour mobile - SIMPLIFIÉES
function touchStarted() {
    if (touches.length === 1) {
        // Un seul doigt : enregistrer la position pour détecter tap vs drag
        InputManager.touchStartX = touches[0].x;
        InputManager.touchStartY = touches[0].y;
        InputManager.touchStartTime = millis();
        InputManager.hasMoved = false;
        
        // Définir le flag pour ignorer le delta du premier frame
        if (InputManager) {
            InputManager.ignoreNextDelta = true;
        }
    }
    // Retourner true permet à p5.js de convertir le touch en mouseClicked
    return true;
}

function touchMoved() {
    if (touches.length === 1 && InputManager.touchStartX !== null) {
        // Mettre à jour hasMoved si le mouvement dépasse le seuil
        const deltaX = Math.abs(touches[0].x - InputManager.touchStartX);
        const deltaY = Math.abs(touches[0].y - InputManager.touchStartY);
        
        if (deltaX > InputManager.DRAG_THRESHOLD || deltaY > InputManager.DRAG_THRESHOLD) {
            InputManager.hasMoved = true; // C'est un drag
        }
    }
    return false; // Empêche le scroll
}

function touchEnded() {
    console.log('touchEnded - hasMoved:', InputManager.hasMoved);
    
    // Si aucun mouvement significatif n'a eu lieu, forcer l'exécution de la logique de clic
    if (!InputManager.hasMoved) {
        // Nous devons simuler le clic ici car p5.js peut ne pas appeler mouseClicked
        // si touchMoved a été appelé, même pour un mouvement minime.
        handleWorldClick();
    }
    
    // Réinitialiser les positions de départ
    InputManager.touchStartTime = null;
    InputManager.touchStartX = null;
    InputManager.touchStartY = null;
    
    // Laisser p5.js gérer le reste (qui peut appeler mouseClicked si le mouvement était minime)
    // Mais notre garde dans handleWorldClick empêchera la double exécution.
    return true;
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