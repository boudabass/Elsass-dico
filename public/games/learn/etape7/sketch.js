let player;
let platforms;
let floor;
let maxHeightScore = 0; // Score basé sur la hauteur maximale atteinte

function setup() {
    createCanvas(800, 600);
    
    world.gravity.y = 25;
    
    player = new Sprite(100, 500, 30, 30);
    player.color = 'blue';
    player.collider = 'dynamic';
    player.rotationLock = true; 
    player.bounciness = 0;
    player.friction = 0;

    platforms = new Group();
    platforms.collider = 'static';
    platforms.color = 'green';
    
    floor = new platforms.Sprite(400, 580, 800, 40);
    floor.color = 'gray';
    
    for(let i = 0; i < 10; i++) {
        let w = random(80, 150);
        let x = random(100, 700);
        let y = 500 - (i * 55 + 50);
        new platforms.Sprite(x, y, w, 20);
    }
    
    // Initialiser le score max à la position de départ
    maxHeightScore = height - player.y;
}

function draw() {
    background(50);
    
    let isGrounded = player.colliding(platforms);

    // --- MISE À JOUR DU SCORE ---
    // Plus la position Y est petite (plus on est haut), plus le score est grand.
    // On inverse la valeur Y (height - player.y) pour que le score augmente en montant.
    let currentScore = floor(height - player.y);
    if (currentScore > maxHeightScore) {
        maxHeightScore = currentScore;
    }
    
    // --- INPUTS ---
    let targetSpeed = 0;
    
    if (kb.pressing('left')) targetSpeed = -4;
    if (kb.pressing('right')) targetSpeed = 4;

    // --- PHYSIQUE DE DÉPLACEMENT ---
    if (isGrounded) {
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.2);
        
        if (kb.presses('space') || kb.presses('up')) {
            player.vel.y = -12;
        }
    } else {
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.05);
    }
    
    // --- RESPAWN ---
    if (player.y > height + 50) {
        resetPlayer();
    }
    
    allSprites.draw();
    
    // --- AFFICHAGE DU SCORE ---
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Hauteur Max: " + maxHeightScore, 20, 20);
}

function resetPlayer() {
    player.pos = {x: 100, y: 500};
    player.vel = {x: 0, y: 0};
}