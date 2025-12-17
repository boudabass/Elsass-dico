# Tâches - Standardisation GameSystem (Pivot)

## 1. Documentation & Standards
- [x] Rédiger `GAMES_DEVELOPER_GUIDE.md` : La bible pour créer/adapter un jeu.
- [x] Rédiger `documentation/analysis_forest.md` (Pédagogie).
- [x] Rédiger `documentation/analysis_asteroids.md` (Pédagogie).
- [x] Mettre à jour `implementation_plan.md`.

## 2. Nettoyage Backend (En Cours)
- [ ] Simplifier `src/app/actions/game-manager.ts` :
    - [ ] Supprimer `generateIndexHtml` (ancienne version "smart").
    - [ ] Créer `createHelperFiles` qui génère juste `index.html` MINIMAL + `thumbnail.png` placeholder.
    - [ ] Supprimer injection lors de l'upload.

## 3. Implémentation du Coeur (GameSystem)
- [ ] Implémenter `public/games/system/system.js` (Namespace `window.GameSystem`).

## 4. Adaptation des Jeux
- [ ] Refactorer `Test-Hub` (Verification).
- [ ] (Optionnel) Adapter Forest/Asteroids si demandé, sinon les laisser comme "archives" pédagogiques.