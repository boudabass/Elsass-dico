let playerX;
let playerY;
const playerSize = 40;
const playerSpeed = 5;

let targetX;
let targetY;
const targetSize = 20;
let score = 0;

// Variables pour le mouvement par clic/toucher
let targetMoveX = null;
let targetMoveY = null;
const trackingSpeed = 0.1; // Vitesse de suivi (pour un mouvement fluide)

function setup() {
    createCanvas(800, 600);
    noStroke();
    
    // Position initiale du joueur au centre
    playerX = width / 2;
    playerY = height / 2;
    
    respawnTarget();
}

function respawnTarget() {
    // Position aléatoire pour la cible, en évitant les bords
    targetX = random(targetSize, width - targetSize);
    targetY = random(targetSize, height - targetSize);
}

function draw() {
    background(50); // Fond gris foncé

    // --- Logique de mouvement (Clavier) ---
    // Si une touche clavier est pressée, on annule le mouvement par clic
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || keyIsDown(81) || 
        keyIsDown(RIGHT_ARROW) || keyIsDown(68) || 
        keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(90) || 
        keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
        
        targetMoveX = null;
        targetMoveY = null;
        
        // Mouvement Clavier
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65) || keyIsDown(81)) { 
            playerX -= playerSpeed;
        }
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { 
            playerX += playerSpeed;
        }
        if (keyIsDown(UP_ARROW) || keyIsDown(87) || keyIsDown(90)) { 
            playerY -= playerSpeed;
        }
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { 
            playerY += playerSpeed;
        }
    } 
    // --- Logique de mouvement (Clic/Toucher) ---
    else if (targetMoveX !== null) {
        // Mouvement fluide vers la cible cliquée
        playerX = lerp(playerX, targetMoveX, trackingSpeed);
        playerY = lerp(playerY, targetMoveY, trackingSpeed);
        
        // Si le joueur est proche de la cible de mouvement, on arrête
        if (dist(playerX, playerY, targetMoveX, targetMoveY) < 5) {
            targetMoveX = null;
            targetMoveY = null;
        }
    }
    
    // Limites de l'écran
    playerX = constrain(playerX, playerSize / 2, width - playerSize / 2);
    playerY = constrain(playerY, playerSize / 2, height - playerSize / 2);
    // --------------------------------------

    // --- Affichage du joueur (cercle bleu) ---
    fill(0, 100, 255);
    ellipse(playerX, playerY, playerSize);
    
    // --- Affichage de la cible (cercle jaune) ---
    fill(255, 200, 0);
    ellipse(targetX, targetY, targetSize);
    
    // --- Affichage du score ---
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Score: " + score, 20, 20);
}

function checkCollection(px, py) {
    // Vérifie si la position donnée (px, py) est proche de la cible
    const d = dist(px, py, targetX, targetY);
    
    // Si la distance est inférieure à la somme des rayons (collision)
    if (d < playerSize / 2 + targetSize / 2) {
        score++;
        respawnTarget();
        return true;
    }
    return false;
}

function mousePressed() {
    // 1. Tenter de collecter la cible à la position du clic
    const collected = checkCollection(mouseX, mouseY);
    
    // 2. Si la cible n'a pas été collectée, définir le point cliqué comme nouvelle destination de mouvement
    if (!collected) {
        targetMoveX = mouseX;
        targetMoveY = mouseY;
    }
}

function keyPressed() {
    // 2. Espace = collision + score++
    if (key === ' ') {
        checkCollection(playerX, playerY);
    }
}