let playerX;
let playerY;
const playerSize = 40;
const playerSpeed = 5;

function setup() {
    createCanvas(800, 600);
    noStroke();
    
    // Position initiale du joueur au centre
    playerX = width / 2;
    playerY = height / 2;
}

function draw() {
    background(50); // Fond gris foncé

    // --- Logique de mouvement (Clavier) ---
    // Gauche : LEFT_ARROW (37) ou A (65) ou Q (81)
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || keyIsDown(81)) { 
        playerX -= playerSpeed;
    }
    // Droite : RIGHT_ARROW (39) ou D (68)
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { 
        playerX += playerSpeed;
    }
    // Haut : UP_ARROW (38) ou W (87) ou Z (90)
    if (keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(90)) { 
        playerY -= playerSpeed;
    }
    // Bas : DOWN_ARROW (40) ou S (83)
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { 
        playerY += playerSpeed;
    }
    
    // Limites de l'écran
    playerX = constrain(playerX, playerSize / 2, width - playerSize / 2);
    playerY = constrain(playerY, playerSize / 2, height - playerSize / 2);
    // --------------------------------------

    // Affichage du joueur (cercle bleu)
    fill(0, 100, 255);
    ellipse(playerX, playerY, playerSize);
}