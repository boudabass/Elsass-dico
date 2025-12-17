# 🎮 Patterns : Inputs (Standard Q5/P5Play)

Inputs unifiés q5 + p5play
Ancien : keyPressed() avec keyCode numérique + gestion manuelle.

Nouveau : q5.keyPress(), q5.keyIsDown(), propriétés sprite.key[] + gamepad natif.

```javascript
// ❌ AVANT (p5.js)
function keyPressed() {
    if(keyCode === UP_ARROW) snake.dir(0, -1);     // Nombres magiques
    if(keyCode === 87) player.jump();              // W = 87
}

// ✅ APRÈS (q5 + p5play - Clavier nommé)
q5.keyPress = () => {
    if(q5.key === 'up')    snake.vel.set(0, -scl);
    if(q5.key === 'down')  snake.vel.set(0, scl);
    if(q5.key === 'left')  snake.vel.set(-scl, 0);
    if(q5.key === 'right') snake.vel.set(scl, 0);
    if(q5.key === 'space') player.jump();
};
```
Appui continu (mouvement fluide)
```javascript
// Inputs maintenus automatiquement
q5.draw = () => {
    // snake.key['left'] = true/false géré par p5play
    if(snake.keyIsDown('left'))  snake.vel.x -= 0.5;
    if(snake.keyIsDown('right')) snake.vel.x += 0.5;
    if(snake.keyIsDown('up'))    snake.vel.y -= 0.5;
};
```
Souris et Touch (drag & tap)
```javascript
// Drag & drop sprite
player.mouse.setSpeed(5);  // Vitesse de suivi souris
player.drag = () => {      // Callback drag
    player.scale = 1.1;    // Grossit au drag
};

// Tap simple
player.tap = () => player.jump();
player.doubleTap = () => player.dash();  // Double-tap
```
Gamepad natif (console/mobile)
```javascript
// Détection auto gamepad
if(gamepad.isUsing) {
    if(gamepad.button('left'))  player.vel.x -= 1;
    if(gamepad.button('right')) player.vel.x += 1;
    if(gamepad.button('jump'))  player.jump();
    
    // Joystick analogique
    player.vel.x += gamepad.axis('leftX') * 3;
    player.vel.y += gamepad.axis('leftY') * 3;
}
```
Inputs par sprite (exemple plateformeur)
```javascript
// Configuration input sprite
player.p5play = {
    left: 'left a',      // Multiples touches
    right: 'right d',    
    jump: 'space w UP_ARROW',
    fire: 'mouseX'
};

// Usage automatique dans draw()
if(player.keyIsDown('left')) player.vel.x -= 1;
if(player.keyIsDown('jump')) player.jump();
```
Flux inputs automatique
```javascript
q5.setup = () => {
    new Canvas(windowWidth, windowHeight);
    
    // Inputs globaux
    q5.keyPress = handleKeys;
    
    // Inputs sprite
    snake.mouse.setSpeed(0);  // Pas de drag pour Snake
    player.mouse.setSpeed(5); // Drag pour player
};

q5.draw = () => {
    // TOUS LES INPUTS SONT GÉRÉS AUTOMATIQUEMENT
    // keyIsDown(), mouseX/Y, gamepad mis à jour chaque frame
    
    allSprites.draw();
};
```
Bonnes pratiques vérifiées
Priorité inputs :

```javascript
// Ordre important : keyPress → keyIsDown → gamepad
q5.keyPress = handleInstant;     // Actions immédiates
// draw() → keyIsDown pour mouvement continu
```
Mobile-first :

```javascript
// Touch virtuel auto
if('ontouchstart' in window) {
    allSprites.mouse.setSpeed(3);  // Plus lent touch
}
```
Debug inputs :

```javascript
// Toggle input debug
window.GameSystem.debugInputs = () => {
    console.log('Keys:', q5.key, 'Mouse:', mouseX, mouseY);
};
```
Intégration GameSystem (pause/menu)
```javascript
// Pause globale via GameSystem menu ☰
q5.keyPress = () => {
    if(q5.key === 'escape') {
        World.paused = !World.paused;  // Pause physique
    }
};
```
Exemple Snake complet intégré
```javascript
// 10 lignes vs 150 avant
snake.collides = () => window.GameSystem.Score.submit(snake.life * 100);
foodGroup.overlaps(snake, food => {
    food.remove();
    snake.life++;
    newFood();
});