# Programme d'apprentissage p5.js + p5.play
**Durée estimée : 20-30h** | **Objectif final : Plateformer complet**

## 📋 Étape 1 : Bases p5.js (2h)
**Objectifs :** setup/draw, canvas, formes de base  
**Fonctions clés :** `createCanvas()`, `background()`, `rect()`, `ellipse()`, `fill()`, `stroke()`  
**Mini-jeu final :** *Suivre la souris*  
- Disque suit `mouseX/mouseY`  
- Change couleur selon position écran  
- Fond se met à jour chaque frame  

**Checklist :** [x] Canvas 800x600 [x] Formes colorées [x] Suivi souris fluide **(VALIDÉE)**

---

## 📋 Étape 2 : Variables + États (2h)
**Objectifs :** Animation automatique, temps, score  
**Fonctions clés :** `frameCount`, `millis()`, variables vitesse/position  
**Mini-jeu final :** *Éviter les bords*  
- Carré rebondit murs (vitesse X/Y)  
- Score = temps de survie  
- Game over au centre écran  

**Checklist :** [x] Animation auto [x] Compteur temps [x] Détection bord **(VALIDÉE)**

---

## 📋 Étape 3 : Inputs utilisateur (2h)
**Objectifs :** Contrôles clavier + souris + touch  
**Fonctions clés :** `keyPressed()`, `keyIsDown()`, `mousePressed()`, `touches[]`  
**Mini-jeu final :** *Collecte de points*  
- Joueur cercle (flèches/WASD/touch)  
- Cibles apparaissent aléatoirement  
- Clic/touch = +1 score, nouvelle cible  

**Checklist :** [x] 3 méthodes input [x] Score incrémental [x] Respawn cible **(VALIDÉE)**

---

## 📋 Étape 4 : Organisation code (2h)
**Objectifs :** Fonctions réutilisables, code propre  
**Fonctions clés :** `updatePlayer()`, `drawEnemies()`, variables globales/locales  
**Mini-jeu final :** *Mini-shooter*  
- Joueur bas écran (flèches)  
- 1 ennemi descend lentement  
- Collision = game over  

**Checklist :** [ ] 5+ fonctions distinctes [ ] Code < 100 lignes [ ] Logique claire

---

## 📋 Étape 5 : Tableaux + Collisions (3h)
**Objectifs :** Multi-entités, détection collision  
**Fonctions clés :** `Array.push()`, `forEach()`, collision distance/rect  
**Mini-jeu final :** *Asteroids simplifié*  
- 5+ astéroïdes aléatoires  
- Joueur évite ou détruit (clic)  
- Score + vitesse progressive  

**Checklist :** [ ] 10+ entités [ ] Collision précise [ ] Array dynamique

---

## 📋 Étape 6 : p5.play Sprites (2h)
**Objectifs :** Passage p5.play, sprites de base  
**Fonctions clés :** `createSprite()`, `drawSprites()`, `sprite.position`  
**Mini-jeu final :** *Plateforme statique*  
- Joueur sprite se déplace  
- Sol + 2 plateformes fixes  
- Sprites visibles, collisions  

**Checklist :** [ ] p5.play chargé [ ] 3+ sprites [ ] drawSprites() fonctionne

---

## 📋 Étape 7 : Physique p5.play (3h)
**Objectifs :** Gravité, sauts, collisions physiques  
**Fonctions clés :** `sprite.collider`, `sprite.velocity`, `sprite.bounce()`  
**Mini-jeu final :** *Plateformer simple*  
- Joueur saute (espace/touch)  
- 5 plateformes + sol  
- Physique réaliste (chute, rebond)  

**Checklist :** [ ] Gravité auto [ ] Saut précis [ ] 10+ collisions

---

## 📋 Étape 8 : Groupes + Interactions (3h)
**Objectifs :** Gestion groupes, callbacks collision  
**Fonctions clés :** `new Group()`, `group.overlap()`, `group.collide()`  
**Mini-jeu final :** *Collecte de pièces*  
- Group ennemis (patrouille)  
- Group pièces (+score)  
- Vies -1 collision ennemi  

**Checklist :** [ ] 2 groupes actifs [ ] 3 callbacks collision [ ] Score + vies

---

## 📋 Étape 9 : Caméra + HUD (2h)
**Objectifs :** Monde > écran, interface fixe  
**Fonctions clés :** `camera.position`, `camera.zoom`, texte hors caméra  
**Mini-jeu final :** *Runner à défilement*  
- Niveau 2000px large  
- Caméra suit joueur  
- HUD score/temps fixe  

**Checklist :** [ ] Caméra fluide [ ] HUD stable [ ] Monde étendu

---

## 📋 Étape 10 : Architecture jeu complet (3h)
**Objectifs :** Structure pro, multi-états, config  
**Fonctions clés :** États (menu/jeu/pause), fichiers séparés, config JSON  
**Mini-jeu final :** *Plateformer complet v1*