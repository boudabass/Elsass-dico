# 📘 Guide Développeur - Création de Jeux pour la Plateforme (Standard p5.js + p5.play)

Bienvenue ! Ce guide explique comment rendre ton jeu compatible avec notre plateforme (Game Center).
Nous utilisons un système standardisé qui repose sur **p5.js** et la librairie **p5.play (version classique)**.

## 1. Structure Requise

Chaque jeu doit être autonome dans son dossier. La structure minimale est :

```text
mon-jeu/v1/
├── index.html          (Point d'entrée obligatoire)
├── sketch.js           (Logique de ton jeu)
├── thumbnail.png       (Image d'aperçu 400x300px)
└── assets/             (Tes images, sons, etc.)
```

## 2. Configuration (`index.html`) - CRITIQUE

Ton fichier `index.html` **doit** inclure les bonnes librairies dans le bon ordre.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Jeu</title>
    <style> body { margin: 0; overflow: hidden; background: #000; } </style>
    
    <!-- CONFIGURATION DU JEU -->
    <script>
        window.DyadGame = { 
            id: 'mon-jeu-v1',   // Doit être unique (minuscules, tirets)
            version: 'v1'
        };
    </script>

    <!-- LIBRAIRIES : p5.js + p5.play classique -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
    <script src="https://p5play.org/packages/p5play.js"></script>

    <!-- SYSTÈME DE LA PLATEFORME -->
    <script src="/system/system.js"></script>

    <!-- TON JEU -->
    <script src="sketch.js"></script>
</head>
<body>
</html>
```

## 3. Stabilité et Performance (Règles d'Or)

Pour garantir une expérience fluide et compatible pour tous, chaque jeu doit :

1.  **Utiliser le rendu 2D par défaut.**
    C'est automatique tant que vous utilisez `createCanvas(width, height)`. N'ajoutez pas le paramètre `WEBGL`.

2.  **Limiter la cadence de rendu.**
    C'est crucial pour l'accessibilité et l'économie de batterie. Une valeur de `30` est recommandée.
    ```javascript
    function setup() {
        createCanvas(800, 600);
        frameRate(30); // Stabilise l'expérience
    }
    ```

## 4. L'API `GameSystem` et la Boucle de Jeu

Une fois le système chargé, tu as accès à l'objet global `window.GameSystem`.

### 🏆 Gestion des Scores

#### Envoyer un score
Appelle cette méthode quand le joueur perd ou termine une partie.

```javascript
function gameOver() {
    const finalScore = 1500;
    if (window.GameSystem) {
        window.GameSystem.Score.submit(finalScore);
    }
}
```

#### Récupérer les meilleurs scores (Leaderboard)

```javascript
async function showHighScores() {
    if (window.GameSystem) {
        const highScores = await window.GameSystem.Score.getLeaderboard();
        console.log(highScores[0]); // Affiche le meilleur score
    }
}
```

### 🖥️ Affichage & Outils

#### Mode Plein Écran
Permet de basculer le jeu en plein écran.

```javascript
window.GameSystem.Display.toggleFullscreen();