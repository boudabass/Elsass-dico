🏭 Ferme Sud — Machines Agricoles Fixes
La Ferme Sud est la zone de production industrielle du jeu.
Elle regroupe l’ensemble des machines stationnaires, chacune possédant une fonction unique et un emplacement défini une fois pour toutes.
Le joueur ne peut ni les placer, ni les déplacer, ni les détruire.

Chaque machine transforme les ressources récoltées dans la Ferme Nord ou extraites des Mines, bouclant ainsi le cycle Farming → Transformation → Craft.

1. 🧭 Structure Générale
Élément	Rôle	Description
Zone Ferme_Sud	Aire dédiée aux machines	10x10 grilles fixes, chaque tile machine ayant une fonction définie.
Machine	Bloc interactif	Interface unifiée avec slots d’entrée et sortie.
Player Action	Tap machine	Ouvre modal de craft instantané associé à la recette disponible.
Cycle Journalier	Avancement production	Calcul automatique durant la nuit pour les crafts à durée retardée.
2. ⚙️ Machines disponibles (fixes et dédiées)
Emplacement	Machine	Fonction principale	Catégorie d’utilisation
Tile A1	🪵 Établi	Assemblage de base	Bois / pierre simples
Tile B2	🔥 Four	Fonderie et cuisson	Métaux et dérivés
Tile C3	🌿 Herbaliste	Préparation artisanale	Potions de plantes
Tile D4	🔬 Recherche	Amélioration d’outils	Métaux traités
Toutes les machines sont visibles sur le terrain, accessibles par simple tap.
Leur état de fonctionnement (libre, actif, terminé) est signalé par couleur et animation.

3. 🧩 Interface Machine (Design unifié)
Chaque machine possède la même structure de modal, à affichage instantané (fade 0.2 s) :

text
┌────── MACHINE ───────┐
│ [Icône machine + nom]               │
│        Slot1 | Slot2 |              │
│            Résultat                 │
│        Slot3 | Slot4 |              │
│ [Bouton Fabriquer]                  │
│ Durée : instant / 1j / 2j           │
└────────────────────────┘
Interactions :

Tap sur un slot vide → ouverture mini-modal de sélection d’item (issu de [🧺 LOOT]).

Tap sur Fabriquer → vérification auto des ressources et lancement du craft.

Tap hors modal → fermeture instantanée (0.2 s).

4. 🔄 Logique de Production
Chaque machine a un mode de fonctionnement fixe :

Machine	Durée type	Exemple de recette	Condition
🪵 Établi	Instantané	1 Planche = 1 Bûche	Ressources disponibles
🔥 Four	1 jour	1 Fer Ingot = 2 Fer Ore + 1 Charbon	Consommation immédiate
🌿 Herbaliste	1 jour	Potion Santé = 5 Baies	Disponibles dans [🧺]
🔬 Recherche	2 jours	Arrosoir Lv2 = Cuivre + Planche	Débloque amélioration
Le temps de production s’écoule uniquement pendant la phase nocturne (Sleep).
Le lendemain matin :

Le produit est automatiquement transféré vers [🧺 LOOT].

Le statut machine revient sur “libre” (animation idle).

Le joueur reçoit un son et un flash d’achèvement.

5. 🧮 États des Machines
État	Description	Icône / Couleur	Interaction possible
⚪ LIBRE	Machine prête à l’emploi	Icône neutre grise	Tap → ouvrir modal
🟡 ACTIVE	Production en cours	Halo jaune pulsant	Aucun accès
🟢 TERMINÉE	Production finie	Icône brillante verte	Tap → récup auto loot
🔴 ERREUR	Ressource manquante	Cligno rouge court	Message “Matériau insuffisant”
Ces états se mettent à jour automatiquement à chaque fin de journée.

6. 🎨 Feedback & Animation
Événement	Effet visuel	Audio
Lancement craft	Étincelle + halo lumineux	“Cling métal”
Production en cours	Pulsation lente (1 s)	“Vibration sourde -15 dB”
Fin production	Flash bleu + particules	“Ding cristallin”
Échec ressource	Clignotement rapide	“Bip erreur”
Animations synchronisées sur canvas séparé pour éviter d’impacter la loop du jeu.

7. 🤝 Intégration au Système Global
Récupère ressources depuis InventorySystem / Onglet LOOT.

Ajoute les résultats à la même section [🧺 LOOT] (pile auto).

Interaction accessible depuis la vue Ferme_Sud uniquement.

Sauvegarde automatique à la sortie du modal et à la fin de journée.

Système de machines totalement déterministe (zéro randomized spawn).

8. ✅ Règles absolues — Ferme Sud v1.0
✅ Machines fixes sur la grille (emplacement dédié).

✅ Interface unifiée à 4 slots + résultat central.

✅ Production différée selon type (instant, 1 j, 2 j).

✅ État machine clair : libre / actif / terminé / erreur.

✅ Craft uniquement via ressources présentes dans [🧺 LOOT].

✅ Sortie automatique au matin suivant.

✅ Aucune machine plaçable, déplaçable ou destructible.

❌ Pas de multi-files par machine.

❌ Pas de croisement machines (v1.0).

❌ Pas de gestion énergétique machine.