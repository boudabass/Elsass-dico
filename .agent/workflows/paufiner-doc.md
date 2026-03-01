---
description: Analyse, polissage et achèvement de la documentation sans toucher au code.
---

Ce workflow guide l'Agent pour assurer une documentation 100% cohérente et complète avant le début du codage.

1. **Audit Global** : Liste tous les fichiers du dossier `documentation/` et lis-les pour comprendre l'état complet du projet.
2. **Vérification de la Cohérence** : Vérifie que chaque document (PRD, Architecture, UI, Schéma BDD) respecte strictement la stratégie "Alsacien Unifié" (résultat unique, pas de choix de variantes pour l'utilisateur public).
3. **Identification des Gaps** : Cherche les points non spécifiés ou ambigus (ex: cas d'erreurs précis, limites de l'API, détails des composants UI, règles d'importation).
4. **Correction des Coquilles** : Repère et corrige les fautes d'orthographe, les ambiguïtés de langage et les erreurs techniques (ex: doublons de lignes, incohérences de types).
5. **Plan d'Action Logique** : Avant toute modification, crée un artifact `implementation_plan.md` listant les changements documentaires proposés.
6. **Mise à jour Atomique** : Après approbation du plan, applique les modifications fichier par fichier.
7. **Nettoyage et Archivage** : Déplace les documents de travail, rapports d'audit ou notes temporaires devenus obsolètes dans `documentation/archive/`.

// turbo
8. Utilise toujours PowerShell pour les manipulations de fichiers (ex: `Move-Item`, `New-Item`).
