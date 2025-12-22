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
            
            // --- LOGIQUE POWER-UP (Priorité 1) ---
            if (GameState.activePowerUpIndex !== -1 && window.PowerUpManager) {
                PowerUpManager.useActivePowerUp(gridPos.col, gridPos.row);
                return;
            }

            // --- LOGIQUE DE SÉLECTION (Clic 1) ---
            if (!GameState.selectedTile) {
                if (tile.itemId) {
                    // Sélectionner l'item
                    GameState.selectedTile = { col: gridPos.col, row: gridPos.row, itemId: tile.itemId };
                    tile.state = 'SELECTED';
                    console.log(`Clic 1: Sélectionné ${tile.itemId} à (${gridPos.col}, ${gridPos.row})`);
                }
            } 
            // --- LOGIQUE DE DÉPLACEMENT/SWAP (Clic 2) ---
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
                
                // Vérification de l'énergie pour toute action de mouvement
                if (!GameState.spendEnergy(1)) {
                    console.warn("Pas assez d'énergie pour bouger.");
                    // Déclencher la fin de partie si l'énergie est à zéro
                    if (GameState.energy <= 0) {
                        GameState.currentState = GameState.GAME_STATE.GAMEOVER;
                        console.log("⚡ Énergie épuisée. Fin de partie.");
                    }
                    return;
                }
                
                let actionSuccess = false;
                let energySpent = true; // L'énergie est dépensée ici

                if (!tile.itemId) {
                    // Clic sur une case libre -> Déplacement (Snap libre)
                    actionSuccess = GridSystem.moveItem(selected.col, selected.row, gridPos.col, gridPos.row);
                    
                } else {
                    // Clic sur une case occupée -> Swap
                    actionSuccess = GridSystem.swapItems(selected.col, selected.row, gridPos.col, gridPos.row);
                }
                
                if (actionSuccess) {
                    // Réinitialiser la sélection après un mouvement réussi (swap ou move)
                    if (previousTile) previousTile.state = 'NORMAL';
                    GameState.selectedTile = null;
                    if (window.refreshHUD) refreshHUD();
                } else if (energySpent) {
                    // Si l'action a échoué (ne devrait pas arriver avec le swap permanent), on désélectionne
                    if (previousTile) previousTile.state = 'NORMAL';
                    GameState.selectedTile = null;
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
    background(Config.colors.background);

    // 1. Mise à jour de la logique de jeu
    if (GameState.currentState === GameState.GAME_STATE.PLAYING) {
        // Vérification de l'énergie à chaque frame (si elle est déjà à 0)
        if (GameState.energy <= 0 && GameState.chrono > 0) {
            // Si l'énergie est épuisée, on passe en Game Over
            GameState.currentState = GameState.GAME_STATE.GAMEOVER;
            console.log("⚡ Énergie épuisée. Fin de partie.");
        }
    }
    
    if (GameState.currentState === GameState.GAME_STATE.GAMEOVER) {
        // Afficher le modal Game Over
        UIManager.showGameOver();
        noLoop(); // Arrêter la boucle
    }

    // 2. Rendu de la grille
    if (window.GridSystem) {
        GridSystem.draw();
    }
    
    // 3. Rendu des animations (DOIT être après GridSystem.draw())
    if (window.AnimationSystem) {
        AnimationSystem.update();
        AnimationSystem.draw();
    }

    // 4. Mise à jour des infos de debug
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