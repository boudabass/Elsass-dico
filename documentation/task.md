# Journal des Tâches - Mise en place du Frontend Public

Ce document recense les modifications effectuées pour transformer le backend d'administration en une plateforme de jeu utilisable par des seniors.

## 1. Analyse & Stratégie
*   **Constat initial :** Architecture backend (Lowdb/Admin) validée et robuste. Frontend public inexistant.
*   **Philosophie UX :** "Senior First". Priorité à la lisibilité, aux gros boutons, et à la prévention des erreurs de navigation.

## 2. Réalisations Techniques

### Backend (Server Actions)
*   **`src/app/actions/get-public-games.ts`** : Création d'une fonction d'agrégation. Elle lit `db.json`, récupère la liste des jeux et croise les données avec la table `scores` pour extraire le "Record à battre" en une seule passe.
*   **`src/app/actions/get-game.ts`** : Création d'une fonction simple pour récupérer les métadonnées d'un jeu spécifique par son ID.

### Frontend (Interface Utilisateur)
*   **Page d'Accueil (`src/app/page.tsx`)** :
    *   Remplacement de la page par défaut par une **Grille de Jeux**.
    *   **Design Card** : Visuels larges, Titres en 24px+, affichage proéminent du Meilleur Score.
    *   **Comportement** : Clic unique sur un gros bouton "JOUER" pour lancer la partie.

*   **Page de Jeu (`src/app/play/[gameId]/page.tsx`)** :
    *   Création de la route dynamique.
    *   **Layout Immersif** : Fond sombre pour focaliser l'attention sur le jeu.
    *   **Iframe** : Chargement du fichier `index.html` généré par l'admin (isolation du code p5.js).
    *   **Sécurité Navigation** : Ajout d'un bandeau supérieur avec un **bouton "QUITTER LE JEU" Rouge et Massif** pour un retour facile à l'accueil.

## 3. État d'Avancement

| Composant | État | Notes |
| :--- | :---: | :--- |
| **Admin** | ✅ | Détection dossiers, Génération index.html, Upload fichiers |
| **API Scores** | ✅ | GET/POST vers Lowdb |
| **Accueil Public** | ✅ | Grille, Top Scores, Navigation |
| **Lecteur Jeu** | ✅ | Iframe, Bouton Sortie |
| **Gestion Images** | ❌ | Les jeux affichent des placeholders gris. L'upload de thumbnails est manquant dans l'admin. |

## 4. Prochaines Étapes Prioritaires
1.  **Admin** : Ajouter la fonctionnalité d'upload et de gestion des Thumbnails (images de couverture).
2.  **Admin** : Ajouter la suppression de jeux.