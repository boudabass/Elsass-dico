let playerX, playerY;
const playerSize = 40;
const playerSpeed = 5;

let enemyX, enemyY;
const enemySize = 30;
const enemySpeed = 2;

let score = 0;
let gameState = "playing";

function setup() {
    createCanvas(800, 600);
    noStroke();
    resetGame();
}

function resetGame() {
    // Initialisation du joueur en bas au centre
    playerX = width / 2;
    playerY = height - 50;
    
    // Initialisation de l'ennemi en haut
    enemyX = random(enemySize, width - enemySize);
    enemyY = -enemySize;
    
    score = 0;
    frameCount = 0;
    gameState = "playing";
}

function updatePlayer() {
    // Mouvement Clavier (Gauche/Droite)
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || keyIsDown(81)) { 
        playerX -= playerSpeed;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { 
        playerX += playerSpeed;
    }
    playerX = constrain(playerX, playerSize / 2, width - playerSize / 2);
}

function updateEnemy() {
    // L'ennemi descend
    enemyY += enemySpeed;
    
    // Si l'ennemi sort par le bas, il réapparaît en haut
    if (enemyY > height + enemySize) {
        enemyX = random(enemySize, width - enemySize);
        enemyY = -enemySize;
    }
}

function checkCollisions() {
    // Collision Joueur vs Ennemi (distance entre les centres)
    const d = dist(playerX, playerY, enemyX, enemyY);
    if (d < playerSize / 2 + enemySize / 2) {
        gameState = "gameOver";
    }
}

function drawPlayer() {
    fill(0, 100, 255);
    ellipse(playerX, playerY, playerSize);
}

function drawEnemy() {
    fill(255, 0, 0);
    ellipse(enemyX, enemyY, enemySize);
}

function drawUI() {
    score = floor(frameCount / 60);
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Score: " + score, 20, 20);
}

function drawGameOver() {
    fill(255, 0, 0);
    textSize(60);
    textAlign(CENTER, CENTER);
    text("PERDU!", width / 2, height / 2 - 40);
    
    fill(255);
    textSize(30);
    text("Score Final: " + score, width / 2, height / 2 + 20);
    textSize(20);
    text("Appuyez sur R pour recommencer", width / 2, height / 2 + 60);
}

function draw() {
    background(50); 

    if (gameState === "playing") {
        // 1. Logique (Update)
        updatePlayer();
        updateEnemy();
        
        // 2. Vérification (Check)
        checkCollisions();
        
        // 3. Affichage (Draw)
        drawPlayer();
        drawEnemy();
        drawUI();
    } else if (gameState === "gameOver") {
        drawGameOver();
    }
}

function keyPressed() {
    if (key === 'r' || key === 'R') {
        if (gameState === "gameOver") {
            resetGame();
        }
    }
}