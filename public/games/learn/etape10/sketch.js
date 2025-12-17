let playerInstance;
let platforms;
let enemiesGroup;
let coinsGroup;
let enemiesList = []; // Pour stocker les instances de classe Enemy

let score = 0;
let lives = 3;

function setup() {
    createCanvas(800, 600);
    
    // Configuration p5.play
    world.gravity.y = Config.gravity;
    allSprites.bounds = { 
        left: 0, 
        right: Config.worldWidth, 
        top: 0, 
        bottom: Config.worldHeight 
    };
    
    // --- DÉFINITION DES ÉTATS ---
    
    // ÉTAT : MENU
    states.add('menu', {
        start: () => {
            // Nettoyage
            allSprites.visible = false; // Cache tout le jeu en arrière-plan
            camera.x = 400;
            camera.y = 300;
            camera.zoom = 1;
            
            if(window.GameSystem) window.GameSystem.Lifecycle.notifyReady();
        },
        draw: () => {
            background(20);
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(40);
            text("SUPER PLATEFORMER", width/2, height/2 - 50);
            textSize(20);
            text("Appuyez sur ESPACE pour jouer", width/2, height/2 + 20);
            text("Flèches pour bouger", width/2, height/2 + 50);
        },
        update: () => {
            if (kb.presses('space')) {
                states.next('game');
            }
        }
    });
    
    // ÉTAT : JEU
    states.add('game', {
        start: () => {
            // Initialisation du niveau
            initLevel();
            allSprites.visible = true;
            score = 0;
            lives = 3;
        },
        update: () => {
            // Mise à jour du joueur
            playerInstance.update(platforms);
            
            // Mise à jour des ennemis
            for(let e of enemiesList) {
                if(!e.sprite.removed) e.update(platforms);
            }
            
            // Collisions
            enemiesGroup.collide(platforms);
            
            // Interactions
            if (playerInstance.sprite.overlaps(coinsGroup, collectCoin));
            if (playerInstance.sprite.collides(enemiesGroup, hitEnemy));
            
            // Respawn chute
            if (playerInstance.y > Config.worldHeight + 100) {
                handleDeath();
            }
            
            // Caméra
            updateCamera();
        },
        draw: () => {
            background(Config.colors.background);
            
            camera.on();
            allSprites.draw();
            camera.off();
            
            drawHUD();
        }
    });
    
    // ÉTAT : GAME OVER
    states.add('gameover', {
        start: () => {
            if(window.GameSystem) window.GameSystem.Score.submit(score);
        },
        draw: () => {
            background(0, 0, 0, 200); // Fond semi-transparent par dessus le jeu (si on le laissait visible)
            // Mais ici on redessine un fond noir
            background(10);
            
            fill(255, 50, 50);
            textAlign(CENTER, CENTER);
            textSize(50);
            text("GAME OVER", width/2, height/2 - 40);
            
            fill(255);
            textSize(30);
            text(`Score Final: ${score}`, width/2, height/2 + 20);
            textSize(20);
            text("Appuyez sur R pour rejouer", width/2, height/2 + 60);
        },
        update: () => {
            if (kb.presses('r')) {
                states.next('game'); // Relance le jeu
            }
        }
    });
    
    // Démarrage
    states.enable = true;
    states.load('menu');
}

// --- FONCTIONS DU JEU ---

function initLevel() {
    allSprites.removeAll(); // Vide tout
    enemiesList = [];
    
    // Groupes
    platforms = new Group();
    platforms.collider = 'static';
    platforms.color = Config.colors.platform;
    
    enemiesGroup = new Group();
    enemiesGroup.collider = 'dynamic';
    enemiesGroup.color = Config.colors.enemy;
    
    coinsGroup = new Group();
    coinsGroup.collider = 'static';
    coinsGroup.color = Config.colors.coin;
    
    // Sol
    new platforms.Sprite(Config.worldWidth/2, Config.worldHeight - 20, Config.worldWidth, 40);
    new platforms.Sprite(400, 500, 200, 20); // Départ
    
    // Génération
    for(let i=0; i<20; i++) {
        let w = random(150, 300);
        let x = random(100, Config.worldWidth - 100);
        let y = random(200, Config.worldHeight - 150);
        new platforms.Sprite(x, y, w, 20);
        
        if (random() > 0.5) {
            let coin = new coinsGroup.Sprite(x, y - 40, 20, 20);
            coin.shape = 'circle';
        }
        
        // 1 chance sur 3 d'avoir un ennemi sur la plateforme
        if (random() > 0.66) {
            let e = new Enemy(x, y - 40, enemiesGroup);
            enemiesList.push(e);
        }
    }
    
    playerInstance = new Player(400, 400);
}

function updateCamera() {
    let targetX = constrain(playerInstance.x, width/2, Config.worldWidth - width/2);
    let targetY = constrain(playerInstance.y, height/2, Config.worldHeight - height/2);
    
    camera.x = lerp(camera.x, targetX, 0.1);
    camera.y = lerp(camera.y, targetY, 0.1);
}

function collectCoin(playerSprite, coin) {
    coin.remove();
    score += 10;
}

function hitEnemy(playerSprite, enemySprite) {
    enemySprite.remove();
    handleDeath();
}

function handleDeath() {
    lives--;
    if (lives <= 0) {
        states.next('gameover');
    } else {
        // Respawn simple
        playerInstance.x = 400;
        playerInstance.y = 400;
        playerInstance.sprite.vel.x = 0;
        playerInstance.sprite.vel.y = 0;
        // On remet la caméra direct pour pas donner le vertige
        camera.x = 400;
        camera.y = 300;
    }
}

function drawHUD() {
    push();
    rectMode(CORNER);
    fill(0, 150);
    noStroke();
    rect(10, 10, 200, 70, 10);
    
    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Score: ${score}`, 30, 25);
    
    fill(255, 50, 50);
    noStroke();
    for(let i=0; i<lives; i++) ellipse(30 + i*30, 60, 15);
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}