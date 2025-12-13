# Game Center Seniors

Bienvenue sur le Game Center, une plateforme de jeux web conçue pour être simple, accessible et amusante, spécialement pensée pour nos aînés.

---

##  Partie 1 : Présentation (Pour Tous)

### 🎯 Notre Mission !

Offrir un espace de divertissement numérique clair et facile d'accès. Chaque jeu est présenté de manière lisible, avec de gros boutons pour lancer une partie en un seul clic. L'objectif est de s'amuser sans se perdre dans des menus compliqués.

### ✨ Fonctionnalités Principales

*   **Bibliothèque de Jeux Visuelle :** Parcourez les jeux disponibles via une grille simple avec des images et des descriptions claires.
*   **Lancement Instantané :** Cliquez sur "JOUER" et la partie commence immédiatement, sans installation ni configuration.
*   **Tableau des Records :** Chaque jeu affiche le meilleur score à battre, ajoutant un petit défi amical.
*   **Interface Administrateur Sécurisée :** Un panneau de contrôle protégé par mot de passe permet de gérer facilement les jeux de la plateforme.

### 🏗️ Comment ça Marche ?

L'application repose sur une philosophie de simplicité :
1.  Les **jeux** sont des fichiers statiques (souvent des projets p5.js) stockés directement sur le serveur.
2.  Les **scores** et les informations sur les jeux sont centralisés dans une base de données très légère (un simple fichier JSON), ce qui rend le système robuste et facile à maintenir.

---

## Partie 2 : Guide Technique (Pour les Développeurs)

Cette section détaille comment lancer, gérer et modifier l'application.

### 📋 Prérequis

*   **Docker & Docker Compose :** Indispensables pour lancer l'environnement de développement et de production.
*   **Node.js :** Utile pour la gestion des dépendances si vous modifiez le code source de l'application Next.js.

### 🚀 Lancement en Local avec Docker

1.  **Configuration de l'Environnement :**
    Copiez le fichier d'exemple `.env.example` vers un nouveau fichier nommé `.env`.
    ```bash
    cp .env.example .env
    ```
    Ouvrez `.env` et remplissez les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Elles sont **obligatoires** pour que l'authentification du panneau d'administration fonctionne.

2.  **Démarrer l'Application :**
    Exécutez la commande suivante à la racine du projet :
    ```bash
    docker compose up -d
    ```
    Cette commande va :
    *   Construire l'image Docker de l'application Next.js.
    *   Démarrer un conteneur.
    *   Mapper le port `3000` de votre machine au port `3000` du conteneur.
    *   Monter les volumes pour la persistance des données et des jeux.

3.  **Accéder à l'Application :**
    *   **Accueil public :** [http://localhost:3000](http://localhost:3000)
    *   **Panneau d'administration :** [http://localhost:3000/admin](http://localhost:3000/admin)

4.  **Arrêter l'Application :**
    ```bash
    docker compose down
    ```

### 🔧 Gérer et Modifier l'Application

La gestion de l'application se divise en deux aspects : le contenu (les jeux) et le code (la plateforme Next.js).

#### 1. Gérer les Jeux (via l'Interface d'Admin)

C'est la méthode privilégiée pour toute gestion de contenu. Connectez-vous sur `/admin` pour :

*   **Créer un nouveau jeu :** Crée automatiquement le dossier et l'entrée en base de données.
*   **Ajouter une version :** Permet de gérer plusieurs versions d'un même jeu (ex: `v1`, `v2`).
*   **Uploader des fichiers :** Déposez vos fichiers `sketch.js`, `index.html`, images, sons, etc. directement dans le bon dossier.
*   **Générer `index.html` :** Le système peut générer un fichier `index.html` de base pour les jeux p5.js ou **injecter intelligemment l'API de score** dans un `index.html` existant sans l'écraser.
*   **Modifier les Métadonnées :** Changez le nom, la description et la résolution native d'un jeu.

Les fichiers que vous uploadez sont stockés dans `public/games/`, qui est un volume Docker persistant.

#### 2. Modifier le Code Source de la Plateforme

Si vous souhaitez modifier l'application Next.js elle-même :

*   **Structure des Dossiers Clés :**
    *   `src/app/` : Contient les pages principales (accueil, admin, page de jeu).
    *   `src/app/api/` : Logique des routes d'API (ex: gestion des scores).
    *   `src/app/actions/` : Fonctions serveur pour la gestion des jeux (`game-manager.ts`).
    *   `src/lib/database.ts` : Définit le schéma de la base de données `lowdb`.
    *   `src/components/` : Composants React réutilisables.

*   **Base de Données (`lowdb`) :**
    *   Le fichier `data/db.json` est la source de vérité unique pour les scores et les métadonnées des jeux.
    *   Il est géré par un volume Docker, donc les données sont persistantes entre les redémarrages du conteneur.
    *   Les interactions avec ce fichier se font via les fonctions dans `src/lib/database.ts` et les routes API.