// Règle d'or : Forcer le mode 2D pour une compatibilité maximale
q5.mode = '2d';

let errorMessage = null;

function setup() {
    createCanvas(800, 600);
    
    try {
        // On essaie de créer le sprite. C'est ici que ça plante.
        let s = new Sprite();
        s.x = width / 2;
        s.y = height / 2;
        s.diameter = 150;
        s.color = 'cyan';
        s.stroke = null;
    } catch (e) {
        // Si ça plante, on capture le message d'erreur.
        errorMessage = e.toString() + "\n\n" + (e.stack || 'Pas de stack trace disponible.');
        console.error("--- ERREUR P5PLAY CAPTURÉE ---", e);
    }

    if (window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
}

function draw() {
    background(10, 10, 30); // Fond bleu nuit

    // S'il y a eu une erreur, on l'affiche.
    if (errorMessage) {
        fill(255, 100, 100); // Texte rouge
        textAlign(LEFT, TOP);
        textSize(16);
        text("ERREUR PENDANT L'INITIALISATION DE P5PLAY:\n\n" + errorMessage, 20, 20, width - 40, height - 40);
    } 
    // S'il n'y a pas d'erreur, p5play devrait dessiner le sprite automatiquement.
}