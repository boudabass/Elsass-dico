let playerX, playerY;
const playerSize = 40;
const playerSpeed = 5;

let asteroids = [];
let score = 0;
let gameState = "playing";

function setup() {
    createCanvas(800, 600);
    noStroke();
    resetGame();
}

function resetGame() {
    playerX = width / 2;
    playerY = height - 50;
    asteroids = [];
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

function spawnAsteroid() {
    const size = random(20, 50);
    const speed = random(1, 4);
    
    asteroids.push({
        x: random(size, width - size),
        y: -size,
        vx: random(-1, 1), // Mouvement horizontal léger
        vy: speed,
        size: size
    });
}

function updateAsteroids() {
    // Spawn continu (environ toutes les 60 frames = 1 seconde)
    if (frameCount % 60 === 0) {
        spawnAsteroid();
    }
    
    // Mise à jour de la position et suppression des astéroïdes hors écran
    for (let i = asteroids.length - 1; i >= 0; i--) {
        let a = asteroids[i];
        a.x += a.vx;
        a.y += a.vy;
        
        // Suppression si hors écran
        if (a.y > height + a.size) {
            asteroids.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Collision Joueur vs Astéroïdes
    for (let a of asteroids) {
        const d = dist(playerX, playerY, a.x, a.y);
        if (d < playerSize / 2 + a.size / 2) {
            gameState = "gameOver";
            break;
        }
    }
}

function drawPlayer() {
    fill(0, 100, 255);
    ellipse(playerX, playerY, playerSize);
}

function drawAsteroids() {
    fill(150); // Gris
    for (let a of asteroids) {
        ellipse(a.x, a.y, a.size);
    }
}

function drawUI() {
    score = floor(frameCount / 60);
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Score: " + score + " | Astéroïdes: " + asteroids.length, 20, 20);
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
        updatePlayer();
        updateAsteroids();
        checkCollisions();
        
        drawAsteroids();
        drawPlayer();
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