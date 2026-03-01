# Analyse d'Impact : Système ORTHAL sur Elsass Dico

Cette analyse vise à assurer la cohérence entre le système orthographique ORTHAL et les spécifications techniques de l'application Elsass Dico.

## 1. Synthèse du Système ORTHAL
Le système ORTHAL (Orthographe Alsacienne) introduit des graphèmes spécifiques pour noter les sons des dialectes alsaciens qui n'existent pas en standard en allemand ou en français.

**Graphèmes Spécifiques :**
- `ì` : /i/ très ouvert
- `à` : /a/ sombre
- `ë` : /e/ très ouvert
- `ù` : /ou/ très ouvert
- `ü` : /u/ français (usage standard mais fréquent)
- `ä` : /è/ ouvert
- `ö` : /eu/
- `œ` : son proche de "un"

**Variantes Régionales :**
Le système ORTHAL gère explicitement les différences (67/68).
⚠️ **Décision Projet (Stratégique) :** L'application adopte une politique de **"Variante Unique / Alsacien Unifié"**.
- **Objectif :** Simplifier l'apprentissage et la communication.
- **Règle :** Une seule version par mot est conservée (priorité au standard Bas-Rhin ou le plus commun).
- **Conséquence :** Suppression de l'affichage des variantes régionales dans l'interface.

## 2. Impact sur la Base de Données (Schema)
**État actuel :** Le schéma (`02-SCHEMA-BDD.md`) utilise une structure JSONB pour les traductions (`alsacien`, `variante`, `region`).
**Conformité :** ✅ **OUI**.
- La structure permet de stocker `{"alsacien": "macha", "region": "68"}` et `{"alsacien": "mache", "region": "67"}` pour une même entrée française.
- L'encodage `TEXT` de PostgreSQL gère nativement l'UTF-8 et donc tous les caractères ORTHAL.

## 3. Impact sur la Recherche (Search Engine)
**Problème identifié :** Les utilisateurs ne sauront pas forcément taper les caractères accentués (`ì`, `à`, `ë`) sur un clavier standard (AZERTY/QWERTY).
**Risque :** Une recherche pour "wisse" (blanc) pourrait ne pas trouver "wìsse" (savoir) si la recherche est stricte, ou inversement, l'utilisateur cherchant "savoir" tape "wisse" et ne trouve rien.

**Recommandations :**
1.  **Recherche "Insensible aux accents" (Unaccent) :**
    - La base de données doit implémenter une recherche qui ignore les accents pour la correspondance large.
    - Ex: Chercher `wisse` doit retourner `wisse` (blanc) ET `wìsse` (savoir) (avec un score de pertinence différent si possible).
    - PostgreSQL extension : `unaccent`.
2.  **Tolérance aux variantes :**
    - La recherche doit inclure les variantes régionales.

## 4. Impact sur l'Interface Utilisateur (UI)
**État actuel :** `06-INTERFACE-UI-PUBLIC.md` décrit une zone de saisie simple.
**Manque identifié :** ❌ **Absence de méthode de saisie pour les caractères ORTHAL**.
- En mode "Alsacien -> Français", l'utilisateur doit pouvoir saisir les caractères spéciaux.

**Recommandations :**
1.  **Clavier Visuel (Virtual Keyboard) :**
    - Ajouter une barre d'outils sous/dans la zone de saisie avec les caractères : `à`, `ì`, `ü`, `ù`, `ë`, `ö`, `ä`.
2.  **Suggestions intelligentes :**
    - Autocomplétion qui propose les versions avec accents dès que l'utilisateur tape la version sans accent.

## 5. Actions Requises (Status)
1.  ✅ **Mise à jour `02-SCHEMA-BDD.md`** : Extension `unaccent` et règle "Index 0 = Canonique" ajoutées.
2.  ✅ **Mise à jour `06-INTERFACE-UI-PUBLIC.md`** : Composant "Clavier Visuel" et gestion des erreurs précisés.
3.  ✅ **Mise à jour `01-PRD.md`** : Support natif ORTHAL et stratégie unifiée validés.
