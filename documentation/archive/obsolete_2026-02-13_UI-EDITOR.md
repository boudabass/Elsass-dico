# 06 - Spécifications Interface (UI) - EDITOR & ADMIN
**Cible** : Utilisateurs connectés uniquement (Rôles `editeur` et `admin`)

## 1. Zones Restreintes (Accès)

Une "Barre de Gestion" discrète (admin bar) ou un lien "Connexion" en footer permet l'accès.
Toute tentative d'URL directe redirige vers `/login`.

## 2. Mode Éditeur (Overlay sur Site Public)

Une fois connecté avec le rôle `editeur`, l'interface publique s'enrichit :

- **Sur une traduction** : Apparition d'un bouton "✏️ Modifier" à côté des segments.
- **Action** : Ouvre une modale de correction pour l'entrée correspondante (`mots` ou `expressions`).
- **Modale d'Édition** :
  - **Zone "Forme Canonique"** : La traduction actuellement affichée au public.
  - **Zone "Variantes Masquées"** :
    - Liste des autres traductions disponibles en BDD (ex: variantes 68, synonymes moins courants).
    - **Action :** Bouton `👑 Promouvoir` à côté de chaque variante pour en faire la nouvelle Forme Canonique (remplace la principale).
  - Champs éditables : Alsacien, Contexte, Niveau, Région.
  - Bouton `Enregistrer` (Update BDD) et `Annuler`.

## 3. Dashboard Admin (`/admin`)

Interface centrale pour la gestion du projet.

### A. Gestion des Utilisateurs
- Liste des utilisateurs inscrits.
- Actions :
  - **Inviter** (Email).
  - **Révoquer** (Désactiver accès).
  - **Changer Rôle** (Éditeur ↔ Admin).

### B. Outil de Traitement du Feedback (`/admin/feedback`)

Interface dédiée "Inbox" pour traiter les retours publics efficacement :

#### 1. Liste de Triage
*   Tableau trié par défaut : `Priorité Admin` > `Score Votes` > `Date`.
*   **Colonnes** :
    *   _Priorité_ (⭐)
    *   _Source_ ("maison")
    *   _Type_ (Suggestion / Vote)
    *   _Contenu_ ("haim" / +15 votes)
    *   _Actions_ (Appliquer/Ignorer)

#### 2. Actions Rapides (One-Click)
*   ⭐ **Prioriser** : Marque l'élément comme important (reste en haut de la pile).
*   💎 **Promouvoir (Variante Unique)** : 
    *   Remplace la traduction actuelle par cette proposition (si meilleure/plus standard).
    *   L'ancienne version peut être archivée ou supprimée.
*   ✅ **Corriger** : 
    *   Si Vote Négatif : Ouvre la fiche pour vérification manuelle.
*   🗑️ **Ignorer** : Archive le feedback (statut `rejete`) et le retire de la liste.

#### 3. UX "Inbox Zero"
*   L'objectif est de vider la liste.
*   Support des raccourcis clavier (↑/↓ pour sélectionner, Enter pour agir).

## 4. Charte Graphique Admin

Reprend les codes couleurs de l'interface publique mais avec une structure "Dashboard" (Sidebar latérale, Tables denses).
Utilisation intensive de composants Shadcn/Data-Table.
