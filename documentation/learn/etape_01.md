# Étape 1 : Bases p5.js (2h)

## 🎯 Objectifs finaux
- [ ] Canvas 800x600 visible
- [ ] Formes colorées (rect, ellipse, ligne)
- [ ] Disque suit la souris en temps réel
- [ ] Fond se met à jour chaque frame
- [ ] Couleur change selon position souris

## 📚 Concepts à maîtriser

### 1. Structure de base p5.js
`setup()` → Exécuté 1x au démarrage
`draw()` → Exécuté ~60x/seconde (boucle infinie)

### 2. Canvas et coordonnées
`createCanvas(800, 600)` ← Largeur x Hauteur
`(0,0)` = coin haut-gauche
`(800,600)` = coin bas-droite

### 3. Formes de base
`rect(x, y, largeur, hauteur)`
`ellipse(x, y, diamètreX, diamètreY)`
`line(x1, y1, x2, y2)`

### 4. Couleurs
`fill(255, 0, 0)` ← Rouge RGB
`stroke(0)` ← Contour noir
`noFill() / noStroke()` ← Sans remplissage/contour
`background(0)` ← Fond noir

### 5. Inputs souris
`mouseX`, `mouseY` ← Position actuelle souris
`pmouseX`, `pmouseY` ← Position précédente frame

## 🛠️ Progression pratique (1h30)

### **Phase 1 : Canvas vide (10min)**
✅ `setup()` avec `createCanvas(800, 600)`
✅ `draw()` avec `background(0)`
✅ Rectangle fixe au centre

### **Phase 2 : Formes colorées (20min)**
✅ 3 formes différentes
✅ Chaque forme couleur différente
✅ `fill()` + `stroke()` sur toutes
✅ `background()` rafraîchit chaque frame

### **Phase 3 : Suivi souris (30min)**
✅ Ellipse suit `mouseX`, `mouseY`
✅ Taille change selon distance centre
✅ Couleur selon position écran (`map()`)

### **Phase 4 : Mini-jeu final (30min)**
🎮 "Suivre la souris"

Disque centre suiveur (`mouseX-25`, `mouseY-25`)

Couleur : `map(mouseX, 0, 800, 0, 255)` pour rouge/bleu

Fond gris foncé (50)

Ligne trace (optionnel : de `pmouseX` à `mouseX`)

## ✅ Checklist validation
[ ] `setup()` + `draw()` fonctionnent
[ ] Canvas 800x600 visible
[ ] `background()` chaque frame (pas de traînées)
[ ] `rect(100, 100, 100, 100)` rouge visible
[ ] ellipse suiveuse fluide
[ ] Couleur change position souris
[ ] Code < 50 lignes

## 🚨 Erreurs fréquentes
❌ `background()` dans `setup()` → fond figé
❌ `createCanvas()` dans `draw()` → 60 canvases
❌ `mouseX` avant premier mouvement → 0
❌ Oubli `fill()` → formes invisibles

## 📁 Structure fichiers
`etape1/`
├── `index.html`
└── `sketch.js`

## 🎮 Résultat attendu
Un disque fluide suit ta souris
Il change de couleur (rouge ←→ bleu) selon position horizontale
Fond noir/gris se rafraîchit sans traînées
3 formes fixes colorées en arrière-plan