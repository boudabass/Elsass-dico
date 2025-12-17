🎮 Overview — Stardew Mobile UX (Résumé 1-Page)
Stardew Mobile est un farming sim mobile-first (React + p5.js iframe) avec 9 vues 3000x3000px, HUD permanent auto-cache, et boucle journalière de 16min réelles.
Core Loop : Farm → Loot → Craft → Vente → Progression sociale.​

🗺️ Architecture Systèmes (11 modules)
text
HUD Permanent (hub_permanent.md)
    ↓
┌─────────────┬─────────────┬─────────────┐
│ Farming Nord│ Ferme Sud   │   Mine      │
│ (10x10 tiles│ (4 machines │ (20 étages  │
│ graines/arro│ fixes)      │ énigmes)    │
│ sage)       │             │             │
└─────────────┴─────────────┴─────────────┘
         ↓              ↓              ↓
    Inventory    Machines/Craft    Loot/Métaux
         ↓                           ↓
       Ville (PNJ/Boutiques) ← TimeSystem (saisons/énergie)
         ↓                           ↓
    Quêtes + Événements ← EventSystem + SaveSystem
         ↓
     UI Modals (unifiés)
🔄 Game Loop Journalier (16min)
text
6h  🏠 Réveil (100 énergie)
8h  🌾 Farm Nord (40 tiles)
12h 🏙️ Ville (vente + graines)
14h ⛏️ Mine (2-3 étages)
16h 🏭 Ferme Sud (crafts)
20h 🍺 Taverne (quête + repos)
2h  🛌 Sleep (+8h / Save auto)
Ressources/jour : +200-1000💰 | Cultures +1 | Crafts avancés

📊 États du Monde (12 vues)
Vue	Système actif	Durée session
1️⃣ Ferme Nord	Farming	4min
2️⃣ Ferme Sud	Machines	2min
3️⃣ Ville	PNJ/Boutiques	3min
4️⃣ Maison	Save/Repos	1min
5️⃣ Mine	Énigmes	3min
6️⃣ Taverne	Quêtes	2min
HUD fixe : Énergie ⚡ | Or 💰 | Temps 🌅 | Timeline saisons | INV/MAP/MENU

🎯 Progression (28 jours/saison)
text
Semaine 1 : Farm de base (Printemps)
Semaine 2 : Mine + craft (Été)
Semaine 3 : Optimisation outils (Automne)
Semaine 4 : Événement J28 (Hiver → Printemps)
Déblocages : Outils Lv1→4 | Machines | Recettes | Réputation PNJ

🛠️ Tech Stack
text
Frontend : React (iframes) + p5.js (canvas jeu)
HUD : Canvas layer séparé (15% écran)
Save : localStorage + GameSystem Hub API
Assets : 32x32px pixel-art Stardew-style
Mobile : Tap-only, auto-cache HUD 4s
✅ Règles Absolues (Game Design)
✅ Tap uniquement (0 drag&drop)

✅ Énergie 100/jour (repos +8h)

✅ Slots fixes (graines 16, outils 6, loot 24)

✅ 20 recettes officielles interconnectées

✅ Saisons 28j + événements J28

✅ Sauvegarde auto (tous lits)

Tu as 100% des fondations pour prototype Alpha.​