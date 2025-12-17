// Règle n°1 : Forcer le mode 2D pour une compatibilité maximale
q5.mode = '2d';

q5.setup = () => {
    // Syntaxe q5.js correcte
    new Canvas(800, 600);
    
    // Règle n°2 : Limiter les FPS pour la stabilité
    frameRate(30);
    
    console.log("✅ q5.js + p5play initialisé correctement.");
    
    // Création d'un sprite simple pour valider p5play
    let circle = new Sprite(width/2, height/2, 150);
    circle.color = 'cyan';
    circle.stroke = null;

    if (window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
};

q5.draw = () => {
    // Effacer l'écran à chaque frame
    clear();
    // p5play s'occupe de dessiner les sprites
};