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

// Logique de clic du monde (accepte les coordonnées monde directement)
function handleWorldClick(worldX, worldY) {
    // Ne pas traiter le clic si une modale est ouverte
    if (UIManager && UIManager.isAnyModalOpen()) {
        return;
    }
    
    console.log('Clic Monde détecté !');
    
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

function setup() {
    new Canvas(windowWidth, windowHeight);

    world.gravity.y = 0;

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

    if (window.QuickAction && QuickAction.refresh) {
        QuickAction.refresh();
    }
    
    // --- GESTION DES INPUTS UNIFIÉE (DOM) ---
    const canvasElement = canvas.elt;

    // Fonction utilitaire pour obtenir les coordonnées (souris ou touch)
    const getCoords = (e) => {
        const rect = canvasElement.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // 1. DÉBUT (mousedown/touchstart)
    const handleStart = (e) => {
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        // Ignorer si clic sur HUD
        if (y < 60) return; 
        
        InputManager.startDrag(x, y);
    };

    // 2. MOUVEMENT (mousemove/touchmove)
    const handleMove = (e) => {
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        if (InputManager.isDragging) {
            InputManager.moveDrag(x, y, camera);
        }
    };

    // 3. FIN (mouseup/touchend)
    const handleEnd = (e) => {
        // e.preventDefault(); // Ne pas bloquer ici pour laisser les événements DOM se propager si besoin
        
        if (InputManager.isDragging) {
            const wasClick = InputManager.endDrag();
            
            if (wasClick) {
                // Si c'était un clic pur, nous utilisons les coordonnées de fin (lastX/Y)
                const screenX = InputManager.lastX;
                const screenY = InputManager.lastY;
                
                // Conversion manuelle des coordonnées écran en coordonnées monde
                const worldX = camera.x + (screenX - width / 2) / camera.zoom;
                const worldY = camera.y + (screenY - height / 2) / camera.zoom;
                
                handleWorldClick(worldX, worldY);
            }
        }
    };

    // Écouteurs
    canvasElement.addEventListener('mousedown', handleStart);
    canvasElement.addEventListener('touchstart', handleStart, { passive: false });

    canvasElement.addEventListener('mousemove', handleMove);
    canvasElement.addEventListener('touchmove', handleMove, { passive: false });

    canvasElement.addEventListener('mouseup', handleEnd);
    canvasElement.addEventListener('touchend', handleEnd);
    
    // Gestion du zoom (inchangé)
    canvasElement.addEventListener('wheel', (e) => {
        if (e.clientY < 60) return true;
        e.preventDefault();
        let zoomAmount = e.deltaY * Config.zoom.sensitivity;
        camera.zoom -= zoomAmount;
        camera.zoom = constrain(camera.zoom, Config.zoom.min, Config.zoom.max);
    }, { passive: false });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (typeof redraw === 'function') {
        redraw();
    }
}

window.redraw = function() {
    if (typeof redraw === 'function') {
        redraw();
    }
};

function draw() {
    const currentZone = getCurrentZone();

    background(currentZone.bgColor);

    camera.on();

    noFill();
    stroke(0);
    strokeWeight(2);
    rect(0, 0, Config.zoneWidth, Config.zoneHeight);

    if (Config.debug && Config.showGrid) {
        drawSimpleGrid();
    }

    if (GridSystem && (GameState.currentZoneId === 'C_C' ||
        GameState.currentZoneId.includes('N') ||
        GameState.currentZoneId.includes('S'))) {
        GridSystem.draw();
    }

    allSprites.draw();
    camera.off();

    // Contrainte de la caméra (appelée à chaque frame)
    InputManager.constrainCamera(camera, width, height);

    // Mise à jour automatique du temps (Game Loop)
    if (window.TimeManager) {
        if (typeof window.lastTimeCheck === 'undefined') {
            window.lastTimeCheck = millis();
        }

        if (millis() - window.lastTimeCheck >= 1000) {
            window.lastTimeCheck = millis();
            TimeManager.advanceMinutes(TimeManager.MINUTES_PER_REAL_SECOND);
        }
    }

    // Mise à jour des infos de debug
    if (Config.debug && window.UIManager) {
        UIManager.updateDebugInfo({
            zoneId: currentZone.id,
            zoneName: currentZone.name,
            zoom: camera.zoom,
            camX: camera.x,
            camY: camera.y,
            worldX: mouse.x,
            worldY: mouse.y,
            mousePressed: InputManager.isDragging, // Utiliser l'état du manager
            mouseY: mouseY
        });
    }
}

// Fonctions p5.js inutilisées après refactor (laisser vides pour éviter les avertissements)
function mouseClicked() {}
function mousePressed() {}
function mouseReleased() {}
function touchStarted() {}
function touchMoved() { return false; }
function touchEnded() {}

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