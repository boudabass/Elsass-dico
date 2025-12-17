# Étape 6 : p5.play Sprites (2h)

## 🎯 Objectifs finaux
- [ ] p5.play chargé et fonctionnel
- [ ] 3+ sprites visibles
- [ ] `drawSprites()` obligatoire
- [ ] Joueur sprite contrôlable
- [ ] Plateforme statique + collision

## 📚 Concepts à maîtriser

### 1. Installation p5.play
`index.html` doit charger les librairies dans cet ordre :

```html
<script src="https://cdn.jsdelivr.net/npm/p5@1.11.4/lib/p5.js"></script>
<script src="https://p5play.org/v3/planck.min.js"></script>
<script src="https://p5play.org/v3/p5play.js"></script>
```

### 2. Sprites de base
`let player = new Sprite(400, 300, 50, 50);` ← Rectangle
`player.color = 'blue';` ← Couleur
`player.x = 200;` ← Position
`player.rotation = 45;` ← Rotation

### 3. `drawSprites()` OBLIGATOIRE
```javascript
function draw() {
    background(0);
    // TOUS sprites dessinés AUTO
    allSprites.draw(); // OU drawSprites() si p5play v2
}
```
*Note : Dans p5play v3, `allSprites.draw()` est la méthode préférée, mais `drawSprites()` fonctionne souvent pour la rétrocompatibilité.*

## 🛠️ Progression pratique (1h30)

### **Phase 1 : p5.play de base (20min)**
✅ Ajoute p5.play CDN dans `index.html`
✅ 1 sprite joueur bleu centre écran
✅ `allSprites.draw()` dans `draw()`
✅ Sprite bouge avec flèches (`sprite.x += 5`)

### **Phase 2 : Sol + plateformes (25min)**
✅ Sprite sol (800, 50) bas écran
✅ 2 sprites plateforme (100x20) en hauteur
✅ Collision auto (`sprite.collide(platform)`)
✅ Joueur reste dessus

### **Phase 3 : Contrôles avancés (25min)**
✅ Flèches gauche/droite → vitesse horizontale
✅ Espace → saut (`sprite.velocity.y = -10`)
✅ Gravité simple (`sprite.velocity.y += 0.5`)

### **Phase 4 : Mini-jeu final (20min)**
🎮 "Plateforme statique"

Joueur sprite bleu contrôlable

Sol + 3 plateformes fixes

Saut (espace) + gravité

Collision physique auto

## ✅ Checklist validation
[ ] p5.play CDN chargé (console sans erreur)
[ ] `allSprites.draw()` dans `draw()`
[ ] 4 sprites visibles (joueur + sol + 2 plateformes)
[ ] Joueur saute et atterrit
[ ] Collision plateforme fonctionne
[ ] Code < 80 lignes

## 🚨 Erreurs fréquentes
❌ Oubli `allSprites.draw()` → écran vide
❌ `new Sprite()` dans `draw()` → 60x/sec
❌ p5.play avant p5.js → crash
❌ Collision sans collider → traverse

## 📁 Structure fichiers
`etape6/`
├── `index.html` ← p5 + p5.play CDN
└── `sketch.js`

## 🎮 Résultat attendu
Joueur sprite bleu saute sur 3 plateformes
Sol gris en bas, plateformes colorées
Gravité + saut contrôlable (espace)
p5.play physique auto (pas de code collision)
Animation fluide sprites