# Elsass Dico

**Elsass Dico** est une application moderne de traduction Français-Alsacien, conçue pour sauvegarder et promouvoir la langue alsacienne à travers un outil numérique performant et précis.

## 🚀 Mission
Créer l'outil de traduction le plus complet au monde pour l'alsacien. Le projet s'appuie sur le système **ORTHAL 2023** comme base de travail évolutive pour forger un nouveau standard d'**Alsacien Unifié** 100% open-source et libre de droits.

## 🛠 Stack Technique
- **Framework** : Next.js 15 (App Router)
- **Backend / BDD** : Supabase (PostgreSQL, RLS, pg_trgm, unaccent)
- **Styling** : Tailwind CSS + Shadcn/UI
- **Données** : Dictionnaire bidirectionnel (~46 000 entrées)

## 📁 Documentation
Tous les détails du projet sont disponibles dans le dossier `documentation/` :
- [01 - PRD](documentation/01-PRD.md) : Vision et fonctionnalités.
- [02 - Schéma BDD](documentation/02-SCHEMA-BDD.md) : Modèle de données PostgreSQL.
- [03 - Décisions Techniques](03-DECISIONS-TECHNIQUES.md) : Choix architecturaux.
- [04 - Architecture Technique](documentation/04-ARCHITECTURE.md) : Flux de données et API.
- [05 - Import des Données](documentation/05-IMPORT-DONNEES.md) : Processus d'acquisition des données.
- [06 - Interface UI Public](documentation/06-INTERFACE-UI-PUBLIC.md) : Spécifications de l'expérience utilisateur.

## 💻 Installation (Développement)
1. Cloner le dépôt.
2. Installer les dépendances : `npm install`.
3. Configurer le fichier `.env` avec vos clés Supabase.
4. Lancer le serveur de développement : `npm run dev`.

---
© 2026 Elsass Dico - Pour la sauvegarde de notre patrimoine linguistique.