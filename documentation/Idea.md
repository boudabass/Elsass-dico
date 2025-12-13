Cahier des Charges - Game Center Seniors
🎯 Objectif
Plateforme ludique pour seniors : Game Center liste jeux statiques + Admin upload jeux créés séparément. Simple, accessible, mobile-first.

🏗️ Architecture
text
Frontend : Next.js (App Router)
Auth : Supabase (admin only)
Stockage : Lowdb local (data/games.json) - configs + scores
Fichiers jeux : /public/games/{nom}/{version}/
Git workflow : main (Game Center) + branches jeu/{nom}/
📁 Structure fichiers jeux
text
public/games/tetris/v1/
├── index.html     ← p5.js CDN + tous scripts
├── sketch.js      ← Logique principale
├── data.js        ← Données (blocs, niveaux)
├── assets.js      ← Assets (images, sons)
├── hud.js         ← HUD standard (score, temps)
└── objects.js     ← Objets (ball, paddle...)
🔐 Pages & Fonctionnalités
/games (Public - Seniors)
text
✅ Grille responsive cartes jeux
✅ Thumbnail + nom + description courte
✅ High scores (Lowdb)
✅ Clic → /games/{id}/ → iframe statique
✅ HUD standard tous jeux
✅ Mobile-first (gros boutons, police 24px)
/admin (Auth Supabase - Toi seulement)
text
✅ Liste jeux existants (Lowdb)
✅ + NOUVEAU : Drag & drop dossier complet
✅ Formulaire : nom, description, version, thumbnail
✅ Sauvegarde Lowdb : {id, nom, path, date}
✅ Supprimer jeu (Lowdb + fs.rm)
✅ Éditer metadata
/games/[id] (Joueur)
text
✅ Iframe pleine page : src="/games/{path}/"
✅ HUD persistant (score, temps)
✅ Responsive canvas
💾 Stockage 100% Lowdb
json
data/games.json
{
  "jeux": [
    {
      "id": "tetris-v1",
      "nom": "Tetris Classique", 
      "description": "Empile les blocs colorés",
      "path": "tetris/v1",
      "thumbnail": "tetris-thumb.jpg",
      "date": "2025-12-13",
      "highScores": [1500, 1200, 900]
    }
  ]
}
🚀 Git Workflow
text
main ← Game Center + Admin
  ├── branche jeu/tetris → export /public/games/tetris/v1/ → merge main
  ├── branche jeu/snake → export /public/games/snake/v1/ → merge main  
  └── branche jeu/breakout → export → merge main
🎮 HUD Standard (TOUS jeux)
text
- Score (haut-gauche, 24px)
- Temps de jeu
- High Score actuel
- Bouton Pause/Redémarrer (gros)
- Contraste élevé (blanc/noir)
- Position fixe (pas canvas)
📱 Design Seniors
text
✅ Police 24px minimum
✅ Contraste WCAG AAA
✅ Boutons 48x48px touch
✅ Pas de scroll horizontal
✅ Sons optionnels (toggle)
✅ Chargement < 2s
⏱️ Planning MVP (8h)
text
Jour 1 (4h) :
- Next.js structure + pages /games + /admin
- Lowdb CRUD jeux
- Supabase auth

Jour 2 (4h) :
- Upload drag & drop dossier
- Iframe /games/[id]
- HUD standard + styles seniors
✅ Livrables finaux
text
1️⃣ Game Center fonctionnel (grille + iframe)
2️⃣ Admin upload (drag dossier + metadata)
3️⃣ Lowdb configs + scores
4️⃣ 3 jeux uploadés (Tetris, Snake, Breakout)
5️⃣ HUD standardisé
6️⃣ Mobile responsive seniors
🛠️ Tech Stack final
text
✅ Next.js 15 (App Router)
✅ Supabase Auth (admin)
✅ Lowdb (data/games.json)
✅ p5.js CDN (jeux statiques)
✅ Tailwind CSS (seniors design)
✅ Git branches jeu/{nom}/