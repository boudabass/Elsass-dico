# Cahier des Charges - Game Center Seniors (Architecture 100% Lowdb)

## 🎯 Objectif
Plateforme ludique pour seniors avec une architecture centralisée.
**Règle d'Or : TOUTES les données (Métadonnées des jeux + Scores des joueurs) sont stockées EXCLUSIVEMENT dans Lowdb (`data/db.json`).**

## 🏗️ Architecture Technique

### Stockage (Source de Vérité Unique)
*   **Base de données :** Lowdb (JSON local).
*   **Fichier :** `data/db.json` (Persistant via Docker Volume).
*   **Contenu :**
    *   `games`: Liste des jeux installés, versions, chemins, descriptions.
    *   `scores`: Historique complet des scores de tous les joueurs.

### Flux de Données (Le "Pont")
1.  **Jeu (Client/Iframe)** : Le jeu p5.js tourne dans le navigateur.
2.  **Pont (window.GameAPI)** : `index.html` injecte un script qui expose `saveScore()` et `getHighScores()`.
3.  **Transport** : `fetch('/api/scores')` envoie les données au serveur Next.js.
4.  **Serveur (API)** : Next.js reçoit la requête, ouvre Lowdb, et écrit dans `data/db.json`.

**Il n'y a PAS de LocalStorage pour les données persistantes.**

## 📂 Structure des Fichiers (Statique + Logique)

Le serveur sert les fichiers, la DB gère les données.

```text
public/games/tetris/v1/
├── index.html     ← GÉNÉRÉ PAR ADMIN. Contient le script de liaison vers Lowdb.
├── sketch.js      ← Logique du jeu (p5.js). Appelle GameAPI.saveScore().
├── data.js        ← Données statiques du jeu.
└── hud.js         ← Interface. Affiche les scores récupérés via GameAPI.getHighScores().
```

## 🔐 Fonctionnalités & Routes

### /games (Public)
*   Lit **Lowdb** pour afficher la grille des jeux disponibles.
*   Affiche le "Meilleur Score Global" pour chaque jeu (depuis **Lowdb**).

### /games/[id] (Joueur)
*   Charge l'iframe du jeu.
*   L'iframe charge les High Scores depuis **Lowdb** via l'API pour les afficher dans le HUD.
*   À la fin de la partie, le score est envoyé dans **Lowdb**.

### /admin (Privé)
*   **Création** : Créer un dossier physique ET une entrée dans **Lowdb** (`games`).
*   **Upload** : Ajoute les fichiers `.js` dans le dossier.
*   **Génération** : Crée le `index.html` qui contient l'ID unique du jeu pour faire le lien avec **Lowdb**.

## 💾 Schéma Lowdb (`data/db.json`)

```json
{
  "games": [
    {
      "id": "tetris-v1",
      "name": "Tetris",
      "path": "tetris/v1",
      "version": "v1",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "scores": [
    {
      "gameId": "tetris-v1",
      "playerName": "Mamie Lucette",
      "score": 1500,
      "date": "2024-01-02T14:30:00Z"
    }
  ]
}
```

## 🚀 Résumé du Workflow Admin

1.  Admin clique "Nouveau Jeu : Snake".
    *   -> Création dossier `public/games/snake/v1`.
    *   -> Ajout entrée `{ id: "snake-v1", ... }` dans **Lowdb**.
2.  Admin upload `sketch.js`, `hud.js`.
3.  Admin clique "Générer".
    *   -> Création `index.html` avec `<script>window.gameId = "snake-v1"</script>`.
4.  Jeu prêt. Quand un joueur joue, le score part dans **Lowdb** avec l'ID "snake-v1".