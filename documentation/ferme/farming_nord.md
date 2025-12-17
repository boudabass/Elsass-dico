🌾 Farming System (Ferme Nord)
Le Farming System définit la logique complète de plantation, croissance, arrosage et récolte des cultures.
Il repose sur une grille 10x10 dédiée (par zone Ferme_Nord/Sud) et interagit directement avec les outils du HUD et les graines de saison.

1. 🧭 Structure de Base
Élément	Rôle	Description
Grille Terrain	Support de culture	10x10 tiles interactives (100 cases).
Tile	Unité de culture	Peut contenir une graine, de l’eau, ou une culture mature.
Player Action	Interaction directe	Tap terrain selon outil ou graine sélectionnée.
Cycle Journalier	Progression	Temps = 1 jour → Avancement croissance si arrosée.
2. 🌱 Cycle de Croissance
Chaque tile suit 5 états successifs :

Étape	État	Condition suivante
1️⃣	TERRE_VIDE	Tap avec graine valide → PLANTÉ
2️⃣	PLANTÉ (J0)	+1 jour si arrosé → POUSSANT
3️⃣	POUSSANT (J1–3)	+1 jour si arrosé → PRÊT
4️⃣	PRÊT (J4)	Tap sans outil → RÉCOLTÉ
5️⃣	RÉCOLTÉ	Reset tile → TERRE_VIDE
Si non arrosé : croissance retardée d’un jour (aucune régression).
Toutes les actions consomment de l’énergie selon les règles du HUD.

3. 💧 Arrosage et Gestion Énergie
Action	Outil	Coût Énergie	Effet sur Tile
Planter	Graines	4	Passer VIERGE → PLANTÉ
Arroser	Arrosoir	2	Marque la tile “arrosée” pour le jour
Récolter	Main	1	Récolte → ajoute loot dans inventaire
Couper (erreur)	Hache	8	Supprime la culture (reset)
Miner (terre non cultivée)	Pioche	5	Dégage pierre/obstacle
4. ☀️ Gestion Saisons et Compatibilité
Chaque graine a sa saison active (Printemps, Été, Automne, Hiver).

Si le joueur tente de planter hors saison → message “Incompatible” + vibration courte.

À chaque changement de saison :

Les cultures en cours hors saison meurent (tile reset).

Les cultures compatibles continuent leur cycle normalement.

5. 🎨 Feedback Visuel & Sonore
Action	Effet visuel	Effet sonore
Plantation	Poussière + icône 🌱 qui pop	“Plop” doux
Arrosage	Tile bleutée translucide	Goutte légère
Croissance	Animation subtile du sprite	Aucun
Récolte	Particules + gain visuel HUD 💰	“Pop métal doux”
Mort saison	Fanage instantané	Vent sec court
6. 🔄 Synchronisation avec HUD et Inventaire
Slot graines actif (HUD bas-gauche) → type de graine à planter.

Slot outil actif (HUD bas-droit) → action disponible sur tile.

Énergie HUD diminue en temps réel à chaque action.

Loot récolté ajouté automatiquement dans l’onglet [🧺 LOOT] selon type (🌿 NATURE ou 🪵 BOIS).

Auto-save à la fin de chaque cycle journalier (dans Sleep).

7. ✅ Règles absolues Farming v1.0
✅ Grilles fixes : 10x10 par zone.

✅ 5 états de croissance (terre → récolté).

✅ Arrosage obligatoire quotidien.

✅ Graines saisonnières seulement.

✅ Feedback visuel + sonore constant.

✅ Interaction uniquement par tap (0 drag).

✅ Énergie comme limite d’action quotidienne.

❌ Pas de multi-cultures sur une tile.

❌ Pas de fertilisant ni accélérateur.

❌ Pas de météo dynamique (v1.0).


8. 🧩 Gestion interne des Tiles (Terrain Logique)
Chaque tile est une entité autonome avec son propre état, mais coordonnée par une grille commune pour simplifier la mise à jour journalière.

Attribut	Type	Description
id	Numérique (1–100)	Identifiant unique sur la grille.
state	Enum	TERRE_VIDE / PLANTÉ / POUSSANT / PRÊT / RÉCOLTÉ
watered	Booléen	Indique si la tile a été arrosée ce jour.
seedType	Enum	Référence à l’ID de graine provenant de l’inventaire.
growthDay	Numérique	Nombre de jours écoulés depuis plantation.
compatibleSeason	Enum (SPRING/SUMMER/AUTUMN/WINTER)	Saison autorisée.
Comportement :

Une tile ne peut contenir qu’une seule culture à la fois.

Si une saison incompatible commence → state = TERRE_VIDE.

Arrosage réinitialisé chaque matin (watered = false).

9. 🌅 Cycle Journalier Global
Chaque journée suit un cycle logique reproductible, déclenché à 6h (réveil joueur).

Ordre de traitement :
Reset quotidien

Toutes les tiles → watered = false.

Énergie joueur = 100.

Heure = 6h00.

Actions joueur (temps réel)

Plantation, arrosage, récolte selon HUD.

Énergie consommée selon action.

Coucher du joueur (Sleep maison)

Déclenche la phase nocturne ci-dessous.

Phase nocturne (calcul interne)

Pour chaque tile :

Si watered == true et state = PLANTÉ/POUSSANT → growthDay++.

Si growthDay atteint le seuil propre à la graine → state = PRÊT.

Sauvegarde automatique de la grille et inventaire.

Nouvelle journée

Chargement état mis à jour, transition météo/saison, puis HUD réinitialisé.

Ce cycle stable permet à la boucle journalière d’être entièrement déterministe : aucune dépendance externe ni timer asynchrone.

10. ⚡ Intégration Énergie et Actions
L’énergie (HUD haut-gauche) est le facteur limitant du farming quotidien.
Chaque action déduit un coût précis et empêche les boucles illimitées.

Action	Coût	Condition
Arroser	-2	Outil actif = Arrosoir
Planter	-4	Graine compatible + tile vide
Récolter	-1	Tile prête
Frapper obstacle	-8	Outil actif = Hache/Pioche
Sprint (double tap)	-0.5/sec	Tant que maintenu actif
Si énergie ≤ 0 → toutes les actions bloquées → Message “Trop fatigué”.
Le joueur doit dormir pour restaurer la jauge (100 le matin suivant).

11. ⏳ Transitions visuelles entre États
Chaque changement d’état de tile applique une animation visuelle légère (p5.js canvas overlay, 0.3–0.5s) :

Transition	Effet visuel	Durée
Terre → Planté	Fleur de poussière brune + sprout 🌱	0.3s
Planté → Poussant	Agrandissement sprite de 120% → 100%	0.4s
Poussant → Prêt	Vibration subtile + halo vert	0.4s
Prêt → Récolté	Particules montantes dorées	0.5s
Hors saison → Vide	Teinte grise + “fanage” rapide	0.3s
Ces animations rendent le sol vivant et renforcent la lisibilité tactile.

12. 🌦️ Compatibilité Saisons et Température
Chaque saison applique une teinte visuelle globale déjà définie dans le HUD (overlay CSS), mais aussi une durée moyenne de croissance et un risque climatique optionnel (prévu v2.0).

Saison	Bonus/Malus	Description
🌸 Printemps	Croissance rapide +10%	Période standard
☀️ Été	Croissance stable	Journées plus longues
🍂 Automne	Croissance lente -10%	Moins d’arrosage requis
❄️ Hiver	Cultures gelées	Aucune nouvelle plantation
13. 🧮 Interaction entre Graines et Inventaire
Lorsqu’une culture est récoltée, le jeu cherche le slot correspondant dans [🧺 LOOT] → ajoute +1.

Si le joueur plante, le jeu retire -1 du slot [🌱 GRAINES] correspondant.

Si la quantité de graine atteint 0 → slot grisé + message “épuisé”.

Cette logique garde le flux totalement symétrique :
chaque graine plantée = chaque loot récolté, dans les bons onglets respectifs.

14. 🔒 Règles absolues – Farming v1.1
✅ 1 tile = 1 culture unique.

✅ Arrosage obligatoire pour toute progression.

✅ Énergie quotidienne limitée à 100.

✅ Symétrie inventaire-grille (1 graine → 1 loot).

✅ Animation à chaque transition d’état.

✅ Sauvegarde automatique à la fin du jour.

❌ Pas de fertilisant, météo ou automates avant v2.0.

❌ Aucune action possible sans tap direct du joueur.