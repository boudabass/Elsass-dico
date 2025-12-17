let player;
let floor;
let platform1, platform2;

function setup() {
    createCanvas(800, 600);
    
    // --- PHYSIQUE GLOBALE ---
    world.gravity.y = 10; // Gravité vers le bas (p5play v3)
    
    // --- JOUEUR ---
    player = new Sprite(400, 300, 50, 50);
    player.color = 'blue';
    player.collider = 'dynamic';
    player.rotationLock = true; 
    player.bounciness = 0; // Pas de rebond pour un contrôle précis
    
    // --- SOL ---
    floor = new Sprite(400, 580, 800, 40);
    floor.color = 'gray';
    floor.collider = 'static';
    
    // --- PLATEFORMES ---
    platform1 = new Sprite(200, 450, 200, 20); // Un peu plus bas pour être accessible
    platform1.color = 'green';
    platform1.collider = 'static';
    
    platform2 = new Sprite(600, 300, 200, 20);
    platform2.color = 'green';
    platform2.collider = 'static';
}

function draw() {
    background(50);
    
    // --- MOUVEMENT HORIZONTAL ---
    // On remet la vitesse X à 0 si aucune touche n'est pressée (arrêt net)
    player.vel.x = 0;

    if (kb.pressing('left')) {
        player.vel.x = -5;
    }
    if (kb.pressing('right')) {
        player.vel.x = 5;
    }

    // --- SAUT ---
    // On ne peut sauter que si on touche quelque chose de statique (sol ou plateforme)
    // player.colliding(floor) renvoie vrai si le joueur touche le sol
    if ((kb.presses('space') || kb.presses('up')) && 
        (player.colliding(floor) || player.colliding(platform1) || player.colliding(platform2))) {
        player.vel.y = -8; // Impulsion vers le haut
    }
}