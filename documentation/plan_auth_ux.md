# Plan d'Implémentation - Architecture Hybride (Supabase Auth + Lowdb Data)

## 📌 Objectif
Utiliser l'authentification Supabase **déjà existante** (actuellement pour Admin) et l'étendre aux Joueurs pour sécuriser les scores et personnaliser l'expérience.

## 🏗️ Architecture Existant vs Nouveau

### 1. Authentification (Supabase)
*   **Existant :**
    *   `src/middleware.ts` : Gère déjà la session Supabase (SSR).
    *   `/login` : Page de connexion fonctionnelle.
    *   `useAuth()` : Hook disponible.
*   **À Faire :**
    *   Exposer l'état Auth dans une **Navbar Globale**.
    *   Permettre aux utilisateurs non-admin de se connecter (pour jouer).

### 2. Base de Données (Lowdb)
*   **Score :** Ajout du champ `userId` dans `src/lib/database.ts`.
    ```typescript
    interface Score {
      userId?: string; // ID Supabase (Optional pour backward compat)
      userEmail?: string; // Pour affichage facile
      // ...
    }
    ```

### 3. Interface Utilisateur
*   **Navbar (Globale) :**
    *   Remplacer header actuel par une Navbar Shadcn.
    *   Si connecté : Avatar + Dropdown (Profil, Admin si role=admin, Logout).
    *   Si déconnecté : Bouton "Connexion".
*   **Pages :**
    *   `/profile` : Page publique/privée montrant les meilleurs scores du joueur.
    *   `/scores` : Liste globale des scores par jeu.

### 4. Integration Hub (`system.js`) - CRITIQUE
Le Hub doit être capable de dire au backend "C'est moi, User X, qui envoie ce score".
*   **Problème :** `system.js` est client-side.
*   **Solution :**
    *   Le navigateur envoie automatiquement les cookies (dont le cookie Supabase) lors du fetch vers `/api/scores`.
    *   C'est le **Backend (`api/scores`)** qui doit valider le cookie pour authentifier la requête.

## 📝 Étapes de Réalisation

### Phase 1 : Sécurisation API Score
1.  Modifier `src/app/api/scores/route.ts`.
2.  Utiliser `createServerClient` (comme le middleware) pour récupérer le user.
3.  Si user trouvé -> Enregistrer `userId` dans le score.

### Phase 2 : UI Navigation (Navbar)
1.  Créer `src/components/main-nav.tsx` (Logo, Liens).
2.  Créer `src/components/user-nav.tsx` (Avatar, Login/Logout).
3.  Intégrer dans `layout.tsx`.

### Phase 3 : Page Profile
1.  Route `/profile/page.tsx`.
2.  Récupère le user courant -> Affiche ses scores filtrés depuis Lowdb.

### Phase 4 : Hub Connecté
1.  Mettre à jour `system.js` pour afficher "Connecté en tant que..." dans l'overlay menu.

## ✅ Validation
1.  Se connecter avec un compte user.
2.  Jouer à Snake V3.
3.  Vérifier que le score dans `db.json` contient bien l'ID Supabase.
