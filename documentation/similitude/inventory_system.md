# 📦 Système d'Inventaire & Power-ups — Similitude (v1.0)

Ce système gère les power-ups consommables du joueur, séparant le stock total (Fenêtre 5x5) des raccourcis d'utilisation rapide (Ligne 2).

## 1. 🧱 Architecture UI (3 Niveaux Fixes)

L'interface est composée de trois zones DOM fixes, positionnées en bas de l'écran, et d'une modale de gestion qui couvre le jeu.

| Zone | Position | Contenu | Rôle | Z-Index |
| :--- | :--- | :--- | :--- | :--- |
| **Ligne 1** | y=82vh (Centre) | `[ POWER UP ]` | Ouvre la **Fenêtre de Gestion 5x5** (PAUSE). | 110 |
| **Ligne 2** | y=90vh (Gauche) | 5 Slots fixes (ex: `🧨x2`) | **Utilisation immédiate** sur la grille. | 110 |
| **Ligne 3** | y=97vh (Centre) | `[ 💰 BOUTIQUE ]` | Ouvre le modal d'achat. | 110 |
| **Fenêtre 5x5** | y=70vh (Overlay) | Tableau complet des 25 Power-ups. | Gestion du stock et équipement vers Ligne 2. | 500 |

## 2. 💥 Tableau des Power-ups (Fenêtre 5x5)

La fenêtre de gestion (ouverte par le bouton `[ POWER UP ]`) affiche le stock total et permet d'équiper les power-ups dans les 5 slots de la Ligne 2.

| Colonne/Slot | 🧨 Cat1 Explosion | ⚡ Cat2 Énergie | 💣 Cat3 Zone | 🌪️ Cat4 Lignes | 🕒 Cat5 Bonus |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ligne 1** | 💣 (3x3) | ⚡⚡ (+30) | 🌪️ (6x6) | ➡️ (H ligne) | 🕒 (+10s) |
| **Ligne 2** | 🔨 (1 case) | 🔋 (+100) | 🌀 (9x9) | ⬇️ (V ligne) | ⏳ (20s pause) |
| **Ligne 3** | 🧨 (rafale) | ⏩ (vitesse) | 💫 (colorbomb) | ↗️ (diago) | 🔮 (vision) |
| **Ligne 4** | 🌩️ (foudre) | 🛡️ (bouclier) | 🕳️ (trou noir) | 🔄 (giratoire) | ⭐ (x2 score) |
| **Ligne 5** | 💥 (5x5 bombe) | ⚡ (max énergie) | 🌋 (volcan x3) | 🎯 (cible précise) | 💎 (double pts) |

**Règle d'Alignement :** La colonne 1 de la fenêtre 5x5 correspond au slot 1 de la Ligne 2, la colonne 2 au slot 2, etc.

## 3. 🖱️ Flux d'Interaction

1.  **Équipement :** Clic sur un power-up dans la Fenêtre 5x5 → Le power-up est équipé dans le slot correspondant de la Ligne 2 (remplaçant l'ancien).
2.  **Utilisation :** Clic sur un slot de la Ligne 2 (`🧨x2`).
    *   Si `x > 0` : Le slot passe en état **ACTIF** (Glow jaune). Le prochain clic sur la grille déclenche l'effet.
    *   Si `x = 0` : Le slot déclenche l'ouverture automatique du modal `[ 💰 BOUTIQUE ]`.
3.  **Boutique :** Le modal `[ 💰 BOUTIQUE ]` permet d'acheter des power-ups, augmentant le stock dans la Fenêtre 5x5.

## 4. 🎨 États Visuels des Slots (Ligne 2)

| État | Visuel | Signification |
| :--- | :--- | :--- |
| **NORMAL** | `🧨x2` (Doré) | Utilisable, mais non actif. |
| **ACTIF** | `🧨🔥x2` (Glow jaune) | Prêt à être utilisé sur la grille (prochain clic = action). |
| **VIDE** | `🧨⛔x0` (Grisé) | Stock épuisé. Clic ouvre la Boutique. |

## 5. ✅ Règles Absolues

*   **Pause** : L'ouverture de la Fenêtre 5x5 met le jeu en `PAUSED`.
*   **Utilisation** : Seuls les 5 slots de la Ligne 2 sont utilisés pour l'action sur la grille.
*   **Alignement** : L'équipement est strictement aligné Colonne ↔ Slot (Col 1 → Slot 1).
*   **Boutique Auto** : Un slot vide de la Ligne 2 ouvre la boutique.