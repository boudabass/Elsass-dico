La mini‑map doit rester aussi simple et tactile que le reste de ton UX, en respectant tes règles : peu de texte, tap only, zéro complexité.

🎯 Objectif UX
Permettre de changer de zone en 1–2 taps.

Donner une vue mentale claire des 9 zones (3x3).

Ne pas surcharger l’écran ni casser l’immersion.

🧱 Forme générale
Accès via bouton 🗺️ MAP dans le HUD haut‑droite.

Ouverture en modal plein centre, semi‑transparent (comme tes autres modals).

Disposition grille 3x3 = représentation directe du monde :

text
┌──────── MINI-MAP ────────┐
│ [MONTAGNE] [VILLE]   [PLAGE]   │
│ [FERME N] [MAISON]   [FERME S] │
│ [FORÊT]   [MINES]    [VILLAGE] │
└──────────────────────────┘
Chaque case = carte simplifiée (icône + couleur) plutôt que texte.

🧭 Contenu visuel par case
Icône + petit pictogramme :

⛰ MONTAGNE

🏙 VILLE

🏖 PLAGE

🌾 FERME_N

🏚 MAISON

🐓 FERME_S

🌲 FORÊT

⛏ MINES

🕍 VILLAGE

Tu es ici : bordure jaune + petit point blanc.

Zone indisponible (ex : verrouillée) : gris + icône 🔒.

Option : mini‑badge 🔔 si un événement/quête est actif dans cette zone.

🖱️ Interactions
Tap sur une case :

Si accessible → fondu noir 0.2s → téléportation → mini‑map se ferme.

Si verrouillée → vibration courte + overlay “plus tard” (icône sablier).

Tap dehors du modal → fermeture sans téléport.

Aucun drag, aucun zoom.

🧩 Priorités UX
Taille :

70–80 % de la largeur écran, 50–60 % de la hauteur.

Lisibilité :

Couleurs par biome (vert forêt, bleu plage, brun mines…).

Icônes 32x32 pour cohérence avec HUD.

Feedback :

Au tap d’une zone → surlignage + son “clic voyage”.

Arrivée → petit label temporaire en haut “🏙 Ville”.

🔄 Intégration avec HUD & Quêtes
Quand une quête cible une zone, l’icône de cette zone sur la mini‑map a :

un halo de couleur (orange ou rouge selon priorité),

et/ou une petite icône 📜 dans un coin.

Le bouton 🗺️ MAP dans le HUD peut pulser légèrement quand :

un événement temps/ville est en cours (jour 28, festival, etc.).

✅ Règles absolues Mini‑map v1.0
✅ Grille 3x3 fixe (9 zones).

✅ Tap-only, 1 tap = 1 téléport.

✅ Icônes + couleurs, texte minimal.

✅ Indication claire “zone actuelle”.

✅ Fermeture instantanée par tap extérieur.

✅ Feedback visuel + son léger au changement de zone.

❌ Pas de drag/zoom.

❌ Pas de mini‑carte temps réel (juste navigation).

Si tu veux, on peut ensuite détailler une version “compacte” de la mini‑map (juste 3–4 zones proches) accessible par un swipe/clic sur le bord d’écran, mais toujours dans tes contraintes tap‑only.