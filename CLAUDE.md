# Elsass Dico

Traducteur français/alsacien, publié sur dico.theelsassisch.fr, adossé à la
marque The Elsassisch. La crédibilité linguistique est critique : du faux
alsacien publié sous cette marque serait un vrai problème.

## Règles non négociables sur les données

1. Aucune traduction générée par un LLM. Jamais. Une entrée inventée est pire
   que pas d'entrée.
2. Aucune copie d'une source unique. La base se construit par recoupement : un
   équivalent attesté dans plusieurs sources indépendantes est retenu, puis
   réécrit en Orthal. Divergence entre sources = entrée marquée pour arbitrage
   manuel. Seule exception, décidée le 07/08/2026 : un admin peut publier une
   entrée à partir d'une contribution unique s'il en juge ainsi. La règle vise
   la reprise en masse d'une source scrapée, pas le témoignage d'un locuteur
   qu'un humain a arbitré.
3. Chaque entrée porte un champ sources et un nombre d'attestations, qui sert
   de score de confiance.
4. Rien ne passe en production sans validation humaine. Statut "à valider" par
   défaut.

## Doctrine éditoriale

- Référence orthographique : ORTHAL 2023 (association AGATE). C'est un système
  de graphie, pas un dictionnaire. Il s'applique en sortie, il ne traduit rien.
- Alsacien unifié : règle "Premier est Roi", la traduction canonique est à
  l'index 0 du tableau JSONB.
- Homonymes séparés en entrées distinctes via le champ contexte.
- Variantes Bas-Rhin / Haut-Rhin conservées quand elles diffèrent.

## État réel (audit du 31/07/2026)

- Le front est un boilerplate Dyad intact, zéro code métier. La landing affiche
  "Template Next.js Boilerplate".
- Le schéma dictionnaire existe depuis
  supabase/migrations/20260731120000_schema_dictionnaire.sql : tables
  sources, attestations, entrees, entree_attestations, avec pg_trgm et
  unaccent. Aucune donnée n'y est encore chargée — l'ingestion des 7260
  entrées du dossier Dictionnaire vers attestations reste à faire (cf.
  Décisions prises).
- Le dossier Dictionnaire contient 7260 entrées (lettres A à D), mais c'est un
  scrape mot pour mot d'une source unique : culture.alsace.pagesperso-orange.fr,
  dont le miroir est commité dans temp_page_af.html. Cela viole la règle 2. À
  traiter comme source 1 sur N, jamais comme base de référence.
- Sur 14377 traductions, les champs variante, niveau, region et note sont
  remplis 0 fois. tags vide à 100%, contexte vide à 99,9%. 227 clés
  français+contexte en doublon, homonymes non arbitrés.
- Les chiffres 46000 (README, doc schéma) et 30000 (doc import) sont des
  objectifs, pas des existants. À corriger dans la doc.
- scripts/import_existing.py insère dans des tables qui n'existent pas et
  n'implémente aucune règle de la doctrine.

## Infra

Coolify self-hosted v4.1.2 sur VPS OVH. Supabase self-hosted à déployer dessus.

## Décisions prises

- Modèle de données à deux niveaux retenu : attestations brutes par source,
  puis entrees dérivées par recoupement. Le schéma à 4 tables plates de la
  doc initiale est abandonné.
- Déploiement (révisé le 06/08/2026) : Coolify build directement depuis le
  repo GitHub (Dockerfile, branche main), même mode que elsass-game —
  redeploy automatique à chaque push, sans étape intermédiaire. Remplace
  l'ancien pipeline GitHub Actions -> ghcr.io (image "pull-only"), abandonné
  parce qu'il n'offrait pas de redeploy automatique sans webhook manuel. Les
  NEXT_PUBLIC_* sont des Build Variables Coolify (gravées dans l'image par
  Coolify lui-même, pas par GitHub Actions). SUPABASE_SERVICE_ROLE_KEY reste
  une variable runtime Coolify uniquement, jamais marquée disponible au
  build.
- Domaine : dico.theelsassisch.fr
- Authentification (06/08/2026) : Odoo est l'autorité sur les mots de passe,
  Supabase reste l'autorité sur les sessions et les rôles. Le login vérifie
  les identifiants portail via un POST JSON-RPC sur
  /web/session/authenticate, puis ouvre une vraie session Supabase
  (generateLink + verifyOtp côté serveur) : la RLS, profiles et
  requireAdmin() fonctionnent inchangés. profiles.odoo_uid relie les deux
  annuaires. Le modèle d'elsass-game (cookie HMAC maison, PostgreSQL sans
  RLS, admin dérivé d'ADMIN_UID) a été écarté ici : la RLS du dico est
  porteuse et non décorative, et il faut trois rôles, pas un booléen. Une
  connexion de secours par mot de passe Supabase reste disponible si Odoo
  est injoignable.
- Rôles : user, contributeur, admin. Un contributeur propose et corrige mais
  ne valide pas — le passage à statut='valide' reste réservé aux admins
  (règle 4).
- Contributions (07/08/2026) : une proposition de contributeur entre dans
  attestations, jamais directement dans entrees. Un contributeur = une source
  (sources.type='contribution', sources.profil_id), pour que deux
  contributeurs proposant le même mot comptent comme deux attestations
  distinctes — la contrainte UNIQUE d'attestations porte sur source_id. Le
  nom de la source est pseudonyme, car sources_entree() expose nom et url
  publiquement ; l'e-mail reste dans notes, réservé aux admins.
- Validation par les pairs : un vote (table attestation_votes), distinct de
  l'attestation. Voter ne crée pas d'attestation, donc le score n'est PAS un
  recoupement au sens de la règle 2 — c'est une aide à l'arbitrage affichée
  sur 5. Aucun seuil ne déclenche quoi que ce soit automatiquement. On ne vote
  pas pour soi.
- Une contribution se fige dès qu'elle est retenue dans une entrée
  (entree_attestations) : ni modifiable ni supprimable par son auteur, sinon
  la traçabilité mentirait sur ce qui a fondé la décision.
- Prochaine étape après la migration : ingérer les 7260 entrées du dossier
  Dictionnaire dans attestations avec la source culture_alsace. Elles ne
  doivent jamais alimenter entrees directement.

## Règles de travail

- Ne jamais inventer de traduction alsacienne, même pour un exemple ou un test.
- Ne jamais remplir la base sans recoupement multi-sources.
- Toujours demander avant de supprimer des données existantes.
