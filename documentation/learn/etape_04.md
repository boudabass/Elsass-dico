# Étape 4 : Organisation code (2h)

## 🎯 Objectifs finaux
- [ ] 5+ fonctions distinctes
- [ ] Code < 100 lignes total
- [ ] Logique claire (update/draw séparés)
- [ ] Mini-shooter : 1 ennemi descendant
- [ ] Collision = game over + restart

## 📚 Concepts à maîtriser

### 1. Fonctions réutilisables
`function updatePlayer() { ... }` ← Logique mouvement
`function drawPlayer() { ... }` ← Affichage seulement
`function updateEnemy() { ... }`
`function checkCollisions() { ... }`
`function drawUI() { ... }`

### 2. Variables globales vs locales
`let playerX = 400;` ← Global (partagé)
`let score = 0;` ← Global (persistant)

`function updatePlayer() {`
`let speed = 5;` ← Locale (fonction seulement)
`}`

### 3. Structure draw()
`function draw() {`
`background(0);`
`updatePlayer();`
`updateEnemy();`
`checkCollisions();`
`drawPlayer();`
`drawEnemy();`
`drawUI();`
`}`

## 🛠️ Progression pratique (1h30)

### **Phase 1 : Joueur en fonctions (20min)**
✅ `function updatePlayer()` → WASD/flèches
✅ `function drawPlayer()` → cercle bleu
✅ Limites écran dans `updatePlayer()`

### **Phase 2 : Ennemi simple (20min)**
✅ `let enemyX, enemyY, enemySpeed`
✅ `function updateEnemy()` → descend lentement
✅ `function drawEnemy()` → cercle rouge

### **Phase 3 : Collision + game over (30min)**
✅ `function checkCollisions()` → distance < 40
✅ `gameState = "gameOver"` sur collision
✅ Écran perdu + score + touche R

### **Phase 4 : UI + polish (20min)**
✅ `function drawUI()` → score + instructions
✅ Ennemi respawn après game over
✅ Vitesse ennemi augmente légèrement

## ✅ Checklist validation
[ ] 6 fonctions distinctes (`updatePlayer`, `drawPlayer`, `updateEnemy`, `drawEnemy`, `checkCollisions`, `drawUI`)
[ ] `draw()` ordonné (update → check → draw)
[ ] Collision détectée précisément
[ ] Game over + restart R
[ ] Code propre < 100 lignes

## 🚨 Erreurs fréquentes
❌ `update()` modifie `draw()` → mélange logique/affichage
❌ Variables globales dans fonctions → scope perdu
❌ Oubli `return` dans fonctions → undefined
❌ `drawUI()` après `background()` → invisible
❌ Collision sans distance → buggé

## 📁 Structure fichiers
`etape4/`
├── `index.html`
└── `sketch.js`

## 🎮 Résultat attendu
Joueur bleu contrôlable (bas écran)
Ennemi rouge descend lentement (haut)
Collision = "PERDU! Score: XX" + R restart
Score temps + instructions claires
Code structuré, lisible, < 100 lignes