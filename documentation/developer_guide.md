# 📘 Guide Développeur - Création de Jeux pour la Plateforme

Bienvenue ! Ce guide explique comment rendre ton jeu compatible avec notre plateforme (Game Center).
Nous utilisons un système standardisé appelé **GameSystem** et nous recommandons fortement la stack **p5.js + p5play v3**.

## 1. Stack Technique Recommandée

Pour une intégration rapide et robuste, nous recommandons :
*   **Moteur de rendu :** p5.js
*   **Moteur physique & sprites :** p5play v3
*   **Communication :** GameSystem Hub (`system.js`)

Consultez les `documentation/patterns/` pour des exemples de code et des bonnes pratiques avec p5play.

## 2. Structure Requise

Chaque jeu doit être autonome dans son dossier. La structure minimale est :

```text
mon-jeu/v1/
├── index.html          (Point d'entrée obligatoire)
├── main.js             (Logique de ton jeu)
├── thumbnail.png       (Image d'aperçu 400x300px)
├── description.md      (Description courte pour le menu)
└── assets/             (Tes images, sons, etc.)
```

## 3. Configuration (`index.html`)

Ton fichier `index.html` **doit** inclure le script de configuration ET le script système **avant** tes propres scripts.

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Jeu</title>
    <style> body { margin: 0; overflow: hidden; background: #000; } </style>
</head>
<body>
    <!-- 1️⃣ Bibliothèques (p5.js + p5play) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
    <script src="https://p5play.org/v3/p5play.js"></script>

    <!-- 2️⃣ CONFIGURATION OBLIGATOIRE -->
    <script>
        window.DyadGame = { 
            id: 'mon-jeu-v1',   // Doit être unique (minuscules, tirets)
            version: 'v1'       // Version du dossier
        };
    </script>

    <!-- 3️⃣ CHARGEMENT DU SYSTÈME (Ne pas modifier ce chemin) -->
    <script src="../../system/system.js"></script>

    <!-- 4️⃣ TON JEU -->
    <script src="main.js"></script>
</body>
</html>
```

## 4. L'API `GameSystem`

Une fois le système chargé, tu as accès à l'objet global `window.GameSystem`.

### 🏆 Gestion des Scores

Utilise le module `GameSystem.Score` pour gérer la progression du joueur.

#### Envoyer un score
Appelle cette méthode quand le joueur perd ou termine une partie.

```javascript
// async submit(score: number, playerName?: string)
await window.GameSystem.Score.submit(1500); 

// Exemple dans une boucle de jeu p5play
snake.collides = function() {
    window.GameSystem.Score.submit(score);
    states.next('gameover'); // Change de scène
};
```

#### Récupérer les meilleurs scores (Leaderboard)

```javascript
// async getLeaderboard() -> Array<{ playerName, score, date }>
const highScores = await window.GameSystem.Score.getLeaderboard();
console.log(highScores[0]); // Affiche le meilleur score
```

### 🖥️ Affichage & Outils

Le `GameSystem` injecte une UI par-dessus ton jeu avec un menu ☰ et un bouton plein écran. Tu n'as pas besoin de les recréer.

#### Mode Plein Écran
Tu peux toujours le déclencher par code si voulu :
```javascript
window.GameSystem.Display.toggleFullscreen();
```

---

## ⚠️ Règles Importantes
1.  **Pas de Backend Custom :** Ton jeu doit être 100% statique (JS/HTML/CSS).
2.  **Chemins Relatifs :** Utilise toujours `./assets/image.png`, jamais `/games/mon-jeu/...`.
3.  **Propreté :** N'utilise pas `localStorage` pour les données critiques, elles seront perdues si le cache est vidé. Utilise `GameSystem.Score`.