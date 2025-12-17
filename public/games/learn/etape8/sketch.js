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
    coins.collider = 'none'; // Les pièces sont des capteurs, pas des objets physiques
    coins.color = COIN_COLOR;
    
    // Création du sol et d'une plateforme
    new platforms.Sprite(400, 580, 800, 40);
    new platforms.Sprite(600, 450, 200, 20);
    
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
    
    // --- Logique de jeu ---
    
    // 1. Mouvement du joueur (copié de l'étape 7)
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
    
    // Respawn si chute
    if (player.y > height + 50) {
        handlePlayerDeath();
    }
    
    // 2. Spawning des entités
    if (frameCount % 120 === 0) {
        spawnEnemy();
    }
    if (frameCount % 90 === 0) {
        spawnCoin();
    }
    
    // 3. Collisions physiques (Ennemis vs Plateformes)
    enemies.collide(platforms);
    
    // 4. Logique de patrouille des ennemis (Phase 3)
    for (let enemy of enemies) {
        // Créer un point de test juste devant l'ennemi
        // On utilise une petite distance (10) pour tester si le sol continue
        let testX = enemy.x + enemy.vel.x * 10;
        let testY = enemy.y + enemy.h / 2 + 5; // 5 pixels sous les pieds
        
        // platforms.overlap(x, y) renvoie le sprite qui chevauche le point (x, y)
        // Si aucun sprite n'est trouvé, cela renvoie null/undefined (falsy)
        let isPlatformAhead = platforms.overlap(testX, testY);
        
        // Si le point devant l'ennemi n'est PAS sur une plateforme, ou si l'ennemi est bloqué (colliding(platforms, true) vérifie les collisions avec les bords)
        if (!isPlatformAhead || enemy.colliding(platforms, true)) {
            enemy.vel.x *= -1; // Inverse la direction
        }
    }
    
    // 5. Interactions (Callbacks)
    player.overlaps(coins, collectCoin);
    player.collides(enemies, hitEnemy);
    
    // 6. Rendu et UI
    allSprites.draw();
    drawUI();
}

function resetPlayer() {
    player.pos = {x: 100, y: 500};
    player.vel = {x: 0, y: 0};
}

function handlePlayerDeath() {
    lives--;
    if (lives <= 0) {
        // Game Over simplifié: on réinitialise tout
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
    let x = random(50, width - 50);
    let enemy = new enemies.Sprite(x, 0, 25, 25);
    enemy.vel.x = random([-1, 1]) * 2; // Vitesse de patrouille
    enemy.friction = 0;
    enemy.bounciness = 0;
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