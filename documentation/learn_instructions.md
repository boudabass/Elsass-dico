# Instructions pour l'AI (Dyad) - Programme d'Apprentissage p5.js

Ce document est mon guide de référence pour t'assister dans le programme d'apprentissage p5.js. Il me permet de reprendre notre travail à tout moment, même dans une nouvelle conversation, en comprenant immédiatement notre méthode et notre progression.

## Principes Fondamentaux

1.  **Travail Séquentiel par Phase :** C'est la règle la plus importante. Je dois avancer **phase par phase** au sein de chaque étape. Je ne dois **JAMAIS** implémenter une étape entière en une seule fois. J'implémente la Phase 1, puis j'attends ta validation avant de passer à la Phase 2, et ainsi de suite.
2.  **Validation par l'Utilisateur :** Tu es le seul validateur. Après chaque modification, je te fournis une checklist concise pour la phase en cours. J'attends ta confirmation avant de continuer.
3.  **Source de Vérité :** Avant toute action, je dois consulter les fichiers suivants pour connaître l'état d'avancement :
    *   `documentation/learn/learn.md` : Pour la vue d'ensemble des étapes validées.
    *   `documentation/learn/etape_XX.md` : Pour les objectifs détaillés de l'étape en cours.
4.  **Clarté et Simplicité :** Mes explications doivent être claires et directes. Mon code doit être simple et focalisé sur l'objectif de la phase en cours.

## Workflow Détaillé

### 1. Début d'une Étape

1.  **Instruction :** Tu me donnes l'ordre de commencer une étape (ex: "commence etape 8").
2.  **Lecture :** Je lis `learn.md` et `etape_XX.md` pour comprendre les objectifs.
3.  **Annonce :** Je t'annonce la checklist pour la **Phase 1 uniquement**.
4.  **Création :** Je crée les fichiers nécessaires (`learn/etapeX/index.html`, `sketch.js`, etc.) et j'ajoute l'entrée dans `data/db.json`.
5.  **Code :** J'écris le code **uniquement pour la Phase 1**.
6.  **Demande de Validation :** Je te demande de valider la checklist de la Phase 1.

### 2. Validation d'une Phase

1.  **Instruction :** Tu valides la phase (ex: "1, 2 et 3 sont bons").
2.  **Annonce :** Je t'annonce la checklist pour la **phase suivante**.
3.  **Code :** Je modifie le code pour implémenter cette nouvelle phase.
4.  **Demande de Validation :** Je te demande de valider la nouvelle checklist.
5.  *(Répéter ce cycle jusqu'à la fin de l'étape)*

### 3. Fin d'une Étape

1.  **Instruction :** Tu valides la dernière phase de l'étape.
2.  **Annonce :** Je confirme que tous les objectifs de l'étape sont atteints.
3.  **Consignation :** Je mets à jour **deux fichiers** :
    *   `documentation/learn/learn.md` : Je coche l'étape comme `(VALIDÉE)`.
    *   `documentation/learn/etape_XX.md` : Je coche tous les objectifs et la checklist de validation.
4.  **Transition :** Je te demande si nous pouvons passer à l'étape suivante.

En suivant ces instructions, je peux garantir une collaboration fluide et efficace, en respectant ton rythme et tes besoins.