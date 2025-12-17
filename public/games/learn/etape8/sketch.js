let player;
let platforms;
let enemies;
let coins;

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
    
    // Respawn
    if (player.y > height + 50) {
        resetPlayer();
    }
    
    // 2. Spawn des entités (Phase 1)
    if (frameCount % 120 === 0) {
        spawnEnemy();
    }
    if (frameCount % 90 === 0) {
        spawnCoin();
    }
    
    // 3. Collision ennemi vs plateforme (Phase 1)
    enemies.collide(platforms);
    
    // --- Rendu ---
    allSprites.draw();
}

function resetPlayer() {
    player.pos = {x: 100, y: 500};
    player.vel = {x: 0, y: 0};
}

function spawnEnemy() {
    // Apparaît en haut de l'écran, position x aléatoire
    let x = random(50, width - 50);
    let enemy = new enemies.Sprite(x, 0, 25, 25);
    enemy.vel.x = random([-1, 1]); // Mouvement horizontal initial
    enemy.friction = 0;
    enemy.bounciness = 0;
}

function spawnCoin() {
    // Apparaît à une position aléatoire
    let x = random(50, width - 50);
    let y = random(50, height - 100);
    let coin = new coins.Sprite(x, y, 15, 15);
    coin.shape = 'circle';
}