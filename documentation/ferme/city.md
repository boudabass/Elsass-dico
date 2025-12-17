🏙️ Ville — Système Social, Économie & Progression
La Ville est le centre de vie et de progression du joueur.
C’est un espace social fixe abritant les commerces, la taverne, la mairie et la maison du joueur.
Elle relie les ressources du farming et les produits des machines à l’économie locale et aux événements saisonniers.

1. 🗺️ Structure Générale
Zone	Rôle principal	Description
🏚️ Maison Joueur	Point de départ et de repos	Lieu de sauvegarde et reset énergie (6h matin)
🧱 Magasin agricole (Marcel)	Vente/Achat graines & loot	Transactions économiques principales
🪓 Atelier (Élodie)	Vente outils et améliorations	Lié au système de machines Recherche
🍺 Taverne (Romain)	Quêtes + repos nocturne	Buff énergie + missions locales
🏛️ Mairie (Lenoir)	Progression & saisons	Passage saison + statistiques village
La Ville est entièrement accessible via téléport carte (🗺️ MAP) et n’a pas de cycle de production propre.
Les PNJ sont statiques mais interactifs par tap direct.

2. 👥 PNJ et Rôles Dédiés
PNJ	Lieu	Fonction	Interaction
Marcel	Magasin agricole	Achat/Vente de graines et loot	Modal boutique 2 panneaux
Élodie	Atelier outils	Vente et amélioration d’outils	Catalogue simple avec niveaux
Romain	Taverne	Quête quotidienne + repos	Buff énergie ou mini-mission
Maire Lenoir	Mairie	Suivi progression et passage saison	Modal stats globales
Chaque PNJ possède un dialogue contextuel minimal lié à la saison ou à l’action en cours.

3. 🛒 Boutiques — Système Économique
Les boutiques de la ville utilisent une interface inspirée du système d’inventaire :
un modal double panneau (marchand ↔ joueur) représentant visuellement les échanges.

text
┌─────────────────────────── BOUTIQUE ────────────────────────────┐
│ MARCHAND (gauche) │ JOUEUR (droite)                            │
│ [Items disponibles] │ [Inventaire joueur → items à vendre]       │
│────────────────────────────────────────────────────────────────│
│ 💰 Total à payer : 0 pc · Différence : 0 pc                     │
│ [💸 Payer] [↩️ Réinitialiser] [❌ Annuler]                      │
└────────────────────────────────────────────────────────────────┘
⚙️ Fonctionnement des transactions
Clic sur un item marchand → sélectionne une quantité (1 / 10 / 50 / MAX).

L’item passe dans le panneau joueur (achat prévu).

Total à payer se met à jour automatiquement.

Le joueur peut ajouter des items de son inventaire (loot) pour compenser en valeur et réduire la différence.

Payer → validation instantanée, consommation des pièces et transfert auto d’items.

Réinitialiser → vide les deux panneaux, remet à zéro la transaction.

Annuler → fermeture sans modification.

Système hybride pièces + troc :

Si le joueur n’a pas assez de 💰, il peut ajouter des objets acceptés par le marchand pour équilibrer.

Les items non reconnus sont ignorés (grisés).

💰 Échelle de valeur et prix de base
Type d’achat/vente	Exemple	Valeur unitaire (pièces 💰)
Vente récolte	Baies, fleurs, herbes	+5 → +50 pc
Achat graines saisonnières	Pomme de terre, melon, citrouille	-25 → -100 pc
Achat outil de base	Arrosoir Lv 1	-200 pc
Passage saison (mairie)	Déblocage saison	-500 pc
Repos taverne	Nuit +20 énergie	-15 pc
Aucun marchandage — prix fixes.
Le HUD met à jour instantanément le total 💰 sur validation.

4. 🍺 Taverne — Repos & Quêtes Nocturnes
La Taverne Romain n’est ouverte que de 20 h à 6 h.
Elle combine deux fonctions : récupération d’énergie et micro-événements de quête.

Action	Effet	Condition
Tap comptoir	+20 énergie (max 1 fois/nuit)	-15 💰
Tap PNJ Romain	Active une mini-quête (dialogue)	PNJ disponible nuit uniquement
Tap chaise/table	Animation repos courte	Aucun coût
Quêtes nocturnes (v1.0 simple) : PNJ Romain propose un échange unique (“Apporte-moi 5 Baies fraîchement cueillies”).
Si validé avant l’aube → récompense 50 💰 ou potion énergie.

5. 🏛️ Mairie — Progression et Saisons
La mairie agit comme centre d’information et interface de progression.

Fonction	Description
Statistiques	Jours, saisons, récoltes, crafts, or accumulé
Passage saison	Déblocage la saison suivante pour 500 💰
Archive	Historique des quêtes et événements saisonniers
Dialogue Maire	Message variable selon performance du joueur
Visuellement : modal simple 4 volets (Statistiques / Événements / Saison / Fermer) avec textes courts et pictos.

6. 🏠 Maison du Joueur
Lieu de repos et sauvegarde principale.
Accessible depuis la ville ou via téléport automatique à la fin de journée.

Action	Effet
Tap lit	Sleep → Sauvegarde + reset énergie 100 + avance jour
Tap coffre	Accès inventaire PERSO↔COFFRE
Tap décor	Aucun effet (esthétique)
C’est aussi le point de respawn du joueur chaque matin.

7. 🔄 Intégration et Cycle Économie
À chaque fin de journée :

Les ventes actives sont enregistrées.

L’or total est mis à jour et sauvegardé.

Le joueur peut participer à la vie du village (taverne/mairie).

La saison progresse automatiquement ou par paiement mairie.

Flux global :
Farming → Loot → Vente Ville → Achat graine → Replantation → Craft Machines.

8. 🎨 Feedback Interface
Événement	Visuel	Son
Achat validé	Halo vert sur item et compteur 💰 bleu	“cling” clair
Vente	Icône or scintillante + +💰 HUD	“coin roll”
Échec (fonds insuffisants)	Flash rouge modal	“bip sec”
Réinitialisation inventaire	Fumée légère grise	“whoosh” doux
Durée feedbacks : 0.2–0.4 s, sans interruption de navigation.

9. ✅ Règles absolues — Ville v1.0
✅ PNJ fixes et rôles uniques.

✅ Boutiques double panneau inspirées de l’inventaire.

✅ Paiement mixte (pièces + troc).

✅ Validation immédiate avec feedback HUD.

✅ Taverne nocturne (20 h–6 h).

✅ Mairie pour saisons et progression.

✅ Maison joueur pour sauvegarde.

✅ Interface tap-only (aucun drag libre).

❌ Pas de réputation PNJ.

❌ Pas de météo urbaine ni événements dynamiques v1.0.

❌ Pas d’inventaire PNJ ou stockage global.