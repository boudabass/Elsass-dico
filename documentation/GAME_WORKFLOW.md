# 🤖 Game Development Workflow (Guide pour l'IA)

Ce document est la **Source de Vérité** pour tout développement de jeu sur cette plateforme.
Il doit être consulté avant de commencer toute tâche de création ou de modification de jeu.

## 1. Base de Connaissance (À Lire en Priorité)

Avant de coder, l'IA doit scanner ces ressources pour s'imprégner du style et de l'architecture :

1.  **Architecture Standard :** `documentation/patterns/` (Surtout `00_environment.md` et `10_system_integration.md`).
2.  **Paramètres de Jeu ("Game Feel") :** `documentation/base_parametre.md` (Valeurs physiques validées).
3.  **Exemple "Gold Standard" :** `public/games/learn/etape10/` (C'est le modèle d'architecture parfait à reproduire).
4.  **Problèmes Connus :** `documentation/TROUBLESHOOTING.md` (À consulter pour éviter les pièges de l'API).

## 2. Stack Technique Imposée

*   **Rendu :** p5.js (Mode Global)
*   **Moteur :** p5.play v3 (Version CDN) + planck.js
*   **Système :** `system.js` (Gestionnaire global fourni par la plateforme)
*   **Langage :** JavaScript (ES6+), pas de TypeScript dans les dossiers de jeux.

## 3. Processus de Développement (Pas à Pas)

Ne jamais tout coder d'un coup. Suivre ce cycle itératif :

### Phase 1 : Initialisation & Structure
1.  **DB Entry :** Ajouter l'entrée dans `data/db.json` (ID unique, chemin, dimensions).
2.  **Fichiers :** Créer le dossier `public/games/{jeu}/{version}/`.
3.  **HTML :** Créer `index.html` en copiant **strictement** les imports de librairies de `learn/etape10/index.html`.
4.  **Config :** Créer `config.js` avec les constantes (couleurs, physique).
5.  **Squelette :** Créer un `sketch.js` vide qui initialise `setup()`, `draw()`, et la connexion `GameSystem`.

### Phase 2 : Core Gameplay (Mécaniques)
1.  **Classes :** Créer des fichiers séparés pour les entités complexes (ex: `player.js`, `enemy.js`).
2.  **Groupes :** Utiliser `new Group()` pour gérer les collections d'objets.
3.  **Physique :** Appliquer la gravité et les contrôles (`velocity`, `collides`).
4.  **Validation :** Vérifier que le joueur bouge et interagit physiquement.

### Phase 3 : Logique & États
1.  **State Machine :** Ne **PAS** utiliser le gestionnaire `states` de p5.play (instable). Utiliser un `switch(currentState)` dans `draw()` (voir `learn/etape10/sketch.js`).
2.  **Boucle :** Implémenter Menu -> Jeu -> Game Over -> Restart.
3.  **Interactions :** Ajouter les pièces, ennemis, et conditions de victoire/défaite.

### Phase 4 : Intégration & Polish
1.  **GameSystem :**
    *   Appeler `window.GameSystem.Lifecycle.notifyReady()` dans `setup()`.
    *   Appeler `window.GameSystem.Score.submit(score)` lors du Game Over.
2.  **Caméra :** Implémenter le suivi manuel avec `lerp` et `constrain` (voir Troubleshooting).
3.  **Game Feel :** Implémenter Coyote Time et Jump Buffer si c'est un jeu de plateforme.

## 4. Règles d'Or (Do & Don't)

*   ✅ **DO :** Utiliser `allSprites.draw()` entre `camera.on()` et `camera.off()`.
*   ✅ **DO :** Utiliser `rectMode(CORNER)` pour les HUDs.
*   ✅ **DO :** Séparer le code en plusieurs fichiers `.js` pour la lisibilité.
*   ❌ **DON'T :** Utiliser `localStorage` (utiliser `GameSystem`).
*   ❌ **DON'T :** Utiliser `camera.follow()` (utiliser la méthode manuelle).
*   ❌ **DON'T :** Utiliser `group.overlap(x, y)` sans sprite (utiliser vérification manuelle).