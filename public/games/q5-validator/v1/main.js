// Règle n°1 : Forcer le mode 2D
q5.mode = '2d';

q5.setup = () => {
    // Syntaxe q5.js
    new Canvas(800, 600);
    frameRate(30);

    // On ne fait rien d'autre. Pas de p5play.
    console.log("✅ q5.js seul est initialisé.");

    if (window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
    
    // Pas besoin de boucle pour un dessin statique
    noLoop();
};

q5.draw = () => {
    // Syntaxe q5.js
    clear();
    fill('cyan');
    noStroke();
    circle(width / 2, height / 2, 150);
};