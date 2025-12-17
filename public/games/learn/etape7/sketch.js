let player;
let platforms;
let floor;

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
}

function draw() {
    background(50);
    
    let isGrounded = player.colliding(platforms);

    // --- INPUTS ---
    let targetSpeed = 0;
    
    // Vitesse réduite : +/- 5 au lieu de +/- 6 ou plus
    if (kb.pressing('left')) targetSpeed = -5;
    if (kb.pressing('right')) targetSpeed = 5;

    // --- PHYSIQUE DE DÉPLACEMENT ---
    if (isGrounded) {
        // AU SOL : Réactif (0.2)
        // On change vite de direction
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.2);
        
        // SAUT
        if (kb.presses('space') || kb.presses('up')) {
            player.vel.y = -12;
        }
    } else {
        // EN L'AIR : Moins réactif (0.05)
        // On peut influencer la trajectoire, mais c'est plus lent/lourd
        // Cela permet de corriger un saut, mais pas de faire des zig-zags instantanés
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.05);
    }
    
    // --- RESPAWN ---
    if (player.y > height + 50) {
        resetPlayer();
    }
    
    allSprites.draw();
}

function resetPlayer() {
    player.pos = {x: 100, y: 500};
    player.vel = {x: 0, y: 0};
}