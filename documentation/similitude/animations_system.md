# 🎬 Animation System — Similitude (Fluide & FrameCount)

Ce système gère toutes les animations visuelles du jeu (déplacement, fusion) en utilisant une approche hybride : `frameCount` pour la fluidité du mouvement et `setTimeout` pour la synchronisation des événements de jeu (swap physique, suppression de combo).

## 1. ⚙️ Architecture & Synchronisation

Le système est basé sur la boucle `draw()` de p5.js et l'objet global `window.AnimationSystem`.

| Composant | Rôle | Mécanisme |
| :--- | :--- | :--- |
| `AnimationSystem.update()` | Met à jour la progression (`progress`) de chaque animation. | Appelé à chaque `draw()` (60 FPS). |
| `AnimationSystem.draw()` | Dessine les items en mouvement/fusion par-dessus la grille. | Appelé à chaque `draw()`. |
| `GridSystem` | Déclenche `addMove()` ou `addFusion()`. | Retire l'item de la grille (`itemId = null`) pendant l'animation. |
| `setTimeout` | Synchronise le swap physique et la suppression du combo. | Utilisé pour garantir que l'animation se termine avant que l'état de la grille ne change. |

## 2. 🚀 Types d'Animations

| Animation | Durée (Frames) | Durée (ms) | Trigger | Effet Visuel |
| :--- | :--- | :--- | :--- | :--- |
| **Déplacement (MOVE)** | 20 | 333ms | `swapItems()` / `moveItem()` | Translation linéaire (lerp) de l'item de la source à la destination. |
| **Fusion (FUSION)** | 15 | 250ms | `checkAndProcessFusions()` | Scale (grossissement) + Rotation + Fade (disparition). |
| **Suppression Combo** | N/A | 300ms | `setTimeout` dans `checkAndProcessFusions()` | Délai entre l'effet visuel de fusion et la suppression réelle de l'item. |

## 3. 🎨 Rendu des Mouvements

Pour éviter le clignotement généralisé, l'item en mouvement est temporairement retiré de la grille et dessiné uniquement par l'AnimationSystem :

1.  **Déclenchement :** `GridSystem.swapItems()` retire l'item de la grille (`tile.itemId = null`) et appelle `AnimationSystem.addMove()`.
2.  **Rendu :** `GridSystem.draw()` ignore la tuile vide. `AnimationSystem.draw()` dessine l'item à sa position interpolée (`lerp`).
3.  **Fin :** Après 333ms, le `setTimeout` dans `GridSystem` remet l'item à sa position finale, et l'AnimationSystem arrête de le dessiner.