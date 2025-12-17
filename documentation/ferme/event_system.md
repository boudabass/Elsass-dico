Event System — Gestion Globale des Événements
Le Event System contrôle les événements planifiés (jours, saisons, PNJ) et les événements contextuels (lié au lieu, au temps ou à des actions précises).
Il agit comme un chef d’orchestre silencieux : il observe le monde, déclenche les effets visuels, et informe les autres modules (HUD, Ville, Quêtes).

1. 🧭 Structure Générale
Élément	Rôle	Description
EventHub	Gestionnaire central	Reçoit signaux du TimeSystem et QuestSystem
EventData	Fichier de configuration	Liste ordonnée des événements du jeu
Triggers	Conditions de déclenchement	Heure, jour, saison, quêtes, zone, énergie
Actions	Effets visuels ou logiques	Lance une animation, une musique, un bonus
L’EventHub exécute toutes les 10 s une vérification légère sur l’état global pour déterminer quelles actions émettre.

2. 📅 Typologie des Événements
Type	Définition	Exemple	Source
Saisonniers	Fixes, en fin de saison (jour 28)	Foire agricole 🌸, Marché artisanal 🍂	City / Time
Journaliers	Déclenchés à une heure précise	Ouverture magasin 8 h, Taverne 20 h	Time
PNJ	Proposés par un personnage	“Romain organise un concours de Baies”	Quest
Système	Universels, liés à l’état global	Fatigue, pluie, sommeil forcé	Core
Spéciaux	Uniques, scénarisés	Passage Hiver → Printemps, Festival mine	EventData
Chaque événement a une durée moyenne (5 – 60 s) et peut être purement visuel, interactif, ou narratif.

3. 🧾 Définition d’un Événement
text
Event {
 id: "spring_fair",
 name: "Foire Agricole",
 type: "seasonal",
 trigger: { season: "spring", day: 28, hour: 18 },
 actions: [
   { type: "hud_overlay", value: "🌸 Foire Agricole !" },
   { type: "music", value: "village_festival.mp3" },
   { type: "bonus", target: "sell_price", value: 1.10 }
 ],
 duration: "1d",
 repeat: true,
 auto_close: true
}
4. ⏱️ Déclencheurs Disponibles
Catégorie	Condition
Temps global	Jour, heure, saison
Lieu	Zone active (Ferme, Ville, Mine, etc.)
Stat joueur	Énergie, or, réputation
Quête	En cours, terminée ou expirée
Objet possédé	Détection d’un item spécifique
Événement précédent	Chaînage simple (sequence)
Chaque événement peut combiner plusieurs déclencheurs (ex : saison + ville + jour 28).

5. 🧩 Actions disponibles
Action	Description	Effet
hud_overlay	Affiche texte / bannière	“🌸 Foire Agricole aujourd’hui !”
music	Change ambiance sonore	Lecture loop d’événement
sound_fx	Joue effet ponctuel	Fanfare, tambour
bonus	Applique multiplicateur temporaire	+10 % vente, -10 % fatigue
dialogue	Lance un mini‑dialogue PNJ	Scène mairie ou taverne
cutscene	Gèle jeu + séquence courte	Début/fin de saison
reward	Ajoute ressource ou potion	Récompense événementielle
quest_link	Active ou complete une quête	Synchronise avec QuestSystem
Toutes les actions sont purement déclaratives : l’EventHub envoie un signal au module correspondant pour exécution.

6. 🔄 Cycle d’Exécution
Scan périodique (every 10 s) du monde actif.

Vérifie les correspondances :

TimeSystem → Season/Day/Hour

Player → location/energy

QuestSystem → active events

Déclenche onEventStart.

Diffusion d’un signal global :

js
window.dispatchEvent(new CustomEvent('event:start',{detail:event}))
Tangible en jeu : musique, overlay, bonus, dialogue, etc.

Auto‑close / Reset après durée ou nouvelle journée.

7. 🌸 Événements Saisonniers Officiels
Saison	ID	Nom	Effet gameplay
Printemps	spring_fair	Foire Agricole	+10 % or vente (jour 28)
Été	summer_festival	Festival Plage	Loot spécial “coquillage rare”
Automne	autumn_market	Marché artisanal	Recettes Machines +1
Hiver	winter_festival	Fête de Neige	Sleep gratuit + énergie 100
Ces quatre événements reviennent à chaque cycle annuel (flag repeat:true).

8. 🏙️ Événements Locaux (Ville & PNJ)
Lieu	Exemple	Condition	Effet
Taverne	Mini‑quête nocturne Romain	Heure ≥ 20 h	Débloque potion gratuite
Magasin Marcel	Jour 3/6/9	Livraison spéciale	-10 % graines
Mairie	Saison complete	Dialogue + progression stats	Bonus réputation
Mine	Étape 10	Transition musicale + loot × 2	Indicateur “Milestone”
Ces événements sont indépendants du calendrier saisonnier.

9. 💽 Sauvegarde & Résumé
Le SaveSystem conserve pour chaque événement :

text
events: [
  { id:"spring_fair", lastTriggered:"Jour28/Printemps/An1" },
  { id:"tavern_special", cooldown: "3d", repeat:true }
]
Cela permet d’éviter les doubles déclenchements,
et de scheduler les prochains via cooldown.

10. 🎨 Interface HUD
Une icône événement (🔔) s’affiche sur la timeline HUD 4 h avant le début.

Couleur selon nature :

🟢 locale

🟡 saisonnière

🔴 spéciale

Tap = ouvre mini‑fenêtre “Infos Événement” :
description, lieu, durée, effet.

11. ✅ Règles absolues — Event System v1.0
✅ Registre global EventHub actif toutes les 10 s.

✅ Intégration directe TimeSystem, QuestSystem, SaveSystem.

✅ Actions modulaires (overlay, musique, bonus, reward…).

✅ 4 événements saisonniers fixes.

✅ Événements PNJ et locaux basés sur heure/position.

✅ Sauvegarde horodatée + cooldown.

✅ Icônes HUD et notification 4 h avant début.

❌ Pas de cutscenes longues (v2.0).

❌ Pas d’événements aléatoires.