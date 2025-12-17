# 🔧 Troubleshooting & Known Issues (p5.play v3)

Ce document recense les erreurs rencontrées lors du développement et les solutions de contournement validées.
**L'IA doit consulter ce fichier avant d'utiliser des fonctionnalités "avancées" de p5.play.**

## 1. Caméra

### 🔴 Problème : `camera.follow is not a function`
*   **Symptôme :** Crash au démarrage du jeu.
*   **Cause :** La version CDN de p5.play utilisée n'expose pas `follow` comme une fonction, ou l'API a changé.
*   **Solution Validée :** Suivi manuel dans `draw()`.
    ```javascript
    // Dans draw()
    let targetX = player.x; // + contraintes
    camera.x = lerp(camera.x, targetX, 0.1);
    camera.y = lerp(camera.y, targetY, 0.1);
    ```

### 🔴 Problème : Le monde ne bouge pas / HUD bouge avec le monde
*   **Symptôme :** Le joueur sort de l'écran, le HUD disparaît.
*   **Solution Validée :** Encapsulation explicite.
    ```javascript
    // 1. Rendu du monde
    camera.on();
    allSprites.draw();
    camera.off();

    // 2. Rendu HUD (coordonnées écran fixes)
    drawHUD();
    ```

## 2. Collisions & Détection

### 🔴 Problème : `overlap callback has to be a function` (avec coordonnées)
*   **Contexte :** Tentative de `group.overlap(x, y)` ou `allSprites.overlap(x, y)` pour tester si un point est vide.
*   **Cause :** Cette surcharge de la méthode semble buggée ou absente dans la version actuelle sans sprite témoin.
*   **Solution Validée :** Vérification AABB Manuelle.
    ```javascript
    function isPointOnPlatform(x, y) {
        for (let p of platforms) {
            if (x > p.x - p.w/2 && x < p.x + p.w/2 &&
                y > p.y - p.h/2 && y < p.y + p.h/2) {
                return true;
            }
        }
        return false;
    }
    ```

## 3. Gestion des États

### 🔴 Problème : `states is not defined`
*   **Symptôme :** Crash `ReferenceError`.
*   **Cause :** Le gestionnaire d'états global de p5.play n'est pas exposé.
*   **Solution Validée :** Machine à états "Maison".
    ```javascript
    const GameState = { MENU: 0, GAME: 1, GAMEOVER: 2 };
    let currentState = GameState.MENU;

    function draw() {
        switch(currentState) {
            case GameState.MENU: drawMenu(); break;
            // ...
        }
    }
    ```

## 4. Système & Serveur

### 🔴 Problème : Erreur 500 sur `POST /api/scores`
*   **Symptôme :** Le jeu fonctionne mais le score n'est pas sauvegardé à la fin.
*   **Cause :** Le fichier `db.json` est corrompu ou mal initialisé (tableau `scores` manquant).
*   **Solution Validée :** Vérifier que `data/db.json` contient bien `"scores": []` à la racine.

## 5. Gameplay

### 🔴 Problème : Sauts "mangés" (Inputs ignorés)
*   **Symptôme :** Le joueur appuie sur Espace mais ne saute pas, surtout sur les bords ou en atterrissant.
*   **Solution Validée :** Implémenter **Coyote Time** et **Jump Buffer** (voir `documentation/base_parametre.md`).