// main.js - Test de validation avec la librairie p5.js classique.

function setup() {
    // 1. Créer le canvas avec la syntaxe p5.js
    createCanvas(800, 600);

    // 2. Dire au système que le jeu est prêt
    if (window.GameSystem) {
        window.GameSystem.Lifecycle.notifyReady();
        console.log("[P5JS-Test] Jeu prêt et notifié au système.");
    } else {
        console.error("[P5JS-Test] GameSystem non trouvé !");
    }
    
    // On met noLoop() car on n'a pas besoin d'animation pour ce test simple
    noLoop();
}

function draw() {
    // 3. Dessiner quelque chose de simple pour prouver que le rendu fonctionne
    background(0); // Fond noir
    fill('magenta'); // On change la couleur pour bien voir la différence
    noStroke();
    circle(width / 2, height / 2, 100); // Un cercle magenta
}