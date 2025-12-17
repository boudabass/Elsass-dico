// Règle d'or : Forcer le mode 2D pour une compatibilité maximale
q5.mode = '2d';

q5.setup = () => {
    // Syntaxe q5.js correcte
    new Canvas(800, 600);
    frameRate(60);
    
    console.log("✅ q5 + p5play OK");
    
    // Syntaxe p5play correcte
    let circle = new Sprite(width/2, height/2, 100);
    circle.color = 'lime';
    circle.stroke = null;

    if (window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
    }
};

q5.draw = () => {
    // Syntaxe q5.js correcte
    clear();
    // p5play dessine les sprites automatiquement
};