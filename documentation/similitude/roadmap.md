# 🗺️ Roadmap — Similitude (V1.0 Completion)

Ce document liste les fonctionnalités restantes à implémenter pour atteindre la version 1.0 jouable du prototype Match-3.

## Phase 1 : Core Loop & Feedback (Priorité Haute)

| Statut | Tâche | Description |
| :--- | :--- | :--- |
| ✅ | **Grille & Items** | Grille 9x9 centrée, remplissage aléatoire, rendu des emojis. |
| ✅ | **Sélection/Déplacement** | Logique Clic 1 (Sélection) et Clic 2 (Déplacement vers case vide). |
| ✅ | **Détection Fusion** | `GridSystem.checkMatch()` pour alignements 3+. |
| ✅ | **Gravité & Spawn** | `GridSystem.applyGravity()` pour faire tomber les items et remplir le haut. |
| ✅ | **Score & Multiplicateurs** | Calcul du score basé sur la longueur du combo (x1, x2, x3). |
| ✅ | **Chrono & Énergie** | Décompte du temps et consommation d'énergie par mouvement. |
| ✅ | **HUD & Modales** | Affichage des stats et modales Pause/Game Over. |
| ✅ | **Animation de Déplacement** | Lissage visuel du mouvement d'un item de la source à la destination (actuellement un snap instantané). |
| ✅ | **Animation de Fusion** | Effet visuel (explosion, disparition) lors de la fusion des items. |
| ⬜ | **Feedback Énergie Zéro** | Afficher un message d'alerte lorsque l'énergie est épuisée et le jeu est bloqué. |

## Phase 2 : Fonctionnalités Avancées (Inventaire & Power-ups)

| Statut | Tâche | Description |
| :--- | :--- | :--- |
| ⬜ | **Inventaire Spawn Bas** | Créer la zone DOM en bas de l'écran pour afficher les 3 prochains items qui vont apparaître dans la grille. |
| ⬜ | **Logique de Fin de Partie** | Vérifier si l'énergie est à zéro ET qu'aucun mouvement n'est possible (grille pleine) pour déclencher le Game Over. |
| ⬜ | **Power-ups (Base)** | Définir 1-2 types de power-ups (ex: Bombe, Échange gratuit) et leur logique d'apparition/utilisation. |
| ⬜ | **Sauvegarde Score** | Intégrer l'appel à `window.GameSystem.Score.submit(score)` lors du Game Over. |

## Phase 3 : Polish & Niveaux (Future Expansion)

| Statut | Tâche | Description |
| :--- | :--- | :--- |
| ⬜ | **Écran de Menu Principal** | Remplacer le bouton "JOUER" par un écran de menu complet (avec instructions). |
| ⬜ | **Système de Niveaux** | Implémenter la logique pour changer la taille de la grille (ex: 5x5, 12x12) et les objectifs par niveau. |
| ⬜ | **Musique & Sons** | Ajouter des effets sonores pour les clics, les fusions et le Game Over. |