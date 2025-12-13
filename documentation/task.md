# Journal des Tâches - Mise en place du Frontend Public

Ce document recense les modifications effectuées pour transformer le backend d'administration en une plateforme de jeu utilisable par des seniors.

## 1. Analyse & Stratégie
*   **Constat initial :** Architecture backend (Lowdb/Admin) validée et robuste. Frontend public inexistant.
*   **Philosophie UX :** "Senior First". Priorité à la lisibilité, aux gros boutons, et à la prévention des erreurs de navigation.

## 2. Réalisations Techniques

### Backend (Server Actions)
*   **`src/app/actions/get-public-games.ts`** : Création d'une fonction d'agrégation. Elle lit `db.json`, récupère la liste des jeux et croise les données avec la table `scores` pour extraire le "Record à battre" en une seule passe.
*   **`src/app/actions/get-game.ts`** : Création d'une fonction simple pour récupérer les métadonnées d'un jeu spécifique par son ID.
*   **`src/app/actions/game-manager.ts`** :
    *   Ajout de `uploadGameThumbnail` pour gérer les images de couverture.
    *   Ajout de `deleteGame` et `deleteVersion` pour le nettoyage complet (Fichiers + DB).

### Frontend (Interface Utilisateur)
*   **Page d'Accueil (`src/app/page.tsx`)** :
    *   Remplacement de la page par défaut par une **Grille de Jeux**.
    *   **Design Card** : Visuels larges, Titres en 24px+, affichage proéminent du Meilleur Score.
    *   **Comportement** : Clic unique sur un gros bouton "JOUER" pour lancer la partie.

*   **Page de Jeu (`src/app/play/[gameId]/page.tsx`)** :
    *   Création de la route dynamique.
    *   **Layout Immersif** : Fond sombre pour focaliser l'attention sur le jeu.
    *   **Iframe Sécurisée** : Isolation du code p5.js.
    *   **Gestion du Focus** : Composant `GamePlayer` qui force le focus sur le jeu pour garantir que le clavier et la souris répondent immédiatement.
    *   **Sécurité Navigation** : Ajout d'un bandeau supérieur avec un **bouton "QUITTER LE JEU" Rouge et Massif** pour un retour facile à l'accueil.

*   **Admin (`/admin`)** :
    *   Upload d'images de couverture (Thumbnails).
    *   Suppression de jeux et de versions.

## 3. État d'Avancement

| Composant | État | Notes |
| :--- | :---: | :--- |
| **Admin Core** | ✅ | Détection, Création, Génération index.html |
| **Admin Actions** | ✅ | Upload Thumbnails, Suppression Jeux/Versions |
| **API Scores** | ✅ | GET/POST vers Lowdb |
| **Accueil Public** | ✅ | Grille, Top Scores, Navigation, Affichage Images |
| **Lecteur Jeu** | ✅ | Iframe, Bouton Sortie, **Focus Inputs Fonctionnel** |
| **Gestion Images** | ✅ | Upload admin fonctionnel et rendu public OK |

## 4. Prochaines Étapes Prioritaires
1.  **Mode Hors-ligne (PWA)** : Rendre l'application installable sur tablette pour une utilisation sans internet constant.
2.  **Amélioration UI** : Ajouter des feedbacks visuels (toast/loader) plus précis lors de l'upload de gros fichiers.