let player;
let floor;
let platform1, platform2, platform3;

function setup() {
    createCanvas(800, 600);
    
    world.gravity.y = 10;
    
    player = new Sprite(400, 300, 50, 50);
    player.color = 'blue';
    player.collider = 'dynamic';
    player.rotationLock = true; 
    player.bounciness = 0;
    
    // ZÉRO friction automatique pour contrôler l'inertie nous-mêmes
    player.friction = 0; 
    player.drag = 0;
    
    // Groupe pour le sol et les plateformes (pour simplifier la détection)
    // En p5play, on peut tester la collision avec un groupe entier
    platforms = new Group();
    platforms.collider = 'static';
    platforms.color = 'green';
    
    floor = new Sprite(400, 580, 800, 40);
    floor.color = 'gray';
    platforms.add(floor); // On l'ajoute au groupe mais on garde sa couleur
    
    platform1 = new Sprite(200, 450, 200, 20);
    platforms.add(platform1);
    
    platform2 = new Sprite(600, 300, 200, 20);
    platforms.add(platform2);
    
    platform3 = new Sprite(300, 150, 150, 20);
    platforms.add(platform3);
}

function draw() {
    background(50);
    
    // Est-ce qu'on touche le sol ou une plateforme ?
    // On vérifie le contact vers le BAS ('bottom') pour être précis
    let isGrounded = player.colliding(platforms);

    if (isGrounded) {
        // --- LOGIQUE AU SOL ---
        
        // 1. Définir la cible
        let targetSpeed = 0;
        if (kb.pressing('left')) targetSpeed = -5;
        if (kb.pressing('right')) targetSpeed = 5;

        // 2. Appliquer l'inertie (lerp)
        // 0.05 = Très glissant / Lourd
        // 0.2 = Réactif
        player.vel.x = lerp(player.vel.x, targetSpeed, 0.05);
        
        // 3. Saut
        if (kb.presses('space') || kb.presses('up')) {
            player.vel.y = -9;
            // Astuce : on garde la vitesse X actuelle pour le saut
        }
    } else {
        // --- LOGIQUE EN L'AIR ---
        // ON NE FAIT RIEN sur vel.x !
        // Le joueur garde son élan (Momentum)
        // C'est la physique de Newton : un objet en mouvement reste en mouvement.
    }
    
    allSprites.draw();
}