# 🏗️ Patterns : Environnement de Développement

## Stack de production : p5.js + p5play v3
Stable sur tous navigateurs depuis 10 ans. Zéro WebGPU.

### Template index.html (copie-colle tous tes jeux)
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="fr"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;[NOM_JEU]&lt;/title&gt;
    &lt;style&gt;
        body { 
            margin: 0; 
            overflow: hidden; 
            background: #000; 
            font-family: sans-serif;
        }
    &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;!-- P5.JS STABLE + P5PLAY OFFICIEL --&gt;
    &lt;script src="https://cdn.jsdelivr.net/npm/p5@1.11.4/lib/p5.js"&gt;&lt;/script&gt;
    &lt;script src="https://cdn.jsdelivr.net/npm/p5@1.11.4/lib/addons/p5.sound.min.js"&gt;&lt;/script&gt;
    &lt;script src="https://p5play.org/v3/planck.min.js"&gt;&lt;/script&gt;
    &lt;script src="https://p5play.org/v3/p5play.js"&gt;&lt;/script&gt;
    
    &lt;!-- CONFIG JEUX (ton system.js) --&gt;
    &lt;script&gt;window.DyadGame = { id: '[ID_JEU]', version: 'v1' };&lt;/script&gt;
    &lt;script src="../../system/system.js"&gt;&lt;/script&gt;
    
    &lt;!-- TON JEU --&gt;
    &lt;script src="main.js"&gt;&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

### Ordre de chargement CRITIQUE
```text
1. p5.js (rendu Canvas 2D stable)
2. p5.sound.js (audio)
3. planck.min.js (moteur physique)
4. p5play.js (moteur sprites/physique)
5. system.js (menu ☰ + scores)
6. main.js (logique jeu)
```

### Structure de dossier standard
```text
public/games/snake/v1/
├── index.html     ← Template ci-dessus
├── main.js        ← Logique Snake p5play
└── assets/        ← images/sons (optionnel)
```

### Syntaxe de base p5play
```javascript
function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    
    player = new Sprite(100, 100, 50);
    player.color = 'lime';
}

function draw() {
    background(20);
    // Physique/collisions AUTO
}
```

### Compatibilité GameSystem (inchangée)
```javascript
// Dans collision ou gameover
if(window.GameSystem) {
    window.GameSystem.Score.submit(score);
}

// Menu ☰ injecté auto par system.js