let player;
let platforms;

function setup() {
    createCanvas(800, 600);
    
    // Gravité forte pour un jeu réactif
    world.gravity.y = 25;
    
    // --- GROUPE STATIQUE (SOL & PLATEFORMES) ---
    platforms = new Group();
    platforms.collider = 'static';
    platforms.color = 'green';
    
    // Création des plateformes via le groupe pour garantir qu'elles sont statiques
    let floor = new platforms.Sprite(400, 580, 800, 40);
    floor.color = 'gray';
    
    new platforms.Sprite(200, 450, 200, 20);
    new platforms.Sprite(600, 300, 200, 20);
    new platforms.Sprite(300, 150, 150, 20);
    
    // --- JOUEUR (Dynamique) ---
    player = new Sprite(400, 300, 30, 30);
    player.color = 'blue';
    player.collider = 'dynamic';
    player.rotationLock = true; 
    player.bounciness = 0;
    player.friction = 0; // On gère l'inertie manuellement
}

function draw() {
    background(50);
    
    let isGrounded = player.colliding(platforms);

    // --- INPUTS ---
    let targetSpeed = 0;
    if (kb.pressing('left')) targetSpeed = -5;
    if (kb.pressing('right')) targetSpeed = 5;

    // --- PHYSIQUE DE DÉPLACEMENT ---
    if (isGrounded) {
        // AU SOL : Assez réactif (0.2)
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.2);
        
        // SAUT (Force de -12 pour contrer la gravité de 25)
        if (kb.presses('space') || kb.presses('up')) {
            player.vel.y = -12;
        }
    } else {
        // EN L'AIR : Moins réactif (0.05) pour le contrôle aérien
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.05);
    }
    
    allSprites.draw();
}