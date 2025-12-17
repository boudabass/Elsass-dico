let player;
let platforms;
let floor;

function setup() {
    createCanvas(800, 600);
    
    // Physique dynamique (comme validé à l'étape 6)
    world.gravity.y = 25;
    
    // --- JOUEUR ---
    player = new Sprite(100, 500, 30, 30);
    player.color = 'blue';
    player.collider = 'dynamic';
    player.rotationLock = true; 
    player.bounciness = 0;
    player.friction = 0; // Gestion manuelle inertie

    // --- PLATEFORMES (Groupe) ---
    platforms = new Group();
    platforms.collider = 'static';
    platforms.color = 'green';
    
    // Sol de départ
    floor = new platforms.Sprite(400, 580, 800, 40);
    floor.color = 'gray';
    
    // --- GÉNÉRATION NIVEAU (Escalier) ---
    // On crée 10 plateformes qui montent
    for(let i = 0; i < 10; i++) {
        // Position X aléatoire mais accessible
        // Position Y qui monte progressivement (-50px par marche)
        let w = random(80, 150); // Largeur variable
        let x = random(100, 700);
        let y = 500 - (i * 55 + 50); // On commence au-dessus du sol
        
        new platforms.Sprite(x, y, w, 20);
    }
}

function draw() {
    background(50);
    
    // --- CONTROLE (Style Etape 6) ---
    let isGrounded = player.colliding(platforms);

    if (isGrounded) {
        let targetSpeed = 0;
        if (kb.pressing('left')) targetSpeed = -6;
        if (kb.pressing('right')) targetSpeed = 6;
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.2);

        if (kb.presses('space') || kb.presses('up')) {
            player.vel.y = -12;
        }
    }
    
    // --- RESPAWN (Mort par chute) ---
    // Si le joueur tombe sous l'écran
    if (player.y > height + 50) {
        resetPlayer();
    }
    
    allSprites.draw();
}

function resetPlayer() {
    // Retour case départ
    player.pos = {x: 100, y: 500};
    player.vel = {x: 0, y: 0};
}