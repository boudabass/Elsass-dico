# 07_sprites_avances.md
Animations sprite sheets (walk cycles, explosions)
Configuration animation (doc p5play) :

```javascript
// Chargement sprite sheet
loadImg('player.png', img => {
    let player = sprite(100, 100);
    player.img = img;
    
    // Définition frames animation (colonne x ligne)
    player.anis.frameSize = 64;  // 64x64 par frame
    player.anis.add('idle', [0, 1, 2], 0.2);   // 3 frames, 0.2s
    player.anis.add('run', [3, 4, 5, 6], 0.1); // 4 frames rapide
    player.ani.play('idle');  // Démarre animation
});

// Contrôle animation
if(player.keyIsDown('right')) {
    player.ani.play('run');
    player.mirror.x = false;
} else {
    player.ani.play('idle');
}
```
Debug et hitbox visuelle
```javascript
// Debug activable (dev uniquement)
player.debug = true;           // Hitbox + vecteurs vel/acc
player.hitbox = circle(20);    // Hitbox ronde personnalisée
camera.debug = true;           // Zone caméra visible

// Toggle depuis GameSystem
window.GameSystem.debugSprites = () => {
    allSprites.debug = !allSprites.debug;
};
```
Système de layers (ordre rendu)
```javascript
// Layers hiérarchiques (fond → arrière-plan → sprites → UI)
background.layer = -10;     // Fond
enemies.layer = 0;          // Ennemis
player.layer = 1;           // Joueur au-dessus
ui.layer = 10;              // Interface

// Layer dynamique (effets)
explosion.layer = 5;        // Au-dessus joueur
```
Friction et physique fine
```javascript
// Friction précise (au lieu de drag global)
player.friction = 0.85;     // Ralentissement naturel
player.bounce = 0.3;        // Rebond partiel
player.mass = 2;            // Plus lourd = moins d'accélération

// Forces appliquées
player.applyForce(vec2(0, -5));  // Saut
player.drag.x = 0.9;             // Friction horizontale seulement
```
Sprites avancés (particules, effets)
```javascript
// Générateur particules
function explosion(x, y) {
    for(let i = 0; i < 20; i++) {
        let p = sprite(x, y);
        p.life = 60;                    // Mort auto après 1s
        p.vel = vec2(random(-5,5), random(-5,5));
        p.friction = 0.95;
        p.color = color(random(255), random(255), 0);
        p.scale = random(0.5, 1.5);
    }
}

// Sprite text (score pop-up)
let scorePop = textSprite('+100', x, y);
scorePop.life = 90;
scorePop.vel.y = -2;
scorePop.color = color(255, 255, 0);
```
Configuration sprite complète (plateformeur)
```javascript
let player = sprite(100, 100, 'dynamic');
player.img = 'player.png';
player.anis.frameSize = 32;
player.anis.add('idle', [0,1], 0.3);
player.anis.add('run', [2,3,4], 0.1);
player.layer = 1;
player.debug = false;           // false en prod
player.maxSpeed = 5;
player.friction = 0.8;
player.bounce = 0;
player.collider = 'dynamic';    // Physique complète
player.mouse.setSpeed(0);       // Pas de drag
```
Bonnes pratiques sprites avancés
Performance layers :

```javascript
// Regrouper par layer pour optimisation
let uiGroup = group();
uiGroup.layer = 10;
```
Pool de sprites (éviter gc) :

```javascript
let bulletPool = group(50);  // Pré-créé
function shoot() {
    let bullet = bulletPool.get(0, 0);  // Réutilise
    bullet.life = 120;
}
```
Intégration GameSystem :

```javascript
player.collides(enemies, enemy => {
    explosion(player.x, player.y);
    window.GameSystem.Score.submit(-100);
});