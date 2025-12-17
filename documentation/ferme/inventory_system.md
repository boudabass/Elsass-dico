# 📦 Système d'Inventaire & Craft (Ferme Nord)

Ce document détaille l'architecture de l'inventaire, des outils et du système de recettes.

## 1. 🎮 HUD Permanent (Rappel)

Le HUD est la porte d'entrée vers l'inventaire via le bouton `📦 INV`.

| Zone | Contenu |
|---|---|
| **HAUT GAUCHE** | Stats Vitales (Énergie, Or, Heure) |
| **HAUT CENTRE** | Timeline (Jours/Saisons) |
| **HAUT DROITE** | Boutons d'Action (INV, MAP, MENU) |
| **BAS GAUCHE** | Slots de Graines (16 slots fixes) |
| **BAS DROITE** | Slots d'Outils (6 slots fixes) |

---

## 2. 📦 STRUCTURE ONGLETS NAVIGATEUR (Système Unifié)

L'inventaire s'ouvre dans un modal avec trois onglets principaux.

```text
┌────────────────────────────── ONGLES ──────────────────────────────┐
│ [🌱 GRAINES*]  [⚙️ OUTILS]  [🧺 LOOT]                              │
├───────────────────────────────────────────────────────────────────┤
│ PERSO              │ COFFRE                                        │
│ [Catégories x Items] │ [Catégories x Items]                         │
└───────────────────────────────────────────────────────────────────┘
```

**Navigation :** Tap onglet → surlignage jaune
**Échange :** Clic item PERSO ↔ COFFRE → Choix quantité → Transfert slot identique

### 🌱 ONGLET GRAINES : 16 Slots Fixes (4 Saisons x 4 Items)

| Saison | Item 1 | Item 2 | Item 3 | Item 4 |
|---|---|---|---|---|
| 🪵 PRINTEMPS | 🌱Pomme de terre | 🌱Poireau | 🌱Chou | 🌱Radis |
| ☀️ ÉTÉ | 🌱Bleuets | 🌱Haricots | 🌱Piment | 🌱Melon |
| 🍂 AUTOMNE | 🌱Aubergine | 🌱Potiron | 🌱Citrouille | 🌱Champignon |
| ❄️ HIVER | 🌱Ail | 🌱Artichaut | [Vide] | [Vide] |

**Règles :**
*   Stack max : 99
*   Gameplay : Seules les graines de la Saison active sont utilisables (les autres sont grisées).

### ⚙️ ONGLET OUTILS : 6 Outils x 4 Améliorations

| Outil | LV1 | LV2 | LV3 | LV4 |
|---|---|---|---|---|
| 💧 Arrosoir | ✓ | [ ] | [ ] | [ ] |
| ⛏️ Pioche | ✓ | [ ] | [ ] | [ ] |
| 🪓 Hache | ✓ | [ ] | [ ] | [ ] |
| 🗡️ Épée | ✓ | [ ] | [ ] | [ ] |
| ✨ Baguette | ✓ | [ ] | [ ] | [ ] |
| 🔧 Special | [ ] | [ ] | [ ] | [ ] |

**Règles :**
*   1 outil actif max (sélectionné dans le HUD Bas-Droite).
*   Améliorations (Lv2, Lv3, Lv4) obtenues via le Craft (Machine : Recherche).

### 🧺 ONGLET LOOT : 24 Slots (6 Catégories x 4 Items)

| Catégorie | Item 1 | Item 2 | Item 3 | Item 4 |
|---|---|---|---|---|
| 🪵 BOIS | Bûches | Charbon | Planche | Bâton |
| ⛏️ PIERRE | Pierre | Béton | Brique | Gravier |
| ⚔️ MÉTAL | Fer Ore | Fer Ingot | Cuivre Ore | Cuivre Ingot |
| 🏭 MACHINES | Établi | Four | Herbaliste | Recherche |
| 🌿 NATURE | Baies | Champignon | Herbe | Fleur |
| 🧪 POTIONS | Santé | Énergie | Vitesse | Force |

**Règles :**
*   Stack max : 999
*   Tri auto : Catégorie + alphabétique.

---

## 3. 🔄 SYSTÈME ÉCHANGE PERSO ↔ COFFRE (Choix Quantité)

1.  Clic item PERSO → Mini-modal quantité (0.1s pop-up).
2.  Slider + boutons : `[1] [10] [50] [MAX]`.
3.  Confirmer → Transfert **AUTOMATIQUE** vers le slot identique dans l'autre inventaire (COFFRE ou PERSO).
4.  Règle : Slot identique obligatoire (Graine Printemps #1 ↔ Graine Printemps #1).

---

## 4. 🔨 TABLEAU RECETTES (20 Recettes Rééquilibrées)

| Catégorie | Machine | Résultat | Ing1 | Ing2 | Ing3 |
|---|---|---|---|---|---|
| 🪵 BOIS | Four | 8 Charbon | 1 Bûche | - | - |
| 🪵 BOIS | Établi | 2 Planche | 1 Bûche | - | - |
| 🪵 BOIS | Établi | 4 Bâton | 1 Planche | - | - |
| ⛏️ PIERRE | Établi | 1 Béton | 8 Pierre | - | - |
| ⛏️ PIERRE | Établi | 2 Brique | 1 Béton | - | - |
| ⛏️ PIERRE | Établi | 4 Gravier | 1 Brique | - | - |
| ⚔️ MÉTAL | Four | 1 Fer Ingot | 2 Fer Ore | 1 Charbon | - |
| ⚔️ MÉTAL | Four | 1 Cuivre Ingot | 2 Cuivre Ore | 1 Charbon | - |
| 🏭 MACHINES | Établi | 1 Établi | 4 Planche | 1 Béton | - |
| 🏭 MACHINES | Établi | 1 Four | 2 Béton | 8 Brique | - |
| 🏭 MACHINES | Établi | 1 Herbaliste | 2 Béton | 3 Gravier | 1 Bâton |
| 🔬 OUTILS | Recherche | Pioche Lv1 | 3 Fer Ingot | 2 Bâton | - |
| 🔬 OUTILS | Recherche | Hache Lv1 | 3 Fer Ingot | 2 Bâton | - |
| 🔬 OUTILS | Recherche | Arrosoir Lv1 | 2 Cuivre Ingot | 1 Bâton | - |
| 🔬 OUTILS | Recherche | Baguette Lv1 | 4 Cuivre Ingot | 4 Gravier | 2 Bâton |
| 🌿 POTIONS | Herbaliste | 1 Santé | 5 Baies | - | - |
| 🌿 POTIONS | Herbaliste | 1 Énergie | 5 Champignon | - | - |
| 🌿 POTIONS | Herbaliste | 1 Vitesse | 5 Herbe | - | - |
| 🌿 POTIONS | Herbaliste | 1 Force | 5 Fleur | - | - |

---

## 5. ✅ SYSTÈME INVENTAIRE v1.5 - RÈGLES ABSOLUES

*   ✅ Onglets NAVIGATEUR HAUT (🌱⚙️🧺) - Pictos 32x32px
*   ✅ GRAINES : 4x4 saisons = 16 slots FIXES
*   ✅ OUTILS : 6x4 améliorations (craft Recherche)
*   ✅ LOOT : 6x4 catégories = 24 slots
*   ✅ Échange PERSO↔COFFRE : CLIC → CHOIX QUANTITÉ → Slot identique AUTO
*   ✅ Mini-modal quantité : `[1] [10] [50] [MAX]` + slider tactile
*   ✅ Ratios parfaits 1=2=4=8 (Bois/Pierre progressif)
*   ✅ 20 recettes logiques interconnectées
*   ✅ Modal 0.2s fade-in/out | Auto-close terrain tap
*   ❌ Pas de drag&drop
*   ❌ Pas de réorganisation libre
*   ❌ Pas de fusion stacks
*   ❌ Pas de vente directe
*   ❌ Pas de recherche/filtres
*   ❌ Pas de catégories custom

---

## 6. 🧩 INVENTORY SYSTEM – Architecture Générale (v1.0)

L’Inventory System est le noyau logique qui gère la possession, le stockage et le transfert des objets entre le joueur et les coffres.
Il relie le HUD permanent, le modal inventaire, et les machines de craft de manière unifiée.

### 🎮 A. Principe central

L’inventaire n’est pas un sac, mais une grille catégorisée stable, divisée en trois ensembles :

*   🌱 **Graines** → Gestion de la production agricole.
*   ⚙️ **Outils** → Gestion de l’action physique.
*   🧺 **Loot** → Gestion des ressources et matériaux.

Chaque ensemble suit sa propre logique de progression mais reste synchronisé visuellement et en mémoire player/coffre.

### 🔄 B. États et interactions principales

| Action | Description | Résultat |
|---|---|---|
| Ouvrir | Tap sur 📦 INV (HUD haut-droit) | Ouverture modal inventaire (fade-in 0.2s). |
| Changer d’onglet | Tap sur [🌱], [⚙️], [🧺] | Changement d’ensemble, surlignage jaune. |
| Sélection item | Tap sur slot actif | Mini-modal quantité. |
| Transfert | Choix quantité + validation | Mouvement automatique vers slot identique du coffre. |
| Fermeture | Tap hors modal ou MENU | Anim fade-out 0.2s + retour au jeu. |

### ⚙️ C. Structure logique interne (conceptuelle)

L’Inventory System maintient une symétrie stricte :

| Couche logique | Rôle principal | Contenu |
|---|---|---|
| PlayerInventory | Données joueur | 3 tableaux fixes (Seeds, Tools, Loot) |
| ChestInventory | Données stockage local | 3 tableaux identiques |
| InventoryModal | Interface | Onglets, slots, interactions |
| InventoryManager | Contrôleur | Gère les transferts, quantités, synchro HUD |
| CraftingLink | Connecteur | Vérifie les ressources disponibles avant craft |

Synchronisation : les deux inventaires (perso/coffre) restent en miroir de structure → validation de compatibilité instantanée sans parsing complexe.

### 🧭 D. Règles de cohérence UX (mobilité et lisibilité)

*   Tap-only, aucune gestuelle complexe ou long press.
*   Slots figés : position = identité (pas d’ordre libre).
*   Iconographie uniforme (pictos 32x32px, label minimal).
*   Feedback clair : son/clignotement à chaque interaction.
*   Latence max 0.2s entre action et résultat visuel.
*   Fermeture instantanée dès qu’un tap terrain est détecté.

### 🪄 E. Vision du système à terme

L’inventaire devient une extension naturelle du HUD, non une interface séparée.
Le joueur ne « cherche » jamais ses items — il les reconnaît visuellement.
L’efficacité repose sur la stabilité :

*   même structure, même réaction, même feedback, quel que soit le contexte.