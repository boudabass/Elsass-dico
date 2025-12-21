# 🌾 Farming System Global (v1.3)

Ce document centralise toutes les règles régissant l'agriculture, les grilles et les machines dans Elsass Farm.
Il remplace les anciens fichiers `farming_nord` et `farming_sud`.

## 1. 🏗️ Architecture Grille Unifiée (Standard)

Pour optimiser la base de données et la lisibilité mobile, toutes les zones agricoles suivent strictement ce format.

| Propriété | Ancienne Valeur | **Nouvelle Valeur (v1.3)** | Impact |
| :--- | :--- | :--- | :--- |
| **Dimensions** | 10 x 10 (100 cases) | **4 x 4 (16 cases)** | DB ÷ 6, Meilleure perf |
| **Taille Visuelle** | 64px / case | **160px / case** | Occupé même espace écran |
| **Interaction** | Clic précis | **Gros Tap** | Accessibilité Senior |

---

## 2. 📍 Zones Agricoles

### A. Ferme Nord (Cultures)
Zone dédiée à la plantation.
*   **Contenu :** 16 Tuiles de terre cultivable.
*   **Logique :** Cycle de croissance organique (voir ci-dessous).

### B. Ferme Sud (Industrie)
Zone dédiée à la transformation.
*   **Contenu :** 16 Emplacements pour machines.
*   **Logique :** Les machines sont **FIXES** (non déplaçables).
*   **Layout 4x4 :**
    *   Ligne 1 : 🪵 Établis (Bois/Pierre)
    *   Ligne 2 : 🔥 Fours (Métaux)
    *   Ligne 3 : 🌿 Herbalisterie (Potions)
    *   Ligne 4 : 🔬 Recherche / Stockage

---

## 3. 🌱 Cycle de Culture (Nord)

### Logique Visuelle (Strict)
Pour éviter la confusion "Est-ce que c'est prêt ?", la couleur du sol indique l'état du terrain, et la taille de l'icône indique l'avancement.

| État | Couleur Sol (Fond) | Icône Plante (Taille) | Signification |
| :--- | :--- | :--- | :--- |
| **EMPTY** | Marron Clair | *(Vide)* | Terre vierge. |
| **PLANTED** | **Marron Foncé** | 🌱 Petite (30%) | Planté, sec. **À arroser !** |
| **GROWING** | **Marron Foncé** | 🌿 Moyenne (40-90%) | En cours, sec. **À arroser !** |
| **WATERED** | **Marron + Teinte Bleue** | (Taille inchangée) | Terre mouillée. Poussera cette nuit. |
| **READY** | **VERT VIF** | 🥗 Max (100%) | **PRÊT ! Récolter.** |

> **Règle d'Or :** Tant que le fond n'est pas VERT, ce n'est pas prêt. Tant que le fond n'est pas BLEUTÉ, ça ne poussera pas.

### Progression Dynamique (Taille)
L'icône grandit visuellement chaque jour pour montrer la vie.
*   *Formule :* `Taille = map(jours, 0, 10, 30px, 100px)`
*   J0 : Graine minuscule.
*   J5 : Pousse moyenne.
*   J10 : Plante massive (remplit la case).

### Actions & Coûts
| Action | Outil | Énergie | Effet Stock |
| :--- | :--- | :--- | :--- |
| **Planter** | Plante | -4 ⚡ | **-1** (Graine utilisée) |
| **Arroser** | Arrosoir | -2 ⚡ | 0 |
| **Récolter**| Main | -1 ⚡ | **+2** (Auto-suffisance) |

---

## 4. 🏭 Cycle Industriel (Sud)

Les machines transforment les ressources brutes (Loot) ou les récoltes.

### Interface Machine
Tap sur une machine → Ouvre un modal unifié "4 Slots + Résultat".
*   *Input :* Ressources depuis l'inventaire.
*   *Output :* Vers l'inventaire (lendemain).

### Cycle de Production
Contrairement aux plantes qui demandent de l'arrosage actif, les machines travaillent seules la nuit.
1.  Joueur dépose ressources.
2.  Joueur dort (Nuit).
3.  Machine traite (+1 jour).
4.  Lendemain : Produit prêt (Flash Vert).

---

## 5. ☀️ Gestion Saisons & Temps

*   **Saisons :**
    *   Les plantes ont une saison stricte (ex: Tomate = Été).
    *   Planter hors saison = Impossible.
    *   Changement de saison = Mort des cultures en cours (Reset case).
*   **Nuit (Calcul) :**
    *   C'est le moment où le serveur/jeu calcule la croissance.
    *   `Si (Watered == true) alors GrowthStage++`
    *   `Watered = false` (La terre sèche le matin).

---

## 6. 📦 Inventaire Unifié (Rappel)

Il n'y a pas de distinction "Graine" vs "Fruit".
*   **Item :** "Pomme de Terre".
*   **Usage 1 :** Planter (Graine).
*   **Usage 2 :** Vendre/Cuisiner (Récolte).
*   **Usage 3 :** Transformer (Machine Sud -> Vodka/Chips).