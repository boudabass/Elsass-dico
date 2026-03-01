# Raffinement Design UI/UX - "Alsacien Unifié"
**Date :** 08/02/2026

Ce document détaille les choix de design pour répondre à la contrainte de "Variante Unique" tout en gérant la complexité réelle de la langue (homonymes, contexte).

## 1. Distinction : Traducteur vs Dictionnaire
L'application possède deux modes d'utilisation distincts qui doivent cohabiter.

### A. Le Traducteur (Message complet)
*   **Usage :** L'utilisateur tape une phrase entière "Je vais à la mousse".
*   **Besoin :** Rapidité, fluidité.
*   **Comportement Unifié :** Le système choisit la meilleure traduction (ex: "S'Moos" pour la plante si le contexte aide, ou le plus fréquent).
*   **Affichage :** Une seule ligne de résultat. Pas de doutes affichés.

### B. Le Dictionnaire (Recherche précise)
*   **Usage :** L'utilisateur tape un mot isolé "mousse".
*   **Besoin :** Exhaustivité, compréhension des nuances.
*   **Problème des Homonymes :** "Mousse" peut être la plante (*Moos*) ou la matière (*Schum*).
*   **Solution UI :**
    *   Si l'input est un mot unique, afficher une **Liste de Définitions**.
    *   Ne pas confondre "Variantes régionales" (67/68) et "Sens différents" (Homonymes).
    *   **Maquette Dico :**
        ```text
        Résultats pour "mousse" :
        1. [S'Moos] (Nom neutre) - Plante verte des forêts.
        2. [D'r Schum] (Nom masc.) - Écume sur la bière ou le savon.
        ```
    *   Ceci est compatible avec la politique "Variante Unique" : Pour le sens "Plante", il n'y a qu'un seul mot ("Moos"), pas de variante 68 ("Moosa" est caché).

## 2. Interface Éditeur (Le "Back-Stage")
Les éditeurs doivent voir ce que le public ne voit pas pour pouvoir affiner le choix "Unifié".

### Maquette Fiche Édition
```text
┌─────────────────────────────────────────────────────────────┐
│ ÉDITION : "Aller à pied"                                    │
├─────────────────────────────────────────────────────────────┤
│ 👑 FORME CANONIQUE (Public) : [ z'Füass geh ]               │
│                                                             │
│ 📂 VARIANTES STOCKÉES (Masquées) :                          │
│ 1. "ze Fösgehn" (Haut-Rhin)  [BOUTON: PROMOUVOIR EN 👑]     │
│ 2. "z'Füess ge" (Bas-Rhin var) [BOUTON: PROMOUVOIR EN 👑]   │
│                                                             │
│ [AJOUTER UNE VARIANTE]                                      │
├─────────────────────────────────────────────────────────────┤
│ [ANNULER]                                     [ENREGISTRER] │
└─────────────────────────────────────────────────────────────┘
```
**Concept Clé :** La base de données garde tout, mais un "Flag" ou l'ordre de la liste détermine le "Gagnant" (Canonical). L'éditeur peut changer le gagnant.

## 3. Interface Admin (Inbox Feed)
Pour gérer le flux sans être submergé.

### Dashboard "Inbox Zero"
```text
[ TOUT (12) ]  [ PROPOSITIONS (5) ]  [ VOTES NEGATIFS (7) ]

1. "Velo" -> Prop: "Fahrrad" (Suggestion)
   [ACCEPTER (Remplace Velo)]  [ARCHIVER (Garde Velo)]

2. "Pomme" -> Vote 👎 (x15)
   [INVESTIGUER (Ouvre Éditeur)]  [IGNORER]
```
Le but est de traiter le flux rapidement.

## 4. Synthèse des Choix UX
1.  **Public Traducteur** : Simple, Direct, 1 Résultat.
2.  **Public Dictionnaire** : Riche, Gère les sens multiples (Homonymes), mais cache les variantes régionales.
3.  **Éditeur** : Vue complète (Rayons X), Pouvoir de décision sur le "Standard".
4.  **Admin** : Flux de travail rapide.
