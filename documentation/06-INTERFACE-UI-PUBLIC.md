# 06 - Spécifications Interface (UI) - PUBLIC V1
**Cible** : Utilisateurs non connectés (Tout le monde)

## 1. Philosophie "Alsacien Unifié"
> [!IMPORTANT]
> **Une seule vérité.**
> L'utilisateur ne doit jamais avoir à choisir entre plusieurs mots pour un même sens. Le système décide pour lui de la variante la plus standard ("Canonique").
> L'interface ne propose **PAS** de sélecteur de variante.

## 2. Écran principal - Traduction

L'interface est structurée de la manière suivante (Le résultat unifié est en **lecture seule** pour le public) :

┌─────────────────────────────────────────────────────────────┐
│ ALSACIEN TRADUCTEUR                   [↔ FR/ALS] [Historique] │
├─────────────────────────────────────────────────────────────┤
│ [                           ]                                │ ← Zone saisie
│ "Je vais à la maison à pied"                                │
│ [ à  ì  ü  ù  ë  ö  ä  œ ]                                  │ ← Clavier Visuel Orthal
│ [TRADUIRE]                 [EFFACER]                        │
├─────────────────────────────────────────────────────────────┤
│ Résultat Unifié (Lecture simplifiée)                        │
├─────────────────────────────────────────────────────────────┤
│ Ich gang z'haim z'Füass                                     │ ← Résultat NON cliquable (sauf éditeur)
├─────────────────────────────────────────────────────────────┤
│ Détails (Analyse)                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 Je vais  → Ich gang  (Expression)                    │ │
│ │ 🟢 à la     → z'        (Canonique)                     │ │
│ │ 🟢 maison   → haim      (Canonique)                     │ │
│ │ 🟢 à pied   → z'Füass   (Expression)                    │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [COPIER LA TRADUCTION]             [SIGNALER UNE ERREUR]    │
└─────────────────────────────────────────────────────────────┘

> [!TIP]
> Le bouton **SIGNALER UNE ERREUR** ouvre une modale permettant d'envoyer un vote négatif ou une proposition corrective vers l'API `/api/feedback`.

## 3. Comportement des Modes (Traducteur vs Dictionnaire)

L'application possède deux modes d'utilisation distincts qui cohabitent pour répondre à des besoins différents.

### A. Le Traducteur (Phrase ou segment long)
*   **Usage :** L'utilisateur tape une phrase entière (ex: "Je vais à la mousse").
*   **Besoin :** Rapidité, fluidité.
*   **Comportement Unifié :** Le système choisit la **meilleure** traduction (ex: "S'Moos" pour la plante si le contexte aide, ou le plus fréquent).
*   **Affichage :** Une seule ligne de résultat. **Pas de doutes affichés**, pas de liste de choix "A, B ou C".

### B. Le Dictionnaire (Recherche Mot Unique)
*   **Usage :** L'utilisateur tape un mot isolé (ex: "mousse").
*   **Besoin :** Exhaustivité, compréhension des nuances.
*   **Gestion des Homonymes :** C'est le SEUL cas où une liste est affichée, car le *sens* change (ex: Plante vs Écume).
*   **Affichage :** Liste de définitions numérotées avec contexte court.
*   **Règle "Variante Unique" :** Pour chaque sens, on n'affiche que la forme "Canonique". Les variantes régionales sont cachées.

## 4. Score de Confiance (Qualité)

Le score reflète la **Qualité** de la traduction canonique trouvée. Il ne dépend PAS du nombre de variantes disponibles.

**Code Couleur :**
- 🟢 **VERT** (80-100%) : Certitude absolue (Expression validée ou Mot canonique courant).
- 🟡 **JAUNE** (50-79%) : Probable (Traduction mot-à-mot, mot rare ou contexte incertain).
- 🔴 **ROUGE** (0-49%) : Doute (mot non trouvé, laissé en français). 

---

## 5. Interface Éditeur (Accès Restreint)
Les utilisateurs authentifiés (Rôles `editeur`, `admin`) bénéficient de fonctions supplémentaires sur l'interface publique :
- **Bouton ✏️ Modifier** : Apparaît sur chaque segment dans le panneau `AnalysisPanel`.
- **Modale d'Édition** : Permet de modifier le texte, le contexte, et surtout de **Promouvoir** une variante masquée au rang de "Canonique" (index 0).

---

## 6. États Généraux et Gestion des Erreurs

Pour garantir une expérience premium, l'interface gère explicitement les cas suivants :

### A. Aucun résultat trouvé (Empty State)
- **Message** : "Aucune traduction exacte trouvée pour '[terme]'."
- **Action** : Proposer de signaler le mot manquant ou d'essayer une autre orthographe.
- **Visuel** : Illustration discrète, pas de page blanche.

### B. Erreurs Techniques (Réseau / Supabase)
- **Timeout** : Si l'API ne répond pas en 5s, afficher : "L'Alsace prend son temps... merci de patienter ou de réessayer."
- **Offline** : Notification si la connexion est perdue.

### C. Caractères Invalides
- **Contrainte** : Le traducteur accepte tous les caractères FR/ALS.
- **Alerte** : Si des caractères spéciaux non supportés par ORTHAL sont détectés dans le mode dictionnaire, un message d'aide au formatage s'affiche.

---
© 2026 Elsass Dico - Pour la sauvegarde de notre patrimoine linguistique.
