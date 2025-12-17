# 🎛️ Patterns : Entrées, Audio & Intégration

## Inputs unifiés p5.js + p5play v3
Ancien : `keyPressed()` avec `keyCode` numérique + gestion manuelle.

Nouveau : `keyPressed()`, `keyIsDown()`, propriétés `sprite.key[]` + gamepad natif.

```javascript
// ❌ AVANT (p5.js pur)
function keyPressed() {
    if(keyCode === UP_ARROW) snake.dir(0, -1);
    if(keyCode === 87) player.jump();  // 'W' = 87
}

// ✅ APRÈS (p5play v3 - Clavier)
function keyPressed() {
    // Directions Snake
    if(keyCode === LEFT_ARROW)  snake.vx = -scl;
    if(keyCode === RIGHT_ARROW) snake.vx = scl;
    if(keyCode === UP_ARROW)    snake.vy = -scl;
    if(keyCode === DOWN_ARROW)  snake.vy = scl;
    
    // Actions
    if(key === ' ') player.jump();
}
```

## Appui continu (mouvement fluide)
```javascript
function draw() {
    background(20);
    
    // Inputs maintenus automatiquement
    if(keyIsDown(LEFT_ARROW))  snake.vx -= 0.5;
    if(keyIsDown(RIGHT_ARROW)) snake.vx += 0.5;
    if(keyIsDown(UP_ARROW))    player.jump();
}
```

## Souris et Touch (drag & tap)
```javascript
// Drag & drop sprite
player.mouse.setSpeed(5);  // Vitesse de suivi souris
player.drag = function() { // Callback drag
    player.scale = 1.1;    // Grossit au drag
};

// Tap simple
player.tap = function() { player.jump(); };
player.doubleTap = function() { player.dash(); };
```

## Gamepad natif (console/mobile)
```javascript
function draw() {
    // Détection auto gamepad
    if(gamepad.isUsing) {
        if(gamepad.button('left'))  player.vx -= 1;
        if(gamepad.button('right')) player.vx += 1;
        if(gamepad.button('jump'))  player.jump();
        
        // Joystick analogique
        player.vx += gamepad.axis('leftX') * 3;
        player.vy += gamepad.axis('leftY') * 3;
    }
}
```

## Inputs par sprite (plateformeur)
```javascript
// Configuration input sprite
player.keys = {
    left: [LEFT_ARROW, 65],    // A
    right: [RIGHT_ARROW, 68],  // D
    jump: [32, 87],            // Space, W
    fire: 'mouseX'
};

// Usage automatique
function draw() {
    if(player.keyIsDown('left')) player.vx -= 1;
    if(player.keyIsDown('jump')) player.jump();
}
```

## Flux inputs automatique
```javascript
function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Inputs sprite
    snake.mouse.setSpeed(0);   // Pas de drag Snake
    player.mouse.setSpeed(5);  // Drag player
}

function draw() {
    background(20);
    
    // TOUS LES INPUTS GÉRÉS AUTOMATIQUEMENT
    // keyIsDown(), mouseX/Y, gamepad mis à jour
    
    allSprites.draw();
}
```

## Bonnes pratiques vérifiées
**Priorité inputs :**

```javascript
function keyPressed() {     // Actions immédiates
    if(key === 'space') player.jump();
}

function draw() {           // Mouvement continu
    if(keyIsDown(LEFT_ARROW)) player.vx -= 1;
}
```

**Mobile-first :**

```javascript
if('ontouchstart' in window) {
    allSprites.mouse.setSpeed(3);  // Touch plus lent
}
```

**Debug inputs :**

```javascript
function keyPressed() {
    if(key === 'f2') {
        console.log('Keys:', keyCode, 'Mouse:', mouseX, mouseY);
    }
}
```

**Intégration GameSystem (pause/menu) :**

```javascript
function keyPressed() {
    if(key === 'Escape') {
        allSprites.paused = !allSprites.paused;  // Pause physique
    }
}