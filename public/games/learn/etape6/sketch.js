let player;

function setup() {
    createCanvas(800, 600);
    
    // Création du sprite joueur (x, y, largeur, hauteur)
    // Avec p5play, on utilise 'new Sprite' au lieu de créer nos propres classes
    player = new Sprite(400, 300, 50, 50);
    player.color = 'blue';
    
    // Pour l'instant, on désactive la physique (gravité) pour tester le mouvement simple
    player.collider = 'none'; // Pas de collision physique pour cette phase
}

function draw() {
    background(50);
    
    // Mouvement simple (modification directe de la position)
    if (kb.pressing('left')) {
        player.x -= 5;
    }
    if (kb.pressing('right')) {
        player.x += 5;
    }
    if (kb.pressing('up')) {
        player.y -= 5;
    }
    if (kb.pressing('down')) {
        player.y += 5;
    }

    // Affichage de tous les sprites (p5play v3 le fait souvent auto, mais on l'explicite)
    // Note: 'allSprites' est un groupe global créé automatiquement par p5play
    allSprites.draw();
}