# Roadmap & État du Projet : Game Center Seniors

## 🏁 État Actuel (v1.3 - Résolution Dynamique & Stabilité)

L'architecture est **hybride, robuste et désormais flexible**. L'interface d'administration permet une gestion complète du cycle de vie des jeux, y compris leur résolution native. Le lecteur de jeu s'adapte parfaitement à toutes les configurations.

### 🏗️ Architecture Validée

1.  **Données (Source Unique) :**
    *   **Moteur :** Lowdb (JSON pur).
    *   **Fichier :** `data/db.json` (Persistant via volume Docker).
    *   **Contenu :** Métadonnées des jeux (`games` avec résolution) + Scores globaux (`scores`).

2.  **Fichiers de Jeux (Statique) :**
    *   **Stockage :** Dossier physique `/public/games/{jeu}/{version}/`.
    *   **Accès :** Servis statiquement par Next.js.

### ✅ Fonctionnalités Implémentées

#### 1. Authentification & Admin
*   [x] Page de Login (`/login`) & Protection `/admin`.
*   [x] Détection, Création, Versioning et Upload de jeux.
*   [x] Gestion complète via l'onglet "Gérer" (Liste, Suppression, Édition).
*   [x] Upload de Thumbnails et mise à jour des Métadonnées (Titre/Description).
*   [x] **Nouveau :** Ajout et gestion de la **résolution native (largeur/hauteur)** pour chaque version de jeu.
*   [x] Génération du fichier `index.html` (injection du pont API).

#### 2. API & Scores
*   [x] **POST /api/scores** : Sauvegarde dans Lowdb.
*   [x] **GET /api/scores** : Récupération du Top 10.

#### 3. Frontend Public ("Senior First")
*   [x] **Accueil (`/`)** : Grille de jeux lisible, affichage des meilleurs scores et des images de couverture.
*   [x] **Zone de Jeu (`/play/[id]`)** : **Lecteur de jeu dynamique** qui respecte la résolution native de chaque jeu (ratio d'aspect parfait) et s'adapte à la largeur de l'écran sans déformation ni rognage, grâce à une mise à l'échelle CSS (`transform: scale`).

#### 4. Stabilisation & Corrections
*   [x] **Correction Critique :** Fiabilisation de la sauvegarde des métadonnées (résolution, nom) en uniformisant la gestion des ID (gestion de la casse).
*   [x] **Correction Affichage :** Résolution définitive du problème de rognage de l'iframe par les bordures (`box-sizing`).

### 🐳 Infrastructure Docker

*   **Volumes :** `data` (JSON) et `games` (Fichiers) sont persistants.

---

## 📅 Prochaines Étapes (Backlog)

1.  **Amélioration UI (Mineur) :**
    *   Ajouter un feedback visuel lors du chargement des fichiers volumineux.

2.  **Mode Hors-ligne (PWA) :**
    *   Rendre l'application installable sur tablette.