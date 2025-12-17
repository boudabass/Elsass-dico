let player;
let platforms;
let enemies;
let coins;

let score = 0;
let lives = 3;

const PLATFORM_COLOR = 'gray';
const PLAYER_COLOR = 'blue';
const ENEMY_COLOR = 'red';
const COIN_COLOR = 'gold';

function setup() {
    createCanvas(800, 600);
    world.gravity.y = 25;
    
    // Initialisation des groupes
    platforms = new Group();
    platforms.collider = 'static';
    platforms.color = PLATFORM_COLOR;
    
    enemies = new Group();
    enemies.collider = 'dynamic';
    enemies.color = ENEMY_COLOR;
    enemies.rotationLock = true;
    
    coins = new Group();
    coins.collider = 'none'; 
    coins.color = COIN_COLOR;
    
    // Création du sol et d'une plateforme
    new platforms.Sprite(400, 580, 800, 40);
    new platforms.Sprite(600, 450, 200, 20);
    new platforms.Sprite(200, 350, 200, 20); // Ajout d'une plateforme pour tester
    
    // Création du joueur
    player = new Sprite(100, 500, 30, 30);
    player.color = PLAYER_COLOR;
    player.collider = 'dynamic';
    player.rotationLock = true; 
    player.bounciness = 0;
    player.friction = 0;
    
    if(window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    background(50);
    
    // --- 1. JOUEUR ---
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
    
    if (player.y > height + 50) handlePlayerDeath();
    
    // --- 2. SPAWN ---
    if (frameCount % 120 === 0) spawnEnemy();
    if (frameCount % 90 === 0) spawnCoin();
    
    // --- 3. PATROUILLE ENNEMIS (Méthode Robuste) ---
    enemies.collide(platforms);
    
    for (let enemy of enemies) {
        // Direction du regard (1 ou -1)
        let dir = Math.sign(enemy.vel.x) || 1;
        
        // Point à tester : devant l'ennemi et un peu vers le bas (dans le sol)
        let scanX = enemy.x + dir * (enemy.w/2 + 5); 
        let scanY = enemy.y + enemy.h/2 + 5; 
        
        // Si PAS de sol devant -> Demi-tour
        if (!isPointOnPlatform(scanX, scanY)) {
            enemy.vel.x *= -1;
            enemy.x += enemy.vel.x * 2; // Petit saut pour éviter de rester coincé
        }
    }
    
    // --- 4. INTERACTIONS ---
    player.overlaps(coins, collectCoin);
    player.collides(enemies, hitEnemy);
    
    // --- 5. RENDU ---
    allSprites.draw();
    drawUI();
}

// Fonction utilitaire manuelle (ne dépend pas de l'API p5play complexe)
function isPointOnPlatform(x, y) {
    for (let p of platforms) {
        // Vérification rectangle simple (AABB)
        if (x > p.x - p.w/2 && x < p.x + p.w/2 &&
            y > p.y - p.h/2 && y < p.y + p.h/2) {
            return true;
        }
    }
    return false;
}

function resetPlayer() {
    player.pos = {x: 100, y: 500};
    player.vel = {x: 0, y: 0};
}

function handlePlayerDeath() {
    lives--;
    if (lives <= 0) {
        lives = 3;
        score = 0;
        enemies.removeAll();
        coins.removeAll();
    }
    resetPlayer();
}

function collectCoin(player, coin) {
    score += 10;
    coin.remove();
}

function hitEnemy(player, enemy) {
    enemy.remove();
    handlePlayerDeath();
}

function spawnEnemy() {
    // Spawn uniquement au-dessus des plateformes pour éviter la chute immédiate
    let targetPlatform = random(platforms);
    let x = targetPlatform.x;
    let y = targetPlatform.y - 40; // Au dessus
    
    let enemy = new enemies.Sprite(x, y, 25, 25);
    enemy.vel.x = random([-2, 2]); 
    enemy.friction = 0;
    enemy.bounciness = 0;
    enemy.rotationLock = true;
}

function spawnCoin() {
    let x = random(50, width - 50);
    let y = random(50, height - 100);
    let coin = new coins.Sprite(x, y, 15, 15);
    coin.shape = 'circle';
}

function drawUI() {
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 20, 20);
    text(`Vies: ${lives}`, 20, 50);
}