# Refactorings et Modifications à Prévoir

Ce document liste les écarts identifiés entre la codebase actuelle (basée sur un template dashboard) et la cible définie dans la documentation technique.

## 1. Structure des Routes (`src/app`)
- **Action** : Regrouper les routes liées au profil et à l'historique sous un groupe de routes `(auth)/`.
- **Raison** : Meilleure organisation du code et application uniforme du layout d'authentification sans modifier les URLs finales.
- **Routes concernées** :
  - Move `/profile` -> `/(auth)/profile`
  - Move `/dashboard` (ou `/historique`) -> `/(auth)/historique`
  - Move `/login` -> `/(auth)/login` (si applicable)

## 2. Centralisation de la Logique Métier
- **Action** : Créer `src/lib/traducteur.ts`.
- **Raison** : Extraire la logique de segmentation, de matching (exact + trigrammes) et de calcul de score des API Routes pour la rendre réutilisable et testable.
- **Impact** : Les API Routes deviendront de simples contrôleurs appelant ce service.

## 3. Mise à jour des Composants UI
- **Action** : Refactoriser les composants génériques du template pour les adapter au design "Premium" d'Elsass Dico.
- **Actions spécifiques** :
  - Créer `src/components/AnalysisPanel.tsx`.
  - Créer `src/components/UnifiedResult.tsx`.
  - Créer `src/components/InputArea.tsx`.
  - Créer `src/components/DirectionToggle.tsx`.
  - Créer `src/components/CopyButton.tsx`.
  - Adapter `user-nav.tsx` pour inclure le lien vers l'historique personnel.

## 4. Nettoyage du Template
- **Action** : Supprimer les éléments inutiles du boilerplate actuel (ex: composants de démo, graphiques Recharts non utilisés).
- **Raison** : Garder une codebase propre et légère pour le MVP.

## 5. Middleware & Sécurité
- **Action** : Ajuster `middleware.ts` pour qu'il cible spécifiquement les groupes de routes `(auth)/` et les routes d'administration.
- **Raison** : Performance et précision des redirections.

## 6. Gestion des Corrections et Rôle Éditeur
- **Action** : Implémenter un système de gestion des rôles dans Supabase (déjà partiellement présent via la table `profiles`).
- **Raison** : Permettre aux locuteurs experts de rectifier les erreurs d'importation directement depuis l'UI.
- **Actions spécifiques** :
  - Ajouter le rôle `editeur` dans les contraintes de la table `profiles`.
  - Créer une vue d'édition accessible uniquement aux admins/éditeurs.
