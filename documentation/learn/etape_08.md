# Étape 8 : Groupes + Interactions (3h)

## 🎯 Objectifs finaux
- [ ] 2 groupes actifs (ennemis/pièces)
- [ ] 3 callbacks collision différents
- [ ] Score + vies fonctionnels
- [ ] Ennemis patrouillent
- [ ] Collecte de pièces

## 📚 Concepts à maîtriser

### 1. Groupes p5.play
`let enemies = new Group();` ← Groupe ennemis
`let coins = new Group();` ← Groupe pièces
`enemy = new Sprite(...);` ← Sprite individuel
`enemies.add(enemy);` ← Ajoute au groupe

### 2. Collisions groupes
`enemies.collide(player);` ← Physique
`coins.overlap(player, collectCoin);` ← Callback
`enemies.overlap(player, hitEnemy);` ← Détection

### 3. Callbacks collision
`function collectCoin(player, coin) {`
`coin.remove();` ← Détruit pièce
`score += 10;`
`}`

`function hitEnemy(player, enemy) {`
`lives--;`
`enemy.remove();`
`}`

## 🛠️ Progression pratique (2h30)

### **Phase 1 : Groupes de base (30min)**
✅ `enemies = new Group()`, `coins = new Group()`
✅ Spawn ennemi toutes 120 frames
✅ Spawn pièce aléatoire toutes 90 frames
✅ `enemies.collide(platforms)`

### **Phase 2 : Interactions pièces (40min)**
✅ `coins.overlap(player, collectCoin)`
✅ `collectCoin()` → `coin.remove()` + `score += 10`
✅ Pièces clignotent (alpha animation)
✅ Texte score haut-gauche

### **Phase 3 : Ennemis dangereux (50min)**
✅ `enemies.overlap(player, hitEnemy)`
✅ `hitEnemy()` → `lives--`, player respawn
✅ Ennemis patrouille (`velocity.x` oscillante)
✅ 3 vies max, perdu à 0

### **Phase 4 : Mini-jeu final (30min)**
🎮 "Collecte de pièces"

Plateformes + ennemis patrouilleurs

Pièces dorées (+10 score)

Collision ennemi = -1 vie (3 max)

Game over 0 vie + restart R

## ✅ Checklist validation
[ ] `enemies.length > 3` actifs
[ ] `coins.length > 5` actifs
[ ] `collectCoin()` callback fonctionne
[ ] `hitEnemy()` callback fonctionne
[ ] Vies 3 → 2 → 1 → game over
[ ] Code < 130 lignes

## 🚨 Erreurs fréquentes
❌ `new Group()` dans `draw()` → spam
❌ callback sans 2 params → crash
❌ `overlap()` au lieu `collide()` → pas physique
❌ `remove()` sans test existence → erreur
❌ Groupe vide → `undefined.length`

## 📁 Structure fichiers
`etape8/`
├── `index.html` ← p5 + p5.play CDN
└── `sketch.js`

## 🎮 Résultat attendu
Joueur saute/collecte pièces dorées
Ennemis rouges patrouillent plateformes
+10 score par pièce, -1 vie par ennemi
HUD : Score 0 | Vies ♥♥♥
Game over 0 vie + meilleur score