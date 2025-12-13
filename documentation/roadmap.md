# Roadmap & État du Projet : Game Center Seniors

## 🏁 État Actuel (v1.2 - Admin Complet)

L'architecture est **hybride et robuste**. L'interface d'administration permet désormais une gestion complète du cycle de vie des jeux.

### 🏗️ Architecture Validée

1.  **Données (Source Unique) :**
    *   **Moteur :** Lowdb (JSON pur).
    *   **Fichier :** `data/db.json` (Persistant via volume Docker).
    *   **Contenu :** Métadonnées des jeux (`games`) + Scores globaux (`scores`).

2.  **Fichiers de Jeux (Statique) :**
    *   **Stockage :** Dossier physique `/public/games/{jeu}/{version}/`.
    *   **Accès :** Servis statiquement par Next.js.

### ✅ Fonctionnalités Implémentées

#### 1. Authentification & Admin
*   [x] Page de Login (`/login`) & Protection `/admin`.
*   [x] Détection, Création, Versioning et Upload de jeux.
*   [x] **Nouveau :** Gestion complète via l'onglet "Gérer" (Liste, Suppression, Édition).
*   [x] **Nouveau :** Upload simplifié des Thumbnails et mise à jour des Métadonnées (Titre/Description).
*   [x] Génération du fichier `index.html` (injection du pont API).

#### 2. API & Scores
*   [x] **POST /api/scores** : Sauvegarde dans Lowdb.
*   [x] **GET /api/scores** : Récupération du Top 10.

#### 3. Frontend Public ("Senior First")
*   [x] **Accueil (`/`)** : Grille de jeux lisible, affichage des meilleurs scores et des images de couverture.
*   [x] **Zone de Jeu (`/play/[id]`)** : Mode plein écran immersif (iframe) avec bouton de sortie sécurisé.

### 🐳 Infrastructure Docker

*   **Volumes :** `data` (JSON) et `games` (Fichiers) sont persistants.

---

## 📅 Prochaines Étapes (Backlog)

1.  **Amélioration UI (Mineur) :**
    *   Ajouter un feedback visuel lors du chargement des fichiers volumineux.

2.  **Mode Hors-ligne (PWA) :**
    *   Rendre l'application installable sur tablette.