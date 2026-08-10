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
- (Périmé depuis le 09/08/2026, cf. « Première ingestion ») Aucune donnée
  n'était chargée à cette date.

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
- Prochaine étape (révisée le 10/08/2026) : **campagne dictionnaire**
  (remplacement du dossier Dictionnaire, 7260 entrées A-D, ~50 pages —
  archivé dans data/raw/, vient de la même source unique). La recherche
  d'une deuxième source est terminée : trois sources retenues et ingérées
  (`alsacien_wikipedia`, `martin_lienhart`, `wiktionnaire_fr`), cf.
  « Campagne 2 close ». Le périmètre des GATE (quelles décisions ont
  vraiment besoin d'une validation humaine explicite avant de continuer) est
  à trancher en premier — décision de John en cours (10/08/2026), pas encore
  actée ici.

## Première ingestion (09/08/2026)

**La base n'est plus vide : 396 attestations, 0 entrée.** Lot
`culture_alsace__villes_villages_hr` — les communes du Haut-Rhin, premier
aboutissement de la chaîne studio -> arbitrage.

- La chaîne complète a tourné : inventaire (73 pages brutes archivées) ->
  extraction par parseur versionné -> vérification -> audit doctrinal -> GATE
  humain -> ingestion. Le vérificateur a **trouvé deux vraies erreurs** de
  mapping de colonnes avant le GATE ; un dispositif qui ne trouve jamais rien
  ne prouve rien.
- 397 lignes au JSONL, 396 en base : la source liste `Altenbach` deux fois,
  la contrainte UNIQUE l'absorbe. Le JSONL reste fidèle à la source, le
  dédoublonnage est le travail de la base — ne jamais « nettoyer » un JSONL.
- Ces 396 sont des candidats à **1 source sur N** : `arbitrer_entree()`
  refusera de les valider sans note d'arbitrage. Rien n'est publié.
- `region` est enfin rempli (393/396). Les 3 vides viennent de coquilles de
  codes postaux dans la source (58500 pour 68500, etc.), non corrigées. D'où
  la règle retenue pour la suite : **`region` se déduit de l'intitulé de page,
  le code postal n'est plus qu'un contrôle** — le contrat data/README.md
  autorise les deux, et la page ne comporte pas de coquille.

**Coolify n'applique aucune migration.** Il construit l'image Next.js à chaque
push, et rien d'autre : supabase/migrations/ ne s'exécute qu'à la main, dans le
SQL Editor du Studio. Les migrations 20260808140000 et 20260808150000 avaient
été oubliées, et rien ne le signalait — le site répondait 200. Le retard n'est
apparu qu'à la première écriture, à mi-parcours, après création d'une source.
`ingest_attestations.py` porte désormais une garde de schéma
(`verifier_schema()`) : elle lit le schéma réellement exposé par PostgREST,
refuse avant tout appel d'écriture (code de sortie 4) et nomme le fichier de
migration à passer. Elle bloque sur ce que le lot va écrire et se contente
d'avertir sur le reste.

- Studio Supabase : `https://supabasekong-<uuid>.theelsassisch.fr/`,
  authentification basique, identifiants dans les variables du service Coolify.
- `main` est protégé depuis le 08/08/2026 au soir : ruleset
  `protect-main-no-direct-push`, règles `pull_request` + `non_fast_forward` +
  `deletion`, **aucun bypass** — la règle 4 est une barrière technique et non
  plus une promesse. Toute modification de main passe par une PR, y compris les
  nôtres. C'est la protection de branche, et non le remplacement du jeton, qui
  porte la règle : elle vaut contre tous les jetons, owner compris.

## Campagne 1 close (09/08/2026)

**1 132 attestations, 0 entrée.** Source `culture_alsace`, trois rubriques :
`villes_villages_hr` (397 lignes -> 396), `villes_villages_br` (558),
`prenoms` (179 -> 178). 954 toponymes, 178 prénoms.

- **Homonymes : `contexte`, jamais `region`.** `Bouxwiller` existe dans les deux
  départements avec la même forme alsacienne. La clé UNIQUE portant sur
  `(source_id, francais, alsacien, contexte)`, les deux communes fusionnaient et
  l'une disparaissait en silence. Les toponymes portent donc `contexte` =
  `Haut-Rhin` / `Bas-Rhin`, en clair car le champ s'affiche. `region` ne peut pas
  jouer ce rôle : elle n'est pas dans la clé. C'est ce que dit déjà la doctrine
  éditoriale — homonymes séparés via `contexte`.
- **Une répétition interne à une source n'est jamais un recoupement.** Ni
  `Altenbach` listé deux fois, ni `Schennla` partagée par deux entrées de la page
  des prénoms, ni les deux sens du dictionnaire (`page_X` / `page_Xf`) ne
  comptent double : ils gonfleraient `nb_attestations` d'un recoupement fictif.
  Le sens inverse sert de contrôle de cohérence interne, à rendre au rapport,
  jamais dans le JSONL.
- **L'ingestion se fait rubrique par rubrique** (`--rubrique`). Les rubriques
  d'une source n'avancent pas au même rythme : `--source` seul emporterait des
  lots qui n'ont pas passé leur GATE, sans erreur ni avertissement.
- **Un JSONL se nomme d'après la clé de rubrique de la fiche source**, jamais
  d'après la page d'origine — le motif de `--rubrique` est
  `<source>__<rubrique>.jsonl`. Le lot des prénoms s'appelait
  `culture_alsace__prenomsalsaciens.jsonl` pour une rubrique `prenoms` :
  `--rubrique prenoms` ne désignait rien et rendait un succès silencieux.
  Depuis, un filtre explicite qui ne trouve aucun fichier **échoue** (code 1) en
  listant les rubriques réellement déposées. Le brut, lui, garde le nom de la
  page : c'est la copie de la source, pas un produit du studio.
- **`--resync`** rattrape une correction de parseur appliquée après ingestion —
  `ignore-duplicates` laisse sinon la ligne existante telle quelle, en silence.
  Il ne peut rien quand la correction touche la clé elle-même : il faut alors
  supprimer puis réingérer.
- **`data/raw/** -text` dans `.gitattributes`** : la source a des fins de ligne
  mixtes, et `core.autocrlf` les réécrivait au checkout. Sans cet attribut, les
  73 md5 tombent faux et un aller-retour Windows modifie l'archive.
- **La fiche source porte les verdicts de vérification** (bloc `verification` :
  verdict, carte, échantillon, graine, date), préservés à la régénération comme
  `statut`. Un rapport de carte est éphémère, le dépôt reste — et le verdict est
  ce qui *autorise* l'ingestion.

**Le goulot n'est plus l'extraction.** Tout vient d'une source unique, donc tout
est à 1 source sur N et `arbitrer_entree()` refuse. Extraire les 50 pages du
dictionnaire porterait le stock à ~44 000 lignes également bloquées. La campagne
suivante est donc la **recherche d'une deuxième source** (article Odoo 725), et
non le dictionnaire. Pour les toponymes, la deuxième source la plus solide n'est
peut-être pas un site : le circuit `/contributions` existe déjà, un contributeur
= une source, et 954 communes à confirmer est un objet de campagne fini.

## Campagne 1 réellement close (09/08/2026, chantier Odoo 730)

La section ci-dessus décrivait le dépôt ; la base, elle, était restée en arrière.
**Elle est maintenant à 1 132 attestations et 0 entrée**, vérifiées par comptage :
954 toponymes (396 `Haut-Rhin`, 558 `Bas-Rhin`), 178 prénoms, `region` rempli sur
954/954, `Bouxwiller` présent deux fois — y compris dans `/admin/arbitrage`.

- **Le dépôt à jour ne prouve pas la base à jour.** Le fix `contexte` était
  commité, vérifié et mergé, et n'avait jamais atteint Supabase : 953 toponymes
  y restaient à `contexte` vide, et le `Bouxwiller` du Bas-Rhin, absorbé par la
  clé UNIQUE à l'ingestion, manquait en silence. Rien ne relie le dépôt à la
  base, et rien ne le signale. **Après tout correctif touchant un JSONL déjà
  ingéré, le contrôle est un comptage en base, pas un `git log`.** C'est le
  pendant exact de Coolify, qui redéploie l'app sans appliquer une migration.
- La réparation a été une **purge SQL ciblée** (`type='toponyme' and
  contexte=''`, 953 lignes, lancée à la main dans le SQL Editor) puis une
  réingestion rubrique par rubrique. `--resync` ne pouvait rien : la correction
  portait sur la clé d'unicité elle-même.
- **Un JSONL se nomme d'après la clé de rubrique de la fiche source**, jamais
  d'après la page — cf. la règle plus haut. La clé est en dur dans
  `inventaire_miroir.py`, qui s'en sert pour reprendre `statut` et
  `verification` à chaque régénération : renommer une clé dans la fiche seule
  les perdrait au prochain passage du générateur. C'est le fichier qu'on
  renomme, pas la clé.
- **Point de départ de la campagne 2** : trois échantillons candidats sont déjà
  déposés dans `data/raw/` par `ed-prospecteur` — `alsacien_wikipedia`,
  `martin_lienhart`, `wiktionnaire_fr`. Le GATE est humain, le critère décisif
  est l'**indépendance** : deux sources dont l'une recopie l'autre comptent pour
  une seule.

## Campagne 2 — deuxième source (09-10/08/2026)

**Statut : trois sources en cours de vérification/audit, aucune ingérée.** Le
studio a prospecté trois candidates (`ed-prospecteur`, échantillons dans
`data/raw/` sur la branche `data`, commit `184e2e6`) : `alsacien_wikipedia`
(als.wikipedia.org), `wiktionnaire_fr` (fr.wiktionary.org), `martin_lienhart`
(Wörterbuch der elsässischen Mundarten, Martin & Lienhart 1899-1907, via
l'API Wörterbuchnetz de Trèves). GATE Claude Code rendu sur pièces (pas sur
rapport) à chaque étape, consignes tenues à jour dans l'article Odoo 725.

- **`alsacien_wikipedia` — retenue, généralisée à 597 attestations.**
  Rédaction encyclopédique communautaire, licence CC BY-SA/GFDL, non dérivée
  de `culture_alsace`. Jointure par nom de commune (champ `nomalsacien` de
  l'infobox) avec les 954 toponymes déjà en base ; les 5 vrais homonymes
  HR/BR (`Bouxwiller`, `Buhl`, `Breitenbach`, `Herrlisheim`, `Steinbach`)
  sont omis comme prévu. Point à vérifier avant arbitrage, non bloquant :
  `Mulhouse` et `Eckartswiller` sont dédupliqués par le parseur comme des
  doublons internes à la source (même `contexte` sur les deux lignes,
  raisonnement calqué sur le précédent `Altenbach`), mais leurs formes
  alsaciennes et codes postaux diffèrent contrairement à `Altenbach` — à
  faire confirmer par `ed-gardien`.
- **`wiktionnaire_fr` — retenue.** Pilote de 18 attestations (17 pages),
  puis inventaire complet de `Catégorie:alémanique` : 834 pages (621
  toponymes, 119 éléments chimiques, 62 mots, 33 noms propres), zéro
  extraction sur ce lot. Généralisation en attente d'une carte dédiée.
  Défaut mineur relevé : 3 entrées du pilote décrivant des communes sont
  taguées `type: "mot"` au lieu de `toponyme`, à corriger au prochain lot.
- **`martin_lienhart` — retenue sous réserve de droits, pilote à 5
  communes.** Le dictionnaire apparie l'alsacien à l'**allemand**, jamais au
  français : la seule extraction sûre est la **jointure toponymique** (le
  lemme allemand correspond au nom officiel français déjà en base par
  correspondance historique connue, jamais une traduction — règle 1). ElsWB
  n'a que 5 lemmes toponymiques correspondant à une commune de
  `culture_alsace`, tous en Bas-Rhin (`Strasbourg`, `Hagenau`, `Ittenheim`,
  `Wasselonne`, `Brumaht`/Brumath) — plafond réel, pas un artefact du pilote.
  Le vocabulaire général reste hors périmètre tant qu'aucune méthode
  d'extraction non traductrice n'est trouvée. **Réserve juridique** : les
  CGU de woerterbuchnetz.de ne montrent aucune licence explicite de
  réutilisation ; une demande de clarification est en cours auprès de
  `kompetenzzentrum@uni-trier.de`. Décision John (09/08/2026) : l'extraction
  pilote démarre en parallèle de la demande (statut « à valider » comme
  toute donnée du studio, règle 4) ; un refus impliquerait un retrait des
  données déjà extraites.

**Suite** : les trois lots passent par `ed-verificateur` puis `ed-gardien`
(même chaîne que la campagne 1) avant tout GATE d'ingestion. La campagne sur
le dossier `Dictionnaire/` (remplacement, ~50 pages) reste en attente que ces
trois lots atteignent l'ingestion.

## Campagne 2 close (10/08/2026)

**2507 attestations, 0 entrée nouvelle.** Les trois sources prospectées ont
toutes été tranchées : `alsacien_wikipedia` (597, approuvé et ingéré),
`martin_lienhart` (5, approuvé et ingéré — plafond réel confirmé, la
jointure toponymique n'a rien de plus à donner par cette méthode),
`wiktionnaire_fr` (généralisé aux 834 pages de `Catégorie:alémanique`, 773
attestations sur 755 pages productrices, approuvé et ingéré après une
correction de parseur). Total recompté indépendamment en base (requête
directe, pas le rapport du script d'ingestion) : `culture_alsace` 1132,
`alsacien_wikipedia` 597, `martin_lienhart` 5, `wiktionnaire_fr` 773 = 2507.

- **Un commit non poussé s'est fait passer pour un GATE tranché.** Le pilote
  élargi de `wiktionnaire_fr` avait été produit et committé (`4934f86`) dans
  le clone local du studio, jamais poussé sur `origin/data` — la carte
  l'annonçait comme déposé. Le premier refus de Claude Code était donc
  correct *au vu de ce qui était réellement sur le dépôt partagé*, mais fondé
  sur un état périmé côté studio. Réconcilié par Claude Code (commit
  `a75d1e0`) après vérification octet à octet que le commit local était un
  vrai sur-ensemble du commit déjà poussé (`17a9eb5`) — même contenu sur les
  5 lignes communes, rien perdu. Leçon retenue côté studio : les cartes de ce
  type exigent désormais « commit ET push sur data », pas seulement
  « commit », pour que la revue GATE voie l'état réel.
- **Détection toponyme généralisée sans excès.** Le parseur `wiktionnaire_fr`
  reste conservateur par construction (règle 3) : sur les 834 pages, 79 n'ont
  produit aucune attestation, et 24 templates de tête inconnus ont laissé des
  lignes omises plutôt que devinées. La seule commune du Haut-Rhin du corpus
  (`Wìnkel`) partage son lemme avec le mot commun « angle » ; ses trois sens
  communs sont extraits, son sens toponymique est omis faute de nom
  identifiable dans la phrase — d'où `region=haut_rhin` à 0 sur ce lot, un
  résultat correct et non un défaut du parseur.
- Vérification indépendante systématique cette campagne : chaque décision
  Claude Code s'est prise sur les fichiers `data/` poussés, jamais sur les
  rapports de carte seuls — deux fois cela a changé la décision (le refus
  initial de `wiktionnaire_fr`, la réconciliation du pilote élargi).

**Prochaine étape** : le dossier `Dictionnaire/` (remplacement par la sortie
du parseur, ~50 pages) est débloqué — plus aucune source de campagne 2 ne
retient l'ingestion.

## Périmètre des GATE tranché (10/08/2026, décision de John)

- **Ce qui s'allège** : l'extraction vers `attestations` (dépôt JSONL sur
  `data`, ingestion candidate en base, statut non public) et le verdict
  `ed-verificateur` / `ed-gardien` — Claude Code n'a plus besoin de refaire
  systématiquement le contrôle octet à octet avant chaque étape de ce
  périmètre. Un doute signalé dans un rapport de carte reste traité comme
  avant (contrôle sur pièces).
- **Ce qui reste inchangé, sans exception nouvelle** :
  - l'arbitrage humain (`statut='valide'`, `/admin/arbitrage`, règle 4) —
    c'est l'étape qui rend une donnée publique, elle n'a jamais été faite
    par le studio (règle doctrinale 5 : aucun agent ne crée d'entrée) et
    reste réservée à un admin ;
  - le seuil de 2 sources distinctes de `arbitrer_entree()` (règle 2), y
    compris pour le dossier `Dictionnaire/` lui-même : une reprise en masse
    d'une source scrapée unique est exactement le cas que l'exception du
    07/08/2026 exclut explicitement (« la règle vise la reprise en masse
    d'une source scrapée, pas le témoignage d'un locuteur qu'un humain a
    arbitré »). Le dossier reste donc bloqué à 1 source sur N tant qu'aucune
    deuxième source indépendante ne recoupe chaque entrée.
- Écarté en cours de clarification : faire compter un code postal cohérent
  comme un deuxième élément de confiance pour un toponyme à source lexicale
  unique. Il valide l'identité de la commune française, pas la forme
  alsacienne — il ne recoupe rien au sens de la règle 2. Le vrai recoupement
  reste lexical, entre deux sources qui s'accordent sur la même forme
  alsacienne (comme la jointure `alsacien_wikipedia` × `culture_alsace` de la
  campagne 2) : la règle actuelle le couvre déjà, sans changement de seuil.

## Règles de travail

- Ne jamais inventer de traduction alsacienne, même pour un exemple ou un test.
- Ne jamais remplir la base sans recoupement multi-sources.
- Toujours demander avant de supprimer des données existantes.
