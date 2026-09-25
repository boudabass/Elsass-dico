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
- **`startTransition` seul ne suffisait pas.** Déployé, revérifié à l'écran :
  « bricoler » (lettre B) sautait bien à la page 13 la première fois, mais
  « cytise » (lettre C) a rejoué le même blocage juste après — un test propre
  supplémentaire, sans rien changer au code, a reproduit l'échec une seconde
  fois. `startTransition` réduisait la fréquence du défaut sans l'éliminer :
  une vraie course, pas un bug déterministe.

### Correctif définitif : pré-remplir le cache avant de faire bouger `pageNo`

Plutôt que de dépendre d'un effet qui doit se redéclencher de façon fiable
après un `await` (fragile, quelle que soit la présence de `startTransition`),
`allerAuPrefixe()` appelle maintenant directement `chargerAvecCache()`
(`src/lib/cache-navigation.ts`, déjà exportée) pour peupler la clé de cache de
la page cible **avant** d'appeler `allerPage(n)`. `useListeMemorisee` relit ce
cache de façon **synchrone pendant le rendu** dès que sa clé change (son
`cleRef`) — si l'entrée existe déjà, la liste s'affiche immédiatement, sans
jamais dépendre du redéclenchement de l'effet. L'effet se déclenche quand
même ensuite, mais trouve un cache frais et ne fait rien (`fraicheurMs`).

- `tsc --noEmit` propre, `pnpm build` a régénéré les 966/966 pages.

### Vérifié à l'écran — et un piège de méthode de test démêlé du vrai bug

Premiers passages après ce déploiement : échecs encore, sur « cytise »,
identiques aux précédents. Traçage fin (valeur du champ + URL relevées à
plusieurs délais après le clic, `window.HTMLInputElement` natif plutôt que
l'accessibilité) : **le champ était déjà vide AVANT même le clic** — le mot
tapé par l'outil de frappe automatisée n'avait jamais atterri dans le bon
champ. Cause probable : l'interaction partait alors que la page était encore
sur son squelette de chargement (le champ n'existe pas dans cette branche du
rendu), donc soit la frappe visait un nœud sur le point d'être démonté, soit
l'outil de frappe lui-même a couru contre le montage du composant. **Une
partie des échecs de cette session n'était donc pas un bug applicatif, mais
un test lancé trop tôt** — leçon distincte du vrai bug de course déjà corrigé
par le pré-remplissage du cache.

**Vérifié ensuite, trois fois de suite, sans un seul échec** (en attendant
que le contenu réel soit affiché — pas le squelette — avant d'interagir) :
« cytise » (C) → page 31/31 ; « bricoler » (B) → page 13/15 ; « dorloter » (D,
mot choisi au hasard) → page 14/15, les trois fois avec le mot bien présent
sur la page annoncée. Les deux premiers via manipulation DOM directe (pour
éliminer toute ambiguïté sur la frappe), le troisième en conditions réelles
(clic + clavier, comme John l'utilisera) — les trois avec succès.

**Statut** : implémentation et correctifs tenus pour solides. Les trois points
du plan du 14/09/2026 (tri désaccentué, accès direct à un mot, résilience du
chargement) sont faits et vérifiés à l'écran.

## Bug trouvé et corrigé : header admin qui recouvrait le rail sur desktop (14/09/2026)

Retour direct de John : « dans la page admin il y a un header qui traine et
qui en plus recouvre le menu sur desktop ». `/admin` (`src/app/admin/page.tsx`)
plaçait `<AppHeader>` **avant** la div qui porte `md:pl-20 lg:pl-56` (la place
réservée au rail de `AppNavShell`), au lieu de l'englober comme le font
`dashboard`, `admin/sources` et `admin/signalements`. Le header est `sticky
top-0 z-40` pleine largeur (`src/components/app-header.tsx`) : sans ce
décalage, il chevauchait le rail (`z-30`) au lieu d'être poussé à droite.

Corrigé en déplaçant `pb-16 md:pb-0 md:pl-20 lg:pl-56` sur la div englobante
(qui contient déjà `<AppHeader>` et le contenu), et en retirant ces classes de
la div de contenu interne — même patron que les trois autres écrans admin.

- **Vérifié** : `tsc --noEmit` propre ; `pnpm build` a généré les 966/966 pages
  (seul l'EPERM symlink Windows connu suit).
- **Vérifié à l'écran** (Chrome piloté, session de John,
  `elsass-dico-dev.theelsassisch.com`, 1440×900) : `/admin` et `/admin/sources`
  — le header ne recouvre plus le rail, correctement poussé à droite dès la
  largeur desktop. Même incident Chrome que le 14/09 (onglet dérivé vers
  `0.0.0.0:3000`) rencontré une fois de plus au premier essai, résolu de la
  même façon (fermer l'onglet, en rouvrir un neuf).

### Second bug sur le même écran : le contenu ne prenait pas toute la largeur

Retour immédiat de John après le correctif ci-dessus : « il n'y a pas que ça,
elle ne prend pas toute la largeur contrairement aux autres pages, à gauche
il y a une bande blanche et à droite on voit le fond ». Deux correctifs
distincts, coup sur coup — John a signalé le risque : pousser trop vite
peut faire vérifier un déploiement encore en cours, ou en faire sauter un
que le suivant écrase avant qu'il finisse de builder. Chaque étape a donc
attendu une confirmation explicite de `updated_at` (`get_application`) **et**
une lecture directe de la classe CSS réellement présente dans le DOM déployé
(`document.body.innerHTML.includes(...)`) avant tout screenshot — pas
seulement un `updated_at` qui bouge, qui peut appartenir au déploiement
précédent si les deux se chevauchent.

Premier correctif tenté (largeur du conteneur interne de `/admin/page.tsx`,
`container mx-auto max-w-5xl` retiré) : insuffisant, le rendu n'a pas changé.
Cause réelle, plus profonde : `LayoutWrapper` (`src/components/layout-wrapper.tsx`)
plafonnait **toutes** les routes `/admin/*` à `max-w-6xl`, centré sur la
largeur TOTALE du viewport — une décision du 30/08/2026, écrite avant que
`/admin` adopte le rail de nav fixe (`AppNavShell`, `position:fixed`, collé
au vrai bord gauche de l'écran, donc hors du calcul de ce centrage). Le rail
et la colonne centrée ne s'accordaient plus : bande vide entre le rail et le
contenu (rail ~224px, colonne recommençant à ~366px sur un viewport 1884px),
fond visible après la fin de la colonne. Mesuré en direct via
`getBoundingClientRect()` sur le DOM déployé, pas deviné sur le JSX.

**Corrigé** en retirant le cas particulier `/admin/*` de `LayoutWrapper` :
toutes les routes reçoivent désormais le même traitement (aucun plafond
global), exactement la même philosophie que la décision du 30/08 pour le
reste de l'app — les trois écrans admin gèrent déjà leur propre largeur en
interne (`md:pl-20 lg:pl-56`, et pour `/admin/sources`/`/admin/signalements`,
leur propre `max-w-3xl` voulu). `LayoutWrapper` n'a plus besoin de
`usePathname` : redevenu un composant serveur.

- **Vérifié** : `tsc --noEmit` propre, `pnpm build` a régénéré les 966/966
  pages.
- **Vérifié à l'écran** (Chrome piloté, session de John,
  `elsass-dico-dev.theelsassisch.com`, 1440×900), après confirmation en
  direct que `max-w-6xl` n'apparaît plus nulle part dans le DOM déployé :
  `/admin` remplit maintenant toute la largeur, collé au rail, jusqu'au bord
  droit — plus de bande blanche ni de fond visible. `/admin/sources` et
  `/admin/signalements` gardent leur propre colonne centrée (`max-w-3xl`,
  un choix voulu de ces deux écrans, distinct du bug), mais désormais
  correctement centrée par rapport à l'espace réellement disponible après le
  rail, plutôt que par rapport au viewport entier.

## `dev` fusionné dans `main`, production sur la refonte (14/09/2026)

**PR #45** (`dev` → `main`), fast-forward propre, aucun commit divergent sur
`main` — fusionnée par commit de merge (`ec4aafa`) plutôt que par squash, pour
garder l'historique détaillé que ce fichier référence commit par commit depuis
le 11/09. `elsass-dico.theelsassisch.com` bascule ainsi de l'ancien site
(Supabase, table `entrees`) vers la refonte complète : carte des parlers,
Prisma, sessions `jose`, pages publiques village/prénom.

**Coolify `elsass-dico:main` ne s'est pas redéployé tout de suite** : juste
après la fusion, `get_application` rendait encore `exited:unhealthy` et un
`updated_at` du 13/09 — antérieur à cette session. Un nouveau contrôle un peu
plus tard a montré `status: running:unknown` et `updated_at` avancé au moment
du merge : le déploiement automatique a fini par partir, avec un décalage,
exactement le genre d'écart entre « ça vient d'être poussé » et « c'est
déployé » que John avait signalé plus tôt dans cette session à propos de
`dev`. `running:unknown` plutôt que `running:healthy` s'explique simplement :
`health_check_enabled` est à `false` sur cette application, Coolify ne sait
donc pas trancher — pas un signe de panne.

**Vérifié sur l'artefact réel, pas sur le seul statut Coolify** (`curl`,
depuis ce poste) : `/` → 200, titre « Elsass Dico — Traducteur
français-alsacien » (la nouvelle présentation publique du 13/09, pas
l'ancienne recherche) ; `/recherche` → 307 vers `/login`, la barrière d'auth
fonctionne ; `/village/colmar-68066` → 200, « Colmar — Kolmer » — la page a
donc bien pu lire la base **au build** (`generateStaticParams`), ce qui
suppose que `DATABASE_URL` était disponible comme Build Variable sur cette
application au moment du build, comme sur `dev` depuis le 13/09. **Non
confirmé avec John** : je n'ai aucun moyen de voir, via le MCP Coolify en
lecture seule, si c'est lui qui l'a réglée entre-temps ou si elle l'était
déjà — seul le résultat (le build a réussi) est observable d'ici.

**Non vérifié à l'écran** : ce contrôle s'est fait entièrement en `curl`,
sans navigateur — la session Chrome pilotée de John n'a pas été rouverte sur
le domaine de production dans cette session.

## Carte des parlers : les deux points restants du prototype traités (14/09/2026)

Reprise de l'étape 4 (doc 20). Le prototype `/carte` listait deux écarts avant
de pouvoir devenir l'écran final : les 819 villages envoyés d'un coup dans le
HTML de la page (127 Ko), et `couleurDe` prévu par `CarteParlers` mais jamais
branché. **Portée délibérément restreinte à ces deux points** — la carte reste
un écran « comment chaque village dit son propre nom » (les toponymes,
`Lemme.communeId`), pas encore « chercher un mot quelconque et voir où on le
dit » (qui suppose une requête par variante + témoignage, hors périmètre de
cette reprise, tranché explicitement avant d'écrire une ligne).

- `pointsCarteAction()` (`src/app/actions/carte.ts`) sort la requête Prisma de
  `page.tsx`, qui devient un composant serveur trivial. `CarteDemo` la charge
  désormais via `useListeMemorisee` (même hook que la pagination A-Z et
  `/dashboard`) — cache par clé publique (`cleCache("carte-parlers")`, sans
  segment d'identité, la donnée étant la même pour tout le monde), reprise
  automatique sur échec déjà écrite dans le hook, sans rien coder de neuf pour
  ça.
- `couleurDeForme()` (`src/lib/couleur-carte.ts`) : hash déterministe
  (djb2) vers une palette de 12 teintes. Déterministe et non `Math.random()` —
  la même forme doit rendre la même couleur à chaque rendu, y compris après
  une réhydratation.
- **Vérifié** : `tsc --noEmit` propre, `pnpm build` (aucun serveur dev en
  cours) a régénéré les 966/966 pages, seul l'EPERM symlink Windows connu
  suit.
- **Déploiement confirmé avec le même protocole que la session précédente** :
  poussé sur `dev`, attente de 240 s avant tout contrôle (leçon du retour de
  John plus haut dans ce fichier — ne pas vérifier un déploiement encore en
  vol), `updated_at` Coolify avancé (15:57:28 → 16:15:58) avant tout
  screenshot.
- **Vérifié à l'écran** (Chrome piloté, session de John,
  `elsass-dico-dev.theelsassisch.com/carte`) : 819 villages affichés, 1 353
  formes, points de couleurs distinctes (contre un champ rouge uniforme
  avant) ; clic sur un point → popup « Nàswil · Naswil — Natzwiller » ; filtre
  « kolmer » → 1 seul village affiché, le bon. Un 503 intermittent (VPS
  partagé, audit du 30/08/2026) est apparu sur l'appel de
  `pointsCarteAction()` pendant ce contrôle — absorbé sans rien à faire par la
  reprise déjà écrite dans `useListeMemorisee` le 14/09, la carte s'est quand
  même affichée au premier essai.
- Même incident Chrome que le reste du 14/09 rencontré une fois de plus au
  premier essai (`0.0.0.0:3000`), résolu de la même façon (fermer l'onglet, en
  rouvrir un neuf).

**Reste hors de cette reprise** : la recherche par mot quelconque (n'importe
quel lemme, pas seulement les toponymes) avec une couleur par variante et des
points agrégés par témoignage — la vraie cible finale de l'étape 4, décision
délibérée de John de la traiter comme un chantier séparé plutôt que de
l'attaquer dans la même reprise que les deux correctifs ci-dessus.

## Contribution : nouvelle variante sur un mot (15/09/2026)

Reprise de l'étape 5 (doc 20). Deux points restaient : « ça se dit autrement
chez moi » (nouvelle forme sur un mot) et éditer sa propre variante. **Le
premier est fait et vérifié à l'écran** ; le second reste ouvert.

- `creerVarianteAction(lemmeId, forme)` (`src/app/actions/variantes.ts`) crée
  la `Variante` **et** son `Temoignage` (membre + village) dans la même
  transaction — le doc dit « forme + village », pas deux gestes séparés, et
  une variante sans aucun témoin naîtrait à 0 source et 0 village. Verbatim
  (règle 1) : la forme est écrite telle que tapée, jamais recadrée vers
  l'ORTHAL — c'est un témoignage de locuteur, pas une transcription de source,
  donc `decomposerArticle()` ne s'applique pas ici (réservé à
  `culture_alsace`).
- **Même gate que le vote** (`votes.ts`) : village requis, relu en base à
  chaque appel plutôt que pris du cookie de session (30 min, pas
  resynchronisé au fil de l'eau).
- **Dédoublonné avant écriture** par `cleDeForme()` sur `(lemmeId, cleForme)`,
  plutôt que de laisser remonter l'erreur de contrainte d'unicité : si la
  forme existe déjà et n'est pas masquée, le message renvoie vers le bouton
  `+` plutôt que de créer un doublon. Si elle existe et **est** masquée, le
  message reste générique (« déjà connue de la base ») — ne jamais révéler
  qu'une forme a été modérée.
- `NouvelleVariante` (`src/app/entree/[id]/nouvelle-variante.tsx`) : même
  patron que `VoteVariante`, pas d'état optimiste, `router.refresh()` après
  succès pour que badge et liste reviennent à jour ensemble.
- **Vérifié en base avant déploiement** (script jetable, lecture seule) : la
  requête de dédoublonnage retrouve bien une clé existante et rend `null`
  pour une clé inventée. `tsc --noEmit` propre, `pnpm build` a régénéré les
  966/966 pages (seul l'EPERM symlink Windows connu suit).
- **Vérifié à l'écran, en conditions réelles** (Chrome piloté, session de
  John, `elsass-dico-dev.theelsassisch.com`, sur demande explicite avant
  d'écrire en base) : ajout de « zzz-test-a-supprimer-claude » sur « bonjour »
  → toast « Forme ajoutée », carte avec badge « 1 village », village
  Mundolsheim, bouton de vote déjà vert ; un second envoi de la même forme →
  toast de doublon exact, aucune carte en plus. La ligne de test a été
  supprimée juste après par un script direct en base (`Variante.delete`,
  cascade sur son `Temoignage`) — pas de fonction de retrait dans l'UI
  puisque « éditer/retirer sa propre variante » est le point suivant, non
  fait. Page rechargée : retour exact aux 4 formes d'avant, rien laissé en
  base.

## Étape 5 close : éditer sa propre variante (15/09/2026)

Dernier point de la contribution (doc 20, « Correction ») : « l'auteur édite
sa variante tant que personne d'autre ne l'a revendiquée ».

- `modifierVarianteAction()` (`src/app/actions/variantes.ts`) ferme l'édition
  dès qu'un **second témoignage** existe sur la variante — compté, pas un
  statut dédié (schema.prisma, point 4 de l'en-tête). L'auteur retire son
  propre `+` sans perdre le droit d'éditer : le compte retombe à 0 ou 1, les
  deux cas restent modifiables ; c'est un **deuxième** témoignage, de
  n'importe qui, qui verrouille.
- `chargerLemme()` calcule `modifiable` par une requête séparée
  (`Variante.findMany({ creeParId: membreId })` + `_count.temoignages`),
  jamais ajoutée à `chargerLemmeDetaille()` : ce chemin est partagé avec les
  fiches publiques `/village`/`/prenom`, sans session.
- **Vérifié par un test jetable en base** (Lemme/Variante/2 Temoignages
  disposables, supprimés après) : 1 témoignage → modifiable ; 2 → verrouillé.
  Le CHECK SQL n'oblige pas le 2e témoignage à venir d'un membre — un
  témoignage de source suffit pour la logique de comptage, donc le test n'a
  pas eu besoin d'un second compte réel (il n'y en a qu'un en base).
- **Vérifié à l'écran, en conditions réelles** (Chrome piloté, session de
  John) : création d'une variante de test → bouton « Modifier » présent →
  clic, changement de forme, Enregistrer → toast « Forme modifiée », carte mise
  à jour, bouton « Modifier » toujours là. Les formes issues de sources
  (`buschur`, etc.) n'affichent, elles, aucun bouton « Modifier » — confirme
  que le verrou tient aussi côté négatif. Ligne de test supprimée par script
  juste après, page rechargée : retour exact aux 4 formes d'origine.
- `tsc --noEmit` propre, `pnpm build` a régénéré les 966/966 pages (seul
  l'EPERM symlink Windows connu suit).

**Étape 5 (contribution) du doc 20 est close** : vote + retrait, choix du
village, nouvelle variante, édition — les quatre points sont faits et
vérifiés à l'écran.

## Étape 4 close : recherche d'un mot quelconque sur la carte (16/09/2026)

Dernier chantier ouvert du doc 20 (l'étape 4 s'était arrêtée le 14/09 aux deux
correctifs du prototype toponymes). Manquait la vraie cible : chercher
**n'importe quel lemme** — pas seulement un village — et voir ses variantes
aux communes qui les revendiquent, une couleur par variante.

- `pointsMotAction(lemmeId)` (`src/app/actions/carte.ts`) est **distincte** de
  `pointsCarteAction()`, et volontairement : celle-ci montre les 819 toponymes
  par leur PROPRE commune (`Lemme.communeId`) ; celle-là montre un lemme
  quelconque par les communes de ses TÉMOINS (`Temoignage.communeId`, un vote
  de locuteur) — deux canaux de données qui ne se recoupent pas. Un point par
  (variante, village), jamais un tableau de formes par point comme sur la
  carte par défaut : c'est ce qui permet à `couleurDeForme` déjà en place de
  colorer par variante sans rien changer à `CarteParlers` ni à
  `couleur-carte.ts`.
- **Les formes sans aucun témoin de village ne vont jamais sur la carte**
  (doc 20) : `formesSansLieu` les liste au-dessus, « Personne n'a encore dit
  d'où vient : … ». Si aucune variante n'a de témoin, la carte reste vide avec
  un message dédié plutôt qu'un cadre vide muet.
- `/carte` porte désormais deux champs distincts : « Chercher un mot du
  dictionnaire » (recherche plein texte via `rechercherAction`, bascule la
  carte sur le mot choisi) et « Filtrer les villages affichés » (le filtre
  local déjà en place, qui ne réduit que les 819 toponymes — masqué tant
  qu'un mot est actif, pour ne pas laisser deux mécanismes de filtre se
  chevaucher sur le même écran).
- **Mesuré en base avant d'écrire** : un seul témoignage locuteur réel porte
  un village à ce jour — « Mundelse » pour Mundolsheim, un vrai vote de John
  sur sa propre commune (pas un reste de test, vérifié par la valeur du
  lemme). Juste assez pour vérifier le chemin de bout en bout sans en
  fabriquer.
- `tsc --noEmit` propre, `pnpm build` a régénéré les 966/966 pages (seul
  l'EPERM symlink Windows connu suit).
- **Vérifié à l'écran** (Chrome piloté, `elsass-dico-dev.theelsassisch.com/carte`,
  déploiement confirmé par `updated_at` Coolify avancé avant tout contrôle) :
  recherche « Mundolsheim » → suggestion unique, sélection → « Carte de «
  Mundolsheim » », 1 point violet sur la commune, popup « Mundelse ·
  Mundolsheim », et « Mùndelse » (une graphie distincte, sans témoin) listée
  au-dessus comme forme sans lieu ; recherche « bonjour » → 0 point, les
  quatre formes connues (`buschur`, `güata Tàg`, `göte Tàij`, `grias di
  wohl`) toutes listées sans lieu, message « Aucun village n'a encore
  revendiqué une forme de « bonjour » » ; retour à la carte des villages →
  819 points, filtre local réapparu, état identique à avant la recherche.
- **Incident d'outillage sans rapport avec le code** : les clics simulés par
  l'automatisation Chrome sur le bouton de suggestion n'aboutissaient pas
  (aucun changement d'état après plusieurs tentatives, coordonnées et
  référence d'élément), alors que le même bouton cliqué par `element.click()`
  en JavaScript direct fonctionnait au premier essai — cohérent avec la leçon
  du 14/09 (« un test lancé trop tôt » côté outillage, pas un bug
  applicatif). Un clic réel au clavier/souris n'est pas concerné.

**Le doc 20 est maintenant entièrement fait** : les cinq étapes (dérivation,
session autonome, fiches publiques, admin, carte, contribution) sont toutes
vérifiées à l'écran. Restent hors périmètre du doc, notés comme tels depuis
le 12-13/09 : l'auto-inscription du portail Odoo, l'aire linguistique du 57,
et le gameplay.

## Bug trouvé : la carte, annoncée comme écran central, était un cul-de-sac (17/09/2026)

Retour direct de John : « la carte n'est jamais accessible alors que ça
devait être un point central de l'app », et « le dropdown de la recherche de
la carte passe derrière la carte et est donc inutilisable ». Les deux
défauts existaient depuis la création de `/carte` (14/09) et n'avaient
jamais été vus, parce que **chaque vérification à l'écran documentée dans ce
fichier (14/09, 16/09) s'est faite en tapant l'URL `/carte` directement** —
jamais par un clic dans la nav. La revue à l'écran prouvait que l'écran
fonctionnait, pas qu'on pouvait l'atteindre : deux propriétés différentes.

- **La carte n'était pas raccordée au shell applicatif.** `ONGLETS`
  (`src/components/app-nav-shell.tsx`) ne listait que
  recherche/dictionnaire/compte — `carte` n'existait ni dans `OngletRacine`
  ni dans le tableau. Pire : `src/app/carte/page.tsx` ne montait ni
  `<AppHeader>` ni `<AppNavShell>` du tout ; le commentaire du fichier disait
  encore *« il n'est pas l'écran final »*, resté vrai littéralement alors que
  l'étape 4 du doc 20 avait été déclarée close le 16/09. Corrigé : `carte`
  rejoint `OngletRacine`/`ONGLETS` (icône `Map` de lucide-react), et
  `CarteDemo` (`src/app/carte/carte-demo.tsx`) monte désormais
  `<AppHeader variant="root" actif="carte" titre="Carte des parlers" />`
  **à l'intérieur** du conteneur qui porte `md:pl-20 lg:pl-56` — pas avant
  lui, sous peine de reproduire exactement le bug du 14/09 (header
  recouvrant le rail sur desktop) que cette même session avait déjà corrigé
  ailleurs.
- **Le dropdown de suggestions passait sous la carte** parce que Leaflet pose
  des panes de contrôle jusqu'à `z-index: 1000` (`.leaflet-top`/
  `.leaflet-bottom`, les boutons +/-), et ni `<main>` ni le conteneur Leaflet
  lui-même ne créent de contexte d'empilement propre — le `z-10` du dropdown
  (`carte-demo.tsx`) se comparait donc directement à ces panes, dans le même
  contexte racine, et perdait. Corrigé en `z-[1001]`, au-dessus du plafond
  connu de Leaflet.
- **Vérifié** : `tsc --noEmit` propre, `pnpm build` a régénéré les 966/966
  pages (seul l'EPERM symlink Windows connu suit). Poussé sur `dev`
  (`72c8015`), déploiement confirmé par `updated_at` Coolify avancé avant
  tout contrôle.
- **Vérifié à l'écran, en conditions réelles** (Chrome piloté, session de
  John, `elsass-dico-dev.theelsassisch.com`) : « Carte » visible dans le
  rail à côté de Recherche/Dictionnaire/Mon espace, clic → `/carte` s'ouvre
  avec l'onglet actif en surbrillance, header et rail correctement placés
  (aucun recouvrement) ; saisie « bonjour » dans le champ de recherche → le
  dropdown de suggestions s'affiche **au-dessus** de la carte, lisible et
  cliquable ; clic sur une suggestion → bascule vers « Carte de « bonjour » »
  avec les quatre formes listées sans lieu, comme attendu.
- **Leçon distincte du bug lui-même** : une vérification à l'écran ne
  couvre que ce qu'elle exerce. Visiter une URL directement prouve que
  l'écran marche, jamais qu'on peut l'atteindre depuis le reste de l'app —
  il faut aussi cliquer depuis la nav, au moins une fois, pour un écran
  destiné à être une destination permanente.

### Un troisième bug de la même famille, trouvé aussitôt : la carte passait par-dessus le footer mobile

Retour de John dans la foulée du correctif ci-dessus : « la carte passe par
dessus le footer en mobile ». Même mécanisme que le dropdown, une couche
plus profonde : Leaflet pose ses panes internes (`.leaflet-overlay-pane`,
`.leaflet-marker-pane`, `.leaflet-top`/`.leaflet-bottom`…) avec des z-index
allant de 400 à 1000, **sans jamais les confiner dans son propre
conteneur** — ni `<main>`, ni la boîte `overflow-hidden` qui entoure la
carte ne créent de contexte d'empilement. Ces z-index se comparaient donc
directement au reste de la page dans le contexte racine : la barre
d'onglets mobile fixe (`AppNavShell`, `z-30`) perdait face au contenu de la
carte dès que leurs rectangles se chevauchaient à l'écran, quel que soit
l'ordre du DOM.

- **Corrigé à la racine plutôt qu'au symptôme** : `isolate` (CSS
  `isolation: isolate`) sur le conteneur Leaflet lui-même
  (`src/components/carte-parlers.tsx`), pas un z-index plus élevé sur
  chaque élément concurrent un par un. Toute la pile interne de Leaflet
  (jusqu'à 1000) reste désormais confinée dans son propre contexte
  d'empilement, quel que soit ce qui l'entoure — le correctif du dropdown
  (`z-[1001]`, plus haut) reste en place mais devient redondant : avec
  `isolate`, la carte ne fuit plus nulle part.
- **`tsc --noEmit` propre, `pnpm build` a régénéré les 966/966 pages** (seul
  l'EPERM symlink Windows connu suit). Poussé sur `dev` (`eb003de`).
- **Outillage** : `resize_window` (Chrome piloté) n'a eu aucun effet sur
  cette session — la fenêtre est restée bloquée à 1884×876 quelle que soit
  la taille demandée, contrairement aux sessions précédentes. Plutôt que de
  deviner, vérifié le mécanisme directement : la vraie barre d'onglets
  mobile existe déjà dans le DOM à toute largeur (juste masquée par
  `md:hidden`), donc forcée visible par script, puis la page scrollée pour
  que le rectangle de la carte chevauche géométriquement celui de la barre.
  `document.elementFromPoint()` au centre de la zone de chevauchement a
  rendu un lien de la barre de nav, pas un élément Leaflet — la barre gagne
  désormais, dans l'exact scénario qui produisait le bug. Vérification au
  mécanisme plutôt qu'à l'œil, faute d'un vrai viewport mobile disponible
  dans cette session ; à confirmer visuellement par John sur un téléphone
  réel ou un DevTools local.

## La recherche de mot sur la carte devient un écran de contribution, sans scroll (17/09/2026)

Troisième retour de John dans la même série. La recherche d'un mot sur
`/carte` était globale depuis le 16/09 (n'importe quel lemme, pas seulement
les toponymes), mais l'écran gardait trois réflexes hérités du prototype
villages : un texte de retour qui ne servait qu'à naviguer, un paragraphe
d'intro figé en haut, et une hauteur de carte fixe (`h-[70vh]`) qui
scrollait la page entière sur petit écran.

- **« ◀ Retour à la carte des villages » remplacé par un panneau de
  contribution.** `pointsMotAction()` (`src/app/actions/carte.ts`) expose
  désormais, pour chaque variante du mot actif, son `id`, son nombre de
  villages et si le membre courant l'a déjà votée (`VarianteMot`) — avant,
  seules des chaînes de formes sortaient, sans de quoi brancher un geste.
  Le panneau réutilise **tels quels** `VoteVariante` et `NouvelleVariante`
  (`src/app/entree/[id]/`), les mêmes composants que la fiche de mot,
  plutôt que d'en écrire une version dédiée à la carte.
- **`onSucces` optionnel ajouté aux deux composants**, par défaut
  `router.refresh()` (comportement d'origine, inchangé sur /entree/[id]) :
  la carte charge ses données par Server Action côté client
  (`useListeMemorisee`), pas par le rendu serveur de la page, donc
  `router.refresh()` n'y aurait rafraîchi qu'un composant serveur trivial —
  `rafraichirMot` (le `rafraichir()` du hook) est passé à la place.
  Aucun changement de comportement pour l'écran existant.
- **Le texte d'intro fixe est retiré**, remplacé par un bouton carré « ? »
  à droite de la barre de recherche, qui ouvre une modal (« Comment lire
  cette carte ») avec le mode d'emploi — écrit en position/rôle générique,
  jamais un chiffre figé (« 819 villages… ») qui se serait périmé au
  premier import.
- **Plus de scroll de page.** L'écran passe de `min-h-screen` (page qui
  défile) à `h-dvh flex flex-col overflow-hidden` (hauteur de viewport
  fixe) : la carte n'a plus de hauteur en `vh` mais `flex-1 min-h-0`, elle
  prend ce qui reste après le header, la barre de recherche, le panneau de
  contribution (s'il est ouvert) et le pied de page. Le panneau de
  contribution garde son propre défilement interne (`max-h-[32vh]
  overflow-y-auto`) : un mot à beaucoup de variantes doit faire défiler
  CE panneau, jamais repousser la carte hors de l'écran ni la page
  entière — `overflow-hidden` sur le conteneur racine est le filet de
  sécurité si jamais un budget de hauteur était mal calculé quelque part.
- **`tsc --noEmit` propre, `pnpm build` a régénéré les 966/966 pages**
  (seul l'EPERM symlink Windows connu suit). Poussé sur `dev` (`1ab29f4`).
- **Vérifié à l'écran, en conditions réelles** (Chrome piloté, session de
  John) : texte d'intro disparu, bouton « ? » à sa place, modal lisible
  par-dessus la carte ; recherche « bonjour » → panneau avec les quatre
  formes et leur bouton « + Chez moi aussi », formulaire « Ça se dit
  autrement chez moi ? » ; ajout d'une forme de test
  (« zzz-test-carte-a-supprimer ») → toast, puce avec vote déjà vert,
  point sur la carte, **rafraîchi sans recharger la page** (preuve que
  `onSucces`/`rafraichirMot` fonctionne réellement, pas seulement en
  théorie) ; forme supprimée juste après par script direct en base
  (`Variante.delete`, cascade sur son `Temoignage`) — page rechargée,
  retour exact aux 819 points d'avant. Toute la mise en page (recherche,
  panneau, carte, pied de page) a tenu dans un seul écran sans scroll à
  1568×682.

### Bug trouvé aussitôt : la barre de recherche décalée par rapport au bouton « ? »

Retour de John : la barre de recherche n'était pas alignée avec le bouton
« ? », visiblement décalée vers le bas. Cause : le conteneur portait
`space-y-1`, une classe qui ajoute une marge-top à chaque enfant suivant le
premier — sur la seule base de l'ordre des enfants dans le DOM, sans
regarder s'ils sont réellement dans le flux visuel. Le tout premier enfant
était le `<label htmlFor="carte-recherche-mot" className="sr-only">`
(nécessaire pour l'accessibilité du champ, jamais affiché) : `sr-only` le
rend `position: absolute` et le retire du flux, mais `space-y-1` lui
appliquait quand même sa règle, poussant la barre de recherche (le second
enfant, réellement affiché) de quelques pixels vers le bas — le bouton
« ? », lui, sans ce conteneur, restait à sa position d'origine.

- **Corrigé en retirant `space-y-1`** (`src/app/carte/carte-demo.tsx`) :
  inutile ici, un seul enfant du conteneur est réellement dans le flux.
  Leçon générale au-delà de cet écran : `space-y-*`/`gap` sur un conteneur
  qui mélange un label `sr-only` et du contenu visible peut créer ce même
  décalage fantôme — à vérifier si un futur écran combine les deux.
- **`tsc --noEmit` propre, `pnpm build`** a régénéré les 966/966 pages
  (seul l'EPERM symlink Windows connu suit). Poussé sur `dev` (`9ebee3c`).
- **Vérifié à l'écran** (Chrome piloté, `elsass-dico-dev.theelsassisch.com/carte`,
  déploiement confirmé par `updated_at` Coolify avancé avant tout
  contrôle) : capture zoomée sur la ligne barre de recherche + bouton —
  les deux éléments sont maintenant sur la même ligne, bords haut et bas
  alignés au pixel.

## `dev` refusionné dans `main` (17/09/2026)

**PR #46** (`dev` → `main`), fusionnée par commit de merge (`b7145b3`) —
même méthode que PR #45 du 14/09, pas de squash, pour garder l'historique
détaillé que ce fichier référence commit par commit. `main` était à 50
commits de retard, couvrant toute la session du 17/09 documentée
ci-dessus : la carte raccordée à la nav, l'isolation du contexte
d'empilement de Leaflet, la contribution directe sur la recherche de mot,
l'écran sans scroll, et les deux corrections d'alignement/z-index qui ont
suivi.

- Branches locales mises à jour (`main` fast-forward sur `origin/main`,
  retour sur `dev` pour la suite du travail).
- **Déploiement Coolify de `elsass-dico:main` confirmé** par `updated_at`
  avancé (16:03:51 → 19:16:43) après la fusion — même léger décalage entre
  « fusionné » et « déployé » que le 14/09, pas un signe de panne.
- **Vérifié sur l'artefact réel, en `curl`** (pas de session sur ce
  domaine dans cette session) : `/` → 200 (présentation publique) ;
  `/recherche`, `/dictionnaire`, `/carte` → 307 vers `/login` (barrière
  d'auth active, rien ne fuite) ; `/village/colmar-68066`, `/sources` →
  200. Aucune régression de routage détectée après la fusion.
- **Non vérifié à l'écran sur `elsass-dico.theelsassisch.com`** : le code
  fusionné est strictement identique à celui déjà vérifié à l'écran sur
  `dev` à chaque étape de cette session — le seul risque propre à la
  fusion était un problème de build/déploiement, écarté par le test de
  fumée ci-dessus.

## Home publique : vitrine de mots et recherche village/prénom (18/09/2026)

Retour de John sur l'auto-inscription (le bouton « Créer un compte » renvoie
déjà vers Odoo, volontairement sans lien de retour — Odoo sert de SSO à
d'autres projets, on n'y bricole rien) : la vraie question était la home non
connectée elle-même. Elle existait depuis le 13/09 (doc 20, étape 3) mais ne
montrait qu'un argumentaire et deux boutons — jamais un seul mot alsacien. Un
visiteur qui arrivait dessus ne voyait rien du dico, seulement qu'il devait se
connecter.

- **Deux ajouts, choisis pour rester dans la doctrine « compte obligatoire »**
  du doc 20 plutôt que de l'entamer : une vitrine statique et une recherche
  interactive, toutes deux **sans session**.
- **Vitrine** (`motsVitrineAction()`, `src/app/actions/accueil.ts`) : dix mots
  de base de tout cours de débutant (bonjour, bonsoir, au revoir, merci,
  pardon, oui, non, ami, maison, famille), choisis après une mesure en base
  (script jetable, lecture seule) plutôt que devinés — certains candidats
  évidents (« s'il vous plaît », « bienvenue », « village ») n'existent pas
  encore dans la base et ont été écartés, pas inventés. Identifiés par
  `(cle, contexte, type)` — la clé naturelle `@@unique` du schéma — plutôt que
  par UUID, qui ne survit pas à une redérivation complète (leçon du 12/09).
  Les formes affichées viennent de la base à chaque appel ; rien n'est codé en
  dur (règle 1).
- **Recherche** (`rechercherAccueilAction()`, même fichier) : restreinte aux
  deux collections déjà publiques sans compte (communes avec forme attestée →
  `/village/[slug]`, prénoms attestés → `/prenom/[slug]`) — jamais le
  dictionnaire entier, qui reste derrière `/recherche` et le login. Chaque
  suggestion mène donc à une vraie fiche, jamais à un mur de connexion
  surprise. Requête SQL brute avec `immutable_unaccent` + `similarity`, même
  patron que `rechercherAction()` (migration `unaccent`/`pg_trgm` du 13/09) —
  vérifiée en base dans les deux sens (« sélestat » et « sélestat » trouvent
  tous deux Sélestat).
- **Les cartes de la vitrine ne sont pas des liens.** `/entree/[id]` est
  authentifié ; en faire des liens aurait renvoyé un clic vers `/login` sans
  contexte — exactement le défaut que cet écran corrige. La vitrine se
  contente de montrer, la recherche est le seul chemin interactif.
- **Composant client** (`src/app/recherche-accueil.tsx`) : même patron
  debounce 250 ms + `useListeMemorisee`/`cleCache` que la recherche de mot sur
  `/carte` (16/09) — repris tel quel plutôt que réinventé.
- **Vérifié** : `tsc --noEmit` propre, `pnpm build` a régénéré les 966/966
  pages (seul l'EPERM symlink Windows connu suit). Poussé sur `dev`
  (`191cfbc`), déploiement confirmé par `updated_at` Coolify avancé
  (19:16:43 → 16:05:54) avant tout contrôle.
- **Vérifié à l'écran** (Chrome piloté, `elsass-dico-dev.theelsassisch.com/`) :
  la vitrine affiche ses dix mots avec formes réelles et badges de confiance
  (« buschur · 2 sources », etc.) ; recherche « colmar » → suggestion
  « Colmar · Haut-Rhin » → clic → `/village/colmar-68066` en 200, sans aucune
  redirection vers `/login`.

### Refonte UI/UX de la home, retrait de l'argument ORTHAL (18/09/2026)

Deuxième retour de John le même jour, sur la version qui vient d'être livrée :
le pitch disait encore « en graphie ORTHAL », périmé depuis le 11/09
(« ORTHAL devient secondaire comme arbitre », plus de forme canonique) — et
les deux boutons `Se connecter`/`Créer un compte`, empilés pleine largeur
juste sous la vitrine, « font tache et désordonné ». Passé par le skill
`impeccable` (mode Persuade, refinement — le contenu et les fonctions
restent, seule la présentation change).

- **Copie réécrite** autour de ce que le produit vend réellement : aucune
  forme n'est « la bonne », chaque village garde la sienne. Nouveau titre
  (« Le français-alsacien, village par village. ») et nouveau sous-texte, sans
  aucune mention d'ORTHAL — la graphie reste documentée dans
  `documentation/orthal/` pour qui construit le dico, elle n'a plus à figurer
  dans l'argumentaire d'un visiteur.
- **Hiérarchie Persuade** : un seul bouton plein (« Créer un compte », l'action
  de croissance) plutôt que deux boutons de poids égal. « Se connecter »
  redescend en lien discret dans une barre du haut, pour qui revient déjà
  équipé d'un compte — il n'a plus besoin de rivaliser visuellement.
- **Rythme de page** : la recherche et la vitrine passent chacune dans leur
  propre section avec un vrai titre (`<h2>`), la recherche encadrée d'un
  panneau `bg-neutre-50` pour la distinguer du reste — plutôt que tout
  empiler sur fond blanc uniforme, la source du « désordre » signalé.
- **Détecteur mécanique impeccable** (`impeccable detect --json`) : aucun
  défaut relevé sur les deux fichiers touchés.
- **Vérifié** : `tsc --noEmit` propre, `pnpm build` a régénéré les 966/966
  pages (seul l'EPERM symlink Windows connu suit). Poussé sur `dev`
  (`bb33ea0`), déploiement confirmé par `updated_at` Coolify avancé
  (16:05:54 → 19:51:29).
- **Vérifié à l'écran** (Chrome piloté, `elsass-dico-dev.theelsassisch.com/`,
  desktop) : plus aucune mention d'ORTHAL ; un seul bouton plein visible,
  « Se connecter » en lien discret en haut à droite ; recherche « ambroise »
  → suggestion « Ambroise », anneau de focus doré visible. **Non vérifié en
  vrai viewport mobile** : `resize_window` (Chrome piloté) n'a eu aucun effet
  cette session, même défaut d'outillage que le 17/09 — la mise en page
  mobile (grille 2 colonnes, boutons pleine largeur) repose sur les mêmes
  classes Tailwind responsive déjà éprouvées ailleurs dans l'app, mais reste
  à confirmer par John sur un téléphone réel.

## Correction d'attribution : culture_alsace n'est pas de Raymond Matzen (18/09/2026)

Signalement de John, recherche web fournie à l'appui : le champ `nom` de la
source `culture_alsace` (le scrape de culture.alsace.pagesperso-orange.fr,
7260 entrées) créditait « Raymond Matzen », confondu avec l'universitaire
strasbourgeois du même nom (1921-2014, auteur de dictionnaires imprimés —
proverbes, gros mots alsaciens — sans aucun lien avec ce site). Le vrai
auteur est **André Nisslé** : la page d'accueil du site archivé
(elsassisch.eu) crédite elle-même ce dictionnaire comme « S elsassischa
Wärterbüach (André Nisslé) », confirmé par un reportage France Bleu Alsace de
2015 titré « le dictionnaire alsacien d'André Nisslé ».

- **Grep du dépôt entier** : une seule occurrence réelle
  (`data/sources/culture_alsace.json`, champ `nom`) — le seul autre résultat
  (« Matzenheim », une commune du 67) est un faux positif. Aucune mention
  dans le code, les migrations, la doc ou une page « à propos ».
- **Pas de champ `auteur` dédié sur le modèle `Source`** (`prisma/schema.prisma`) :
  l'attribution vit dans le texte libre du champ `nom`
  (« Culture Alsace (site de X et contributeurs) »), affiché tel quel sur
  `/sources` et `/admin/sources`. C'est bien le « libellé affiché » que la
  correction devait viser, pas un identifiant technique — `code:
  "culture_alsace"` n'a pas bougé, aucune référence dans `attestations` ou
  `temoignages` n'est affectée.
- **Corriger le JSON ne suffisait pas** : `scripts/importer-data.mts` est
  idempotent par `code` et ne réécrit jamais un `Source` déjà présent en base
  (`if (existante) { ...; continue }`) — un simple commit du fichier n'aurait
  rien changé à l'écran tant qu'un réimport complet n'a pas lieu. Corrigé
  aussi par une mise à jour directe du champ `nom` en base (script jetable,
  supprimé après usage), sur le même principe que les autres corrections
  ponctuelles de cette session.
- **`dev` et `main` partagent la même base** : la mise à jour en base a donc
  corrigé l'affichage sur les deux domaines en un seul geste, vérifié en
  `curl` sur `elsass-dico-dev.theelsassisch.com/sources` **et**
  `elsass-dico.theelsassisch.com/sources`. Le fichier JSON, lui, ne vit pour
  l'instant que sur `dev` — il rejoindra `main` à la prochaine fusion, sans
  urgence puisqu'il ne pilote qu'un futur réimport, jamais l'écran actuel.
- Une note de traçabilité a été ajoutée directement dans le champ `notes` du
  JSON (avec les deux preuves ci-dessus), pour qu'une relecture future ne
  réintroduise pas « Matzen » sans revérifier.

**Deuxième retour de John, même jour** : le nom disait encore « site d'André
Nisslé **et contributeurs** », alors que Nisslé est décédé (un article France
Bleu ultérieur, sur la réédition papier de son « Lehrstuwa », le nomme « le
regretté André Nisslé » — date de décès non trouvée). Vérifié avant de
corriger : la balise META `Author` de la page archivée (elsassisch.eu) ne
nomme qu'André Nisslé, aucun contributeur — « et contributeurs » n'était donc
pas seulement daté (site non maintenu, déjà noté), il affirmait quelque chose
que la source elle-même ne dit pas. Retiré du `nom`
(→ « Culture Alsace (site d'André Nisslé) ») dans le JSON et en base, même
mécanisme que la correction précédente.

## Clôture de session (18/09/2026)

Neuf commits sur `dev` depuis la dernière fusion (PR #46, 17/09), pas encore
proposés à `main` : la home publique enrichie (vitrine + recherche
village/prénom), sa refonte UI/UX, et les deux correctifs d'attribution
`culture_alsace`. Tout est vérifié à l'écran ou sur l'artefact déployé (cf.
sections ci-dessus), rien n'est laissé à moitié fait — mais le code de
`elsass-dico.theelsassisch.com` ne reflète pas encore la nouvelle home, à la
différence des deux correctifs d'attribution (déjà visibles sur `main`
puisqu'ils touchaient la base, partagée entre les deux applications
Coolify, et non le code).

État exact : `git log origin/main..origin/dev --oneline` liste `191cfbc` →
`fde9eeb`. Aucun commit ne divergeait sur `main`, donc une PR future s'y
fusionnerait par fast-forward ou simple merge commit, comme les PR #45 et
#46. Reste hors du périmètre de cette session, comme documenté depuis le
12-13/09 : auto-inscription Odoo, aire linguistique du 57, gameplay.

**Fusionné dans la foulée, sur demande de John** : PR #47 (`dev` → `main`),
fusionnée par commit de merge (`ec6167b`) — même méthode que les PR #45/#46.
Déploiement Coolify de `elsass-dico:main` confirmé par `updated_at` avancé
(19:16:43 → 22:21:54). **Vérifié sur l'artefact réel** (`curl`) : `/` → 200
et sert la nouvelle home (« village par village », vitrine, recherche) ;
`/recherche` → 307 vers `/login` (barrière d'auth intacte) ;
`/village/colmar-68066` → 200 ; `/sources` affiche « Culture Alsace (site
d'André Nisslé) ». `main` et `dev` sont maintenant alignés.

## Revue qualité thermo-nucléaire du code applicatif (19/09/2026)

Première revue de ce type sur ce projet, demandée hors de tout chantier de
fonctionnalité — audit de l'ensemble du code applicatif (~6000 lignes hors
Prisma généré et composants shadcn vendus), pas d'un diff. Verdict global :
base disciplinée, aucune régression structurelle trouvée. Trois findings
mineurs, tous corrigés :

- **Motif garde-admin dupliqué 3×** (`admin/page.tsx`, `admin/sources/page.tsx`,
  `admin/signalements/page.tsx`) : `estAdmin` + clé de cache + toast d'erreur +
  repli `[]`, recopié à l'identique sur les trois écrans. Extrait dans
  `src/hooks/use-liste-admin.ts` — même seuil que celui déjà appliqué à
  `CarteVariante` le 13/09 (« trois écrans l'affichent, ce qui justifie
  l'extraction »).
- **Ternaire département** dans `entree/[id]/page.tsx` réinventant
  `LIBELLES_DEPARTEMENT`, déjà importé dans le même fichier et déjà réutilisé
  par `village/[slug]/page.tsx`. Remplacé par une relecture de la table.
- **`.find()` linéaire évitable** dans `scripts/deriver.mts` (complétion des
  articles au rejeu) : une Map indexée par la même clé existait déjà juste
  au-dessus pour un besoin voisin (résolution d'id des témoignages), mais ne
  portait que l'`id` — la boucle de complétion refaisait un balayage linéaire
  de ~41 600 lignes pour chacune des ~8 886 lignes à article. Fusionné en une
  seule Map portant l'enregistrement complet.

**Un deuxième passage a revu la correction elle-même** (auto-relecture, avant
tout commit) : `useListeAdmin()` tel qu'écrit au premier jet était générique
sur la forme brute de chaque action (`R extends {succes:true}|{succes:false}`),
ce qui forçait deux paramètres de type explicites à chaque appel et un cast
interne (`as Extract<R,...>`) — TypeScript ne *narrow* pas un paramètre
générique contraint à une union comme il narrow une union concrète. Corrigé en
contractualisant le hook sur une forme uniforme `{succes:true; liste:T[]} |
{succes:false; erreur}` : chaque écran normalise le champ propre à son action
(`membres`/`sources`/`signalements` → `liste`) dans un adaptateur inline d'une
ligne, le hook n'a plus qu'un seul paramètre de type et aucun cast. Leçon
générale : une revue de qualité doit se retourner sur son propre correctif
avant de le considérer clos, pas seulement sur le code d'origine.

**Vérifié aux deux passages** : `pnpm run typecheck` (app + scripts, deux
`tsconfig` distincts) et `pnpm build` (966/966 pages) propres, seul l'EPERM
symlink Windows connu suit.

Commité (`5ffe53d`) et poussé sur `dev`, puis fusionné dans `main` sur demande
de John : **PR #48**, commit de merge `182dd49` — même méthode que les PR
#45-47. **Déploiement Coolify non confirmé à la clôture** : `updated_at` de
`elsass-dico:main` relu juste après la fusion (03:29:28Z) affichait encore
01:37:10Z, donc antérieur au merge — contrairement aux fusions précédentes, le
redéploiement automatique n'était pas encore parti au moment de vérifier. Un
`curl` sur `/`, `/admin` et `/village/colmar-68066` a rendu les codes attendus
(200/307/200), mais ça ne distingue pas l'ancien code du nouveau : ces trois
changements sont des refactors purs, sans aucun effet observable côté écran.
**À confirmer à la prochaine session** : que `elsass-dico:main` a bien
redéployé depuis, en relisant `updated_at` avant tout autre contrôle.

## Audit technique, XSS corrigée, dix points d'accessibilité/performance, trois retours UX (21-22/09/2026)

Première revue `/impeccable audit` sur ce projet. Détecteur mécanique
(`impeccable detect`) : zéro finding sur tout `src/`. Le reste vient d'une
lecture manuelle, dimension par dimension, avec vérification directe dans le
code de chaque affirmation avant de la retenir.

### P0 trouvé : injection HTML stockée dans le popup de `/carte`

`src/components/carte-parlers.tsx:101` construisait le contenu du popup
Leaflet par interpolation de chaîne à partir de `Variante.forme` — un champ
enregistré **verbatim** (règle 1, jamais recadré) par `creerVarianteAction`,
sans filtrage de caractères au-delà d'une limite de longueur. N'importe quel
membre pouvait donc soumettre une forme du type `<img src=x
onerror=...>`, exécutée dans le navigateur de tout visiteur ouvrant ce
popup — vol de session possible. Seul endroit de toute l'app à construire du
HTML à la main : partout ailleurs le contenu passe par du JSX, échappé
automatiquement par React.

**Corrigé** en construisant le contenu comme de vrais nœuds DOM
(`document.createElement`/`textContent`), jamais comme une chaîne — Leaflet
`bindPopup` accepte un `HTMLElement` directement, donc aucune dépendance
d'échappement à écrire. **Vérifié par exploitation réelle** : une variante de
test portant `<img src=x onerror="window.__xss_ok=true">` insérée
directement en base (script jetable), popup affichant la charge en texte
littéral, `window.__xss_ok` resté `false`, aucun élément `<img>` créé dans le
DOM. Donnée de test supprimée aussitôt après (deux fois : une fois avant le
déploiement du correctif par prudence, une fois après vérification finale) —
le code vulnérable restait en ligne pendant l'attente du déploiement, la
fenêtre d'exposition a été traitée comme un vrai risque, pas un détail de
procédure.

### Dix points restants (5 P1, 4 P2, 1 P3), hors attribution de police Azimut

Fil conducteur : le projet a **deux familles de primitives shadcn/Radix déjà
installées et vendues** dans `src/components/ui/` mais **jamais utilisées**
— `dialog.tsx` (`@radix-ui/react-dialog`) et `command.tsx`+`popover.tsx`
(`cmdk`+`@radix-ui/react-popover`). Trois dropdowns de suggestions faits main
(`recherche-accueil.tsx`, `carte-demo.tsx`, `village-profil.tsx`) et la
modale d'aide de la carte ont été remplacés par ces primitives plutôt que de
coder un focus-trap ou une logique ARIA combobox à la main.

- **Contraste** : `text-neutre-400` (≈2,6:1, sous le seuil AA) remplacé par
  `text-muted-foreground` (≈5,4:1) dans 13 fichiers, 36 occurrences.
- **Labels non liés** sur `/entree/[id]/signaler` (`htmlFor`/`id` posés).
- **Perf carte** : le filtre local (« Filtrer les villages affichés »)
  recalculait `filtres` à chaque frappe, forçant `CarteParlers` à détruire et
  reconstruire toute la carte Leaflet (nouveau `fetch` du topojson inclus) à
  chaque caractère. Débattu 250ms, même patron que la recherche de mot
  déjà en place dans le même fichier. **Vérifié par instrumentation
  réseau** (patch de `window.fetch` injecté en console) : 6 frappes rapides
  ne déclenchent plus qu'un seul rechargement, 250ms après la dernière.
- **Meta-description** de `layout.tsx` alignée sur la home (retrait de la
  mention ORTHAL, périmée depuis le 18/09).
- **`aria-current`** sur la lettre active de l'alphabet A-Z ; **cibles
  tactiles** agrandies (puces A-Z 32→36px, bouton de vote 32→36px, boutons ×
  de la carte 24→32px) ; **tableaux admin** dégradés sous `md` (colonnes
  secondaires masquées plutôt que simple `overflow-x-auto`) ;
  **`prefers-reduced-motion`** ralentit spinner/squelette au lieu de les
  figer à `0.01ms` (le kill total aurait supprimé le signal « chargement en
  cours » sans rien y substituer).

**Bug trouvé en vérifiant à l'écran, corrigé dans la foulée** : le premier
passage posait un `id`/`htmlFor` manuel sur chaque `CommandInput` — cmdk
génère son propre id interne (nécessaire à son câblage
`aria-controls`/`aria-activedescendant`) et **ignore silencieusement** un
`id` externe. Les trois labels se sont retrouvés orphelins, pointant vers un
id que l'input réel ne portait plus. Corrigé en utilisant la prop `label` de
`<Command>`, le mécanisme prévu par cmdk lui-même pour un libellé accessible
non affiché — trouvé en lisant `node_modules/cmdk/dist/index.d.ts` plutôt que
deviné. Leçon : un id/label posé à la main sur un composant tiers qui gère
déjà sa propre accessibilité interne peut se faire silencieusement écraser ;
vérifier l'API du composant avant de reproduire un patron qui marche ailleurs
dans le même fichier.

**Vérifié à l'écran, point par point** (Chrome piloté, `dev` déployé) :
rendu visuel identique aux 3 dropdowns et à la modale ; navigation clavier
(flèches, Entrée, Échap) fonctionnelle sur les 3 combobox, capacité neuve
absente avant ; focus trap et **restauration du focus sur le bouton « ? » à
la fermeture** de la modale (gain réel, l'implémentation manuelle ne le
faisait pas) ; clic extérieur ferme sans effacer le texte tapé.

**Hors périmètre**, sur décision de John : l'attribution de la police
Azimut (licence CC BY-ND 4.0 jamais créditée nulle part) — il en prépare une
nouvelle et gère ce point séparément.

### Trois retours UX après usage réel

1. **« Ton village » (Mon espace)** : le texte décrivait le mécanisme sans
   jamais dire qu'il faut choisir son village pour pouvoir y rattacher des
   formes. Reformulé pour dire l'action d'abord, puis pourquoi.
2. **Carte** : retaper un mot dans le champ de recherche pendant qu'un mot
   est déjà affiché ne rouvrait jamais les suggestions
   (`popoverMotOuvert` exigeait `!motActif`, jamais remis à `null` par la
   frappe) — il fallait cliquer le bouton × d'abord. Corrigé en vidant
   `motActif` dès la première frappe, comme le bouton × le fait déjà.
3. **Pages publiques `/village/[slug]` et `/prenom/[slug]`** : aucun header,
   aucun moyen de revenir en arrière, qu'on y arrive depuis la recherche de
   la home ou directement par un lien externe (Google, partage). Ajout
   d'`AppHeader` en mode empilé avec `backHref="/"` fixe, même patron que
   `/login` — pas `retourHistorique`, puisque ces fiches sont aussi bien
   atteintes sans historique interne que depuis la home.

**Retour de John pendant la rédaction du texte du point 1** : jamais de
tiret long (« — ») dans la copie affichée à l'écran, indépendamment de sa
justesse grammaticale — reformulé en deux phrases courtes.

**Vérifié à l'écran** (Chrome piloté, `dev` déployé) : nouvelle phrase
affichée ; recherche « bonjour » puis, sans cliquer ×, « salaire » directement
dans le même champ — les nouvelles suggestions apparaissent et la sélection
fonctionne ; `/village/colmar-68066` et `/prenom/ambroise` affichent un
chevron retour fonctionnel.

**Quatre commits sur `dev`** : `4528880` (XSS), `1ad616f` (dix points),
`7bbd1e7` (correctif label cmdk), `b4aedcb` (trois retours UX). `pnpm run
typecheck` et `pnpm run build` (966/966 pages) propres après chaque groupe,
pas seulement en fin de session.

## Deuxième revue thermo-nucléaire, appliquée (23/09/2026)

Revue du lot audit/XSS/UX du 21-22/09 (`4528880` → `b4aedcb`). Verdict : ce
lot soignait des symptômes à trois endroits là où une cause unique existait.
Tout est appliqué dans `5585055`.

- **La carte ne se reconstruit plus.** `CarteParlers` avait un seul effet
  `[points, couleurDe]` qui créait la carte, rechargeait le fond et remettait
  le cadrage sur toute l'Alsace à chaque changement de points. Le débounce du
  filtre, ajouté le 21/09, espaçait les reconstructions sans en supprimer la
  cause. Et un membre zoomé sur son coin perdait sa vue **à chaque vote**
  (`rafraichirMot` → nouveaux points). Désormais : un effet `[]` crée la carte
  et le fond une fois, un `L.layerGroup()` porte les marqueurs, un second effet
  les repose. Le débounce du filtre disparaît, et la carte reste montée pendant
  les chargements (indicateur superposé au lieu de `<Cadre>`).
- **`ChampSuggestions`** (`src/components/champ-suggestions.tsx`) remplace les
  trois combobox recopiées (home, carte, Mon espace) et leurs trois modèles
  d'ouverture. **`ui/command.tsx` revient à sa version shadcn d'origine** : les
  props `wrapperClassName`/`showIcon` n'existaient que pour être désactivées
  par leurs trois seuls appelants. Au passage : cliquer dans son propre champ
  ne referme plus la liste, les champs de la carte et du village ont enfin un
  anneau de focus, et un chargement affiche « Chargement… » plutôt
  qu'« Aucun résultat. ».
- **Bug réel trouvé en vérifiant : Entrée ne faisait rien sur la home.** Les
  suggestions étaient des `<Link>` en `asChild` sans `onSelect`, or cmdk ne
  déclenche que `onSelect` à l'Entrée. Confirmé sur la production (ancien
  code) : suggestion « Colmar » sélectionnée, Entrée, on reste sur `/`. Sur
  `dev` : `/village/colmar-68066`. Le choix passe maintenant par
  `router.push`.
- **Piège d'outillage** : la touche « Return » du navigateur intégré n'arrive
  pas comme `Enter` à cmdk. Le premier test de la production, fait avec elle,
  ne prouvait donc rien. Refait avec un vrai `KeyboardEvent` `key: "Enter"`
  sur les deux déploiements avant de conclure.
- **`useRequeteDebattue`** (`src/hooks/`) remplace quatre débounces recopiés
  (carte, home, `/recherche`). Le vidage est immédiat, seul l'envoi attend.
- **`CarteDemo` découpé** : `AideCarte` (un `Dialog` non contrôlé posé à côté
  de son bouton : `DialogContent` passe déjà par un portail, englober tout
  l'écran n'avait aucune raison d'être) et `PanneauContribution`.
- **`FichePublique`** habille village, prénom et désormais `/sources`, qui
  n'avait aucun chevron retour. `cn()` factorise les puces A-Z et le bouton de
  vote, dont la base avait dû être modifiée trois fois le 21/09.

**Vérifié** : `pnpm run typecheck` propre, `pnpm build` 966/966 (seul l'EPERM
symlink Windows connu suit). **À l'écran**, Chrome piloté avec la session de
John sur `dev` : zoom deux fois, filtre « heim » → 223 points, **même
conteneur Leaflet (marqué avant le filtre), même translation, un seul
chargement du topojson** ; recherche « bonjour » → liste au-dessus de la
carte, clic → panneau des quatre formes ; vote sur « buschur » → 1 point à
Mundolsheim, cadrage intact, puis vote retiré (retour à 0, rien laissé en
base) ; × → retour aux 223 villages filtrés ; « ? » → modale, Échap, focus
rendu au bouton. Mon espace : liste ouverte au focus, reclic dans le champ →
toujours ouverte, « mundol » + Entrée → « Mundolsheim (67) » choisi, puis
Annuler (aucune écriture).

**Resté ouvert, noté sans être corrigé** : les fiches publiques (et `/login`,
depuis plus longtemps) portent deux `<h1>`, celui de l'en-tête empilé et celui
de la page. L'en-tête empilé est le seul titre des écrans admin, donc on ne
peut pas le rétrograder partout. Il faudrait soit une prop dédiée, soit
retirer le grand titre de la page : c'est une décision de mise en page, pas un
correctif.

## PRODUCT.md et passe de copie (23/09/2026)

`/impeccable init` a produit `PRODUCT.md` avec John. Ce fichier résume pour
le travail de design et renvoie au doc 20 et à ce fichier, qui font foi.
Trois réponses de John y sont consignées : le membre construit et situe son
propre parler (les sources écrites sont le socle, plus la seule vérité) ;
**l'alsacien unifié reste le but final**, la carte en est la matière
première ; tutoiement partout et jamais de tiret long à l'écran. Deux points
restent **ouverts** : qui tranche entre apprenant et locuteur, et comment un
standard sera tiré de la carte.

`/impeccable clarify` a appliqué cette voix dans la foulée (PR #51,
`37181a5`) : plus aucun « — » dans le texte affiché ni dans les titres
d'onglet, tutoiement des trois messages de connexion qui vouvoyaient, une
consigne de reprise sur chaque échec d'enregistrement, et des descriptions
de fiches qui citent toutes les formes au lieu d'un « nom alsacien » au
singulier. Vérifié sur le HTML servi : zéro tiret long sur les pages
publiques.

**Tranché par John le même jour** : « Recoupé à partir de sources écrites
et de témoignages de locuteurs », qui décrivait la doctrine d'avant le 11/09,
devient « Tiré de sources écrites et des Alsaciens qui le parlent » (home et
meta-description). **Reste ouvert** : « En continuant, tu acceptes nos
conditions » sur `/login` ne renvoie à rien, The Elsassisch n'a pas encore de
CGU (seulement mentions légales, CGV, retours, cookies). John a créé la page, commune à toutes les apps.

### CGU publiées, `/login` relié (23/09/2026)

Texte rédigé avec John et publié sur https://www.theelsassisch.com/cgu (vue
Odoo `ir.ui.view` 6479, bloc « Texte »), vouvoiement comme les autres pages
légales du site. Trois choix de John : **licence non exclusive** sur les
contributions ; **contributions gardées sous forme anonyme** à la suppression
d'un compte ; **aucune gestion de l'âge** (une phrase renvoie l'accord
parental des moins de 15 ans à l'utilisateur, l'éditeur ne vérifie rien).
`/login` relie « conditions générales d'utilisation » à cette page
(`URL_CGU`, `src/lib/odoo.ts`).

**Écart à combler avant la première demande de suppression** : les CGU
promettent l'anonymisation, mais le code efface encore les témoignages d'un
membre en cascade (`Temoignage.membre`, `onDelete: Cascade`), et le CHECK
`chk_temoignage_source_ou_locuteur` exige un membre pour un témoignage de
locuteur. Aucune suppression n'est possible depuis l'app aujourd'hui (elle
passe par un email), donc rien ne casse, mais la migration doit précéder la
première demande. **Décidé par John : « on fera la modif de la DB après ».**

### Anonymisation faite (24/09/2026)

Écart comblé le lendemain, à la demande de John. Migration
`20260924120000_anonymiser_temoignages` : la clé étrangère témoignage → membre
passe de `CASCADE` à `SET NULL`, et `chk_temoignage_source_ou_locuteur`
reconnaît un témoignage parlé à sa **commune**, avec ou sans membre (sans =
un membre parti). Les variantes créées étaient déjà en `SET NULL` ; les
signalements restent en `CASCADE` (messages à motif libre, pas des
contributions au dictionnaire).

- **Suppression sur demande** : `scripts/supprimer-membre.mts <email>`, à
  blanc par défaut, `--confirmer` pour écrire. Transaction qui annule tout si
  un seul témoignage disparaît au lieu d'être anonymisé ; refuse de supprimer
  le dernier admin. **Le compte Odoo reste à supprimer à la main**, sinon la
  personne peut se reconnecter et un membre vierge est recréé. Sa session en
  cours (30 min au plus) n'est pas révoquée, mais toute écriture relit le
  membre en base et échoue.
- `scripts/verifier-derivation.mts` compte les témoignages parlés par
  `commune_id`, plus par `membre_id`.
- **Vérifié sur la base réelle** : migration appliquée au démarrage du
  conteneur `dev` (base partagée avec `main`, changement compatible avec le
  code déjà en production) ; `confdeltype = 'n'` ; test dans une transaction
  annulée (membre créé, témoignage, membre supprimé → témoignage gardé,
  `membre_id` nul, village intact, rien d'écrit) ; `verifier-derivation`
  entièrement vert (42 135 écrits, 1 parlé, 0 hybride) ; le script de
  suppression à blanc refuse bien le seul membre, dernier admin.

## Un seul titre par page, A-Z complet, le locuteur prioritaire (24/09/2026)

- **Plus de `<h1>` dans l'en-tête** (décision de John) : les fiches village et
  prénom, `/sources` et `/login` en portaient deux, celui de l'en-tête empilé
  et celui de la page. Le titre de l'en-tête est désormais un `<span>`, comme
  la variante racine l'a toujours été. Conséquence acceptée : les écrans
  admin et « Signaler » n'ont plus de `<h1>`, comme la carte ou le
  dictionnaire (ils ne sont pas indexés). Vérifié sur l'HTML servi par `dev` :
  un seul `<h1>` par page publique.
- **L'A-Z ignore la ponctuation de tête.** `(espèce de) tordu`, le seul lemme
  injoignable (mesuré en base), se range maintenant sous E. La lettre, le tri
  et le saut « Aller à un mot » passent tous par la même expression
  (`cleParcours()`, `src/app/actions/navigation.ts`) : si l'un s'en écartait,
  le saut tomberait sur une page qui n'affiche pas le mot. Vérifié en faisant
  tourner les vraies actions contre la base : page 12 de E, entre `espèce` et
  `espérance`, et `cytise`/`bricoler`/`ça` tombent toujours juste.
- **Le locuteur est l'utilisateur prioritaire** (décision de John) : priorité à
  sauvegarder et accumuler les parlers. Remplace l'apprenant du 02/09.
- **L'unification ne s'impose pas** (décision de John) : elle doit se faire
  naturellement et dans le temps, aucune méthode viable n'amène aujourd'hui des
  locuteurs à trancher. **Se préparer techniquement, ne rien imposer.** Piste
  notée dans Odoo 883, pas engagée : un vote retiré supprime son
  `Temoignage`, donc on perd la trace d'un village qui change de forme.
- **Consigné dans Odoo 882 et 883**, qui font foi depuis leur réécriture du
  même jour (l'exception du doc 20 est close, cf. `documentation/README.md`),
  puis dans `PRODUCT.md`.

## Préparation technique de l'unification : le journal des contributions (24/09/2026)

Suite directe de la décision du même jour (« se préparer techniquement, ne rien
imposer »). Plan validé par John, commit `0fb1eef`. Deux trous comblés, **rien
ne change à l'écran** et les compteurs restent calculés sur `Temoignage`.

- **L'historique se perdait.** Retirer un vote supprimait le témoignage,
  modifier une forme l'écrasait. Or un village qui quitte une forme pour une
  autre est le signal même d'une convergence. Table `evenements_contribution`
  (migration `20260924180000_journal_contributions`), en ajout seul : `pose`,
  `retrait`, `creation`, `modification`, écrits **dans la même transaction**
  que le geste (`votes.ts`, `variantes.ts`). `temoignageId` sans clé étrangère
  apparie une pose et son retrait ; `communeId` est le village au moment du
  geste ; `membreId` en SET NULL comme les témoignages. Un CHECK fixe la forme
  de chaque type. Rattrapage : la seule pose existante (Mundelse).
  **Journal plutôt qu'une colonne `retireLe`** sur les témoignages : celle-ci
  aurait obligé à filtrer chaque requête de comptage, et en oublier une aurait
  gonflé un compteur en silence.
- **Les contributions ne vivaient qu'en base**, en contradiction avec « la
  source de vérité est le dépôt » (12/09) : une reconstruction à neuf les
  aurait effacées. `scripts/exporter-contributions.mts` écrit
  `data/contributions/journal.jsonl` (clés naturelles, **aucun membre, dates
  au jour**, le dépôt est public) ; `scripts/importer-contributions.mts` le
  rejoue après `deriver.mts`, idempotent. **À lancer à chaque clôture de
  session qui a vu des contributions**, et avant toute opération lourde sur la
  base.
- `supprimer-membre.mts` contrôle aussi que le journal est anonymisé.
- **Vérifié** : migration validée d'abord dans une transaction annulée sur la
  vraie base, puis appliquée au démarrage du conteneur `dev`. À l'écran (session
  de John) : vote et retrait sur `buschur`, création puis modification d'une
  forme de test, six événements exacts. Reconstruction : forme de test
  supprimée en base puis recréée par l'importeur (forme actuelle, témoignage
  actif anonyme, trois événements, le vote retiré non recréé), second rejeu
  sans effet. Tout le test nettoyé ensuite (1 événement, 1 témoignage parlé,
  4 formes pour « bonjour »). `verifier-derivation` entièrement vert.
- **Fusionné dans `main` (PR #56)** : la migration était déjà dans la base
  partagée, la fusion fait journaliser aussi les gestes de la production.
- **Sauvegardes Coolify quotidiennes** (`0 3 * * *`, réglées par John), et
  **une restauration vérifiée** : la sauvegarde du jour restaurée dans une base
  VIDE (Postgres 18 jetable dans Docker, `pg_restore --exit-on-error`, code 0)
  est identique à la production table par table (nombre de lignes et empreinte
  md5 du contenu des 11 tables, extensions, 31 contraintes).
  **Piège rencontré** : un premier essai de John a restauré DANS la
  production (port 5444, ce poste n'a pas de Postgres local). Sans dégât, parce
  que tout existait déjà et que chaque `COPY` a échoué dès sa première ligne,
  mais sans rien prouver non plus. Avec `--clean`, le même geste aurait d'abord
  supprimé les tables. **Une restauration de test se fait toujours dans une
  base vide, jamais vers la production.**
- **Pas de mesure de convergence** tant qu'il n'y a pas de données : un seul
  témoignage réel à ce jour.

## Premier parcours du membre, et le faux « bug Chrome » (24/09/2026)

`/impeccable onboard`, suite de la décision « le locuteur est prioritaire ». Un
nouveau membre arrivait dans « Mon espace » devant deux compteurs à zéro et un
choix de village sans suite ; le refus « choisis d'abord ton village » était
une impasse partout ailleurs.

- **« Mon espace » devient un parcours en deux gestes** tant que le membre n'a
  rien fait (`src/app/dashboard/premiers-pas.tsx`) : choisir son village, puis
  reconnaître une forme de *bonjour*, *merci* ou *au revoir*
  (`premiersMotsAction()`, clés naturelles, formes lues en base). Chaque clic
  est un vrai vote. Le premier affiche « *märsi* se dit maintenant à
  Mundolsheim » et ouvre **`/carte?mot=<id>`**, nouveau lien direct vers la
  carte d'un mot. Décidé d'après les données, une fois par visite (le parcours
  ne disparaît pas sous les yeux au moment de la réussite), rien de stocké.
  `?premiers-pas` le force : le seul compte de la base a déjà contribué.
- **Le refus « village requis » porte un bouton** « Choisir mon village »
  (`REFUS_VILLAGE_REQUIS`, `signalerEchecContribution()`), sur la fiche et sur
  la carte.
- **Vérifié à l'écran** (session de John, `dev`) : parcours affiché, vote sur
  *märsi* → étape cochée, message de réussite, « Voir sur la carte » → carte de
  *merci* avec 1 point à Mundolsheim ; rendu 375 px vérifié dans un cadre de
  cette largeur (`resize_window` inerte). Vote retiré et ses deux événements
  effacés du journal ensuite. **Non vérifié** : l'étape 1 à vide (le seul
  compte a déjà un village), qui réutilise `VillageProfil` tel quel.

### « L'onglet Chrome qui dérive vers 0.0.0.0:3000 » était notre bug

Noté cinq fois depuis le 14/09 comme incident propre au navigateur, contourné
en ouvrant un onglet neuf. C'était `/api/session/refresh` : il redirigeait par
`new URL(chemin, request.url)`, et derrière le proxy de Coolify, `request.url`
d'une route vaut l'adresse d'écoute interne. Prouvé en `curl -I` sur le site
servi (`Location: https://0.0.0.0:3000/login`). **Tous les membres étaient
touchés** au premier chargement après 30 min d'inactivité ; le nouveau cookie
était quand même posé, d'où l'onglet neuf qui « réglait » tout. Corrigé par une
redirection relative (`0bddf8c`), vérifié servi par `dev` (`Location: /login`).
Le middleware, lui, n'a pas ce défaut : Next y reconstruit l'URL publique.
**En production le 24/09 (PR #57, avec le premier parcours)** : la sonde est
passée de `Location: https://0.0.0.0:3000/login` à `Location: /login` trois
minutes après la fusion, sans régression sur `/`, `/recherche` et une fiche
village. Parcours réel vérifié avec la session de John : le renouvellement
dépose sur `elsass-dico.theelsassisch.com/dashboard`. Reste à constater en
usage : plus de page d'erreur au retour après 30 min.
**Leçon** : un « caprice » qui revient à chaque première visite se reproduit en
`curl -I` avant d'être classé incident.

## Clôture de session (24/09/2026)

Quatre PR fusionnées dans la journée (#55 à #58), **`main` et `dev` identiques
à la clôture**, tout constaté en production. Livré : un seul `<h1>` par page et
un A-Z complet ; les décisions de John (le locuteur est prioritaire,
l'unification émerge sans s'imposer), consignées dans Odoo 882/883 et
`PRODUCT.md` ; le journal des contributions et son export ; les sauvegardes
quotidiennes, restauration vérifiée ; le premier parcours du membre ; le
correctif de session `0.0.0.0:3000`.

- **Export des contributions** relancé à la clôture : inchangé (1 événement,
  la pose Mundelse). Les seuls votes du jour étaient des tests, effacés.
- **Base à la clôture** : 25 864 lemmes, 41 646 variantes, 42 136 témoignages
  (dont 1 parlé), 1 membre, 1 événement au journal.
- **Reste à constater par John** : plus de page d'erreur au premier chargement
  après 30 min d'inactivité.
- **Ouvert** : faire venir des locuteurs (la priorité) ; mesure de
  convergence quand il y aura des données ; auto-inscription Odoo, aire du 57,
  gameplay, attribution Azimut (John).

## Le jeu « Quel village dit ça ? » (25/09/2026)

Premier gameplay, cadré avec John par `/impeccable shape` (brief en mémoire,
`gameplay-quel-village-dit-ca`). On montre **toutes** les formes attestées d'un
village, le membre le retrouve parmi quatre voisins. Pas de nom de jeu (un
onglet « Jeu »), pas de marque dans le partage, **membres seulement** : le jeu
attire par ce que les membres partagent, le résultat renvoie vers la home.

- **Défi du jour** (5 manches, le même pour tous, déduit de la date par un
  générateur à graine, rien de stocké pour le tirer) et **partie libre**. Défi
  n° 1 = le 25/09/2026 (`LANCEMENT`, `src/lib/jeu.ts`).
- **Difficulté mesurée, pas devinée.** Distance d'édition entre le nom français
  et la forme la plus proche, après normalisation. Sous 0,2 le village est
  écarté (`Lembach` ← `Lämbàch`, `Hœrdt`, `Colmar` ← `Colmer`) : **539
  jouables sur 819**, cinq tranches de 97 à 124, une manche par tranche. Une
  première version en trigrammes (pg_trgm) a été **démentie à l'écran** : elle
  laissait `Herdt` et classait `Süfflum` parmi les plus durs.
- **Distracteurs** : voisins attestés à 15 km (13 au minimum, mesuré), sans
  aucune forme commune avec la réponse ni même nom — 21 formes sont partagées
  (`Arelse` = deux Ernolsheim), deux Bouxwiller existent.
- **La réponse ne quitte le serveur qu'après la réponse du membre**
  (`repondreAction`). Table `parties_jeu` (migration `20260925120000_jeu`) :
  unicité (membre, jour), CHECK « seul le défi porte une date », cascade à la
  suppression d'un membre (ses parties, pas des contributions).
- **Fin de partie** : « et chez toi, on dit comment ? » sur un mot de base
  (`src/lib/mots-de-base.ts`, sorti de `accueil.ts`), facultatif, jamais compté.
- Les 3 transcriptions phonétiques entre crochets sont écartées du jeu
  seulement ; elles restent sur la fiche.
- **Trouvé en passant** : `neutre-200` n'existe pas dans les tokens, une classe
  qui ne peint rien. Corrigé dans le jeu ; reste utilisé au survol d'un bouton
  de `/admin/signalements`, non touché.
- **Vérifié** : tirage rejoué contre la base (97 jours sans répétition ni
  distracteur ambigu, même résultat à chaque appel), migration rejouée dans une
  transaction annulée, `typecheck`, `build` 967/967. À l'écran (session de John,
  `dev`) : onglet et invitation de « Mon espace », une partie libre complète au
  clavier (1 à 4, Entrée), révélation avec sources et carte, bilan et mot de fin,
  et le rendu 375 px (cadre, `resize_window` inerte). La révélation remonte
  seule dans la vue sur téléphone, où elle tombait sous le pli.
  **Le défi du jour n'a pas été joué**, pour laisser le n° 1 à John ; une partie
  libre de test reste dans ses parties.
- **En production le 25/09 (PR #60, `ec47815`)** : `main` redéployé trois
  minutes après la fusion (`updated_at` 23:46:24). Constaté à l'écran sur
  `elsass-dico.theelsassisch.com/jeu` : John avait déjà joué le défi n° 1
  (5 sur 5), ce qui valide aussi les deux états que Claude n'avait pas pu
  exercer, le défi terminé et la série (« 1 jour de suite »).
- **Titre global « Le défi du jour »** (décision de John, même soir) : le jeu
  accueillera d'autres types de manches (mots, prénoms), et « Quel village dit
  ça ? » n'en décrit qu'un. Il reste la consigne de ce type ; le titre de
  l'écran et le partage (« Le défi du jour n° 12 · 4/5 ») deviennent communs.

## Point ouvert fermé : apprenant et locuteur ne sont pas deux profils (25/09/2026)

`PRODUCT.md` listait depuis le 23/09 un point ouvert : « qui tranche entre
apprenant et locuteur ». **Tranché par John : il n'y en a qu'un.** Le membre
qui découvre l'alsacien et celui qui le parle depuis toujours ont les mêmes
droits et les mêmes possibilités, rien ne les sépare côté produit — ce
n'était jamais une question d'arbitrer entre deux catégories, il n'y en a
qu'une. Remplace la formulation du 24/09/2026 (« le locuteur est
prioritaire »), qui laissait entendre une hiérarchie entre deux profils
distincts ; elle-même remplaçait la désignation de l'apprenant / du curieux
du 02/09/2026. `PRODUCT.md` (§ Users) mis à jour dans la foulée.

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
