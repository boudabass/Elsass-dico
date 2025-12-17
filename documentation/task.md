# Tâches - Standardisation GameSystem (Pivot Q5/P5Play)

## 1. Documentation & Standards
- [x] Rédiger `documentation/developer_guide.md` : La bible pour créer/adapter un jeu (Standard Q5/P5Play).
- [x] Mettre à jour `documentation/analysis_forest.md` (Marquer p5.js comme Legacy).
- [x] Mettre à jour `documentation/analysis_asteroids.md` (Marquer p5.js comme Legacy).
- [x] Mettre à jour `documentation/implementation_plan.md` (Inclure les dépendances Q5/P5Play).
- [x] Mettre à jour `documentation/patterns/*.md` (Remplacer p5.js par Q5/P5Play).

## 2. Nettoyage Backend (Terminé)
- [x] Simplifier `src/app/actions/game-manager.ts` :
    - [x] Supprimer `generateIndexHtml` (ancienne version "smart").
    - [x] Créer `createHelperFiles` qui génère juste `index.html` MINIMAL (avec Q5/P5Play).
    - [x] Supprimer injection lors de l'upload.

## 3. Implémentation du Coeur (GameSystem)
- [x] Implémenter `public/games/system/system.js` (Namespace `window.GameSystem` compatible Q5).

## 4. Adaptation des Jeux (En Cours)
- [x] Refactorer `Test-Hub` (Verification).
- [ ] Migrer le jeu `Snake` (v3-system) vers Q5/P5Play pour validation du workflow complet.
    - [ ] Phase 1: Mettre à jour `index.html` pour charger Q5.js et P5Play (remplacement de p5.js).
    - [ ] Phase 2: Refactoriser `sketch.js` et `snake.js` pour utiliser les Sprites et Groupes P5Play.
        - [ ] Remplacer la classe `Snake` par un `sprite` P5Play.
        - [ ] Remplacer le tableau `food` par un `group()` P5Play.
        - [ ] Implémenter les états de jeu (`menu`, `game`, `gameover`).
    - [ ] Phase 3: Intégration des Inputs et du Score.
        - [ ] Remplacer `keyPressed()` par `q5.keyPress` (touches nommées).
        - [ ] Intégrer `GameSystem.Score.submit()` dans le callback de mort.