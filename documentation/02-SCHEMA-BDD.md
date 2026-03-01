# Cahier des charges - Schéma Base de Données (PostgreSQL)
**Projet : Alsacien Traducteur v1.0**

## 1. Objectif du schéma
Stockage et indexation de 46 000 entrées issues des extractions JSON consolidées (Dossier `Dictionnaire/`). Ce schéma supporte la recherche rapide, la priorisation des expressions et l'unification ORTHAL.

## 1.bis Extensions Requises
Pour gérer la recherche insensible aux accents (essentiel pour le système ORTHAL):
```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## 2. Architecture des tables
Quatre tables distinctes pour séparer les directions de traduction et les types de termes :

| Nom de la table | Description |
| :--- | :--- |
| `mots_fr_als` | Français → Alsacien (mots simples) |
| `expressions_fr_als` | Français → Alsacien (expressions complexes) |
| `mots_als_fr` | Alsacien → Français (mots simples) |
| `expressions_als_fr` | Alsacien → Français (expressions complexes) |
| `feedback_public` | Contributions anonymes (votes et propositions) |

## 2.bis Table Feedback Public
Détail de la table de contribution anonyme :

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Identifiant (généré par défaut via `gen_random_uuid()`) |
| `segment_traduction`| `TEXT` | `NOT NULL` | Texte source signalé |
| `proposition_alsacien`| `TEXT` | | Meilleure proposition utilisateur |
| `vote` | `INTEGER` | `DEFAULT 0` | +1 / -1 |
| `commentaire` | `TEXT` | | Note libre |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Date |

## 3. Structure des colonnes (Commune)
Toutes les tables partagent la structure suivante :

| Colonne | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Identifiant unique (ex: `abaissement_8`) |
| `mot` ou `expression` | `TEXT` | `NOT NULL` | Terme source |
| `article` | `TEXT` | `DEFAULT ''` | (l'), (un), etc. |
| `traductions` | `JSONB` | `NOT NULL` | Contenu JSON (voir format ci-dessous) |
| `contexte` | `TEXT` | `DEFAULT ''` | Usage (familier, littéraire, etc.) |
| `tags` | `TEXT[]` | `DEFAULT '{}'` | Tags pour filtrage interne (Bas-Rhin, Haut-Rhin, etc. - Non visibles au public) |
| `source_ligne` | `TEXT` | | Ligne brute d'origine |
| `source_index` | `INTEGER` | | Index dans le fichier source |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Date d'insertion |

## 4. Format du champ `traductions` (JSONB)
Le champ est un **JSONB** contenant un tableau d'objets. Chaque objet doit posséder obligatoirement 5 sous-champs.

### Direction Français → Alsacien
```json
[
  {
    "alsacien": "s'àwasätza",
    "variante": "",
    "niveau": "",
    "region": "",
    "note": ""
  }
]
```

### Direction Alsacien → Français
```json
[
  {
    "francais": "l'abaissement", 
    "variante": "",
    "niveau": "",
    "region": "",
    "note": ""
  }
]
```


### Recherche textuelle (Case insensitive + Recherche Floue pg_trgm)
```sql
-- Recherche exacte et pattern
CREATE INDEX idx_mots_fr_als_mot ON public.mots_fr_als (LOWER(mot) varchar_pattern_ops);
CREATE INDEX idx_expressions_fr_als_expr ON public.expressions_fr_als (LOWER(expression) varchar_pattern_ops);

-- Recherche floue et insensible aux accents (ORTHAL support)
CREATE INDEX idx_mots_als_fr_trgm ON public.mots_als_fr USING GIST (unaccent(LOWER(mot)) gist_trgm_ops);
CREATE INDEX idx_expressions_als_fr_trgm ON public.expressions_als_fr USING GIST (unaccent(LOWER(expression)) gist_trgm_ops);
```

### Recherche JSONB (GIN)
```sql
CREATE INDEX idx_mots_fr_als_traductions ON public.mots_fr_als USING GIN (traductions);
```

### 6. Vues utilitaires
Pour simplifier les requêtes globales :
```sql
CREATE VIEW traduction_fr_als AS
SELECT * FROM mots_fr_als
UNION ALL
SELECT * FROM expressions_fr_als;
```

## 7. Règles d'intégrité & Validation (STRATÉGIE UNIFIÉE)
- **Version Canonique (Index 0)** : **CRITIQUE** : La première traduction du tableau (`traductions[0]`) est la SEULE version "Canonique" affichée par défaut au public. L'ordre est le garant de l'unification.
- **Max length** : `mot` / `expression` limité à 500 caractères.
- **JSONB Validation** : Chaque objet du tableau `traductions` doit posséder les clés spécifiées, même si leurs valeurs sont des chaînes vides.
- **Unicité** : L'ID est garant de l'unification par table.
