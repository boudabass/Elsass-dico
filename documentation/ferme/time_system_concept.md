# 🕰️ Horloge de jeu — Système Hybride (Local First)

> 1 seconde réelle = 1 minute jeu (16min = 1 jour complet).

## 🎯 Fonctionnement
*   Mise à jour fluide temps réel (delta calculé).
*   Triggers vérifiés seulement sur changement de minute jeu.

## 💾 Stratégie de Sauvegarde

### 1. En cours de jeu (Fréquent - LOCAL)
Le jeu écrit dans le `localStorage` du navigateur lors des actions clés. C'est instantané et invisible.
*   Sommeil (+8h)
*   Changement de zone
*   Quête validée

### 2. Fin de session (Unique - CLOUD)
Le jeu écrit dans la **Base de Données (DB)** une seule fois.
*   Bouton "Quitter & Sauvegarder"
*   Cela garantit que la progression est disponible sur un autre appareil au prochain lancement.

## 🔔 Fréquences optimisées
| Action | Cible | Fréquence |
| :--- | :--- | :--- |
| Gameplay (Dormir, Planter) | **Local Storage** | Haute (Sans latence) |
| Démarrage Jeu | **Lecture DB** | 1 fois (Synchro) |
| Quitter Jeu | **Écriture DB** | 1 fois (Upload) |

> **Résultat :** Portabilité totale sans ralentir le jeu avec des requêtes réseau constantes.