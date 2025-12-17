let snake;
let scl = 20;
let nFood = 25;
let foodGroup;
let tailGroup;
let score = 0;

// --- Fonctions utilitaires ---

function createFood() {
    // Crée un sprite de nourriture à une position aléatoire sur la grille
    let x = floor(random(width) / scl) * scl;
    let y = floor(random(height) / scl) * scl;
    
    let f = new Sprite(x, y, scl, scl, 'static');
    f.color = color(255, 0, 100);
    f.layer = 0; // Rendu sous le serpent
    foodGroup.add(f);
}

function resetGame() {
    // Nettoyage des sprites existants
    allSprites.clear();
    
    // Initialisation des groupes
    foodGroup = new Group();
    tailGroup = new Group();
    
    // Création du serpent (tête)
    snake = new Sprite(
        parseInt((width / 2) / scl) * scl, 
        parseInt((height / 2) / scl) * scl, 
        scl, scl, 
        'dynamic'
    );
    snake.color = color(255);
    snake.layer = 1;
    snake.vel.set(scl, 0); // Démarre vers la droite
    snake.maxSpeed = scl;
    snake.friction = 0;
    snake.bounciness = 0;
    snake.rotationLock = true;
    
    // Création de la nourriture
    for (let i = 0; i < nFood; i++) {
        createFood();
    }
    
    score = 0;
}

// --- Callbacks de P5Play ---

q5.setup = () => {
    new Canvas(windowWidth, windowHeight, 'p2d'); // Force le moteur de rendu 2D
    frameRate(10);
    
    // Configuration du monde
    World.gravity.y = 0;
    
    // Définition des états de jeu
    states.add('menu', {
        start: () => {
            // Notifie le wrapper que le jeu est prêt
            if (window.GameSystem) {
                window.GameSystem.Lifecycle.notifyReady();
            }
        },
        draw: drawMenu,
        update: updateMenu
    });
    
    states.add('game', {
        start: resetGame,
        update: updateGame,
        draw: drawGame
    });
    
    states.add('gameover', {
        // Soumission du score au GameSystem dès l'entrée dans l'état Game Over
        start: (finalScore) => {
            if (window.GameSystem) {
                window.GameSystem.Score.submit(finalScore);
            }
        },
        draw: drawGameOver,
        update: updateGameOver
    });
    
    states.enable = true;
    states.load('menu');
};

q5.draw = () => {
    clear();
    allSprites.draw();
    
    // Affichage du score en mode jeu
    if (states.current.name === 'game') {
        drawScore();
    }
};

// --- Logique des États ---

function drawMenu() {
    textAlign(CENTER, CENTER);
    textSize(40);
    fill(255);
    text('SNAKE P5PLAY', width / 2, height / 2 - 50);
    textSize(20);
    text('Appuyez sur ESPACE pour commencer', width / 2, height / 2 + 20);
}

function updateMenu() {
    if (q5.keyIsDown('space')) {
        states.load('game');
    }
}

function updateGame() {
    // 1. Mouvement de la queue (doit se faire avant la mise à jour de la tête)
    if (tailGroup.length > 0) {
        // Déplace chaque segment de queue vers la position du segment précédent
        for (let i = tailGroup.length - 1; i > 0; i--) {
            tailGroup[i].pos.set(tailGroup[i - 1].pos.x, tailGroup[i - 1].pos.y);
        }
        // Le premier segment suit la tête
        tailGroup[0].pos.set(snake.oldPos.x, snake.oldPos.y);
    }
    
    // 2. Vérification des collisions
    
    // Collision Tête vs Nourriture
    snake.overlaps(foodGroup, (snake, food) => {
        food.remove();
        score += 100;
        
        // Ajout d'un segment de queue
        let newSegment = new Sprite(snake.oldPos.x, snake.oldPos.y, scl, scl, 'static');
        newSegment.color = color(255);
        newSegment.layer = 1;
        tailGroup.add(newSegment);
        
        createFood(); // Nouvelle nourriture
    });
    
    // Collision Tête vs Queue (Mort)
    snake.overlaps(tailGroup, () => {
        states.load('gameover', score);
    });
    
    // Collision Tête vs Bords (Wrap around)
    snake.wrap();
}

function drawGame() {
    // Le rendu est géré par q5.draw() -> allSprites.draw()
}

function drawScore() {
    textSize(24);
    fill(255);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 20, 20);
}

function drawGameOver() {
    textAlign(CENTER, CENTER);
    textSize(50);
    fill(255, 0, 0);
    text('GAME OVER', width / 2, height / 2 - 80);
    textSize(30);
    fill(255);
    // states.gameover.props.args[0] contient le score passé lors du states.load('gameover', score)
    text(`Score Final: ${states.gameover.props.args[0]}`, width / 2, height / 2);
    textSize(20);
    text('Appuyez sur R pour rejouer', width / 2, height / 2 + 50);
}

function updateGameOver() {
    if (q5.keyIsDown('r')) {
        states.load('game');
    }
}

// --- Gestion des Inputs ---

q5.keyPress = () => {
    if (states.current.name !== 'game') return;

    // Empêche de faire demi-tour instantanément
    if (q5.key === 'up' && snake.vel.y !== scl) {
        snake.vel.set(0, -scl);
    } else if (q5.key === 'down' && snake.vel.y !== -scl) {
        snake.vel.set(0, scl);
    } else if (q5.key === 'left' && snake.vel.x !== scl) {
        snake.vel.set(-scl, 0);
    } else if (q5.key === 'right' && snake.vel.x !== -scl) {
        snake.vel.set(scl, 0);
    }
}