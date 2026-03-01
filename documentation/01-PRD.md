# PRD - Application de Traduction Français-Alsacien

## 1. Vision & Objectifs
- **Nom** : Elsass Dico
- **Mission** : Sauvegarder et rendre accessible la langue alsacienne via un outil moderne et rapide.
- **Ambition Unificatrice** : Dépasser le clivage dialectal (Nord `-e` / Sud `-a`) en proposant un standard unifié (type "Euskara Batua") pour l'ère numérique.
- **Cible** : Grand public (débutants) et professionnels cherchant une orthographe de référence.

## 2. Problème résolu
**Problème principal :**
L'alsacien disparaît faute d'outils numériques modernes. Les solutions existantes sont souvent limitées (dictionnaires papier de 13 000 mots, apps de 230 mots, projets abandonnés).
**Conséquence :**
Les locuteurs ne peuvent pas écrire de textes complets (emails, messages, posts) de manière fiable.

## 3. Public cible
- **Apprenants** : débutants à intermédiaires.
- **Locuteurs** : Alsaciens cherchant le mot ou l'expression juste.
- **Enseignants** : pour préparer cours et exercices.
- **Culturels** : associations, théâtre, médias régionaux.

## 4. Fonctionnalités principales (MVP)
### 4.1 Traduction assistée de texte
Processus où l'utilisateur saisit un texte français, l'application le découpe en segments (mots + expressions), et affiche la traduction unifiée (**Canonique**) calculée par le système.

### 4.2 Dictionnaire intelligent
- Recherche bidirectionnelle (Fr <-> Als).
- **Support natif ORTHAL** : Saisie des caractères spéciaux et recherche insensible aux accents.
- **Alsacien Unifié** : Système offrant une version unifiée par mot/sens pour simplifier l'apprentissage et garantir la pérennité numérique.
- Priorité aux expressions figées.
- **Score de confiance** : Reflète la validité de la traduction unifiée **Canonique** sélectionnée (basée sur l'index 0 du tableau des traductions).

### 4.3 Historique personnel
- Garde les 10 dernières traductions.
- Éditable et réutilisable.

### 4.4 Contribution Publique Anonyme (Crowdsourcing)
- **Validation** : Les utilisateurs peuvent voter (👍/👎) sur chaque segment de traduction.
- **Correction** : Possibilité de proposer une meilleure traduction sans créer de compte.
- **Centralisation** : Toutes les contributions sont stockées pour modération par les éditeurs/admins.
## 5. Données et Volume
Base de données consolidée issue des extractions JSON (Dossier `Dictionnaire/`) :
1. `mots_fr_als` : ~20 000 entrées
2. `expressions_fr_als` : ~3 000 entrées
3. `mots_als_fr` : ~20 000 entrées
4. `expressions_als_fr` : ~3 000 entrées

Structure d'une entrée :
```json
{
  "id": "aller_a_pied",
  "mot": "aller à pied",
  "article": "",
  "traductions": [
    {
      "alsacien": "z'Füass geh", 
      "variante": "", 
      "niveau": "courant",
      "region": "alsacien_unifie",
      "note": ""
    }
  ],
  "contexte": ""
}
```

## 6. Interface utilisateur (MVP)
- **Écran principal** : Zone de saisie FR, découpage en segments d'analyse, résultat ALS éditable.
- **Navigation** : Bascule Fr/Als (↔), Recherche Dictionnaire, Historique.

## 7. Critères de succès
- Temps pour traduire 1 phrase < 30 secondes.
- Précision des suggestions > 80%.
- 90% d'utilisabilité sans tutoriel.

- Qualité linguistique vérifiable.
- Évolutivité (prêt pour 100 000+ entrées).
- Accessibilité (Interface publique sans login).
- Rôles stricts : Édition/Administration réservée aux comptes authentifiés.
- Pas de vendor lock-in (données exportables).
