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

- (Périmé depuis le 08/08/2026, cf. plus bas) Le front était un boilerplate
  Dyad intact, zéro code métier.
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
- (Périmé depuis le 08/08/2026) scripts/import_existing.py insérait dans des
  tables inexistantes et n'implémentait aucune règle de la doctrine. Supprimé,
  remplacé par scripts/ingest_attestations.py.

## Mise à jour du 08/08/2026

- Le front n'est plus vide : login adossé à Odoo, /admin (utilisateurs),
  /contributions (proposer, corriger, voter), /admin/arbitrage (file de
  candidats et écran d'arbitrage), / (recherche publique dans les deux sens) et
  /entree/[id] (détail avec sources).
- La table entrees est désormais alimentée et lue. Migration
  supabase/migrations/20260808120000_arbitrage.sql : candidats_arbitrage(),
  detail_candidat(), arbitrer_entree(), entrees_par_statut(),
  rechercher_entrees(), plus une colonne générée entrees.alsacien_recherche
  qui rend la recherche alsacien -> français indexable.
- Reste inchangé : aucune donnée n'est chargée, l'ingestion des 7260 entrées
  du dossier Dictionnaire vers attestations sous la source culture_alsace n'a
  pas commencé.

## Studio Elsass Dico (08/08/2026)

Équipe autonome de collecte de sources, montée sur le Kanban Swarm de Hermes,
sur le modèle du studio Elsass Game. Board `elsassdico`, sept profils `ed-*`.
Documentation Odoo, sous le hub 117 : board et rôles 716, profils 717
(sous-articles 718-724), passerelle Claude <-> elsassdico 725, amorçage lu par
le profil `default` 726.

- **La frontière du studio est `attestations`.** Les agents cherchent,
  extraient, vérifient et déposent du brut attesté. Ils ne créent jamais une
  `entree` : le passage attestation -> entrée reste humain, via
  `arbitrer_entree()` et /admin/arbitrage (règle 4, inchangée).
- **Sept règles doctrinales**, écrites dans le SOUL.md de chaque profil et non
  dans persona.md — l'investigation Hermes 712 a établi que seul SOUL.md est
  réellement chargé : (1) aucune forme alsacienne qui ne soit copiée verbatim
  d'une source, un doute se signale et ne se comble pas ; (2) extraction par
  parseur versionné, jamais de saisie — une ligne qu'aucun parseur ne peut
  regénérer est un défaut bloquant ; (3) aucun agent n'a
  SUPABASE_SERVICE_ROLE_KEY ; (4) aucun push sur main (Coolify y redéploie) ;
  (5) aucun agent ne crée d'entrée ; (6) jamais de root ni de modification de
  /opt/hermes/ ; (7) dépasser son budget d'actions se solde par un blocage de
  carte, jamais par plus d'efforts. Le bloc fait foi dans l'article Odoo 717 et
  se recopie intégralement, de 1 à 7.
- **Périmètre : données et sources uniquement.** Le code de l'app reste à
  Claude Code.
- **Dépôt** : `data/` versionné, contrat dans `data/README.md`. `data/raw/`
  contient la copie brute des sources — sans elle une extraction n'est pas
  vérifiable, et rejouer un parseur doit produire un `git diff` vide.
- **Ingestion** : `scripts/ingest_attestations.py`, idempotent, simulation par
  défaut, lancé à la main après relecture du diff. Remplace
  `scripts/import_existing.py`, supprimé.
- **elsassisch.eu n'est pas une source distincte** de
  culture.alsace.pagesperso-orange.fr : le chemin d'URL du miroir se déclare
  archive du même site. Même code `culture_alsace` — deux codes feraient
  compter deux fois la même attestation et videraient la règle 2.
- **type_terme étendu** à `toponyme` et `prenom` (migration
  20260808140000) : les rubriques villes/villages et prénoms alsaciens entrent
  dans `entrees` comme le reste. Les codes postaux 67/68 y remplissent enfin
  le champ `region`, vide à 100 % jusqu'ici.
- **ORTHAL** : un profil `ed-orthal` propose une graphie pour une forme déjà
  attestée, jamais ne décide. Ses propositions vont dans `propositions_orthal`
  (migration 20260808150000), **jamais dans `attestations`** — une graphie
  transcodée dérive d'une attestation, elle n'en est pas une seconde, et l'y
  verser gonflerait `nb_sources` d'un recoupement fictif. Il signe sous
  l'identité `orthal_bot` de la table `automates`, explicitement désignée comme
  automatique : personne ne doit prendre un transcodage pour le témoignage
  d'un locuteur. Profil non activé avant qu'une première campagne complète
  soit passée.

### Studio monté le 08/08/2026 au soir

- Profils en place : `elsassdico` (orchestrateur, port 8645, bot Telegram
  dédié) et six workers — `ed-prospecteur` 8646, `ed-extracteur` 8647,
  `ed-verificateur` 8648, `ed-orthal` 8649, `ed-gardien` 8650, `ed-doc` 8651.
  Board `elsassdico` créé, repo cloné dans /opt/data/elsass-dico sur la branche
  `data`.
- **Un worker n'a ni bot Telegram ni gateway actif.** Le dispatcher est unique
  sur la machine, vit dans le gateway de l'orchestrateur, et lance pour chaque
  carte un sous-processus éphémère `hermes -p <assignee> chat -q "work kanban
  task N"`. Les flags s6 `down` des `ed-*` restent en place. Donner un bot à un
  worker ouvrirait un canal de consignes hors du board, donc une perte de
  traçabilité.
- Trois affirmations de la doc initiale ont été démenties par le relevé réel et
  corrigées dans les articles : le port 8642 n'est pas occupé mais seulement la
  valeur par défaut d'Hermes ; `api_server: connected` n'est un critère de
  succès pour personne (aucun ne l'a actif dans ce build) ; le motif
  d'inventaire des variables d'environnement doit accepter les chiffres
  (`grep -oE '^[A-Z0-9_]+='`), faute de quoi il rate N8N_API_KEY.
- **Le PAT git du conteneur est celui de l'owner du dépôt.** Tout profil peut
  donc techniquement pousser sur main. Push suspendu jusqu'à substitution par
  un jeton restreint (dépôt seul, Contents en écriture, pas d'Administration)
  et pose d'une protection de branche sur main. La règle 4 doit être une
  barrière technique, pas une promesse.

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
- Pas de SMTP (07/08/2026) : les utilisateurs sont créés et gérés dans Odoo,
  et les comptes créés à la main voient leur lien transmis à la main depuis
  /admin. Aucun envoi d'e-mail automatique n'est donc à mettre en place — ne
  pas reproposer de relais SMTP.
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
- Arbitrage (08/08/2026) : la garde de la règle 2 vit dans
  arbitrer_entree(), pas dans l'interface. Passer une entrée à statut='valide'
  avec moins de 2 sources distinctes lève une exception, sauf si
  notes_arbitrage est renseignée — c'est la forme technique de l'exception du
  07/08/2026. L'interface reproduit la règle pour l'ergonomie, elle n'en est
  pas la barrière.
- Amorçage en deux temps (08/08/2026, fait) : le profil Hermes `default` a créé
  le seul profil `elsassdico` (article Odoo 726) puis s'est arrêté, et
  `elsassdico` a créé le board et les six profils `ed-*` (article 725). La
  séparation évitait qu'un profil généraliste prenne des décisions engageant la
  doctrine ; elle a tenu.
- Prochaine étape (révisée le 08/08/2026 au soir) : la campagne 1 sur
  culture_alsace est lancée — `ed-prospecteur` inventorie le miroir et archive
  les pages brutes dans data/raw/, puis s'arrête au GATE inventaire. Rien n'est
  poussé vers origin tant que le jeton git n'est pas restreint. Le dossier
  Dictionnaire
  (7260 entrées A-D) est une extraction antérieure au studio et non vérifiée :
  à reprendre au contrat data/README.md avant ingestion. Ces attestations ne
  doivent jamais alimenter entrees directement — elles entreront dans la file
  d'arbitrage comme n'importe quelle autre, marquées 1 source sur N.

## Règles de travail

- Ne jamais inventer de traduction alsacienne, même pour un exemple ou un test.
- Ne jamais remplir la base sans recoupement multi-sources.
- Toujours demander avant de supprimer des données existantes.
