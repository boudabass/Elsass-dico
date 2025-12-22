// Logique de clic du monde (accepte les coordonnées écran directement)
function handleWorldClick(screenX, screenY) {
    // Ne pas traiter le clic si une modale est ouverte
    if (UIManager && UIManager.isAnyModalOpen()) {
        return;
    }
    
    if (GameState.currentState !== GameState.GAME_STATE.PLAYING) {
        console.log("Jeu non actif.");
        return;
    }

    // Conversion des coordonnées écran en coordonnées monde (ici, monde = écran car pas de caméra)
    const worldX = screenX;
    const worldY = screenY;
    
    if (GridSystem) {
        const gridPos = GridSystem.worldToGrid(worldX, worldY);

        if (gridPos.valid) {
            const tile = GridSystem.getTile(gridPos.col, gridPos.row);
            
            if (!tile) return;

            // --- LOGIQUE DE SÉLECTION (Clic 1) ---
            if (!GameState.selectedTile) {
                if (tile.itemId) {
                    // Sélectionner l'item
                    GameState.selectedTile = { col: gridPos.col, row: gridPos.row, itemId: tile.itemId };
                    tile.state = 'SELECTED';
                    console.log(`Clic 1: Sélectionné ${tile.itemId} à (${gridPos.col}, ${gridPos.row})`);
                }
            } 
            // --- LOGIQUE DE DÉPLACEMENT (Clic 2) ---
            else {
                const selected = GameState.selectedTile;
                const previousTile = GridSystem.getTile(selected.col, selected.row);
                
                // Clic sur la même tuile sélectionnée -> Désélection
                if (selected.col === gridPos.col && selected.row === gridPos.row) {
                    previousTile.state = 'NORMAL';
                    GameState.selectedTile = null;
                    console.log("Désélectionné.");
                    return;
                }
                
                // Clic sur une case libre -> Déplacement
                if (!tile.itemId) {
                    if (GameState.spendEnergy(1)) {
                        GridSystem.moveItem(selected.col, selected.row, gridPos.col, gridPos.row);
                        
                        // Réinitialiser la sélection
                        if (previousTile) previousTile.state = 'NORMAL';
                        GameState.selectedTile = null;
                        
                        if (window.refreshHUD) refreshHUD();
                    } else {
                        console.warn("Pas assez d'énergie pour bouger.");
                    }
                } else {
                    // Clic sur une autre tuile occupée -> Nouvelle sélection
                    if (previousTile) previousTile.state = 'NORMAL';
                    GameState.selectedTile = { col: gridPos.col, row: gridPos.row, itemId: tile.itemId };
                    tile.state = 'SELECTED';
                    console.log(`Clic 2: Nouvelle sélection ${tile.itemId}`);
                }
            }
        }
    }
}

function setup() {
    const p5Canvas = createCanvas(windowWidth, windowHeight);
    
    // Pas de gravité ni de sprites dans ce jeu
    world.gravity.y = 0;
    if (typeof allSprites === 'undefined') {
        allSprites = new Group();
    }

    // Initialisation de la grille (déjà fait dans main.js, mais on s'assure que les dimensions sont prêtes)
    if (window.GridSystem) {
        GridSystem.rows = Config.grid.rows;
        GridSystem.cols = Config.grid.cols;
    }

    // --- GESTION DES INPUTS UNIFIÉE (DOM) ---
    const canvasElement = p5Canvas.elt;

    const getCoords = (e) => {
        const rect = canvasElement.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleStart = (e) => {
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        // Ignorer si clic sur HUD (hauteur 60px)
        if (y < 60) return; 
        
        InputManager.startDrag(x, y);
    };

    const handleMove = (e) => {
        e.preventDefault();
        const { x, y } = getCoords(e);
        
        if (InputManager.isDragging) {
            InputManager.moveDrag(x, y); // Pas de caméra à bouger
        }
    };

    const handleEnd = (e) => {
        if (InputManager.isDragging) {
            const wasClick = InputManager.endDrag();
            
            if (wasClick) {
                const screenX = InputManager.dragStartX; // Utiliser le point de départ pour le clic
                const screenY = InputManager.dragStartY;
                
                handleWorldClick(screenX, screenY);
            }
        }
    };

    // Écouteurs
    canvasElement.addEventListener('mousedown', handleStart);
    canvasElement.addEventListener('touchstart', handleStart, { passive: false });

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });

    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    
    // Arrêter la boucle de jeu au démarrage. Elle sera relancée par LoadingManager.finishLoading()
    if (typeof noLoop === 'function') noLoop();
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
    // Log de vérification de l'exécution de la boucle
    // console.log("Draw loop running. State:", GameState.currentState); 
    
    background(Config.colors.background);

    // 1. Mise à jour de la logique de jeu
    if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
        // Le ChronoManager gère le temps
    } else if (GameState.currentState === GameState.GAME_STATE.GAMEOVER) {
        // Afficher le modal Game Over
        UIManager.showGameOver();
        noLoop(); // Arrêter la boucle
    }

    // 2. Rendu de la grille
    if (window.GridSystem) {
        GridSystem.draw();
    }

    // 3. Mise à jour des infos de debug
    if (Config.debug && window.UIManager) {
        UIManager.updateDebugInfo({
            screenX: mouseX,
            screenY: mouseY
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

// Gestion du temps réel (appelé par p5.js)
window.lastTimeTick = 0;
function keyPressed() {
    if (key === 'p' || key === 'P') {
        UIManager.toggleMenu();
    }
}

// Fonction de tick du chrono (appelée par p5.js)
function timeTick() {
    if (GameState.currentState === GameState.GAME_STATE.PLAYING && window.ChronoManager) {
        ChronoManager.tick();
    }
}

// Utiliser setInterval pour le tick du chrono (plus fiable que draw loop pour le temps)
setInterval(timeTick, 1000);