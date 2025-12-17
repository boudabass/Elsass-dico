# Étape 5 : Tableaux + Collisions (3h)

## 🎯 Objectifs finaux
- [ ] 10+ entités dynamiques (tableau)
- [ ] Collision précise (distance/rect)
- [ ] Array push/pop dynamique
- [ ] Asteroids : éviter ou détruire
- [ ] Score + vitesse progressive

## 📚 Concepts à maîtriser

### 1. Tableaux d'objets
`let asteroids = [];` ← Array vide
`asteroids.push({x, y, size});` ← Ajoute élément
`asteroids.pop();` ← Supprime dernier
`for (let i = 0; i < asteroids.length; i++) { ... }`

### 2. Collision distance
`function checkCollision(p1, p2) {`
`let d = dist(p1.x, p1.y, p2.x, p2.y);`
`return d < (p1.size + p2.size);`
`}`

### 3. Collision rectangle
`function rectCollision(r1, r2) {`
`return r1.x < r2.x + r2.w &&`
`r1.x + r1.w > r2.x &&`
`r1.y < r2.y + r2.h &&`
`r1.y + r1.h > r2.y;`
`}`

### 4. Boucles forEach
`asteroids.forEach((asteroid, index) => {`
`updateAsteroid(asteroid, index);`
`});`

## 🛠️ Progression pratique (2h30)

### **Phase 1 : Tableau asteroids (30min)**
✅ `let asteroids = [];`
✅ Spawn aléatoire toutes 60 frames
✅ Chaque astéroïde : `{x, y, vx, vy, size}`
✅ Boucle `for` update + draw tous

### **Phase 2 : Collision joueur-astéroïdes (40min)**
✅ `function checkCollisions()` → boucle tous astéroïdes
✅ Collision distance < 40 → game over
✅ Respawn astéroïdes après mort

### **Phase 3 : Destruction clic (40min)**
✅ Clic souris → raycast tous astéroïdes
✅ Plus proche < 50 → `splice(index)`
✅ +10 score par destruction
✅ Effet particules (optionnel)

### **Phase 4 : Mini-jeu final (40min)**
🎮 "Asteroids simplifié"

Spawn continu (vitesse augmente)

Éviter (touche) OU détruire (clic)

Score temps + destructions

Game over collision + restart R

## ✅ Checklist validation
[ ] `asteroids.length > 10` actifs
[ ] Spawn automatique continu
[ ] Collision distance précise
[ ] Clic détruit astéroïde
[ ] `Array.splice()` fonctionne
[ ] Code < 120 lignes

## 🚨 Erreurs fréquentes
❌ `for (let asteroid of asteroids)` → pas d'index
❌ `splice()` dans `for(i++)` → skip éléments
❌ `dist()` sans `Math.hypot()` → lent mobile
❌ `push()` sans limites → 1000+ astéroïdes
❌ Collision sans test existence → crash

## 📁 Structure fichiers
`etape5/`
├── `index.html`
└── `sketch.js`

## 🎮 Résultat attendu
10+ astéroïdes gris bougent aléatoirement
Joueur bleu évite (flèches/WASD)
Clic = destruction +10 score
Spawn continu + vitesse progressive
Collision = game over + score final