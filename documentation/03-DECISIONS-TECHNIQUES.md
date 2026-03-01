# 03 - Décisions Techniques

Ce document consigne les choix structurants pour le projet Alsacien Traducteur. Ces décisions sont désormais figées pour assurer la cohérence du développement.

## 1. Stack Technologique (Validée)

### Frontend + Backend
- **Framework** : Next.js 15 (App Router)
- **Infrastructure** : Supabase Cloud (BaaS) / Docker pour le développement local.
  - **Base de données** : PostgreSQL avec support `JSONB` et extension `pg_trgm` (déjà incluse).
  - **Authentification** : Supabase Auth pour la gestion des comptes utilisateurs.
- **UI & Styling** : Tailwind CSS + Shadcn/UI (Radix UI).
- **Langage** : TypeScript intégral (strict type-checking).

## 2. Données et Base de Données

### Structure figée
Séparation en 4 tables PostgreSQL pour optimiser la recherche et la maintenance :
- `mots_fr_als` (20 000 entrées)
- `expressions_fr_als` (3 000 entrées)
- `mots_als_fr` (20 000 entrées)
- `expressions_als_fr` (3 000 entrées)

### Format JSONB FINAL
Chaque ligne contient une colonne `traductions` au format `JSONB` (Objet JSON contenant un tableau d'objets). Ce format est définitive.
**Exemple Fr -> Als :**
```json
{
  "alsacien": "s'àwasätza",
  "variante": "",
  "niveau": "",
  "region": "alsacien_unifie",
  "note": ""
}
```
> [!IMPORTANT]
> **TOUS** les champs sont obligatoires dans l'objet JSONB, même s'ils sont vides (`""`).

## 3. Règles de Recherche (Stratégie "Strict Display, Fuzzy Search")
Pour compenser la politique "Variante Unique", le moteur de recherche doit être très tolérant :
1.  **Expressions AVANT les mots simples** : Priorité haute aux expressions.
2.  **Insensible aux Accents (Unaccent)** :
    - Utilisation de l'extension `unaccent` pour que `wisse` trouve `wìsse`.
    - Indispensable pour l'expérience utilisateur "Grand Public".
3.  **Fuzzy Search (Trigrammes)** :
    - Utilisation de `pg_trgm` via la fonction `similarity()` pour trouver des résultats même avec des fautes de frappe ou des variantes orthographiques mineures (ex: `mache` vs `màcha`).
4.  **Indexation** : Index **GIN** sur `traductions` et index `unaccent(lower(col))` sur les mots clés.
5.  **Bidirectionnel** : Support natif.

## 4. API Routes prévues
### `POST /api/traduire`
- **Entrée** : `{ "texte": "Je vais à la maison", "direction": "fr-als" }`
- **Contrainte** : Limité à 2000 caractères par requête pour assurer la performance.
- **Processus interne** :
  1. Découper le texte en segments potentiels.
  2. Chercher les expressions (priorité haute).
  3. Chercher les mots restants (priorité secondaire).
  4. Assembler les résultats (Une seule traduction par segment).
- **Sortie** :
  ```json
  { 
    "segments": [
      { 
        "source": "Je vais", 
        "target_unified": "Ich gang", 
        "score_confiance": 95,
        "type": "expression"
      }
    ],
    "score_global": 92
  }
  ```

## 5. Authentification et Rôles
- **Accès Public (Non connecté)** :
  - **Droit** : Lecture seule (Traduction, Recherche) + **Écriture (Uniquement `INSERT` sur `feedback_public`)**.
  - **Historique** : Stockage local.
- **Accès Éditeur (Authentifié)** :
  - **Droit** : Correction des entrées, proposition de variantes.
  - **Interface** : Accès aux boutons "Éditer" sur les fiches.
- **Accès Admin (Authentifié)** :
  - **Droit** : Gestion des utilisateurs, validation des suppressions, accès complet BDD.
  - **Interface** : Dashboard `/admin`.
- **Mécanisme** : Supabase Auth. Sign-up désactivé publiquement (création de compte sur invitation admin uniquement).

## 6. Organisation des Fichiers de Données
```text
Dictionnaire/
├── A/
│   ├── mots.json
│   ├── expressions.json
│   └── notes.json
├── B/ ...
```

## 7. Contraintes Techniques et Qualité
- ✅ Structure BDD figée après le premier import.
- ✅ Pas de "vendor lock-in" (données exportables en SQL pur).
- ✅ Recherche expressions prioritaire = traduction plus naturelle.
- ❌ **Interdit** : Lowdb, fichiers JSON lus directement en runtime (les JSON du dossier `Dictionnaire/` servent uniquement à l'import initial en BDD), client-side only (pour garantir la performance sur mobile).

## 8. Maintenance et Qualité des Données
L'alsacien étant une langue en évolution et menacée, le système doit permettre la correction continue :
- **Rôle Éditeur** : Un rôle spécifique "editeur" (en plus du rôle "admin") sera créé pour permettre la modification des entrées directement depuis l'interface.
- **Historique des Modifications** : (Post-MVP) Suivi des changements sur les entrées critiques.
- **Reporting** : Système permettant aux utilisateurs de signaler une erreur sur une traduction spécifique.

## 9. Gestion des Cas Limites et Erreurs
Pour garantir une expérience premium (WOW), l'application gère les cas suivants :
- **Timeout API** : Si la traduction prend plus de 5s, l'UI affiche un message de patience et offre la possibilité de réessayer.
- **Réseau Instable** : L'utilisation de cache local (SWR/React Query) permet de conserver les résultats précédents.
- **Homonymes sans contexte** : Le système propose par défaut la version "Canonique" mais alerte l'utilisateur qu'une ambiguïté existe.

## 11. Protocole d'Unification (Décision "Batua")
Pour garantir la cohérence linguistique, notamment sur le clivage Nord (`-e`) / Sud (`-a`) :
1.  **Autorité de la Donnée** : C'est le fichier source JSON qui fait foi. La première traduction (`index 0`) **EST** la norme unifiée.
2.  **Interdiction du "Flip-Flop"** : Le système ne doit pas alterner aléatoirement entre des formes `-e` et `-a` pour des mots de même catégorie grammaticale.
3.  **Validation Humaine** : Seul le rôle `éditeur` a le pouvoir de modifier l'Index 0 pour corriger une incohérence d'unification.

## 10. Pourquoi ces choix ?
- **Performance** : Supabase + index GIN garantissent des réponses instantanées même avec 100 000+ entrées.
- **Souplesse** : Le passage par une base de données (plutôt que des fichiers JSON statiques) permet des corrections en temps réel par les locuteurs experts.
- **Évolutivité** : Prêt pour l'audio, les exercices et les contributions utilisateurs.
- **Maintenance** : Une stack unifiée simplifie la mise en production via Docker.
