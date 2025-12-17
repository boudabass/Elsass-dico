// Règle d'or : Forcer le mode 2D pour une compatibilité maximale
q5.mode = '2d';

let circleSprite;

function setup() {
    // Créer le canvas
    createCanvas(800, 600);
    
    // Créer un "Sprite" p5play. C'est le test crucial.
    // Si cette ligne fonctionne, p5play est correctement initialisé.
    circleSprite = new Sprite();
    circleSprite.x = width / 2;
    circleSprite.y = height / 2;
    circleSprite.diameter = 150;
    circleSprite.color = 'cyan';
    circleSprite.stroke = null; // Pas de bordure

    // Notifier le système que le jeu est prêt
    if (window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
        console.log("[Q5-Validator] Jeu prêt.");
    }
}

function draw() {
    // Dessiner le fond
    background(10, 10, 30); // Fond bleu nuit

    // Avec p5play, il n'est même pas nécessaire de dessiner les sprites manuellement dans draw().
    // Le simple fait qu'ils existent suffit. La boucle draw() ne sert qu'à effacer l'écran.
}