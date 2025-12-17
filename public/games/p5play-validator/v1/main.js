// main.js - Validation avec la stack p5.js + p5.play (classique)

let circleSprite;

function setup() {
  // Syntaxe p5.js correcte
  createCanvas(800, 600);
  frameRate(30); // FPS limité pour la stabilité
  
  // Syntaxe p5.play classique correcte
  circleSprite = createSprite(width / 2, height / 2, 150, 150);
  circleSprite.shapeColor = color('lime');
  circleSprite.strokeWeight = 0;
  
  console.log("✅ p5.js + p5.play (classique) OK");

  if(window.GameSystem) {
    window.GameSystem.Lifecycle.notifyReady();
  }
}

function draw() {
  background(10, 10, 30); // Fond bleu nuit
  
  // Commande obligatoire pour dessiner les sprites p5.play
  drawSprites();
}