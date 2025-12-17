let x;
let y;
let speedX;
let speedY;
const size = 50;

function setup() {
    createCanvas(800, 600);
    noStroke();
    
    // Initialisation des variables
    x = width / 2;
    y = height / 2;
    speedX = 3;
    speedY = 2;
}

function draw() {
    background(50); // Rafraîchissement du fond

    // 1. Mise à jour de la position
    x += speedX;
    y += speedY;

    // 2. Détection et rebond des bords
    if (x > width - size / 2 || x < size / 2) {
        speedX *= -1;
    }
    if (y > height - size / 2 || y < size / 2) {
        speedY *= -1;
    }

    // 3. Affichage du carré
    fill(255, 100, 0); // Orange
    rectMode(CENTER);
    rect(x, y, size, size);
}