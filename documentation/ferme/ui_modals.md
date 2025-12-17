🪟 UI Modals — Système d’Interfaces Unifiées
Le UI Modal System définit les règles visuelles et tactiles de toutes les fenêtres contextuelles du jeu.
Son but est de créer une cohérence d’interaction à travers l’ensemble du gameplay,
qu’il s’agisse d’acheter un objet, ouvrir un coffre, résoudre une énigme, accepter une quête, ou voir une carte.

Ce document fixe les dimensions, animations, comportements et typologies des modals, pour une implémentation standardisée (p5.js + React iframe).

1. 🧭 Philosophie
Un style unique, reconnaissable par son ombrage et sa transparence.

Aucune fenêtre flottante opaque : tout modal laisse 15 % de transparence sur le jeu.

Actions rapides : 2 taps max pour interagir (ou fermer).

Clôture instantanée : tap en dehors = fermeture fluide.

Animation standardisée : fade-in 0.2 s / fade-out 0.2 s.

Hiérarchie : 1 modal actif à la fois (le reste du HUD est désactivé).

2. 🖼️ Structure Visuelle Commune
text
┌─────────────── MODAL FRAME ───────────────┐
│ [ Titre / Icône ]                        │
│──────────────────────────────────────────│
│ [ Contenu principal ]                    │
│                                          │
│ [ Boutons d’action en bas alignés ]      │
└──────────────────────────────────────────┘
Caractéristiques globales
Élément	Valeur	Détail
Largeur	80 % écran (mobile)	Centrée horizontalement
Hauteur max	70 % écran	Scroll auto interne
Rayon bordure	8 px	Uniforme partout
Fond	rgba(30, 30, 30, 0.85)	Transparence harmonisée
Police	Sans-serif pixelisée 14 px	Légère pour lisibilité mobile
Animation	Fade 0.2 s + scale 0.05	Sensation dynamique douce
3. ⚙️ Types de Modals Standardisés
Type	Contexte	Boutons	Spécificité
InventoryModal	Inventaire / Coffre	Fermer	Double panneau (Perso ↔ Coffre)
ShopModal	Ville / Commerce	Payer · Annuler · Reset	Comptabilise pièces + troc
MachineModal	Ferme Sud (Craft)	Fabriquer · Fermer	4 slots + Résultat
QuestModal	Taverne & Mairie	Accepter · Refuser	Description + récompense
DialogueModal	PNJ / Cinematique	Continuer · Fermer	Texte subtilement scrollé
PuzzleModal	Mine (énigmes)	Confirmer · Quitter	Interface full écran 90 %
PauseModal	HUD ≡ Menu	Reprendre · Sauvegarde · Quitter	Statistiques rapides
4. 🎨 Couleurs et Signaux
Élément	Couleur (CSS)	Rôle
Bordure principale	#6b7280 (gris clair)	Cadre neutre
Action positive	#34d399 (vert)	“Fabriquer”, “Payer”, “Accepter”
Action négative	#ef4444 (rouge)	“Annuler”, “Refuser”
Info / neutre	#93c5fd (bleu)	“Fermer”, “OK”
Danger / alerte	#fbbf24 (jaune/ambre)	“Attention”, “Énergie faible”
Des animations d’intensité (glow léger) assurent un retour visuel quand le bouton est tapé.

5. 🎚️ Hiérarchie et Superposition
Niveau	Élément	Profondeur
Z‑Index 1	HUD fixe	visible mais grisé
Z‑Index 2	Modal actif	focus utilisateur
Z‑Index 3	Overlay alerte / message rapide	notifications
Z‑Index 4	Réservé système	Debug ou UI GameSystem Hub
Jamais plus d’un modal interactif en Z‑Index 2 à la fois.

6. 🔄 Transitions et Interaction
Action utilisateur	Effet	Durée
Ouverture	Fade‑in + zoom 5 %	0.2 s
Fermeture	Fade‑out	0.2 s
Tap extérieur	Fermeture immédiate	0.1 s
Bouton cliqué	Feedback coloré (glow 0.1 s)	0.1 s
Scroll intérieur	Limitée à 50 px/s	tactile naturel
Les transitions CSS sont calculées sur le canvas HUD pour ne jamais bloquer le jeu p5.js.

7. 📱 Adaptation Mobile
Taille dynamique selon densité d’écran (vw/vh).

Gestes exclus : tap uniquement.

Orientation : vertical > horizontal.

Touch events désactivés hors zone modale (pointer-events:none).

Effet esthétique de flou d’arrière‑plan (blur 4 px) au focus modal.

8. 🧭 Liens inter‑systèmes
Module	Usage du modal
InventorySystem	Onglets (Graine / Outil / Loot) affichés dans InventoryModal
CitySystem	Boutique double panneau (ShopModal)
Ferme Sud	MachineModal unifié (4 slots + Résultat)
QuestSystem	Description mission + acceptation (QuestModal)
TimeSystem	PauseModal + Menu sauvegarde
Mine	PuzzleModal pleine surface
EventSystem	Overlays d’annonce / notification : modaux temporaires non bloquants
Toutes les fenêtres suivent la même charte visuelle et comportementale.

9. 🔔 Overlays légers
L’EventSystem et le TimeSystem peuvent afficher de légers overlays temporaires,
distingués des vrais modals :

Élément	Durée	Transparence	Effet
Notification succès	1.5 s	0.6	Message “Récolte terminée !”
Alerte fatigue	1 s	0.8	“Trop fatigué…” + vibration
Message temps	2 s	0.5	“Jour + 1 → Été” transition douce
Ces éléments ne perturbent jamais la logique HUD.

10. ✅ Règles absolues — UI Modal System v1.0
✅ 7 types de fenêtres harmonisés.

✅ Transparence + blur ≈ 15 %.

✅ Animation standard : fade 0.2 s, scale 5 %.

✅ Tap‑to‑close universel.

✅ 1 modal actif à la fois.

✅ Palette cohérente : gris/vert/rouge/bleu/ambre.

✅ Overlays légers séparés du contenu.

✅ Compatibilité mobile p5.js + React.

❌ Pas de glisser‑déposer.

❌ Pas de positionnement manuel.

❌ Pas de sous‑modals superposés.