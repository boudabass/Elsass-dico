# 07 - Tests Utilisateurs Prioritaires

Cahier de test pour valider l'utilisabilité et la précision de l'application.

## 1. Profils des Testeurs
Pour le MVP, le panel de testeurs est composé de :
- **2 locuteurs natifs** : Valider la précision linguistique et le naturel des expressions.
- **3 apprenants intermédiaires** : Tester l'utilabilité pédagogique.
- **2 professeurs d'alsacien** : Vérifier la conformité aux structures linguistiques attendues.

## 2. Scénarios de Test
### Scénario 1 : "Traduire un message familial"
- **Objectif** : Vérifier si l'utilisateur peut traduire un court message quotidien (ex: "Salut maman, je viens manger à midi").
- **Critère de succès** : Temps de traduction < 30 secondes.

### Scénario 2 : "Recherche dictionnaire (Homonymie)"
- **Objectif** : Tapez un mot à double sens (ex: "Mousse").
- **Critère de succès** :
    - L'interface affiche clairement les DEUX sens (Plante vs Matière).
    - Pour chaque sens, **UNE SEULE variante** est proposée (le mot standard). Pas de "déclinaisons".

### Scénario 3 : "Traduire une phrase (Mode Traducteur)"
- **Objectif** : Tapez "Je vais à la mousse".
- **Critère de succès** :
    - Le système produit **UNE phrase unique**.
    - Aucun doute n'est permis. L'utilisateur ne doit pas avoir à cliquer pour choisir.
    - Le flux est fluide ("Traduire" -> "Résultat" -> "Copier").

### Scénario 4 : "Compréhension d'un texte alsacien"
- **Objectif** : Basculer l'interface en mode Als -> Fr pour comprendre un texte reçu.
- **Critère de succès** : Traduction inverse fluide et cohérente.

## 3. Métriques de succès
- **Précision** : 80% des suggestions sont utilisables sans correction.
- **Utilisabilité** : 90% des testeurs effectuent une traduction sans recourir à un tutoriel.
