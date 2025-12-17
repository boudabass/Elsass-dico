# Standardisation de l'Architecture : One-Source-of-Truth

Ce document définit la structure canonique du projet pour éliminer toute ambiguïté entre le stockage (Fichiers) et l'utilisation (Base de Données).

## 1. La Philosophie : "Playable Release First"

Pour garantir la stabilité du système, nous adoptons une règle unique :
**L'unité atomique du système est la "Version Jouable" (Game Release).**

Le système ne "joue" pas à un dossier, il joue à une configuration spécifique (Jeu + Version).

## 2. Définitions Standardisées

### A. GameProject (Vision Admin / Stockage)
C'est le **Conteneur**. Il sert uniquement à l'organisation physique et à l'administration.
- **Nature** : Dossier physique sur le disque.
- **Structure** : `public/games/{gameName}/`
- **Rôle** : Regrouper les versions d'un même jeu.

### B. GameRelease (Vision Runtime / DB / Joueur)
C'est l'**Objet Réel**. C'est ce qui est stocké en base et utilisé par le Hub et les Scores.
- **Nature** : Entrée dans `db.json`.
- **ID Unique** : `{gameName}-{versionName}` (ex: `snake-v3-system`).
- **Propriétés** :
  - `path`: Chemin d'accès relatif (ex: `snake/v3`).
  - `config`: Dimensions, description, thumbnail.

## 3. Implémentation Technique

### Base de Données (`db.json`)
La DB est **PLATE**. Elle ne stocke que des `GameRelease`.
Elle ne connait pas la notion de hiérarchie. C'est voulsu pour la performance et la simplicité des requêtes (Scores, Liste de jeux).

```typescript
// src/lib/database.ts

export interface GameRelease {
  id: string;          // UNIQUE KEY: "snake-v1"
  name: string;        // Display Name: "Snake"
  version: string;     // Version Name: "v1"
  path: string;        // Launcher Path: "snake/v1"
  description: string;
  thumbnail?: string;
  width: number;
  height: number;
  createdAt: string;
}

// Data Schema
export interface DatabaseData {
  games: GameRelease[]; // Liste plate
  scores: Score[];
}
```

### API Layer
- **GET /api/games** : Renvoie `GameRelease[]`.
- **Admin Manager** : C'est le SEUL endroit qui a le droit de reconstruire la hiérarchie pour l'affichage (regrouper les releases par nom), mais il manipule in fine des `GameRelease`.

## 4. Règle d'Alignement

Si un conflit survient entre le Disque et la DB :
1.  **Le Disque est l'inventaire** (ce qui est installable).
2.  **La DB est le catalogue actif** (ce qui est jouable et a des scores).

Toute modification de fichier (Admin) met à jour la DB (Catalogue).
Le Frontend (Scores, Profil) ne lit **JAMAIS** le disque, il lit uniquement le Catalogue (DB).

---
**Décision :** Nous alignons tout le code Frontend (Profile, Scores, Hub) sur le type `GameRelease`.
**Interdiction :** Le code client ne doit jamais essayer de "deviner" des versions. Il consomme ce que l'API lui donne.
