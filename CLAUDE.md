# Elsass Dico

Traducteur français/alsacien, publié sur elsass-dico.theelsassisch.fr, adossé à la
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
  candidats et écran d'arbitrage — un onglet « Recoupées » s'y est ajouté le
  23/08/2026, cf. « Premières entrées publiées »), / (recherche publique dans
  les deux sens) et /entree/[id] (détail avec sources).
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
- Domaine (corrigé le 23/08/2026) : **elsass-dico.theelsassisch.fr**, seul FQDN
  déclaré par l'application Coolify `elsass-dico:main-utdpj1qsxnn954id84t28rha`.
  L'ancien `dico.theelsassisch.fr`, inscrit ici jusqu'à cette date, répond 503 —
  un 503 sur cette URL n'est donc pas une panne du site.
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
- Prochaine étape (tranchée le 24/08/2026) : **campagne 5 = troisième source
  lexicale**, cf. la section « Campagne 5 » en fin de document. Le constat
  ci-dessous, écrit le 23/08 quand la question était encore ouverte, reste exact
  sur les chiffres — seule sa conclusion « non tranchée » est périmée.
- (Conclusion périmée depuis le 24/08/2026, chiffres toujours valables)
  Prochaine étape (révisée le 23/08/2026) : **campagne 5, non tranchée.** Tout
  ce qui précédait est fait — deuxième source (campagne 2), dictionnaire
  (campagne 3), deuxième source du lexique général (campagne 4), et
  169 premières entrées publiées. **Le goulot n'est plus le volume
  d'attestations mais le recoupement lexical** : sur 26 309 candidats,
  ~25 680 n'ont qu'une source, et sur les 629 à deux sources, 460 voient
  ces sources écrire des formes *différentes*. Deux voies possibles, à
  trancher avec John : soit une **troisième source lexicale** (le lexique
  général de `culture_alsace` reste très majoritairement seul), soit un
  **chantier d'arbitrage manuel** sur les 460 divergents, qui ne demande
  aucune donnée nouvelle. Pour les toponymes divergents en particulier, un
  locuteur qui tranche entre deux graphies attestées vaut peut-être mieux
  qu'une troisième source écrite — le circuit `/contributions` existe et un
  contributeur = une source.

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

## Campagne 3 — dictionnaire, close (10-11/08/2026)

**24 983 attestations pour `culture_alsace` (+ 23 851), 0 entrée nouvelle.**
La rubrique `lexique_a_d` de la fiche source (le dossier `Dictionnaire/`
actuel, A-D, 7260 entrées, `statut: "extrait hors studio"`, jamais passé au
contrat) a été reprise en entier au contrat `data/README.md` et étendue à
tout l'alphabet — elle remplace ce dossier, elle n'ajoute pas une source.

- **Chaîne de 4 cartes** (`ed-prospecteur` → `ed-extracteur` →
  `ed-verificateur` → `ed-gardien`), sans carte GATE dédiée : la source
  `culture_alsace` était déjà acceptée (GATE 1 non applicable), et le
  périmètre GATE allégé ci-dessus couvrait déjà cette campagne (extraction →
  attestations, verdicts `ed-verificateur`/`ed-gardien`).
- **Parseur `scripts/extract/culture_alsace/lexique_a_d.py`** : lit les 25
  pages `page_{X}f.htm` (sens français → alsacien uniquement — décision John
  du 08/08/2026, le sens inverse n'est jamais une seconde attestation) et
  produit 23 851 attestations. 2 omissions documentées (règle 3 du contrat :
  un doute se signale, il ne se comble pas), 20 doublons intra-source
  retirés (répétitions dans une page, ou entre `page_wf.htm`/`page_xyf.htm`
  — première occurrence gardée, sauf quand l'alsacien diffère entre les
  deux, auquel cas les deux attestations sont gardées), 390 coquilles de
  source copiées verbatim et signalées, jamais corrigées (règle 1).
- **Vérification `ed-verificateur`** : verdict CONFORME, échantillon 30/30 EN
  SUS d'une reconstruction exhaustive des 23 851 lignes (0 écart), rejeu du
  parseur identique octet à octet (md5 stable), `git diff` vide. Un vrai
  écart trouvé en premier passage (balise `</I>` parasite dans `francais`,
  L18829) a bloqué la carte, été corrigé (commit `57634ce`), puis re-vérifié
  CONFORME — exactement le cycle « doute signalé → contrôle sur pièces →
  reprise » que le périmètre allégé garde intact.
- **Audit doctrinal `ed-gardien`** : verdict CONFORME sur les 7 règles du
  SOUL.md (verbatim, rejeu, pas de clé service_role, pas de push sur main,
  aucune trace `entrees`/arbitrage, pas de root, budget tenu — un run
  d'extraction a timeout puis repris sans incident). Audit en lecture seule :
  aucun commit sur `data`, livrable en commentaire de carte, pas d'article
  Odoo (hors périmètre `ed-doc` pour cette campagne).
- **Le canal Telegram direct s'est tu en cours de campagne sans prévenir.**
  Les rapports d'avancement de l'extraction et de la vérification ne sont
  jamais arrivés sur le canal (`getUpdates` s'arrêtait à « prospecteur en
  cours », alors que 4 commits et un audit complet avaient déjà eu lieu).
  Aucune erreur ni webhook en cause (`getWebhookInfo` propre) : le studio
  n'avait simplement pas posté ces étapes-là sur ce canal. D'où la vérité
  retrouvée sur les fichiers (`data/sources/culture_alsace.json`, le JSONL,
  le compte de commits) plutôt que sur l'absence de messages — un canal muet
  n'est pas une preuve que rien ne s'est passé, dans un sens comme dans
  l'autre.
- **Ingestion** (`--source culture_alsace --rubrique lexique_a_d --apply`,
  depuis un worktree sur `data`) : 23 851 créées, 0 déjà présentes d'après le
  script — recompté indépendamment en base par type (`mot` 17 954 +
  `expression` 5 897 = 23 851 ; total source 24 983, `toponyme` et `prenom`
  inchangés) plutôt que pris au mot du script, comme chaque campagne
  précédente.
- **Toujours bloqué à 1 source sur N.** `culture_alsace` reste une source
  unique : `arbitrer_entree()` refusera toute validation de ces 23 851
  candidats sans note d'arbitrage. Rien n'est publié. La suite naturelle est
  la même deuxième source déjà utilisée pour les toponymes et prénoms
  (`alsacien_wikipedia`, `wiktionnaire_fr`) — mais pour le lexique général
  cette fois, pas encore recoupée.

## Campagne 4 — deuxième source lexique général (gsw-fr), close (22-23/08/2026)

**826 attestations ingérées côté `wiktionnaire_fr`, 0 entrée nouvelle.** (La
généralisation en avait produit 821, ramenées à 813 par le fix `RE_FORME` puis
portées à 826 par le tranchage des 13 lignes — cf. le détail plus bas. 826 est
le compte final, recoupé en base.) Objet
de la campagne : le lexique général de `culture_alsace` (23 851 lignes,
campagne 3) restait bloqué à 1 source sur N faute de deuxième source touchant
autre chose que toponymes/prénoms. Avant de reprospecter depuis zéro,
elsassdico a été interrogé sur ce qui avait déjà été exploré (canal Telegram
direct) : aucune prospection dédiée n'avait visé le lexique général, la
campagne 1 étant explicitement cadrée toponymes dès le départ.

- **Prospection d'inventaire (`t_ebd325cf`, zéro extraction)** sur 3 pistes que
  ce cadrage avait laissées de côté : (1) les sections `{{langue|gsw-fr}}`
  (alsacien de France) du Wiktionnaire fr, **ignorées par le parseur
  existant** (choix de prudence documenté en campagne 2, jamais une exclusion
  doctrinale) — 836 pages, ~800 mots ; (2) complétude de
  `Catégorie:alémanique` — confirmée exacte à 834 pages, rien à récupérer ;
  (3) `als.wiktionary.org`, jamais examiné jusque-là — **découverte qu'il
  s'agit d'un simple alias du wiki `alsacien_wikipedia` déjà en base**
  (redirection vers le namespace `Wort:`), pas un projet indépendant ; le
  compter à part aurait vidé la règle 2 (recoupement avec soi-même). Bon
  réflexe d'`ed-prospecteur` d'avoir vérifié plutôt que pris pour acquis.
- **Pilote d'extraction (`t_bb75ea0e`)** : la définition française existe et
  est exploitable dans les sections `gsw-fr`, jamais traduite (règle 1) — 20
  attestations sur 21 pages.
- **Qualification indépendance (`t_1f833c6f`)** : **verdict INDÉPENDANCE
  DÉMONTRÉE**. 59 % des pages viennent d'un transfert daté et documenté
  (16-20 janvier 2008, depuis un dictionnaire français-alsacien de
  Wikipédia), le reste de créations humaines organiques 2004-2007. Zéro
  filiation vers Matzen/Beyer/`culture_alsace`, divergence de graphie
  systématique (conventions propres à `gsw-fr` : `ã`, `ä`, `â`...), **0
  coquille de `culture_alsace` reproduite** — un miroir aurait recopié les
  bizarreries, ici non. Deux réserves honnêtement rapportées (page source
  Wikipédia supprimée donc filiation profonde invérifiable ; correction du
  « 0 copie stricte » de l'inventaire en 41 formes byte-identiques sur 70
  recoupantes, conventions partagées et non des coquilles) : aucune n'inverse
  le verdict.
- **GATE John (`t_4aa8dee1`) : généraliser**, avec un garde-fou explicite posé
  *avant* et non après — la section `gsw-fr` seule ne permet pas de trancher
  toponyme/mot pour un nom propre (ex. `Strossburi` → « Strasbourg. » sans
  motif) ; le parseur doit consulter la section `gsw` jumelle de la même page
  comme second signal, motifs commune/ville déjà connus. Si la jumelle est
  absente, la ligne est signalée « type incertain », jamais devinée (règle
  3) — c'est arrivé sur 13 des 836 pages.
- **Généralisation (`t_06e56f33`)** → 821 attestations (803 mot / 16 prénom /
  2 toponyme). **Vérification `ed-verificateur` : NON CONFORME au premier
  passage**, deux vrais défauts trouvés (pas un simple copier-coller de
  vérification) — 8 lignes de forme fléchie mal extraites faute de variantes
  manquantes dans le regex `RE_FORME` (markup wikitext résiduel dans le
  français) ; un rapport parent inexact sur 2 entrées d'une liste annexe.
  Fix appliqué (`0edf3b8`, 821 → 813), **re-vérifié CONFORME**.
- **Les 13 lignes « type incertain » tranchées par John** sur le seul critère
  qui tient : le rubrique toponyme vise les communes/villages 67/68 déjà
  dans `culture_alsace`, pas n'importe quel nom propre de lieu. 7 lignes
  (les 4 variantes de `Milhüsa`, `Strossburg`, `Gawiller`, `Zàwera`) → 4
  communes alsaciennes déjà en base, jointure exacte sur le nom français, **0
  homonyme, 0 échec**. 6 lignes (`Vogesa`, `Spanïa`, `Frankrïïch`,
  `Suntiklàuis`, `Kindelesbrunnen`, `Schwyz`) → `mot`, ce sont des pays, une
  figure/tradition et un monument, pas des communes — le rubrique toponyme ne
  s'applique pas même à un nom propre de lieu. Appliqué (`12ec2b5`, 813 →
  826), **re-vérifié CONFORME**.
- **Ingestion** (`--source wiktionnaire_fr --rubrique gsw_fr --apply`, depuis
  un sandbox minimal plutôt qu'un worktree complet — cf. note technique
  ci-dessous) : 821 créées, 5 déjà présentes d'après le script — recompté
  indépendamment via l'API PostgREST (jamais pris au mot du script) :
  `wiktionnaire_fr` total 1594 = 773 (rubrique `mots`) + 821 (rubrique
  `gsw_fr`) ; par type `mot` 1058, `toponyme` 520, `prenom` 16 — tout se
  recoupe exactement. Total base tous sources : 27 179. Les 5 « déjà
  présentes » sont un recoupement interne (pages portant à la fois une
  section `gsw` et `gsw-fr`, déjà ingérées via la rubrique `mots` —
  précédent `Altenbach`/`Strossburi` déjà noté en campagne 2), pas une
  erreur.

**Ce que ça change** : `gsw-fr` est la première vraie deuxième source pour le
**lexique général** (`mot`/`expression`), là où seuls les toponymes et
prénoms avaient un recoupement jusqu'ici. Les entrées du lexique général de
`culture_alsace` qui matchent une attestation `gsw-fr` sont désormais
éligibles à l'arbitrage humain (`/admin/arbitrage`) — c'était l'objectif de
la campagne. Rien n'est publié tant qu'un admin n'arbitre pas (règle 4).

**Note technique — checkout Windows et service Supabase arrêté.** Un
`git worktree add` classique sur la branche `data` échoue sur ce poste :
`data/raw/wiktionnaire_fr/` contient un nom de fichier avec un caractère `?`,
invalide sur NTFS quel que soit `core.protectNTFS` — l'échec se produit dès
la construction de l'index, avant même le checkout des fichiers, et `git
archive` avec pathspec échoue pareillement (le tree entier est déballé même
si `data/raw` est explicitement exclu du pathspec). Contournement : extraire
au cas par cas les seuls fichiers nécessaires par `git show
origin/data:<chemin> > fichier` (lecture de blob, pas de parcours d'arbre),
dans un sandbox minimal (`scripts/`, `data/attestations/`, `data/sources/`)
plutôt qu'un worktree complet. Par ailleurs, le service Supabase self-hosted
(`supabase-seqe2htqfjva4ack7r2bnoeb` sur Coolify) s'est retrouvé à l'état
`exited` en cours de session (503 en simulation d'ingestion) — redémarré
manuellement par John, aucun accès Coolify en écriture n'étant disponible
depuis Claude Code pour le faire.

## Premières entrées publiées (23/08/2026)

**169 entrées `statut='valide'`, 342 liens `entree_attestations`.** Le
dictionnaire affiche enfin quelque chose : après quatre campagnes de collecte,
c'est le premier franchissement de l'étape `attestations -> entrees`, la seule
qui rende une donnée visible. 166 toponymes + 3 mois (`janvier`, `juillet`,
`juin`), tous à 2 attestations, tous signés (`valide_le`, `valide_par`).

- **Deux notions de recoupement, longtemps confondues.** `arbitrer_entree()`
  compte des `source_id` distincts ; la doctrine demande que les sources
  **s'accordent sur la même forme alsacienne**. Sur les candidats à 2 sources :
  629 passent la garde SQL, mais **169 seulement** voient leurs sources écrire
  la même forme. Les 460 autres divergent (`Range`/`Rànge`,
  `Riaschpa`/`Rieschbi`, `Ewerburnhaipt`/`Ewer-Burnhäuipt`) et relèvent du
  « Divergence entre sources = entrée marquée pour arbitrage manuel » de la
  doctrine éditoriale : choisir la forme canonique **est** l'arbitrage, ça ne
  part pas en lot. La garde SQL n'a pas été touchée — c'est l'interface qui est
  plus stricte qu'elle, jamais l'inverse.
- **`TYPES_TERME` ignorait `toponyme` et `prenom`**, pourtant ajoutés à l'enum
  par la migration `20260808140000`. Comme `estTypeTermeValide()` garde
  `arbitrerAction()`, **arbitrer une commune échouait sur « Type inconnu »**, y
  compris une par une. Le blocage était dur et invisible : il n'apparaissait
  qu'à la première tentative d'arbitrage, comme le retard de migration du
  09/08 et le bug de schéma du 10/08 n'apparaissaient qu'à la première
  écriture. **Rien ne signale une désynchronisation enum SQL / constante TS.**
- **La clé `service_role` ne peut pas arbitrer.** `is_admin()` lit `auth.uid()`,
  absent d'une clé de service : `candidats_arbitrage()` et `arbitrer_entree()`
  répondent « Arbitrage réservé aux administrateurs ». Pré-remplir `entrees`
  depuis un script aurait imposé un `INSERT` direct, contournant la fonction de
  garde. D'où le choix inverse : `arbitrerLotAction()` fait tourner la session
  admin de John, et la garde s'exécute réellement 169 fois. La règle 4 reste
  une barrière technique.
- **La forme publiée est toujours copiée verbatim d'une attestation** (règle 1).
  La ponctuation finale de `culture_alsace` (`Jüli.` contre `Jüli`) est ignorée
  pour *comparer* deux formes, jamais réécrite : quand une source écrit la forme
  sans point, c'est cette graphie-là qui est retenue ; sinon la forme attestée
  part telle quelle, point compris. Vérifié sur les 629 candidats réels avant
  publication — zéro forme publiée que personne n'ait écrite.
- **Vérification**, comme à chaque campagne, recomptée en base et non prise au
  rapport de l'action : 169 entrées, toutes `valide`, `nb_attestations >= 2`
  partout, 342 liens de traçabilité. Puis contrôle de l'affichage **avec la clé
  anonyme** et non la clé de service : `rechercher_entrees()` rend
  `Benfeld -> Banfald`, le sens inverse (`Banfald -> Benfeld`) fonctionne via
  `entrees.alsacien_recherche`, `sources_entree()` expose bien les deux
  sources, et `GET /attestations` rend 0 ligne à un visiteur — le brut ne fuite
  pas.
- **Le reste du stock demeure bloqué.** 26 309 candidats au total, dont
  ~26 000 à source unique : `arbitrer_entree()` continuera de les refuser sans
  note d'arbitrage. Publier davantage suppose soit une source de plus, soit un
  arbitrage manuel candidat par candidat.
- **Piège relevé, non traité** : `candidats_arbitrage()` regroupe sur
  `immutable_unaccent(lower(btrim(francais)))`, donc `unaccent` fusionne des
  mots français différents — `classé` (culture_alsace, « unter Dankmolschutz »)
  avec `Classe` (wiktionnaire, « Klassa »), `affairé` avec `Affaire`. Plusieurs
  des 30 candidats lexicaux à 2 sources sont de faux recoupements. Le critère
  d'accord sur la forme les écarte de fait ici, mais le regroupement reste à
  revoir avant d'ouvrir le lexique général.

**L'outil** (`/admin/arbitrage`, onglet « Recoupées ») ne relâche jamais la
garde SQL, il la resserre : il n'offre en lot que les candidats dont deux
sources écrivent la même forme, et refuse côté serveur toute clé absente du lot
qu'il vient lui-même de recalculer. Le reste de la file s'arbitre toujours un
par un, à l'écran de détail. `traductionsRecoupees()`
(`src/lib/dictionnaire.ts`) porte le critère, et donc la doctrine : elle est le
bon endroit où regarder avant de toucher au seuil.

**Ce que l'onglet vide signifie.** Après publication, « Recoupées (0) » est
l'état normal et non une panne : `candidats_arbitrage()` exclut par
construction toute attestation déjà rattachée à une entrée, donc un lot publié
quitte la file. Les compteurs des deux autres onglets s'affichent en « 50+ » —
`p_limite` plafonne les RPC de liste à 50, et afficher le nombre brut ferait
lire une taille de page comme un total.

## Campagne 5 — troisième source lexicale (lancée le 24/08/2026)

**Décision de John : la troisième source, pas le chantier d'arbitrage** — des
deux voies laissées ouvertes le 23/08. Carte de prospection `t_5858eff3`
(`ed-prospecteur`, inventaire, **zéro extraction**), GATE avant tout pilote.
Cadrage : critère de succès = **recoupements lexicaux**, jamais volume
d'attestations ; critère de tri n°1 = la source doit apparier l'alsacien au
**français** (un dictionnaire germanophone l'apparie à l'allemand — plafond
Martin & Lienhart à 5 lignes, campagne 2) ; piège alémanique explicite
(als.wikipedia et de.wiktionary mélangent suisse, souabe, badois). Piste
secondaire à qualifier : le namespace `Wort:` d'als.wikipedia, jamais exploité,
mais **rubrique d'une source déjà en base et non troisième source**.

### Ce que le diagnostic préalable a établi (mesuré en base, pas estimé)

- **La couverture est bien le goulot, pas la graphie.** `wiktionnaire_fr` ne
  couvre que **0,8 %** des lemmes lexicaux de `culture_alsace` (184 sur 22 718).
  Les deux sources ne parlent pas des mêmes mots — d'où une troisième source, et
  non un travail sur les formes.
- **165 accords bloqués par une convention de champ, pas par les données.**
  `candidats_arbitrage()` groupe sur (français normalisé, **contexte**). Or la
  rubrique `mots` de `wiktionnaire_fr` (campagne 2) porte `contexte =
  "Alsace ; Géographie"` sur 490 toponymes, là où `culture_alsace` et
  `alsacien_wikipedia` portent le département. Les deux ne se rencontrent donc
  jamais, **même en écrivant exactement la même forme** (`Bàrr`, `Bìwelse`,
  `Àndlöi`). 165 nets, hors `Breitenbach` et `Buhl` (homonymes réels). Le
  regroupement par contexte est correct — c'est lui qui protège les deux
  `Bouxwiller` ; c'est la donnée qui n'est pas au contrat. Carte studio envoyée
  le 24/08 : régénération du JSONL par jointure exacte sur le nom français, puis
  purge ciblée et réingestion par Claude Code (la clé UNIQUE est touchée, donc
  `--resync` ne peut rien — précédent campagne 1). La rubrique `gsw_fr`
  (campagne 4) applique déjà la bonne convention : c'est un alignement.
- **L'article défini alsacien ne vaut pas un correctif.** `culture_alsace`
  écrit `d'r lohn`, `s' schloss` (15 624 attestations lexicales sur 23 851),
  ce qui fait échouer la comparaison avec `lohn`, `schloss`. L'ignorer pour
  comparer ne gagne pourtant qu'**un** recoupement (`choucroute`). Un premier
  chiffrage annonçait +13 : il était faux, produit par une normalisation qui
  écrasait aussi casse et diacritiques. **Mesurer un recoupement avec une règle
  plus permissive que `cleDeForme()` ne trouve rien, ça efface la question.**
- **En revanche, 76 des 460 divergents ne diffèrent que par un diacritique**
  (`Barr`/`Bàrr`, `Bischwiller`/`Bìschwiller`, `Àndloi`/`Àndlöi`). C'est un
  volume d'**arbitrage manuel** rapide, jamais un recoupement automatique :
  choisir entre deux graphies attestées *est* l'arbitrage, et Orthal donne la
  règle. À ne pas confondre avec un gisement publiable en lot.

### Le dictionnaire double : 332 entrées publiées (24/08/2026)

**169 -> 332 entrées `valide`, 814 liens de traçabilité, en une journée et sans
aucune donnée nouvelle.** 329 toponymes + 3 mois. Publiées en lot par John via
l'onglet « Recoupées » après ingestion de la recontextualisation.

Contrôles refaits en base après publication, comme le 23/08 :
toutes `valide`, toutes signées (`valide_le`, `valide_par`), `nb_attestations >= 2`
partout, aucune entrée sans lien, **0 forme publiée que personne n'ait écrite**
(règle 1) et **0 forme canonique attestée par moins de 2 sources** (règle 2).
Affichage vérifié avec la **clé anonyme** et non la clé de service :
`Natzwiller -> Nàswil` et le sens inverse répondent, `sources_entree()` expose
bien les trois sources, et `GET /attestations` rend `[]` à un visiteur — le brut
ne fuite pas. La forme canonique est celle sur laquelle deux sources s'accordent,
la variante à source unique suivant en second (« Premier est Roi ») :
`Rangen -> ['Rànge', 'Range']`.

**« Recoupées (0) » après publication a de nouveau été lu comme une panne.**
C'est l'état normal, déjà documenté au 23/08 : `candidats_arbitrage()` exclut
toute attestation rattachée à une entrée, donc un lot publié quitte la file. Le
piège est réel — le compteur passe de 163 à 0 au moment précis où l'on réussit.
Le contrôle qui tranche est le comptage des `entrees`, jamais l'onglet.

### Résultat des deux cartes (24/08/2026)

**Recontextualisation ingérée : 169 -> 332 accords de forme, +163 candidats
recoupés, 0 perdu.** Le plus gros gain de recoupement depuis l'ouverture de la
base, sans une seule donnée nouvelle. Les divergences tombent de 460 à 350.
Total inchangé (27 179 attestations, `wiktionnaire_fr` 1594), recompté en base
et non pris au rapport du script.

- Diff contrôlé ligne à ligne avant purge : 349 lignes, **toutes `toponyme`,
  toutes sur le seul champ `contexte`**, ordre préservé, aucune ligne perdue.
- **349 recontextualisées et non ~490 comme la consigne l'annonçait** :
  l'estimation était fausse, pas le travail. 154 des lignes non jointes sont des
  communes que `culture_alsace` ne liste pas (`Bergbieten`, `Brumath`...) ou des
  villes étrangères (`Berlin`, `Brême`). Les 8 non jointes dont le nom existe
  pourtant côté `culture_alsace` sont les 5 homonymes attendus plus 3 cas où le
  nom **français** diffère par un diacritique (`Sélestat`, `Seebach`,
  `Lutzelhouse`) — jointure exacte, doute signalé, jamais deviné.
- Purge sûre car vérifiée telle : **aucune des 349 ne fondait une entrée
  publiée** (0 lien `entree_attestations`), sauvegarde complète écrite avant le
  premier DELETE. Réingestion : 349 créées, 424 déjà présentes.
- **Piège de mapping évité** : un premier plan de purge visait 350 lignes dont
  une de type `mot`. Le JSONL porte deux `Neptune.` / `Neptun` (le dieu et la
  planète), qu'un index par (français, alsacien) écrase l'un l'autre. **Le seul
  mapping exact entre deux versions d'un JSONL est positionnel**, l'ordre des
  lignes étant vérifié identique — pas une clé métier qu'on suppose unique.
- **La simulation d'ingestion sert aussi à ça** : elle a révélé que le script
  allait créer les trois sources candidates écartées (`elsadico`,
  `freelang_alsacien`, `runneburger_benfeld`), présentes dans `data/sources/`
  mais sans aucune attestation — `--source` ne filtre pas la création des
  sources. `sources` étant exposée publiquement par `sources_entree()`, ces
  fiches ont été retirées du sandbox avant `--apply`. La base garde 4 sources.

**Prospection : il n'existe pas de troisième source lexicale libre de droits.**
C'est le vrai résultat de la campagne, et il est négatif.

- `elsadico` (3 333 mots) — **écartée sur l'indépendance** : dictionnaire de
  Raymond Bitsch *avec la participation de Raymond Matzen*, or `culture_alsace`
  est « Matzen et contributeurs ». Deux sources partageant le même linguiste ne
  se recoupent pas, elles se répètent — règle 2 appliquée à la racine et non à
  la surface. Droits réservés par ailleurs.
- `freelang_alsacien` (5 478 entrées, bidirectionnel, auteurs indépendants
  Alby/Muller) — la meilleure piste sur le fond, **bloquée sur les droits** :
  les listes restent propriété des auteurs, pas de licence de réutilisation.
- `runneburger_benfeld` (~98 720 entrées, parler de Benfeld) — probablement le
  plus grand dictionnaire alsacien-français publié, **papier uniquement** : OCR
  et saisie sont tous deux interdits par le contrat.
- Aucune copie archivée pour ces trois-là — la question des droits se pose
  **avant** la première copie.
- Seule piste ouverte, **non extraite** : le namespace `Wort:` d'als.wikipedia
  (CC BY-SA, ~970 couples, 8 pages archivées avec md5). C'est une **rubrique
  d'`alsacien_wikipedia`**, jamais une troisième source. Son recoupement mesuré
  est l'information décisive : **418 lemmes français communs sur 643 (65 %,
  contre 0,8 % pour `wiktionnaire_fr`) mais 14 formes byte-identiques
  seulement.** Au passage, `elsassisch.eu/LexiqueFrancaisAlsacien` s'est révélé
  être un **miroir** de cette même page (398/468 identiques) — deuxième fois que
  ce domaine tente de compter double.

**Ce que ça change pour la suite.** Le goulot n'est plus la couverture mais
**l'accord de graphie entre sources**. Une source de plus ne le règle pas : elle
divergerait aussi. D'où la décision de John du 24/08 — **arbitrage manuel**,
pas d'extraction supplémentaire. Le gisement est là : 350 divergences, dont 76
ne diffèrent que par un diacritique et se tranchent à la règle Orthal.

### Clé d'arbitrage : `unaccent` fusionnait des mots français distincts

Migration `20260824120000_cle_arbitrage_accents.sql`. La clé de groupement
s'écrivait `immutable_unaccent(lower(btrim(francais)))`, ce qui réunissait
`sur`/`sûr`, `ou`/`où`, `la`/`là`, `comte`/`comté`, `tache`/`tâche`,
`ville`/`Villé` — **31 groupes**, présentés à l'arbitre comme un seul candidat
mêlant deux sens. La clé devient `lower(btrim(francais))` dans les quatre
fonctions qui la produisent ou la comparent (`candidats_arbitrage`,
`detail_candidat`, `entrees_par_statut`, `propositions_orthal_candidat`).

- La **recherche floue garde `unaccent`** — chercher « epreuve » doit trouver
  « épreuve ». Elle s'écrit `lower(x)` sans `btrim`, elle n'est pas touchée.
- **Aucune entrée publiée n'était fausse** : le critère d'accord sur la forme
  les écartait de fait. Une seule voit sa clé se scinder, et c'est le cas
  emblématique — `Villé`, commune du Bas-Rhin, aujourd'hui confondue avec le mot
  `ville`. Le défaut était donc déjà à l'œuvre, sans dégât visible.
- **L'index `ux_entrees_francais_contexte_normalise` n'est pas touché** : il
  applique `immutable_unaccent` lui aussi, donc `sur` et `sûr` ne peuvent pas
  coexister dans `entrees` sans contexte distinct. Décision du 24/08 : on le
  laisse, ça ne gêne qu'au moment de publier les deux, et la doctrine sépare
  déjà les homonymes par le contexte. À rouvrir si le cas se présente.
- Comme toujours, **Coolify n'applique aucune migration** : à passer à la main
  dans le SQL Editor du Studio.

## Onglet « Divergentes » (24/08/2026)

Le symétrique de « Recoupées », pour la voie d'arbitrage manuel retenue par John
faute de troisième source. Il liste les candidats à **deux sources ou plus dont
aucune forme n'est écrite pareil par deux d'entre elles** — 345 à l'ouverture —
et propose, pour chacun, un bouton par forme attestée. Un clic publie une entrée
avec cette forme en canonique, les autres conservées en variantes.

- **Ce n'est pas un traitement de masse et ça ne doit jamais le devenir.**
  « Divergence entre sources = arbitrage manuel » : choisir la graphie EST
  l'arbitrage. L'onglet rend le geste rapide, il ne le supprime pas — une
  décision humaine par entrée, `arbitrer_entree()` exécutant ses gardes comme
  depuis l'écran de détail.
- **Deux gardes serveur, parce que ce qui vient du navigateur ne fonde rien.**
  `arbitrerDivergenceAction()` recalcule le candidat côté serveur et refuse une
  clé absente de la file ; puis `traductionsArbitrees()` rend `[]` si la graphie
  demandée n'est pas l'une des formes attestées — **rien ne peut publier une
  forme que personne n'a écrite** (règle 1).
- **`cleDeTri()` écrase casse et diacritiques, et ne sert QU'À TRIER.** Elle
  remonte en tête les 28 divergences qui ne tiennent qu'à un accent
  (`Hatte`/`Hàtte`, `Wolschwiller`/`Wolschwìller`), tranchables à la règle
  ORTHAL. **Elle ne doit jamais servir à décider d'un recoupement** : en Orthal
  les diacritiques notent des sons, et les confondre effacerait la question posée
  à l'arbitre — c'est exactement l'erreur commise le 24/08 en annonçant « +13 »
  là où le gain réel était de +1. Le reste des divergences sont de vraies
  variantes dialectales (`Riaschpa`/`Rieschbi`, `Müeschbe`/`Müaschpa`), qui
  demandent une décision de fond.
- La pagination est factorisée avec l'onglet Recoupées
  (`parcourirCandidatsMultiSources`) : sa condition d'arrêt est subtile — le tri
  SQL par `nb_sources DESC` garantit qu'après une page sans candidat à deux
  sources, les suivantes n'en portent pas non plus — et les deux onglets doivent
  la partager. Leurs compteurs sont donc de vrais totaux, contrairement aux deux
  autres plafonnés à « 50+ ».

## Identité visuelle alignée sur le site (25/08/2026)

L'app est destinée à être **intégrée en iframe dans une page du site**, pour
qu'elle fasse partie du site et non qu'elle y soit posée. Elle portait jusqu'ici
la palette du boilerplate Dyad — indigo, cyan, fond `slate-950` — sans rapport
avec The Elsassisch. **Décision de John : fond clair, palette du site.**

- **Le site est `www.theelsassisch.com`** (site Odoo, même contenu que
  `theelsassich.odoo.com`). Attention : `theelsassisch.fr` répond 503 en HTTPS
  et 404 en HTTP, et `theelsassisch.com` sans `www` ne répond pas — seul le
  sous-domaine `elsass-dico.theelsassisch.fr` est servi par Coolify, qui
  n'héberge pas le site principal.
- **Palette relevée dans le CSS compilé du site**, jamais inventée :
  `--o-color-1` / `--primary` = `#EFC631` (or), `--o-color-2` = `#FF0000`
  (rouge), `.o_cc1` = fond `#FFFFFF` / texte `#212529`, `--danger` = `#dc3545`.
  Police : pile système, aucune webfont.
- **Deux contraintes de contraste commandent l'usage des deux couleurs**, et
  elles ne se contournent pas : l'or sur blanc donne **1,8:1** — il ne peut pas
  porter de texte, seulement servir de fond ou d'aplat ; `#FF0000` sur blanc
  donne **4,0:1**, sous le seuil AA du texte courant. D'où
  `--marque-rouge-texte` (`#C20000`, 6,4:1), seul rouge admissible sur du texte.
- **`--secondary` et `--accent` ne sont PAS les couleurs secondaires de la
  marque.** Dans shadcn ce sont des surfaces neutres (fond de badge, survol) :
  y verser `#FF0000` aurait rendu rouge vif chaque `Badge variant="secondary"`
  de la file d'arbitrage. Le rouge et l'or vivent dans des tokens `marque-*`
  dédiés, invoqués explicitement (`bg-marque-or`, `text-marque-rouge-texte`).
- **`--input` est distinct de `--border`.** Le boilerplate leur donnait la même
  valeur (1,29:1) : la bordure qui *délimite un champ* doit atteindre 3:1
  (WCAG 1.4.11), sans quoi le champ de recherche — le cœur de cette app — est à
  la limite du visible. `--input` vaut donc `210 14% 59%` (3,02:1), `--border`
  reste discret pour les séparateurs.
- **Le vert et l'ambre de `/admin/arbitrage` sont conservés** : ils portent un
  sens (recoupé / divergence), ce ne sont pas des couleurs décoratives. Seul
  l'indigo, qui n'en portait aucun, a été retiré. La couronne « forme
  canonique » passe en revanche à l'or de marque, pour cesser de se confondre
  avec l'ambre d'alerte.
- **Piège Tailwind vérifié sur le CSS produit** : `ease-[cubic-bezier(0.2,0,0,1)]`
  est rejeté comme ambigu (« matches multiple utilities ») et ne génère
  **aucune** règle — la transition retombe silencieusement sur `ease`. La courbe
  est devenue un token nommé, `ease-doux`. En revanche les opacités sur couleur
  de marque (`bg-marque-or/[0.07]`) fonctionnent : Tailwind 3.4 produit bien
  `hsl(var(--marque-or) / 0.07)` sans avoir besoin de `<alpha-value>`.
- **Un changement de `tailwind.config.ts` n'est pas pris à chaud** : le serveur
  de dev doit être redémarré, sans quoi on vérifie l'ancien CSS en croyant
  tester le nouveau.

## App autonome, mobile-first (décision du 28/08/2026)

**Renverse la décision du 25/08/2026.** L'app n'est plus destinée à être
intégrée en iframe dans une page du site — elle devient une **app autonome,
100% mobile-first**, et le site (`www.theelsassisch.com`) redirige vers elle
par un simple lien si besoin, plutôt que de l'embarquer.

- Motif : la maquette mobile (`design_handoff_mobile_app/`, handoff Claude
  Design du 28/08) dessine une UI façon app native (status bar, home
  indicator) qui n'a pas de sens nichée dans une page desktop. L'iframe posait
  aussi de vrais problèmes techniques indépendants du design : session
  Supabase en cookies tiers, pas de deep-link partageable vers une fiche de
  mot (`/entree/[id]`).
- Le travail d'identité visuelle du 25/08 (palette rouge/or du site,
  contrastes AA) reste valide et sert la cohérence de marque — il ne dépendait
  pas techniquement de l'iframe.
- **Périmètre confirmé (28/08/2026) : toute l'app.** `/admin` et
  `/admin/arbitrage` passent aussi mobile-first, pas seulement les 6 écrans
  publics du handoff — John doit pouvoir arbitrer depuis son téléphone.

## Mobile-first implémenté et déployé (29/08/2026)

Les 13 flux/16 écrans du handoff (`design_handoff_mobile_app/`) ont été
recréés dans l'app : nouveau `src/components/app-header.tsx` (icônes de nav
racine / chevron retour empilé) en remplacement de `MainNav`/`UserNav`
(supprimés), tokens neutres/succès/attention dans `globals.css`/
`tailwind.config.ts`, écrans publics reconstruits (recherche, fiche de mot,
signaler et dictionnaire A-Z — ces deux derniers nouveaux), auth restylée,
« Mon espace » (fusion dashboard/profil/contributions par rôle,
`/dashboard`, `/profile` redirige dessus), « Proposer un mot » autonome
(`/contributions/proposer`), « Mes contributions » restylée, habillage
mobile-first de `/admin` et `/admin/arbitrage/*` (contenu métier inchangé).
Deux migrations ajoutées : `20260829000000_navigation_alphabet.sql`
(`lettres_disponibles()`, `entrees_par_lettre()` — parcours A-Z) et
`20260829010000_stats_contributeur.sql` (`mes_votes_count()` — compteur de
Mon espace). **PR #16, mergée et déployée en prod le 29/08/2026.**

Deux simplifications assumées faute de flux backend correspondant, à
confirmer si besoin : le CTA « Devenir contributeur » (lecteur, Mon espace)
pointe vers le forum plutôt qu'un changement de rôle self-service
inexistant ; la carte « À arbitrer » (admin, Mon espace) est un teaser
(compte + lien vers `/admin/arbitrage`) plutôt qu'un bouton « Promouvoir »
inline sur une entrée déjà publiée, ce geste n'existant dans aucune action
actuelle.

**Bug trouvé dès la mise en prod, corrigé le jour même (PR #17) : l'app
restait à largeur téléphone sur tablette/desktop.** `LayoutWrapper`
plafonnait toutes les routes à `max-w-md` (402px, gabarit du handoff), y
compris `/admin/*` dont les pages portent leurs propres conteneurs plus
larges (`max-w-5xl`/`max-w-6xl`, hérités du 25/08) — imbriqués dans un
parent plus étroit, ces conteneurs n'avaient plus aucun effet. Le handoff ne
montre que des cadres de téléphone : rien dans le mockup ni dans la
vérification initiale ne testait au-delà de cette largeur. Correctif :
largeur conditionnelle à la route dans `LayoutWrapper` (`usePathname`) —
progressive par palier pour les écrans app (`max-w-md` → `sm:max-w-lg` →
`md:max-w-2xl` → `lg:max-w-3xl`, une colonne qui reste une colonne, pas de
grille multi-colonnes), `max-w-6xl` fixe pour `/admin/*` pour laisser ses
conteneurs internes reprendre la main. **Leçon pour toute future migration
mobile-first sur ce modèle : vérifier plusieurs largeurs de viewport
(mobile, tablette, desktop) avant de considérer le travail terminé, pas
seulement la largeur du mockup fourni.**

## Nav responsive : rail desktop/tablette + barre mobile (30/08/2026)

Le header à icônes du 28/08 (`app-header.tsx`) était strictement identique à
toutes les largeurs — aucune adaptation tablette/desktop de la nav
elle-même, seule la colonne de contenu s'élargissait (correctif du 29/08
ci-dessus). Corrigé en appliquant à Dico le standard de nav responsive
documenté le même jour dans Claude Design (projet « The Elsassisch Design
Systeme » -> composant AppNav, calqué sur `AppShell` d'Elsass Game) :

- Nouveau `src/components/app-nav-shell.tsx` : barre d'onglets fixe en bas
  sur mobile, rail vertical fixe à gauche dès la tablette (`md`, icônes
  seules) puis desktop (`lg`, icônes + libellés) — mêmes destinations
  qu'avant (Recherche/Dictionnaire/Mon espace). Overlay en position fixe,
  pas un wrapper de layout : évite de retoucher `LayoutWrapper`, qui portait
  déjà le correctif de largeur de la veille. Les 4 écrans concernés (`/`,
  `/dictionnaire`, `/dashboard`, `/entree/[id]`) réservent la place via un
  padding responsive sur leur propre conteneur (`md:pl-20 lg:pl-56` /
  `pb-16 md:pb-0`).
- `app-header.tsx` allégé : ne porte plus les icônes de nav (déplacées dans
  `AppNavShell`), garde seulement le wordmark/titre et le chevron retour.
- **4e destination conditionnelle : « Arbitrage »**, visible uniquement si
  `role === "admin"` — même condition stricte que le middleware sur
  `/admin/*`, pas juste « connecté » : un utilisateur ou contributeur
  connecté serait de toute façon redirigé vers `/dashboard` en accédant à
  `/admin/arbitrage`, un lien affiché pour lui n'aurait mené nulle part.
  `/admin/arbitrage` garde son propre `AppHeader` en `variant="stack"`
  inchangé (trailing vers `/admin`, retour vers `/dashboard`) : l'icône ne
  s'affiche donc jamais « active » une fois sur la page elle-même, comme
  `/admin` aujourd'hui — seulement en highlight d'entrée depuis les 3
  autres écrans racine.

Vérifié : `tsc --noEmit` propre, `next build` jusqu'au bout (types, lint,
15/15 pages générées) — seul l'échec final est un `EPERM` sur les liens
symboliques Windows du mode standalone, sans rapport avec le code. Testé en
navigateur à 3 largeurs (mobile ~390px, tablette ~1024px, desktop ~1320px)
et sur `/admin` (écran « stack », confirmé sans rail — comportement
inchangé). Branche `feat/nav-adaptative-appnav`, PR ouverte vers `main`
(protégé par ruleset, aucun push direct).

## Règles de travail

- Ne jamais inventer de traduction alsacienne, même pour un exemple ou un test.
- Ne jamais remplir la base sans recoupement multi-sources.
- Toujours demander avant de supprimer des données existantes.
