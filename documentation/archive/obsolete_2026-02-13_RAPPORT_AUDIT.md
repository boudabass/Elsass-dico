# Rapport de Lecture & Audit de Prêt-à-Développer
**Date :** 08/02/2026
**Statut :** 🟠 Partiellement Prêt (Quelques incohérences critiques à corriger)

## 1. Conclusion Générale
La documentation est **complète à 90%** et la vision "Alsacien Unifié" est clairement définie dans les documents stratégiques (`01-PRD`, `03-DECISIONS`). Cependant, pour atteindre les "200% de certitude" demandés, **il reste des incohérences résiduelles** dans les spécifications techniques et UI qui pourraient cause des ambiguïtés lors du développement.

Il est impératif de mettre à jour les documents "Opérationnels" (`06-UI`, `04-ARCHI`) pour qu'ils reflètent strictement les décisions prises dans `DESIGN_UI_UX_RAFFINEMENT.md`.

## 2. Incohérences Critiques (Bloquants)
Ces points doivent être corrigés dans la documentation avant d'écrire la première ligne de code.

### A. Ambiguïté du Score "Nombre de Traductions"
*   **Source** : `06-INTERFACE-UI-PUBLIC.md` (Section 3) vs `01-PRD.md` (Unified)
*   **Problème** : L'algorithme de score actuel bonus/malus le *nombre* de traductions. Or, la stratégie "Unifiée" impose de n'en montrer qu'une seule par sens.
*   **Risque** : Le développeur pourrait coder une logique qui récupère *toutes* les variantes pour calculer le score, alors que la requête SQL devrait être optimisée pour n'en récupérer qu'une (la canonique).
*   **Action** : Réécrire la section "Algorithme de score" pour se baser sur la *qualité* de la traduction canonique (ex: `is_canonical`, `trust_score`) et non sur la quantité de variantes.

### B. UI de Sélection de Variantes (Fantôme)
*   **Source** : `RAPPORT_AUDIT.md` vs `06-INTERFACE-UI-PUBLIC.md`
*   **Problème** : Bien que les mockups ASCII semblent corrigés dans `06-UI`, des mentions de composants d'intéraction (clic pour changer, scoring basé sur la quantité) suggèrent encore une logique de choix multiple. De plus, la distinction claire entre le mode "Traducteur" (1 résultat) et "Dictionnaire" (Liste d'homonymes) définie dans `DESIGN_UI_UX_RAFFINEMENT.md` n'est pas explicitement intégrée dans le fichier `06-UI` principal.
*   **Action** : Fusionner `DESIGN_UI_UX_RAFFINEMENT.md` dans `06-INTERFACE-UI-PUBLIC.md` pour en faire la source de vérité unique.

### C. Gestion des Erreurs et Cas Limites
*   **Manquant** : Aucune documentation (`08-ERREURS.md` ?) ne définit les messages d'erreur standard (API down, Timeout, Rate limit) ni le comportement UI précis en cas d'erreur partielle (ex: une expression trouvée, mais pas le reste de la phrase).
*   **Action** : Ajouter une section "Gestion des Erreurs" dans `06-INTERFACE-UI-PUBLIC.md`.

## 3. Points Techniques à Valider
*   **Script d'Import** : `05-IMPORT-DONNEES.md` compte sur l'ordre des fichiers TXT pour déterminer la variante canonique. C'est risqué. Il serait plus sûr de définir une règle explicite (ex: "Le premier terme est canonique") codée en dur.
*   **Refactoring** : Le fichier `Refactoring.md` est un excellent plan de bataille technique. Il doit être considéré comme la **première étape du développement**.

## 4. Plan de Mise à Niveau Immédiat
Pour passer à 100% (et viser les 200%), je propose d'effectuer les actions suivantes sur la documentation :

1.  **FUSIONNER** `DESIGN_UI_UX_RAFFINEMENT.md` → `06-INTERFACE-UI-PUBLIC.md`.
2.  **CORRIGER** l'algorithme de score dans `06-INTERFACE-UI-PUBLIC.md`.
3.  **NETTOYER** `04-ARCHITECTURE.md` des mentions obsolètes (`VarianteChip`).
4.  **VALIDER** une convention de nommage pour les erreurs.

Une fois ces 4 actions documentaires faites, nous pourrons lancer le développement (commençant par le Refactoring structurel) sans aucune ambiguïté.
