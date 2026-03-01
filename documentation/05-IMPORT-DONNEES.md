# 05 - Procédure d'import des données (Finalisée)

Ce document détaille le processus d'importation massive des 52 fichiers TXT sources vers les tables Supabase.

## 1. Fichiers sources (Structure A-Z)
Les données sont collectées manuellement dans 52 fichiers texte répartis dans deux directions :
```text
sources/
├── francais-alsacien/     (26 fichiers A.txt à Z.txt)
└── alsacien-francais/     (26 fichiers A.txt à Z.txt)
```

## 2. Source de vérité : Extractions JSON Consolidées
Les données sont désormais fournies sous forme de fichiers JSON structurés dans le dossier `Dictionnaire/`, classés par lettre (A-Z). Ces fichiers constituent l'unique source de vérité pour l'importation.

### Structure attendue (`mots.json` & `expressions.json`)
Chaque entrée doit respecter le format suivant pour être importée :
- `id` : Identifiant unique (ex: `abaissement_8`).
- `francais` : Terme source.
- `article` : Article associé.
- `traductions` : Tableau JSONB (Index 0 = Canonique).
- `contexte` : Note de contexte.

## 3. Algorithme du script `import_from_json.py`
Le script d'importation simplifie le processus en évitant toute étape de parsing Regex :
1. **Scannage** : Parcours des dossiers `A` à `Z` dans `Dictionnaire/`.
2. **Chargement** : Lecture directe des fichiers `mots.json` et `expressions.json`.
3. **Classification & Mapping** :
   - `mots.json` -> Table `mots_fr_als`.
   - `expressions.json` -> Table `expressions_fr_als`.
4. **Bulk Insert** : Insertion directe dans Supabase via l'API REST.
5. **Logs** : Rapport de succès et erreurs d'insertion.

## 4. Vérifications et Maintenance
- **Validation** : Vérification du comptage final (Cible : ~30 000 entrées validées).
- **Politique "Alsacien Unifié" (Arbitrage Critique)** :
    - **Variantes Régionales** (Même sens) : Le script applique la règle **"Le Premier est Roi"**. Dans une ligne comme `Maison (f) Haim, Hüss`, `Haim` devient la traduction **Canonique** (stockée à l'index 0 du tableau JSONB). C'est cette position qui définit le caractère unifié utilisé par l'UI.
    - **Homonymes** (Sens différents) : Si un même mot français possède des sens distincts (ex: `Mousse (plante)` vs `Mousse (écume)`), le script crée deux entrées distinctes en BDD basées sur le champ `contexte`. **En l'absence de contexte explicite**, le script génère une alerte dans les logs et suffixe l'ID (ex: `mousse_1`, `mousse_2`) pour arbitrage manuel ultérieur par un éditeur.
    - **Note :** Seuls les éditeurs pourront modifier manuellement la canonique ou fusionner des entrées via l'interface admin.
- **Évolutivité** : Le script est conçu pour être relancé sur de nouveaux fichiers TXT sans casser la structure existante.
- **Nettoyage** : Après validation, les fichiers sources et le script d'import ne sont pas conservés en production pour des raisons de sécurité.
