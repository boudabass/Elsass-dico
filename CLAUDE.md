# Elsass Dico

Traducteur français/alsacien, publié sur elsass-dico.theelsassisch.com, adossé à la
marque The Elsassisch. La crédibilité linguistique est critique : du faux
alsacien publié sous cette marque serait un vrai problème.

## Règles non négociables sur les données

1. Aucune traduction générée par un LLM. Jamais. Une entrée inventée est pire
   que pas d'entrée.
2. Le recoupement se déclare, il ne se cache pas. La base se construit par
   recoupement : un équivalent attesté dans plusieurs sources indépendantes est
   retenu, puis réécrit en Orthal. Divergence entre sources = entrée marquée
   pour arbitrage manuel. **Révisée le 02/09/2026** (cf. « Modèle de confiance
   à trois niveaux ») : une entrée peut être publiée à partir d'une source
   unique **à condition d'afficher son niveau de confiance** — 1 source =
   rouge, 2 = jaune, 3 et plus = vert. Le seuil binaire « 2 sources ou rien »
   est remplacé par cette déclaration visible. Ce qui reste interdit :
   présenter une entrée à 1 source comme si elle était recoupée. L'exception du
   07/08/2026 (publication depuis une contribution unique de locuteur) est
   absorbée par ce modèle.
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



## Refonte : la carte des parlers (décision de John, 11/09/2026)

**Le projet change de doctrine. La cible complète est dans
`documentation/20-REFONTE-CARTE-DES-PARLERS.md`, l'état d'avancement et la reprise
dans `documentation/21-REPRISE.md`.** Tout ce qui précède dans ce fichier reste
vrai comme histoire, mais la section « Doctrine éditoriale » et la règle 2 sont
remplacées par ce qui suit.

**Le constat qui l'a provoquée** : 27 179 attestations, cinq campagnes, quatre mois
d'arbitrage — et **338 entrées publiées, dont 331 toponymes**. Un annuaire de
communes, pas un traducteur. Le goulot n'était pas la donnée, c'était d'exiger
qu'on désigne *une* forme juste dans une langue qui n'en a pas. `Riaschpa` contre
`Rieschbi`, appelé « divergence à trancher » pendant des semaines : ce sont deux
villages, et c'est l'information la plus intéressante de la base.

- **Plus de forme canonique.** Toutes les variantes coexistent, portées par leurs
  sources écrites et par les **villages** qui les revendiquent. La carte devient
  l'écran central. « Premier est Roi » et l'index 0 disparaissent.
- **Un vote = un village.** Le bouton `+` sur une variante y attache le village du
  membre. Jamais de vote contre. Le village se **choisit dans une liste**, ne se
  détecte jamais — et le mot « géolocalisation » ne paraît nulle part dans l'UI.
- **La règle 2 (recoupement obligatoire) disparaît**, remplacée par l'affichage du
  nombre de sources **et** de villages. Les règles 1 (rien d'inventé), 3 (sources
  déclarées) et 4 (validation humaine, devenue modération) survivent — et la
  règle 1 devient plus facile à tenir : on n'arbitre plus, donc on ne réécrit plus.
- **Modèle** : `Commune` / `Lemme` / `Variante` / `Temoignage`. `attestations`
  survit **intacte, en archive lecture seule** ; un script rejouable en dérive les
  variantes. Différence essentielle avec `attestations → entrees` : la dérivation
  est automatique et exhaustive, sans décision humaine par mot.
- **Supprimé** : `entrees`, `entree_attestations`, `attestation_votes`,
  `propositions_orthal`, `automates`, les 25 RPC, `/admin/arbitrage`,
  `/contributions`, et tout `@supabase/*`.
- **Stack** : Postgres + Prisma, Supabase sort (~8 conteneurs pour PostgREST, un
  peu de RLS et un Studio, sur un VPS qui sature). `prisma migrate deploy` au
  démarrage du conteneur tue la classe de bugs « migration oubliée dans le SQL
  Editor » qui a frappé trois fois.
- **Accès** : compte obligatoire, création renvoyée vers le portail Odoo. Deux
  rôles, membre et admin — tout membre contribue. Public : une home de présentation
  plus **une page par village et par prénom**, générées statiquement.
- **Référentiel** : 67 + 68 + **tout le 57**, 1 605 communes, déjà produit dans
  `data/communes/`. `aireLinguistique` reste **nulle pour la Moselle** — aucune
  liste officielle des communes germanophones du 57 n'existe, et tracer cette
  limite nous-mêmes fabriquerait une donnée que personne n'a établie.
- **ORTHAL devient secondaire** comme arbitre, mais `documentation/orthal/` reste :
  sans elle on lit `Barr`/`Bàrr` comme deux graphies d'un même son, alors que
  l'accent note un /a/ sombre. C'est la clé de lecture de la carte.
- **Livraison** : socle technique d'abord, tout sur `dev`, puis une PR qui remplace
  `main`. Le gameplay est reporté.

**Les articles Odoo 882, 883 et 884 sont périmés** par cette décision et restent à
réécrire. En attendant, le document 20 fait foi sur la cible — exception assumée à
la règle « ce dossier ne fait autorité sur rien », expliquée dans
`documentation/README.md`.


## Socle de la refonte posé, base chargée (12/09/2026)

**L'étape 1 du doc 20 est faite, et le dictionnaire dérivé est en base.**
27 179 attestations → **25 864 lemmes, 41 646 variantes, 42 135 témoignages**,
sans une seule décision humaine. Détail et commandes dans `21-REPRISE.md`.

Ce que le dictionnaire rend, sur les mots qui servaient d'exemple à son échec :
`bonjour` → `buschur` / `güata Tàg` / `göte Tàij` / `grias di wohl` ;
`salaire` → `Lohn` et non `d'r lohn`. « Un visiteur tapant *bonjour* ne trouve
rien » revenait depuis le 02/09.

- **Prisma 7 sur Postgres 18**, et **`prisma migrate deploy` au démarrage du
  conteneur** (`docker-entrypoint.sh`), qui refuse de monter si une migration
  échoue. Un conteneur qui ne démarre pas se voit ; une app qui répond 200 sur un
  schéma en retard, non — c'est ce qui a coûté trois incidents.
- **Quatre pièges d'outillage**, tous rencontrés : `npm` est cassé sur ce dépôt
  (c'est du pnpm) ; `prisma@latest` sert une release candidate, le tag `prev`
  porte la stable ; pnpm 11 exige une décision explicite par script
  d'installation ; et `prisma generate` tourne au build d'image, **où
  `DATABASE_URL` n'existe pas exprès** — `env()` dans `prisma.config.ts` y
  ferait échouer le build entier.

### La source de vérité est le dépôt, plus la base

**Décision de John** : repartir de données vierges, que quatre mois d'anciennes
décisions n'ont pas altérées. La base se reconstruit des JSONL des parseurs
versionnés ; Supabase sort du chemin.

Une seule altération décisionnelle s'était glissée dans les JSONL, et le parseur
la nommait lui-même : « contexte est remplacé […] dans `candidats_arbitrage()`,
qui groupe sur (français normalisé, contexte) ». 349 contextes de
`wiktionnaire_fr` recopiés de `culture_alsace` pour que l'ancienne file
d'arbitrage fasse se rencontrer les candidats. **Annulée par la PR #44.** Tout le
reste de l'historique est de la correction de fidélité, et a été gardé.

- **Un toponyme EST une commune** : le lemme s'indexe par sa commune, pas par
  (français, contexte). `Roeschwoog` et `Rœschwoog` portent leurs deux formes sur
  la même fiche. C'est ce qui rend la recontextualisation inutile pour de bon.
- Trois choses vivaient en base et pas dans le dépôt, **reconstruites par du code
  et jamais réinventées** : la décomposition de l'article (8 886, le chiffre
  exact de la migration SQL), les 390 coquilles connues (même répartition
  323/37/30), et l'exclusion des trois fiches de sources écartées.
- **Le rapport imprimé d'un parseur plafonne**, ici à 80 anomalies : on rappelle
  `parse_page()` lettre par lettre plutôt que de lire sa sortie. Même piège que
  les compteurs « 50+ » de l'ancienne file.

### Le déterminisme tenait à l'ordre des UUID

Trouvé en comparant la base de production à la base locale : **8 881 variantes à
article ici, 8 882 là-bas**, mêmes données et même code. La dérivation lisait les
attestations par `id`, or les UUID sont tirés au hasard à l'import — quand deux
attestations écrivent la même forme, celle qui créait la variante changeait d'un
chargement à l'autre.

Un écart d'une unité qu'on pouvait mettre sur le compte du bruit. C'était une
faille de la promesse « rejouable = même résultat », qui ne tenait que tant qu'on
ne rechargeait pas l'archive. Corrigé par un ordre stable **et** par une règle
qui ne dépend d'aucun ordre (à forme égale, la variante porteuse de l'article
l'emporte), puis vérifié sur une base entièrement neuve.

**Deux bases valent mieux qu'une** : sans le double chargement, le défaut restait
invisible. C'est « recompter en base » appliqué à deux bases.

### La carte ne dépend d'aucun service extérieur

**Décision de John** : *« il faut notre propre carte, le projet ne doit dépendre
d'aucun outil extérieur »*. Une carte à tuiles demande son fond à un serveur
tiers à chaque consultation. Deux fonds instruits puis écartés le même jour : les
tuiles d'OSM (blocage « sans préavis » prévu par leur politique) et la
Géoplateforme de l'IGN (meilleure, mais service tiers quand même).

Une distinction a permis de ne pas tout réécrire : un **service** répond à chaque
consultation et nous échappe ; une **bibliothèque** est du code dans notre
bundle ; des **données** téléchargées une fois et versionnées sont à nous.
Leaflet est donc gardé — sans `tileLayer`, il n'émet aucune requête.

- Le fond est `public/carte/contours.topojson`, produit par
  `scripts/communes/generer-contours.js` : **401 Ko, ~97 Ko compressés**. Une
  seule tuile en pèse 34, et une carte à tuiles en recharge à chaque
  déplacement — **l'autonomie est ici plus légère que la dépendance**.
- Le doc 20 écartait cette piste d'avance (« plusieurs Mo, indéfendable en
  mobile-first ») : **mesuré, c'était faux**. 1,6 Mo en GeoJSON brut, et le
  format adapté à un maillage divise encore par quatre.
- 4 contours au millésime 2018 désignaient des communes fusionnées depuis :
  écartés, sinon la carte dessinerait des frontières qui n'existent plus. Le
  script **échoue** si une commune du référentiel n'a pas de contour — un trou
  dans le fond, ça ne se découvre pas à l'écran.
- **Vérifié sur l'artefact servi** : aucun chunk de `/carte` ne contient
  `geopf.fr`, `tile.openstreetmap`, `mapbox`, `maptiler` ni `cartocdn`.

**L'attribution a quitté la carte, pas le projet.** Le texte de la Licence
Ouverte demande la source et son millésime **sans imposer d'emplacement** — il
accepte même un simple renvoi par URL. La mention vit sur `/sources`. Elle n'est
pas facultative : c'est la seule contrepartie d'une licence qui donne par
ailleurs l'usage commercial, mondial, illimité et gratuit, et le projet a écarté
trois sources lexicales sur cette question en campagne 5.

### Deux décisions de simplification

- **On s'en tient aux communes actuelles.** 249 noms de toponymes ne joignent
  aucune commune — 57 fusionnées depuis la source, des noms mal orthographiés par
  le site de 2006, des villes étrangères, des hameaux. Les 57 étaient
  récupérables, mais les faire entrer supposait de décider quoi afficher pour un
  village qui n'est plus une commune. **Complexité refusée**, la source
  officielle INSEE fait foi.
- **Le dump de Supabase est abandonné.** Il ne protégeait plus que ce qui
  n'existait qu'en base — entrées arbitrées, comptes, votes — et qui n'a plus
  d'intérêt.

## Session autonome, Supabase sorti du code (13/09/2026)

**Étape 2 du doc 20 faite.** Le middleware ne fait plus aucun appel réseau, et
`@supabase/*` ne figure plus dans `package.json`.

- **Deux jetons signés avec `jose`.** `ed_session` (30 min) porte l'identité et
  le rôle ; `ed_refresh` (30 jours) ne porte **que** l'identifiant. Le rôle est
  absent du jeton long exprès : recopié de renouvellement en renouvellement, une
  promotion faite dans `/admin` n'atteindrait jamais un membre déjà connecté. Il
  est relu en base par `/api/session/refresh` — une requête par demi-heure et
  par membre actif, contre une par page vue avec `supabase.auth.getUser()`.
- **Une revendication `typ` signée** sépare les deux jetons. Sans elle, un jeton
  de renouvellement passerait pour une session : il n'a pas de rôle, et un rôle
  absent lu comme « membre » serait une rétrogradation silencieuse — ou une
  escalade si le défaut penchait de l'autre côté.
- **`SESSION_SECRET` absente fait échouer bruyamment.** La lecture de la clé est
  hors du `try` : avalée, elle déconnecterait tout le monde pendant que le site
  répond 200 — le mode de panne exact des trois incidents de migration.
- **La barrière d'admin n'a pas bougé de couche** : `adminExige()` relit le rôle
  en base. Le middleware reste un confort de navigation, comme il l'a toujours
  été.
- **Le premier admin s'amorce à la main** (`scripts/promouvoir-admin.mts`), après
  une première connexion — c'est elle qui crée le membre. Un `ADMIN_EMAIL`
  d'environnement aurait rendu quelqu'un admin par configuration, donc en
  silence et réversiblement au prochain déploiement.

**Trois gestes d'administration disparaissent, et aucun n'est à réintroduire** :
inviter et générer un lien de réinitialisation (Odoo est l'autorité sur les
comptes, et il n'y a pas de SMTP côté dico), et **supprimer un membre** — ses
témoignages sont en cascade, l'effacer effacerait des villages que personne
d'autre ne porte. Les trois rôles deviennent deux : le rôle intermédiaire
n'avait de sens que tant que contribuer demandait une habilitation.

**Les écrans de lecture passent sur Prisma**, des 338 entrées arbitrées aux
25 864 lemmes. La fiche perd la couronne « Canonique » et montre, pour *chaque*
forme, ses sources écrites et ses villages dans deux blocs distincts ;
`BadgeConfiance` rend deux pastilles et jamais un total. Migration
`20260912140000_recherche` : `unaccent` et `pg_trgm`. **`unaccent` vit dans la
recherche et nulle part ailleurs** — dans une clé d'identité il fusionnait
`sur`/`sûr` et `ville`/`Villé` (corrigé le 24/08).

**Vérifié sur l'artefact, pas sur la source** : le middleware compilé ne contient
ni `supabase`, ni `@prisma`, ni `pg` — seulement `HS256` et `SESSION_SECRET`.
Sans cookie, `/` et `/dictionnaire` répondent 307 vers `/login`. La requête réelle
de la recherche a été rejouée en base : `bonjour` rend ses quatre formes,
`Milhüsa` retrouve Mulhouse et ses sept formes, `epreuve` trouve `épreuve`.

**Non vérifié à l'écran, deux sessions de suite** : Chrome force `https://` sur le
serveur de dev, qui est en HTTP, et `next dev --experimental-https` bute sur
l'élévation de privilèges de mkcert. Le contrôle s'est fait en `curl` sur le HTML
rendu. La connexion Odoo bout en bout reste à faire par John — elle demande un
mot de passe.

**Deux limites vues et laissées telles quelles, parce qu'elles se disent** : un
lemme sur 25 864 est injoignable par le parcours A-Z (`(espèce de) tordu`,
verbatim de la source, que la recherche trouve), et les grandes lettres dépassent
le plafond de 200 — l'écran affiche « 200 premiers sur 3 006 » plutôt que de
laisser lire une page comme un total. **La seconde est résolue le 14/09/2026,
cf. plus bas** — la première reste ouverte, aucune plainte à son sujet.

## Fiches publiques village et prénom (13/09/2026)

**Début de l'étape 3 du doc 20** : `/village/[slug]` et `/prenom/[slug]`, les
seules pages publiques indexables (compte obligatoire partout ailleurs).
Générées statiquement (`generateStaticParams`). `/` reste pour l'instant la
recherche authentifiée — en faire la home de présentation publique déplace la
recherche ailleurs et touche `AppNavShell`, décision distincte non prise ici.

- **Un toponyme EST une commune** (doc 20) : `/village/[slug]` n'est pas un
  second modèle de données, c'est le lemme rattaché à la commune
  (`Lemme.communeId`, `@unique`) vu depuis l'autre bout. `chargerVillage()`
  (`src/lib/villages.ts`) délègue au même chargeur que la fiche authentifiée.
- **819 communes sur 1 605 ont une forme attestée** au 13/09/2026 — chiffre
  vérifié en base, qui corrige le 954 écrit dans le doc 20 avant le 12/09 (qui
  comptait des attestations, pas des communes rattachées). Seules elles sont
  pré-rendues ; les 786 autres restent joignables à la même URL, rendues à la
  demande, en `noindex` posé par la page — sans lien vers une contribution qui
  n'existe pas encore (étape 5), même règle que le « lien mort pire qu'une
  absence » déjà appliquée à la page de recherche.
- **131 prénoms attestés**, tous avec un slug : contrairement aux villages, un
  lemme `prenom` naît toujours d'une attestation, donc n'a pas d'état « sans
  forme » à gérer.
- **`chargerLemmeDetaille()` extrait de `chargerLemme()`** (`src/lib/lemmes.ts`,
  déplacé depuis `app/actions/recherche.ts`) : prend un sélecteur Prisma unique
  plutôt qu'un id, pour être appelé par id (`/entree/[id]`, authentifié) ou par
  slug (`/prenom/[slug]`, public). La fiche village s'y ajoute par `communeId`.
- **`CarteVariante` extrait en composant** (`src/components/carte-variante.tsx`)
  depuis `/entree/[id]` : trois écrans l'affichent maintenant, ce qui justifiait
  l'extraction — elle ne l'aurait pas fait pour un seul.

### `generateStaticParams` a besoin de la base au build — conflit avec la règle du 12/09

Trouvé en écrivant ces deux routes, avant tout `git push` : le commentaire du
`Dockerfile` du 12/09 dit « plus aucune variable de build, rien de sensible gravé
dans l'image » — `DATABASE_URL` y est strictement runtime. Mais
`generateStaticParams` tourne PENDANT `next build`, y compris dans le conteneur
Coolify, et ces deux routes ont besoin de lire la base à ce moment-là. Les deux
règles se contredisaient telles quelles.

**Essayé d'abord en secret BuildKit, pas une Build Variable** — choix fait pour
ne rien devoir à la règle du 12/09. `Dockerfile` : `RUN
--mount=type=secret,id=database_url`, censé monter la valeur en tmpfs pour la
seule durée de l'instruction `pnpm build` sans l'écrire dans aucune couche de
l'image. Échoue bruyamment si le secret manque, plutôt que de construire une
image aux deux routes silencieusement non pré-rendues.

**Confirmé non fonctionnel sur ce Coolify au premier déploiement `dev`
(13/09/2026, log lu par John)** : le build a échoué avec exactement le message
prévu — « Secret de build 'database_url' manquant » — donc Coolify ne relaie pas
de secret BuildKit à id libre ici. La discussion GitHub
coollabsio/coolify#5328, ouverte par un utilisateur et restée sans réponse,
avait raison d'en douter.

**Repli appliqué dans la foulée** : `ARG DATABASE_URL` classique dans le
`Dockerfile`, alimenté par une Build Variable Coolify — le mécanisme déjà
éprouvé sur ce projet pour les `NEXT_PUBLIC_SUPABASE_*` avant le 12/09.
Compromis assumé et documenté dans le `Dockerfile` : la valeur reste lisible
dans l'historique des couches du builder, mais cette image n'est jamais
poussée sur un registre public et l'étage final — seul livré — ne la copie
pas. **Reste à poser dans Coolify** : marquer `DATABASE_URL` disponible au
build sur `elsass-dico:dev`, puis rejouer le déploiement.

### Vérifié contre la vraie base, pas seulement par `tsc`

`tsc --noEmit` propre, mais un vrai `next build` local a échoué comme d'habitude
sur l'EPERM symlink du mode standalone Windows — **après** avoir affiché
« Generating static pages (963/963) », donc après avoir rendu les 819 + 131 pages
sans une seule erreur de requête. Le `prerender-manifest.json` final n'a pas été
écrit (le crash a coupé avant), donc le contrôle habituel sur l'artefact ne
s'appliquait pas ; la couche de données a été vérifiée directement (`tsx`,
`DATABASE_URL` injectée via `node --env-file`, port 5444 rouvert le temps du
contrôle puis à refermer) : `chargerVillage("colmar-68066")` rend `Kolmer` /
`Colmer`, exactement ce que `21-REPRISE.md` annonçait depuis le 12/09 ; un slug
inexistant rend `null` (→ `notFound()`) ; les comptes de 819 et 131 recoupent ceux
du doc 20.

**Non vérifié à l'écran** : comme le reste de l'étape 2, `next dev` bute sur
l'HTTPS forcé par Chrome sur ce poste. À confirmer par John une fois déployé.

### Déployé : quatre problèmes de build en cascade, un seul déploiement Coolify (13/09/2026)

Chaque correctif révélait le suivant — invisible tant que le précédent
bloquait le build plus tôt. Les trois premiers sont des problèmes de
**build**, jamais de code applicatif ; `tsc` et la vérification en base ne
pouvaient rien en dire.

1. **`DATABASE_URL` manquante au build.** Essayé en secret BuildKit
   (`--mount=type=secret`, jamais écrit dans une couche) pour ne rien devoir à
   la règle du 12/09 sur les Build Variables — confirmé non fonctionnel sur ce
   Coolify, le secret arrivait vide (discussion GitHub
   coollabsio/coolify#5328, restée sans réponse, avait raison d'en douter).
   Repli : `ARG DATABASE_URL` classique, alimenté par une Build Variable
   Coolify — le mécanisme déjà éprouvé ici pour les `NEXT_PUBLIC_SUPABASE_*`
   avant le 12/09. Bonus découvert au passage : cette variable pointe vers le
   nom **interne** de la base (`l11x6p591gah952rrbbgl24o:5432`), donc le
   port public 5444 n'a plus besoin d'être ouvert pour qu'un build Coolify
   passe — seulement pour une vérification manuelle depuis ce poste.
2. **`npm install` de la CLI Prisma résolvait tout le graphe du projet.** La
   sortie standalone de Next embarque une copie **intégrale** de
   `package.json` (pas un extrait) dans l'étage final — `rm -f package.json`
   avant l'install. Sans `"type": "module"` dans ce fichier, le retirer ne
   change rien à la façon dont `node server.js` interprète ses propres
   fichiers.
3. **Deux tentatives supplémentaires ont échoué pour la même cause
   profonde**, avant la bonne solution : faire cohabiter deux
   `node_modules` d'origines différentes dans `/app` — celui que pnpm résout
   (copié par le traçage de fichiers, avec sa structure `.pnpm/` réelle
   derrière les liens symboliques) et celui qu'`npm install` produit
   classiquement.
   - Installer directement dans `/app` (même sans `package.json`) faisait
     scanner `node_modules/.pnpm/` par npm : plusieurs minutes
     d'avertissements ERESOLVE sur des paquets sans aucun rapport (jest,
     eslint-config-standard…), venus de devDependencies que pnpm avait
     résolues pour tout autre chose que Prisma.
   - Installer à part puis `cp -r` le résultat DANS `/app/node_modules`
     échouait sur `cp: target '/app/node_modules/./react' is not a
     directory` — Prisma embarque Prisma Studio (donc React, ~136 paquets
     sans rapport avec l'app), et `cp` refuse d'écrire un dossier réel
     par-dessus un lien symbolique pnpm.
   - **Solution retenue : `/opt/prisma-cli`, un répertoire fermé sur
     lui-même** — binaire, dépendances (`prisma`, `dotenv`), schéma ET
     `prisma.config.ts` y vivent ensemble, aucun point de contact avec
     `/app/node_modules`. Nécessaire pour une raison qu'un simple chemin de
     binaire n'aurait pas réglée : `prisma.config.ts` importe lui-même
     `dotenv` et `defineConfig` de `"prisma/config"`, et ces imports se
     résolvent depuis l'**emplacement du fichier**, pas depuis celui du
     binaire qui l'exécute — les laisser dans `/app` aurait fait échouer une
     quatrième fois, différemment. `docker-entrypoint.sh` lance la CLI avec
     ce répertoire en `cwd` (sous-shell, pour que `exec "$@"` garde `/app`).
4. **Le build mourait en silence** (`exit 255`, aucune trace applicative) à
   « Generating static pages (240/963) » — la signature d'un process tué
   (probable OOM), pas d'une exception qu'on aurait pu attraper. Hypothèse
   posée sans confirmation par une métrique mémoire (hors de portée depuis
   Claude Code) : Next génère par défaut plusieurs pages en parallèle, et 950
   des 963 pages de ce build (`/village` + `/prenom`) ouvrent chacune une
   vraie requête Postgres — des dizaines de connexions et de processus Node
   simultanés sur un VPS déjà identifié comme sujet à saturation (audit du
   30/08/2026). `experimental.cpus = 1` (`next.config.ts`) sérialise la
   génération.

**Déployé et vérifié sur `elsass-dico-dev.theelsassisch.com`, en `curl`, pas
seulement en base** : `/village/colmar-68066` → 200, titre « Colmar — Kolmer »
(exactement ce que la couche de données rendait déjà) ; `/prenom/ambroise` →
200, « Ambroise — Àmbrosi » ; un slug inexistant → 404 ; `/` (recherche
authentifiée) → 307 vers `/login`, rien ne fuite à un visiteur anonyme.

**Reste non vérifié dans un vrai navigateur** — même blocage HTTPS/mkcert que
le reste de l'étape 2 — et à reporter sur `elsass-dico:main` quand `dev`
passera en PR : les quatre correctifs de build ci-dessus s'appliquent au même
`Dockerfile`, donc au même déploiement.

### Vu dans un vrai navigateur, et un vrai bug trouvé (13/09/2026)

Premier passage à l'écran des trois pages publiques sans compte
(`elsass-dico-dev.theelsassisch.com`, Chrome piloté). Les données rendaient
bien — `Colmar → Kolmer, Colmer`, `Ambroise → Àmbrosi, Brosi` — mais la mise en
page non : `/village`, `/prenom` **et `/sources`** réservaient `md:pl-20
lg:pl-56`, la place du rail `AppNavShell` — copié du patron des écrans
authentifiés sans vérifier qu'aucune des trois ne monte ce rail. À l'écran :
une colonne de contenu plaquée loin à droite, plusieurs centaines de pixels de
vide à gauche dès la largeur tablette. `/sources` portait déjà le défaut avant
ce chantier — jamais vu faute d'avoir été ouvert à cette largeur : correct à la
lecture du JSX, faux à l'écran, le même genre d'écart que la source ne prouve
pas l'effet. Retiré sur les trois pages ; `mx-auto
max-w-3xl` suffit à centrer une colonne de contenu qui ne partage l'écran avec
aucune nav.

### Connexion Odoo bout en bout et premier admin, faits par John (13/09/2026)

`elsass-dico-dev.theelsassisch.com`, `theelsassisch@gmail.com` : la connexion a
créé le membre à la première connexion et posé une session — preuve en passant
que `SESSION_SECRET` est bien réglée en runtime sur Coolify, sans quoi l'app
aurait refusé bruyamment plutôt que de laisser passer une connexion (cf.
`src/lib/session.ts`). `scripts/promouvoir-admin.mts theelsassisch@gmail.com`
lancé dans la foulée (port 5444 rouvert le temps de la commande, à refermer) :
`membre -> admin`, confirmé par le script — ce qui clôt le dernier point ouvert
de l'étape 2 (« connexion Odoo bout en bout à faire par John »).

### `/` devient la présentation publique (décision de John, 13/09/2026)

Tranché le jour même, sur la question laissée ouverte à la fin de l'étape 3 :
`/` était encore l'écran de recherche authentifié, hérité du 28/08 — un
visiteur anonyme y était redirigé vers `/login` sans jamais voir ce qu'est le
site. Avec `/village/[slug]` et `/prenom/[slug]` désormais indexables, un
lecteur qui arrive depuis Google sur une fiche de commune n'avait nulle part
où aller comprendre le projet avant qu'on lui demande un compte.

- **La recherche déménage sur `/recherche`**, intégralement — mêmes hooks de
  cache et de scroll (`useListeMemorisee`, `useScrollMemorise`), seules les
  deux URLs internes (`router.replace`, `memoriserUrlOnglet`) changent de
  chemin. `AppNavShell` y pointe désormais pour l'onglet « Recherche ».
- **`/` devient une page de présentation, publique.** Un membre déjà connecté
  qui y arrive est redirigé côté serveur vers `/recherche` — inutile de lui
  montrer un argumentaire pour un compte qu'il a déjà.
- **Le middleware traite `/` en comparaison STRICTE**, jamais en préfixe
  (`chemin === "/"`, pas `chemin.startsWith("/")`) : la liste `PUBLIC`
  existante fonctionne par préfixe, et `/` est le début de **tout** chemin, y
  compris `/admin` — l'y glisser avec le même mécanisme que les autres
  entrées aurait rendu toute l'app publique.
- **Vérifié à l'écran** (Chrome piloté, `elsass-dico-dev.theelsassisch.com`,
  après redéploiement) : `/` rend la présentation et centre bien son contenu ;
  `/recherche` redirige un visiteur anonyme (`curl`, 307) vers `/login` ; le
  chevron retour de `/login` ramène à `/`. Non testée : la redirection
  automatique d'un membre connecté vers `/recherche` (demanderait de se
  connecter dans ce navigateur, réservé à John).

## Écrans admin signalements et sources (13/09/2026)

Complète les trois écrans admin du doc 20 (« Admin, trois écrans » —
`/admin` existait déjà). PR sur `dev`, commit `c08a11d`.

- **Le signalement devient in-app.** `/entree/[id]/signaler` renvoyait vers
  le forum depuis l'étape 2 (« un signalement anonyme n'est pas faisable côté
  backend aujourd'hui ») : c'était vrai avant le compte obligatoire, ça ne
  l'est plus. `creerSignalementAction` (`src/app/actions/signalements.ts`)
  attache le membre de la session à une **variante précise** — l'écran, qui
  signalait tout le lemme en bloc via une chaîne concaténée, propose
  désormais un choix de forme (`<select>` sur les variantes) et un motif
  libre. Le forum reste en secours pour une discussion plus large, il n'est
  plus le seul chemin.
- **`/admin/signalements` ne montre que le non traité** — la file se vide au
  traitement, sur le même principe que « Recoupées (0) » de l'ancien
  arbitrage (23/08) : un écran vide est un succès, pas une panne. Marquer
  traité ne touche ni la forme ni ses témoins ; la décision de fond (garder,
  corriger, masquer la variante) reste un geste séparé pris ailleurs — cet
  écran est une file, pas un exécuteur.
- **`/admin/sources` est en lecture seule, et volontairement.** `Source` fait
  partie de l'archive — « LECTURE SEULE » dans le schéma — donc l'écran
  affiche licence et fiabilité déclarées sans bouton d'édition : les fiches
  viennent de `data/sources/` sur la branche `data` et se régénèrent par
  l'importeur, pas depuis l'app. **La fiabilité n'a pas d'échelle connue** :
  seule `culture_alsace` a une fiche visible sur `dev` (`fiabilite: 3`, un
  `SmallInt` sans borne documentée dans le schéma) — le chiffre brut est donc
  affiché tel quel, sans suffixe `/5` inventé.
- **Vérifié** : `tsc --noEmit` propre, et un vrai `pnpm build` (dev arrêté
  avant, relancé après) a généré les 966 pages sans erreur — seul l'échec
  final est l'EPERM symlink Windows connu, après « Generating static pages
  (966/966) ». Déploiement Coolify confirmé (`get_application.updated_at`
  passé de 14:28:28 à 14:32:58Z). **Non vérifié à l'écran** : la session
  admin de John avait expiré entre-temps (Chrome piloté redirigé vers
  `/login` en visitant `/admin/signalements`) — à confirmer à la
  reconnexion.

## Première tranche de la contribution : le vote et le village (13/09/2026)

Suite logique après l'étape 3 (écrans admin) : la session admin de John avait
expiré, bloquant la vérification à l'écran des écrans admin — plutôt
qu'attendre, la première tranche de l'étape 5 du doc 20 (contribution) a été
prise, puisqu'elle ne dépend d'aucune session existante à rejouer.

- **Un vote = un village** (doctrine du 11/09) : `src/app/actions/votes.ts`
  crée un `Temoignage{membreId, communeId}` — jamais `sourceId`/`attestationId`
  — via `voterPourVarianteAction()`, et `retirerVoteAction()` le supprime.
  `Membre.communeId` (posé par `definirVillageAction()`,
  `src/app/actions/membres.ts`) ne fait que **pré-remplir** un futur vote : un
  témoignage déjà posé ne bouge pas si le membre change de village ensuite,
  parce que `communeId` est porté par le témoignage — un des quatre points non
  négociables du modèle (doc 20).
- **Le gate se relit en base, jamais sur le cookie.** La session (30 min) porte
  `communeId` depuis l'étape 2, mais ne se resynchronise qu'à son
  renouvellement : voter juste après avoir choisi son village doit marcher
  tout de suite, donc `voterPourVarianteAction()` relit `Membre.communeId` en
  base à chaque appel plutôt que de faire confiance au jeton.
- **`upsert` sur `(varianteId, membreId)`, pas `create`** : un double clic ne
  doit pas remonter une erreur de contrainte d'unicité à l'écran.
- **Le sélecteur de village** (`src/app/dashboard/selecteur-village.tsx`) est
  un `<select>` en ligne dans « Mon espace », triée par `Commune.population`
  décroissante — c'est la raison d'être documentée de ce champ dans le schéma
  depuis le 12/09 (« ordonner un sélecteur de 1 605 entrées par ce que
  l'utilisateur cherche en premier »). **Simplification assumée** : le doc 20
  parle d'une « modale » ; ici c'est un sélecteur en ligne, parce que la carte
  qui l'entoure dans « Mon espace » ne s'affiche déjà que tant que le village
  manque — même économie que les CTA simplifiés du 29/08/2026.
- **`CarteVariante` reçoit un slot optionnel `accessoire`**, fourni seulement
  par `/entree/[id]` (authentifié) : les fiches publiques `/village` et
  `/prenom`, sans session, ne le passent pas et restent inchangées. Le bouton
  lui-même (`VoteVariante`,`src/app/entree/[id]/vote-variante.tsx`) n'a pas
  d'état local optimiste — un succès appelle `router.refresh()`, qui refait
  tourner la page côté serveur, pour que `monVote` et le compte de villages
  reviennent à jour ensemble.
- **`chargerLemme()`** (`src/app/actions/recherche.ts`, le chemin authentifié)
  ajoute `monVote` sur chaque variante quand une session existe ; les fiches
  publiques, qui appellent `chargerLemmeDetaille()` directement, n'y touchent
  pas.
- **Vérifié** : `tsc --noEmit` propre ; un vrai `pnpm build` (dev arrêté avant,
  relancé après) a généré les 966/966 pages, seul l'EPERM symlink Windows
  connu suit. Sur la base réelle, en lecture seule (script jetable, supprimé
  après usage — jamais d'écriture de test sur la production) : les 1 605
  communes portent toutes une `population` (Strasbourg en tête, 293 771),
  0 témoignage de locuteur n'existe encore (attendu, fonctionnalité neuve), et
  le seul membre de la base (`theelsassisch@gmail.com`) n'a pas de village —
  le sélecteur s'affichera bien pour lui à la prochaine connexion.
- **Vérifié à l'écran le 13/09/2026**, une fois John reconnecté (Chrome
  piloté, `elsass-dico-dev.theelsassisch.com`) : `+` sans village posé →
  refusé avec le message exact ; sélecteur peuplé, trié par population
  décroissante (Strasbourg, Metz, Mulhouse, Colmar…) ; village choisi →
  « Village enregistré », profil mis à jour ; `+` repris sur « buschur »
  (candidat « bonjour ») → badge « 2 sources · 1 village », village affiché,
  bouton vert ; retiré → retour exact à l'état d'avant. `/admin/signalements`
  et `/admin/sources` (commit `c08a11d`) confirmés au même passage — l'étape 3
  est donc close pour de bon.
  - Note opérationnelle : ce test a laissé Colmar comme village réel du
    compte `theelsassisch@gmail.com` (seul moyen d'exercer le sélecteur en
    conditions réelles) — à corriger ou laisser tel quel selon ce que John
    veut y voir.
- **Restent hors de cette tranche** : créer une nouvelle variante sur un mot
  (« ça se dit autrement chez moi »), éditer sa propre variante tant qu'elle
  est seule, et la carte interactive (étape 4, toujours à juger à l'écran).

## Deux retours de John, deux correctifs (14/09/2026)

### Le sélecteur de village : tri alphabétique, recherche, modifiable à tout moment

Retour direct après la vérification à l'écran du 13/09 : « la liste des
villages est en bordel total, elle devrait être classée par ordre alphabétique
et avoir une barre de recherche », et « il faut pouvoir le changer à tout
moment dans notre profil ».

- `src/app/actions/communes.ts` : tri passé de `population` décroissante à
  `nom` croissant. Le commentaire du schéma du 12/09 sur `population`
  (« ordonner un sélecteur par ce que l'utilisateur cherche en premier »)
  n'a pas résisté au premier usage réel — sur un `<select>` natif de
  1 605 entrées sans recherche, un tri par population est illisible. La
  recherche ajoutée côté client couvre désormais mieux cette intention qu'un
  tri seul ne le pouvait.
- `src/app/dashboard/village-profil.tsx` remplace `selecteur-village.tsx` :
  un combobox (champ texte + liste filtrée en mémoire, 1 605 communes déjà
  chargées, pas de aller-retour serveur par frappe) plutôt qu'un `<select>`
  natif. Le composant porte aussi un état affichage/édition — le bloc « Ton
  village » s'affiche désormais en permanence dans « Mon espace », avec le
  village actuel et un bouton « Changer », plutôt que de n'apparaître que
  tant que le village est vide.
- **Vérifié à l'écran** (Chrome piloté, session de John,
  `elsass-dico-dev.theelsassisch.com`) : recherche « mundolsheim » → un seul
  résultat pertinent ; validation → toast « Village enregistré », profil mis
  à jour ; bouton « Changer » réapparaît ensuite. Corrigé au passage le
  village de test laissé la veille (Colmar → Mundolsheim, le vrai village de
  John).

### La pagination du dictionnaire A-Z

Retour direct : « pour le dictionnaire, pour chaque lettre il n'affiche que
les 200 premiers ! je fais comment pour voir les autres ? ». Le plafond du
13/09 (« 200 premiers sur 3 006 ») se disait, mais n'offrait aucun moyen de
voir la suite — exactement la même famille de défaut que les anciens
compteurs « 50+ » de la file d'arbitrage et le rapport de parseur plafonné à
80 anomalies : un plafond qui ne se contente pas de compter finit par
bloquer.

- **100 mots par page, pas 200** — tranché plutôt que redemandé : sur un VPS
  sans limite CPU ni rate limiting, une page plus courte coûte moins par
  requête, et l'argument pour 200 (moins de clics) ne tient plus une fois
  qu'on peut réellement tourner les pages.
- `lemmesParLettreAction(lettre, page)` (`src/app/actions/navigation.ts`) :
  le compte total est lu **avant** le `LIMIT`/`OFFSET`, et la page demandée
  est validée contre le vrai nombre de pages côté serveur — une page hors
  bornes (lien trafiqué, lettre changée entre deux clics) ne rend jamais une
  liste vide à tort.
- Boutons **Précédent/Suivant en haut ET en bas** de la liste
  (`src/app/dictionnaire/page.tsx`), page portée par l'URL
  (`?lettre=C&page=3`). Un changement de page n'est pas un « retour » au sens
  de `estRetourHistorique()` : `useScrollMemorise` ne remonte donc pas seul,
  d'où un `window.scrollTo({top:0})` explicite après chaque clic — sinon on
  resterait scrollé au niveau du bouton « Suivant » cliqué en bas de liste.
- **Vérifié en base avant déploiement** (script jetable, lecture seule,
  supprimé après usage) : C (3 006 mots) → 31 pages, dernière page 6 lignes ;
  P (2 622) → 27 pages ; Z (68, sous le seuil) → 1 page. **Vérifié à l'écran**
  ensuite sur la lettre C : page 1/31 → clic Suivant → page 2/31, remontée en
  haut, URL à jour ; page 31/31 → 6 mots, bouton Suivant désactivé en haut et
  en bas, Précédent actif.
- Incident sans suite : un onglet Chrome de la session précédente s'est mis à
  résoudre `elsass-dico-dev.theelsassisch.com` vers `0.0.0.0:3000` après un
  aller-retour — confirmé propre au navigateur et non au serveur (`curl`
  direct sur l'URL rend la redirection normale vers `/login`), résolu en
  ouvrant un nouvel onglet.

## Plan en attente : tri A-Z cassé par les accents, accès direct à un mot (14/09/2026)

Deux nouveaux retours de John le même jour que les correctifs ci-dessus, **plan
écrit et validé en fin de session, implémentation NON commencée** — à reprendre
en priorité à la prochaine session.

1. **Trop de clics pour atteindre un mot connu.** « bricoler » (lettre C)
   demandait 12 clics sur Suivant, « cytise » 30. Confirmé en base avec le tri
   actuel : bricoler rang 1190 (page 12), cytise rang 2939 (page 30) — chiffres
   de John exacts.
2. **Les mots accentués tombent en fin de liste.** Pour C : `cytise`, `câble`,
   ... `çà` en dernier — pas un tri français. Cause identifiée :
   `lemmesParLettreAction()` (`src/app/actions/navigation.ts`) trie par
   `ORDER BY l.cle ASC` sans désaccentuer, et la collation Postgres classe les
   caractères accentués après l'ASCII simple.

**Solution retenue** (détaillée dans le plan) :
- Point 2 (à corriger en premier, car il change le rang du point 1) :
  `ORDER BY immutable_unaccent(l.cle) ASC, l.cle ASC` dans
  `lemmesParLettreAction`. **Ce n'est PAS une violation de la doctrine du
  24/08/2026** (« `unaccent` jamais dans une clé d'identité ») : ici
  `immutable_unaccent` ne sert qu'à calculer un ordre d'affichage, aucune ligne
  n'est fusionnée — c'est un troisième usage légitime, distinct de l'usage
  interdit dans une clé de regroupement/identité.
- Point 1 : nouveau champ « Aller à un mot » sur `/dictionnaire`, nouvelle
  action `pageDuPrefixeAction(lettre, prefixe)` qui calcule le rang du préfixe
  tapé avec EXACTEMENT le même tri que `lemmesParLettreAction` et saute à la
  bonne page via `allerPage()` (déjà écrite). Alternatives écartées : rediriger
  vers `/recherche` (John feuillette délibérément, il ne cherche pas un mot déjà
  identifié) ; bigrammes cliquables façon dictionnaire papier (plus coûteux,
  moins flexible qu'un champ texte).

Plan complet (contexte, requêtes SQL exactes, plan de vérification) dans
`C:\Users\George\.claude\plans\tranquil-meandering-rose.md` côté poste de
Claude Code — pas versionné dans le dépôt. À la reprise : implémenter les deux
points, mesurer en base (script jetable) que `ça`/`çà` précèdent bien `cabale`
et que le saut de page atterrit sur le bon mot avec le nouveau tri, `tsc
--noEmit` puis `pnpm build` réel, déployer sur `dev`, vérifier à l'écran avec
John.

## Plan ci-dessus implémenté (14/09/2026)

Les deux points du plan en attente sont codés et vérifiés en base ; reste la
vérification à l'écran après déploiement.

- **Point 2 (tri)** : `lemmesParLettreAction()` trie désormais par
  `ORDER BY immutable_unaccent(l.cle) ASC, l.cle ASC` — exactement la requête
  du plan, second critère en départage stable. **Mesuré en base** (script
  jetable, lecture seule, supprimé après usage) : le début de C devient
  `c'est tout`, `c'est-à-dire`, `ça`, `çà`, `ça et là`, `ça par exemple`,
  `ça va !`, `cabale` — les mots accentués remontent bien en tête au lieu de
  la queue.
- **Point 1 (accès direct)** : `pageDuPrefixeAction(lettre, prefixe)`
  (`src/app/actions/navigation.ts`) compte les lemmes qui précèdent le
  préfixe avec le même tri désaccentué, puis renvoie la page — factorisé avec
  `lemmesParLettreAction` via `nbPagesPour()`. Champ « Aller à un mot »
  ajouté sur `/dictionnaire` (`ChampAllerAuMot`), affiché seulement quand
  `nbPages > 1`, au-dessus des `ControlesPagination` du haut ; réutilise
  `allerPage()` telle quelle. **Mesuré en base** avec le nouveau tri : avec
  les rangs recalculés (`bricoler` → rang 1269, page 13 ; `cytise` → rang
  3005, page 31 — différents des rangs 12/30 de l'ancien tri, cohérent avec
  « les deux points sont liés » du plan), le mot tombe bien sur la page
  calculée dans les deux cas.
- **Vérifié** : `tsc --noEmit` propre ; `pnpm build` (aucun serveur dev en
  cours) a généré les 966/966 pages sans erreur, seul l'EPERM symlink Windows
  connu suit.
- **Vérifié à l'écran** (Chrome piloté, session de John,
  `elsass-dico-dev.theelsassisch.com`) : lettre C → `ça`, `çà`, `ça et là`
  bien en tête, avant `cabale` ; champ « Aller à un mot » → « cytise » saute
  page 31/31 (mot présent) et « bricoler » (lettre B, pas C — le mot du plan
  était mal annoté) saute page 13/15 (mot présent).

### Bug trouvé en vérifiant à l'écran : squelette bloqué pour toujours sur échec réseau

Deux fois de suite, l'écran est resté bloqué sur le squelette de chargement
après un clic « Aller », alors que l'URL avait pourtant changé vers la bonne
page. Cause trouvée dans `read_network_requests` : de vrais **503** intermittents
sur ce VPS partagé (déjà identifié comme sujet à saturation, audit du
30/08/2026), qui touchaient aussi bien mon nouveau flux que des requêtes de
préchargement Next.js sans rapport (`/entree/[id]`, `/recherche`…).

Le vrai problème n'était pas les 503 eux-mêmes (transitoires, un simple `curl`
répété sur `/` passait 5/5) mais **`useListeMemorisee`** (`src/hooks/use-liste-memorisee.ts`,
utilisé par 6 écrans) : aucune reprise sur échec. Une requête ratée laissait
`donnees` à `null` pour toujours, et rien ne redéclenchait l'effet puisque la
clé de cache n'avait pas changé — l'écran restait bloqué sans erreur ni retenter,
indéfiniment. Mon champ « Aller à un mot » n'a fait que révéler un défaut déjà
latent, en ajoutant un aller-retour serveur de plus au même instant que le
rendu de la page.

**Corrigé par une seule nouvelle tentative après 1,2 s**, dans le hook
partagé (`chargerAvecReprise()`) plutôt que dans chacun des 6 écrans — pas de
boucle infinie, juste assez pour absorber un blip. Pas de changement d'API :
les écrans consommateurs n'ont rien à modifier.

- **Vérifié** : `tsc --noEmit` propre, `pnpm build` a regénéré les 966/966
  pages sans erreur (seul l'EPERM symlink Windows connu suit).
- **Non vérifié à l'écran après ce correctif précis** : reste à redéployer et
  confirmer que le champ « Aller à un mot » ne se bloque plus, y compris en
  cas de 503 réel (impossible à provoquer à la demande — la reprise s'est
  vérifiée par lecture de code, pas en reproduisant un 503 sous contrôle).

### La vraie cause : `router.replace` appelé après un `await`, hors transition

Le correctif de reprise ci-dessus n'a pas suffi — le blocage restait
reproductible à froid, sans le moindre 503 : les logs réseau interceptés
(`window.fetch` patché depuis la console) montraient `pageDuPrefixeAction`
répondre 200 en ~200 ms, l'URL passer bien à `&page=13`, mais **aucune
quatrième requête** pour `lemmesParLettreAction` — jamais émise, pas une
erreur, rien. Lecture directe de l'état React en mémoire (fibre du composant,
`memoizedState` en chaîne) : `lettre="B"` et `pageNo=13` étaient bien à jour,
mais `donnees` restait `null` et `enCours` restait `true` pour toujours —
l'effet de `useListeMemorisee` ne s'était simplement jamais redéclenché pour
la nouvelle clé.

**Cause réelle** : `allerAuPrefixe()` appelle `allerPage(n)` — qui appelle
`router.replace()` — depuis la continuation d'un `await`, donc **hors de la
pile d'appel synchrone du clic**. Les boutons Précédent/Suivant appellent
`allerPage` directement depuis `onClick`, synchrone, et n'ont jamais montré
ce blocage. Next a besoin qu'une navigation déclenchée en dehors d'un
gestionnaire d'événement synchrone soit explicitement dans une transition
React (`startTransition`) pour rester cohérente avec Suspense — sans ça, la
mise à jour d'état (URL, `pageNo`) passe, mais l'effet qui devait s'en
resservir ne se réarme jamais.

**Corrigé** en enveloppant `allerPage(n)` et `setPrefixe("")` dans
`startTransition()` (`src/app/dictionnaire/page.tsx`). Diagnostiqué sans
redéploiement supplémentaire grâce à deux outils de bord : un patch de
`window.fetch` injecté par la console pour voir les vraies requêtes (pas
celles supposées par lecture de code), et une marche directe de la fibre
React (`__reactFiber$...`, chaîne `memoizedState`) pour lire l'état réel sans
attendre qu'il s'affiche.

**Incident sans rapport croisé en route** : un onglet Chrome de cette session
s'est remis à résoudre `elsass-dico-dev.theelsassisch.com` vers
`0.0.0.0:3000` après un aller-retour — même défaut déjà noté le 14/09/2026,
propre au navigateur, pas au serveur. Fermer l'onglet et en rouvrir un neuf
l'a réglé, comme la fois précédente.

- **Vérifié** : `tsc --noEmit` propre, `pnpm build` a regénéré les 966/966
  pages sans erreur.
- **Reste à vérifier à l'écran après ce déploiement** : le champ « Aller à un
  mot » doit désormais atterrir sur la bonne page sans jamais rester bloqué.

## Règles de travail

- Ne jamais inventer de traduction alsacienne, même pour un exemple ou un test.
- Ne jamais afficher une forme sans dire ce qui la fonde — combien de sources
  écrites, combien de villages. Peu attesté est publiable ; le faire passer pour
  bien attesté ne l'est pas. **Ne jamais additionner des sources et des villages
  dans un même chiffre** : c'est la confusion qui a produit le bug de la PR #41.
- Toujours demander avant de supprimer des données existantes.
- Mesurer avant d'écrire. Deux chantiers ont été annulés par la mesure préalable
  (04/09, 09/09) : c'est un succès de la méthode, pas du temps perdu. Et le
  12/09, une mesure a démenti une affirmation de notre propre documentation —
  « plusieurs Mo, indéfendable en mobile-first » valait 97 Ko.
- **L'app ne dépend d'aucun service extérieur** (12/09/2026). Une bibliothèque
  dans le bundle et des données versionnées sont à nous ; un serveur qu'on
  interroge à l'exécution ne l'est pas, quelle que soit la qualité du
  fournisseur.
- **Respecter les licences des données qu'on réutilise**, y compris quand rien
  ne nous y oblige en pratique. Le projet a écarté trois sources lexicales sur
  ce motif ; une mention de paternité peut changer de place, jamais disparaître.
