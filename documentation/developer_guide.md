# 📘 Guide Développeur - Création de Jeux pour la Plateforme

Bienvenue ! Ce guide explique comment rendre ton jeu compatible avec notre plateforme (Game Center).
Nous utilisons un système standardisé appelé **GameSystem**.

## 1. Structure Requise

Chaque jeu doit être autonome dans son dossier. La structure minimale est :

```text
mon-jeu/v1/
├── index.html          (Point d'entrée obligatoire)
├── main.js             (Logique de ton jeu)
├── thumbnail.png       (Image d'aperçu 400x300px)
├── description.md      (Description courte pour le menu)
└── assets/             (Tes images, sons, etc.)
```

## 2. Configuration (`index.html`)

Ton fichier `index.html` **doit** inclure le script de configuration ET le script système **avant** tes propres scripts.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Jeu</title>
    <style> body { margin: 0; overflow: hidden; background: #000; } </style>
    
    <!-- Bibliothèques (ex: p5.js) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
</head>
<body>

    <!-- 1️⃣ CONFIGURATION OBLIGATOIRE -->
    <script>
        window.DyadGame = { 
            id: 'mon-jeu-v1',   // Doit être unique (minuscules, tirets)
            version: 'v1'       // Version du dossier
        };
    </script>

    <!-- 2️⃣ CHARGEMENT DU SYSTÈME (Ne pas modifier ce chemin) -->
    <script src="../../system/system.js"></script>

    <!-- 3️⃣ TON JEU -->
    <script src="main.js"></script>
</body>
</html>
```

## 3. L'API `GameSystem`

Une fois le système chargé, tu as accès à l'objet global `window.GameSystem`.

### 🏆 Gestion des Scores

Utilise le module `GameSystem.Score` pour gérer la progression du joueur.

#### Envoyer un score
Appelle cette méthode quand le joueur perd ou termine une partie.

```javascript
// async submit(score: number, playerName?: string)
await window.GameSystem.Score.submit(1500); 

// Exemple dans une boucle de jeu p5.js
function gameOver() {
    window.GameSystem.Score.submit(score);
    noLoop();
}
```

#### Récupérer les meilleurs scores (Leaderboard)

```javascript
// async getLeaderboard() -> Array<{ playerName, score, date }>
const highScores = await window.GameSystem.Score.getLeaderboard();
console.log(highScores[0]); // Affiche le meilleur score
```

### 🖥️ Affichage & Outils

#### Mode Plein Écran
Permet de basculer le jeu en plein écran sans code complexe.

```javascript
window.GameSystem.Display.toggleFullscreen();
```

---

## ⚠️ Règles Importantes
1.  **Pas de Backend Custom :** Ton jeu doit être 100% statique (JS/HTML/CSS).
2.  **Chemins Relatifs :** Utilise toujours `./assets/image.png`, jamais `/games/mon-jeu/...`.
3.  **Propreté :** N'utilise pas `localStorage` pour les données critiques, elles seront perdues si le cache est vidé. Utilise `GameSystem.Score`.
