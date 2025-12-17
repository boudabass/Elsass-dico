# Étape 3 : Inputs utilisateur (2h)

## 🎯 Objectifs finaux
- [ ] Contrôles clavier (flèches + WASD)
- [ ] Contrôles souris (clic/touch)
- [ ] Contrôles tactiles (mobile/tablette)
- [ ] Système de score + respawn cibles
- [ ] 3 méthodes input simultanées

## 📚 Concepts à maîtriser

### 1. Clavier
`keyPressed()` ← Touche pressée 1x
`keyIsDown(UP_ARROW)` ← Touche maintenue
`keyCode` ← Code numérique (37=left, 38=up...)
`key` ← Caractère (' ', 'r', 'a')

### 2. Souris
`mousePressed()` ← Clic pressé
`mouseReleased()` ← Clic relâché
`mouseIsPressed` ← Clic maintenu
`mouseX`, `mouseY` ← Position

### 3. Touch (mobile)
`touchStarted()` ← Doigt touche écran
`touchMoved()` ← Doigt bouge
`touches[]` ← Tableau positions doigts
`touches.x` ← Premier doigt

## 🛠️ Progression pratique (1h30)

### **Phase 1 : Joueur contrôlable clavier (25min)**
✅ Cercle joueur centre écran
✅ Flèches : gauche/droite/haut/bas
✅ Vitesse fixe (speed = 5)
✅ Limites écran (pas sortir)

### **Phase 2 : Cibles + score (25min)**
✅ Cible aléatoire (x:random(50,width-50))
✅ Clic souris = collision + score++
✅ Score affiché haut-gauche
✅ Nouvelle cible après collecte

### **Phase 3 : Multi-contrôles (20min)**
✅ WASD en + flèches
✅ Touch gauche/droite écran = mouvement
✅ Espace = "collecter" (comme clic)

### **Phase 4 : Mini-jeu final (20min)**
🎮 "Collecte de points"

Joueur bleu (flèches/WASD/touch)

Cible jaune aléatoire (clic/Espace/touch)

Score +1, nouvelle cible

Vitesse cible augmente

## ✅ Checklist validation
[ ] Flèches + WASD marchent
[ ] Clic souris collecte
[ ] Touch mobile fonctionne
[ ] Score incrémente
[ ] Cible respawn instantané
[ ] Code < 90 lignes

## 🚨 Erreurs fréquentes
❌ `keyPressed()` → déclenché 60x/sec
❌ `keyIsDown()` sans if → vitesse folle
❌ `mouseX` sans limites → sort écran
❌ `touches` sans test → erreur vide
❌ Oubli `preventDefault()` → scroll mobile

## 📁 Structure fichiers
`etape3/`
├── `index.html`
└── `sketch.js`

## 🎮 Résultat attendu
Cercle bleu contrôlable 4 directions
Cible jaune aléatoire clignote
3 façons collecter : clic/Espace/touch
Score augmente + nouvelle cible
Fonctionne PC + mobile instantané