let player;
let platforms;

// Dimensions du monde
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1200;

const PLATFORM_COLOR = 'gray';
const PLAYER_COLOR = 'blue';

// Variables de jeu
let score = 0;
let lives = 3;

function setup() {
    createCanvas(800, 600);
    world.gravity.y = 25;
    
    // Limites du monde
    allSprites.bounds = { 
        left: 0, 
        right: WORLD_WIDTH, 
        top: 0, 
        bottom: WORLD_HEIGHT 
    };
    
    platforms = new Group();
    platforms.collider = 'static';
    platforms.color = PLATFORM_COLOR;
    
    // --- SOL CONTINU ---
    new platforms.Sprite(WORLD_WIDTH / 2, WORLD_HEIGHT - 20, WORLD_WIDTH, 40);
    
    // Plateformes de test
    new platforms.Sprite(400, 500, 200, 20); 
    
    for(let i = 0; i < 15; i++) {
        let w = random(150, 300);
        let x = random(100, WORLD_WIDTH - 100);
        let y = random(200, WORLD_HEIGHT - 100);
        new platforms.Sprite(x, y, w, 20);
    }
    
    // --- JOUEUR ---
    player = new Sprite(400, 400, 30, 30);
    player.color = PLAYER_COLOR;
    player.collider = 'dynamic';
    player.rotationLock = true; 
    player.bounciness = 0;
    player.friction = 0;
    
    // --- CAMÉRA INITIALE ---
    camera.x = player.x;
    camera.y = player.y;
    camera.zoom = 1;
    
    if(window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    background(50);
    
    // 1. Mouvement
    let isGrounded = player.colliding(platforms);
    let targetSpeed = 0;
    if (kb.pressing('left')) targetSpeed = -5;
    if (kb.pressing('right')) targetSpeed = 5;

    if (isGrounded) {
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.2);
        if (kb.presses('space') || kb.presses('up')) {
            player.vel.y = -12;
        }
    } else {
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.05);
    }
    
    // 2. Caméra Follow
    let targetCamX = player.x;
    let targetCamY = player.y;
    
    let camMinX = width / 2;
    let camMaxX = WORLD_WIDTH - width / 2;
    let camMinY = height / 2;
    let camMaxY = WORLD_HEIGHT - height / 2;
    
    targetCamX = constrain(targetCamX, camMinX, camMaxX);
    targetCamY = constrain(targetCamY, camMinY, camMaxY);
    
    camera.x = lerp(camera.x, targetCamX, 0.1);
    camera.y = lerp(camera.y, targetCamY, 0.1);
    
    // 3. Rendu du Monde
    camera.on(); 
    allSprites.draw();
    camera.off(); 
    
    // 4. Rendu du HUD (Interface Fixe)
    drawHUD();
}

function drawHUD() {
    fill(0, 150); // Fond semi-transparent pour lisibilité
    noStroke();
    rect(100, 40, 180, 60, 10); // x, y, w, h, radius
    
    fill(255);
    textSize(20);
    textAlign(LEFT, CENTER);
    text(`Score: ${score}`, 30, 30);
    
    // Dessin des vies (coeurs simples)
    fill(255, 50, 50);
    for(let i = 0; i < lives; i++) {
        ellipse(30 + i * 25, 55, 15);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}