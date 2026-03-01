# 04 - Architecture Technique

Ce document détaille l'organisation des services, la structure des fichiers et le flux de données pour l'application Alsacien Traducteur.

## 1. Architecture Globale
Le flux d'information suit une structure descendante optimisée pour la performance :
```text
Utilisateur → Next.js App Router (Frontend/Backend) → Supabase PostgreSQL
Interface UI  → API Routes (Next.js)      ← [Fichiers JSON Dictionnaire/ (Source)]
```

## 2. API Routes Principales

### `POST /api/traduire`
- **Rôle** : Traduction assistée d'un texte complet avec arbitrage automatique.
- **Entrée** : `{ texte: string, direction: "fr-als" | "als-fr" }`
- **Sortie** : `{ segments: [{ source: string, target_unified: string, type: "mot"|"expression", score_confiance: number }] }`
- **Note** : Renvoie uniquement la *meilleure* traduction par segment. Le `score_confiance` est une valeur de 0 à 100 reflétant la fiabilité.

### `GET /api/dico`
- **Rôle** : Recherche bidirectionnelle pour un terme isolé (Mode Dictionnaire).
- **Entrée** : `{ terme: string, direction: string, limit: number }`
- **Sortie** : `{ homonymes: Definitions[] }`
- **Note** : Gère les sens multiples (homonymes) mais propose une vision unifiée pour chaque sens (Standard ORTHAL).

### `GET/POST /api/historique` (Auth requis)
- **Rôle** : Persistance des 10 dernières traductions par utilisateur.

### `POST /api/feedback` (Public)
- **Rôle** : Enregistrement d'un vote (+1/-1) ou d'une proposition sur un segment.
- **Entrée** : `{ segment_id: string, proposition?: string, vote: number, commentaire?: string }`
- **Cible** : Table `feedback_public`.

## 3. Flux de Traduction Détaillé (`/api/traduire`)

1. **Pré-traitement** : Normalisation du texte (minuscules, nettoyage espaces, conservation des accents).
2. **Recherche Expressions (PRIORITAIRE)** : 
   - Recherche exacte et floue via `pg_trgm`.
   - Identification des segments correspondant à des locutions figées (Bonus score max).
   - **Algorithme Greedy** : Le système cherche d'abord les expressions les plus longues et spécifiques avant de traiter les segments plus courts.
   - Marquage des zones traitées.
3. **Recherche Mots Restants** :
   - Pour chaque espace vide, recherche via `unaccent` dans la table correspondante.
   - **Arbitrage Automatique** : Si plusieurs homonymes sont trouvés :
     - 1. **Contexte** : Comparaison du champ `contexte` de l'entrée avec les mots environnants.
     - 2. **Popularité** : Si aucun contexte ne matche, priorité à l'entrée possédant le tag `common`.
     - 3. **Canonique** : Sélection de l'index 0 par défaut en dernier recours.
4. **Assemblage et Score** :
   - Concaténation des bouts de phrases.
   - Calcul du score de confiance global basé sur la qualité des sources (Lexique validé vs Inconnu).

## 4. Structure des Dossiers Next.js

### `src/app/`
- `(auth)/` : Regroupement logique des routes authentifiées (`historique`, `profile`).
- `admin/` : Dashboard de gestion avec middleware de protection.
- `traduire/` : Écran principal de traduction assistée.
- `dico/` : Interface de recherche dictionnaire intelligent.
- `api/` : Endpoints (`traduire/route.ts`, `dico/route.ts`, `historique/route.ts`, `feedback/route.ts`).

### `src/lib/`
- `supabase.ts` : Client Supabase configuré via les variables d'environnement.
- `traducteur.ts` : **Cœur métier** (logique de segmentation et matching).
- `types.ts` : Interfaces TypeScript unifiées.

## 5. Composants UI (Design System)
Situés dans `src/components/` :
- `TranslationBox.tsx` : Conteneur principal.
- `UnifiedResult.tsx` : Affichage du résultat final (Gros texte).
- `AnalysisPanel.tsx` : Détail technique (Source -> Cible) en lecture seule.
- `InputArea.tsx` : Zone de saisie + boutons.
- `VirtualKeyboard.tsx` : Clavier Orthal.
- `ActionButtons.tsx` : Ensemble d'actions (Copier, Signaler).
- `Loader.tsx` : Feedback visuel premium.

## 6. Performance et Sécurité
- **Performance** : 
  - Connection pooling (Supabase).
  - Index GIN pour des recherches `< 50ms`.
  - Cache automatique des Route Handlers Next.js pour les requêtes identiques.
- **Sécurité** :
  - **RLS (Row Level Security)** :
    - `SELECT` : Public (ouvert à tous, role `anon`).
    - `INSERT/UPDATE` : Restreint aux rôles `editeur` et `admin` authentifiés.
    - `DELETE` : Restreint au rôle `admin` uniquement.
  - **Pages Protégées** : Middleware Next.js bloquant l'accès `/admin` et `/edit` aux non-authentifiés.
  - **Validation Zod** : Schématisation stricte des entrées serveur.
