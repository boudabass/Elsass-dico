🎮 HUD Permanent (Tous États)
Structure HAUT (15% écran max)
text
GAUCHE (stats vitales)        | CENTRE (timeline)        | DROITE (boutons)
┌─────────────────────────────┬─────────────────────────┬─────────────────┐
│ ⚡[Jauge courbe 82/100]     │ [Timeline Frostpunk]    │ 📦 INV │ 🗺️ MAP │ ≡ MENU │
│ 💰 125g │ 🌅 10:30           │                         │                 │
└─────────────────────────────┴─────────────────────────┴─────────────────┘
Auto-cache : Disparaît après 4s sans action → Tap bord écran = réapparition instantanée.

HUD HAUT DÉTAILLÉ
GAUCHE (Icônes 32x32px + texte minimal)
text
⚡ Jauge Énergie Courbe (vert→jaune→rouge) : 82/100
  → Clic = +20 énergie (cooldown 10s)
💰 Or : 125g
🌅 Heure : 10:30 (avance temps réel)
CENTRE (Timeline Frostpunk - 35% largeur, 8px hauteur)
text
[Passé J-9..J0 grisés] [J0🌸 orange] [Futur J1..J28 ☀️]
Passé (gauche) : 10 marqueurs jours historiques

Présent (centre) : Curseur cliquable + icône saison active

Futur (droite) : 18 marqueurs projetés (teinte saison suivante)

Clic timeline : Debug uniquement (avance/rewind temps)

DROITE (3 boutons ronds tactiles 40x40px)
text
📦 INV → Modal inventaire 3 onglets
🗺️ MAP → Téléport vue (fondu 0.2s)
≡ MENU → Pause/stats/sauvegarde
Surlignage jaune au tap/hover

🌱 HUD BAS-GAUCHE : GRAINES (16 slots fixes 4x4)
text
Printemps : [🌱P] [🌱Po] [🌱C] [🌱Radis]
Été      : [🌱B] [🌱H] [🌱HP] [🌱Melon] 
Automne  : [🌱Eg] [🌱PoA] [🌱Citrouille] [🌱Champi]
Hiver    : [🌱Ail] [🌱Artichaut] [ ] [ ]
Interaction :
Clic slot → surlignage jaune fixe → Tap terrain compatible = plantation instantanée
Feedback : Poussière + son "plop" + tile → 🌱 PLANTÉ

🔧 HUD BAS-DROITE : OUTILS (6 slots fixes)
text
[💧Lv1] [⛏️Lv1] [🪓Lv1]
[🗡️Lv1] [✨Lv1] [ ]
Interaction :
Clic slot → glow jaune actif → Tap terrain/objet = action automatique
Exemples : Arrosoir→eau | Pioche→minerais | Hache→bois

🌤️ EFFETS AMBIANTS
Saison Teinte (CSS overlay 10% opacité)
text
Printemps : 🌸 Vert chaud
Été      : ☀️ Orange lumineux  
Automne  : 🍂 Brun/orange
Hiver    : ❄️ Bleu froid
Son Ambiant (Loop -20dB)
text
Printemps : Pluie douce
Été      : Cigales
Automne  : Vent feuilles
Hiver    : Vent glacial/neige
📱 INTERACTIONS TACTILES (Mobile-First)
Gesture	Action	Feedback
Tap slot	Sélection active (jaune)	Glow + son "clic"
Tap terrain	Action instantanée	Particules + son
Double-tap terrain	Sprint x2 vitesse	Poussière vitesse
Tap bord écran	HUD réapparition	Fade-in 0.1s
Clic timeline	Debug temps	(Développeurs only)
🎨 SPÉCIFICATIONS TECHNIQUES
text
Icônes : 32x32px pixel art (Stardew style)
HUD Hauteur max : 15% écran
Timeline : 8px hauteur, 35% largeur
Auto-cache : 4s timer
Teinte CSS : filter: hue-rotate() + opacity: 0.1
Canvas Layer : HUD → séparé du jeu principal
✅ RÈGLES ABSOLUES (NE PAS MODIFIER)
text
✅ 16 slots graines FIXES (4 par saison)
✅ Tap uniquement (ZERO drag&drop)
✅ Auto-cache HUD 4s
✅ Jauge énergie visuelle cliquable
✅ Timeline Frostpunk informative
✅ Icônes 32x32px UNIFIÉES
❌ Pas de texte superflu
❌ Pas de nouveaux états/complexité
❌ Pas de swipe/gestes complexes
Ce HUD est 100% prêt prototype p5.js - FERME_NORD first.