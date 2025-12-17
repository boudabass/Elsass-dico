Implementation Plan — Roadmap React/p5.js (4 Sprints)
Objectif : Prototype jouable Ferme Nord + HUD + Inventaire en 4 semaines (Sprint 1-2 semaines chacun).
Stack : React (app + modals) + p5.js (canvas jeu) + GameSystem Hub (save/leaderboard).

📋 Sprint 1 : Core Engine (Semaine 1)
Objectifs
 Canvas p5.js Ferme Nord (10x10 grille interactive)

 HUD Permanent (énergie, or, timeline, slots graines/outils)

 Game Loop de base (temps réel 1min=1h, énergie -2/arrosage)

Deliverables
text
├── src/
│   ├── p5/FermeNord.js          ← Grille + player tap
│   ├── components/HUD.js        ← Canvas layer HUD (15% écran)
│   ├── systems/TimeEngine.js    ← Horloge + énergie
│   └── GameSystemHub.js         ← Save localStorage
Tâches : 5 jours dev | 2 jours polish | Demo : Farm basique fonctionnel

📋 Sprint 2 : Inventory + UI Modals (Semaine 2)
Objectifs
 InventoryModal (3 onglets PERSO/COFFRE)

 Slots HUD fixes (12 graines + 6 outils → actions terrain)

 SaveSystem v1 (auto-save sommeil)

Deliverables
text
├── src/
│   ├── components/Modals/       ← InventoryModal, ShopModal
│   ├── systems/Inventory.js     ← 16 graines fixes + loot
│   ├── hooks/useModalStack.js   ← 1 modal actif (z-index)
│   └── utils/saveManager.js     ← JSON local + checksum
Tâches : 4 jours modals | 3 jours inventory | Demo : Planter → Inventaire → Save

📋 Sprint 3 : Ferme Sud + City (Semaine 3)
Objectifs
 4 Machines fixes (Établi/Four/Herbaliste/Recherche)

 Ville basique (Marcel boutique + double panneau)

 20 recettes (transfert loot → craft)

Deliverables
text
├── src/
│   ├── p5/FermeSud.js           ← Machines + timers
│   ├── components/ShopModal.js  ← Pièces + troc
│   ├── systems/Crafting.js      ← 20 recettes validées
│   └── MapSystem.js             ← 9 vues + téléport 0.2s
Tâches : 5 jours machines | 2 jours ville | Demo : Farm → Craft → Vente

📋 Sprint 4 : Polish + Systems (Semaine 4)
Objectifs
 TimeSystem complet (+8h sommeil, fatigue auto)

 QuestSystem (3 quêtes Taverne/Marcel)

 Mine N1-4 (énigmes association symboles)

 GameSystem Hub (scores, fullscreen, auth)

Deliverables
text
├── src/
│   ├── systems/QuestEngine.js   ← Journal + HUD icônes
│   ├── p5/Mine.js               ← Étages 1-4 + lit
│   ├── hooks/useGameLoop.js     ← Cycle 16min complet
│   └── api/GameSystem.js        ← /api/save + leaderboard
Tâches : 4 jours systèmes | 2 jours polish | 1 jour QA | Demo Alpha : Boucle complète

🛠️ Tech Architecture
text
React App (80%)
├── CanvasContainer (p5.js jeu) ← 3000x3000 vues
├── HUDCanvas (layer séparé)    ← 15% écran fixe
├── ModalStack (React)          ← UI unifiée transparente
└── GameSystems (hooks)         ← Time/Inventory/Quest/Save

GameSystem Hub (20%)
├── localStorage (primaire)
├── /api/save (secondaire)
└── Leaderboard (bonus)
🎨 Assets à créer (Sprint 1)
Type	Quantité	Taille	Exemple
Icônes HUD	20	32x32px	🌱P, 💧Lv1, ⛏️
Tiles ferme	10	64x64px	Terre vide, 🌱, prêt
Machines	4	128x128px	Établi, Four
PNJ	4	48x48px	Marcel, Romain
Outil : Aseprite ou Pixelorama (Stardew-style)

📈 KPIs par Sprint
Sprint	Sessions/jour	Or/jour	Énergie utilisée
1	Farm 40 tiles	+50💰	80/100
2	+ Inventaire	+150💰	85/100
3	+ Craft/Vente	+350💰	75/100
4	Boucle complète	+600💰	65/100
✅ Règles absolues Implémentation
✅ p5.js pour jeu uniquement (canvas brut, pas React)

✅ React pour HUD + modals (layer canvas séparé)

✅ GameSystem Hub dès Sprint 1 (save/leaderboard)

✅ Tap-only (0 drag, 0 keyboard)

✅ 16min = 1 jour (temps compressé)

✅ Alpha jouable Sprint 4 (Ferme + Ville + boucle)