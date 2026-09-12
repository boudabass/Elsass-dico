# 21 — Reprise du chantier en local

> Écrit le 12/09/2026 pour reprendre la refonte décrite dans
> `20-REFONTE-CARTE-DES-PARLERS.md` depuis Claude Code en local, là où la base,
> le `.env.local` et le réseau sont accessibles.

## Où on en est

| | État |
|---|---|
| Vision et décisions | ✅ tranchées — `20-REFONTE-CARTE-DES-PARLERS.md` |
| Référentiel des communes | ✅ fait — `data/communes/` |
| Schéma Prisma | ✅ fait le 12/09 — `prisma/schema.prisma`, migration `20260912120000_init` |
| Mesure du marqueur a~e | ✅ faite le 12/09, **résultat positif** — `22-MESURE-MARQUEUR-AE.md` |
| Script de dérivation | ✅ fait le 12/09 — `scripts/deriver.mts` |
| **Base de production chargée** | ✅ **fait le 12/09**, 11 contrôles passent |
| Fond de carte autonome | ✅ fait le 12/09 — `public/carte/contours.topojson` |
| Prototype de carte | ✅ `/carte` et `/sources`, **à juger à l'écran** |
| **Auth autonome, Supabase dehors** | ✅ **fait le 13/09** — étape 2 |
| Le reste (écrans, carte, contribution) | ⬜ étapes 3 à 5 |

**La base Postgres de Coolify contient le dictionnaire dérivé.** Supabase est
intact et reste la base de l'app actuelle, mais plus rien ne le lit : la chaîne
reconstruit tout depuis le dépôt.

Contrôle à l'arrivée, avec une connexion neuve — ce que le dictionnaire rend
aujourd'hui pour les mots qui servaient d'exemple à son échec :

```
bonjour → buschur / güata Tàg / göte Tàij / grias di wohl
merci   → märsi
salaire → Lohn          (et non « d'r lohn » : l'article est décomposé)
Colmar  → Kolmer / Colmer   (48.10987, 7.38477)
```

« Un visiteur tapant *bonjour* ne trouve rien » était le constat qui revenait
depuis le 02/09. Il rend quatre formes, sans qu'aucune décision humaine n'ait
été prise.

### Accès à la base de production

`DATABASE_URL` est dans `.env.local`. La base
(`l11x6p591gah952rrbbgl24o`, `postgres:18-alpine`) a été **exposée
publiquement sur le port 5444** le temps du chargement. **Cet accès doit être
refermé** : l'utilisateur est `postgres` et la base est sur l'Internet ouvert
tant qu'il est actif. Coolify le referme d'ailleurs seul au bout d'une heure
(`public_port_timeout` = 3 600 s), ce qui explique un chargement qui échouerait
soudain sur un timeout.

L'app, elle, n'en a pas besoin : elle passe par l'URL interne, et les migrations
s'appliquent au démarrage du conteneur.

## La chaîne, dans l'ordre

```bash
# 1. Une base de test locale (Docker), si l'on veut refaire le parcours
docker run -d --name elsass-pg -e POSTGRES_PASSWORD=… \
    -e POSTGRES_DB=elsass_dico -p 55432:5432 postgres:18
export DATABASE_URL="postgresql://postgres:…@localhost:55432/elsass_dico"

pnpm exec prisma migrate deploy          # le schéma
pnpm exec tsx scripts/seed-communes.mts  # 1 605 communes

# Les 390 coquilles connues : elles ne vivent dans aucun JSONL, on les
# régénère en rejouant le parseur du studio sur les pages archivées.
python scripts/mesures/anomalies_culture_alsace.py --sortie /tmp/anomalies.json

pnpm exec tsx scripts/importer-data.mts --anomalies /tmp/anomalies.json
pnpm exec tsx scripts/deriver.mts             # -> Lemme / Variante / Temoignage
pnpm exec tsx scripts/verifier-derivation.mts # contrôles relus EN BASE
```

Les scripts sont **idempotents** et **n'effacent jamais rien**. Le dernier sort
un code 1 si un contrôle échoue.

### La source de vérité est le dépôt, plus la base (décision du 12/09/2026)

`importer-data.mts` lit les **JSONL des parseurs versionnés** sur la branche
`data`, et non plus Supabase. Motif : la base portait quatre mois de purges, de
réingestions et de colonnes ajoutées au fil de l'arbitrage ; le dépôt porte ce
que les parseurs ont extrait des sources, et le contrat `data/README.md` exige
qu'un rejeu produise un `git diff` vide.

Une seule altération décisionnelle s'était glissée dans les JSONL — 349
contextes de `wiktionnaire_fr` recopiés de `culture_alsace` pour que l'ancienne
file d'arbitrage fasse se rencontrer les candidats. **Annulée par la PR #44.**

Trois choses vivaient en base et pas dans les JSONL ; elles sont reconstruites
par du code, jamais réinventées :

| | où | contrôle |
|---|---|---|
| décomposition de l'article | `scripts/lib/article.mts` | 8 886 — le chiffre exact de la migration SQL du 03/09 |
| 390 coquilles connues | `scripts/mesures/anomalies_culture_alsace.py` | 390, même répartition 323/37/30 |
| fiches de sources écartées | `importer-data.mts` | `elsadico`, `freelang_alsacien`, `runneburger_benfeld` non créées |

### Ce que la dérivation produit, mesuré le 12/09/2026

| | |
|---|---:|
| attestations | 27 179 — *le total exact de Supabase* |
| lemmes | 25 864 |
| variantes | 41 646 |
| témoignages | 42 135 |
| communes ayant une fiche | 819 / 1 605 |
| variantes à article décomposé | 8 884 |
| témoignages portant une aire déclarée | 17 392 |
| témoignages sans aucun lieu | 24 743 |

Les 8 884 diffèrent des 8 886 attestations décomposées : deux attestations
peuvent écrire la même forme et ne font alors qu'une variante. Ce chiffre a
d'ailleurs révélé un défaut — voir plus bas.

**Un toponyme EST une commune** : le lemme est indexé par sa commune, plus par
(français, contexte). `Roeschwoog` de `culture_alsace` et `Rœschwoog` du
wiktionnaire portent donc leurs deux formes sur la même fiche de village —
c'est ce qui rend la recontextualisation définitivement inutile, le département
venant du référentiel INSEE et non du contexte d'une source recopié sur une
autre.

### Le défaut que seul le double chargement a montré

Entre la base locale et la production : **8 882 variantes à article ici,
8 881 là-bas**, mêmes données et même code. La dérivation lisait les attestations
par `id`, or les UUID sont tirés au hasard à l'import — quand deux attestations
écrivent la même forme, celle qui créait la variante changeait d'un chargement à
l'autre, et avec elle la présence de l'article décomposé.

Un écart d'une unité qu'on pouvait mettre sur le compte du bruit. C'était une
faille de « rejouable = même résultat », qui ne tenait que tant qu'on ne
rechargeait pas l'archive. Corrigé sur deux plans, le second rendant le premier
non critique : ordre de lecture stable (code de source, français, alsacien,
contexte), et **à forme égale la variante porteuse de l'article l'emporte** — ce
qui ne dépend plus d'aucun ordre. Le chiffre stable est 8 884, vérifié en
reconstruisant une base entièrement neuve aux UUID tous différents.

**Deux bases valent mieux qu'une.** Sans le double chargement, le défaut restait
invisible : c'est « recompter en base » appliqué à deux bases.

Ces 24 743 sont la dette de données qui devient le moteur de contribution :
« personne n'a encore dit d'où ça vient ».

### Ce qu'elle ne rattache pas, et pourquoi — tranché le 12/09/2026

**249 noms de toponymes ne joignent aucune commune, et on s'en tient là.**
Décision de John : *« partir de ce qui existe maintenant en évitant de
complexifier, se référer aux sources officielles »*. La source officielle est le
référentiel INSEE des communes **actuelles**, et c'est lui qui fait foi.

Mesuré avant de trancher, pour savoir ce qu'on laisse :

| cas | noms | exemple |
|---|---:|---|
| commune **fusionnée** depuis la source | 57 | `Auenheim` → Rountzenheim-Auenheim (2016) |
| **nom différent** de l'officiel | ~dizaines | `Ballbronn`/Balbronn, `Bergbiden`/Bergbieten |
| ville **étrangère** | ~10 | `Berlin`, `Moscou`, `Zurich` |
| hameau ou lieu-dit | le reste | `Achbach`, `Brechlingen` |

Les 57 fusionnées étaient récupérables mécaniquement (les communes déléguées
sont dans `@etalab/decoupage-administratif`), mais les faire entrer supposait de
décider quoi afficher pour un village qui n'est plus une commune — deux points
au même endroit, ou des coordonnées à retrouver. **Complexité refusée.** 819
communes portent une forme attestée, c'est la carte de départ.

Les noms mal orthographiés par la source de 2006 ne sont **pas** rapprochés
automatiquement : entre `Bergbiden` et `Bergbieten` il n'y a qu'une lettre, mais
une règle qui tolère une lettre finirait par rattacher un village au mauvais
voisin sans que rien ne le signale.

**2 restent ambigus** (`Bouxwiller`, `Buhl` avec le contexte
« Alsace ; Géographie ») : sans département, rien ne tranche entre les deux
communes homonymes. Le doute se signale, il ne se comble pas.

## La carte, tranchée le 12/09/2026

**Aucun service extérieur.** Décision de John : *« il faut notre propre carte,
le projet ne doit dépendre d'aucun outil extérieur »*. Une carte à tuiles demande
son fond à un serveur tiers à chaque consultation ; le jour où il change ses URL,
plafonne ou tombe, la carte est vide.

Deux fonds ont été instruits puis écartés le même jour — les tuiles
d'OpenStreetMap (dont la politique prévoit un blocage « sans préavis ») et la
Géoplateforme de l'IGN (meilleure : tuiles hors plafonnement, testée à 200 sans
clé, mais service tiers quand même).

Une distinction a permis de ne pas tout réécrire :

| | exemple | statut |
|---|---|---|
| **service** externe | tuiles IGN / OSM | écarté — répond à chaque consultation, hors de notre contrôle |
| **bibliothèque** | Leaflet | gardée — du code dans notre bundle, qui ne rappelle personne |
| **données** | contours des communes | gardées — téléchargées une fois, versionnées, à nous |

Le fond est `public/carte/contours.topojson` : **401 Ko, ~97 Ko compressés**,
chargés une fois. Une seule tuile en pèse 34, et une carte à tuiles en recharge à
chaque déplacement — l'autonomie est ici plus légère que la dépendance.

Vérifié **sur l'artefact servi**, pas sur la source : aucun chunk de `/carte` ne
contient `geopf.fr`, `tile.openstreetmap`, `mapbox`, `maptiler` ni `cartocdn`, et
la page ne demande que des ressources locales.

**L'attribution a quitté la carte, pas le projet.** Le bandeau « contours : IGN
Admin Express » encombrait l'écran central ; le texte de la Licence Ouverte
demande la source et son millésime **sans imposer d'emplacement** — il accepte
même un simple renvoi par URL. La mention vit donc sur `/sources`. Elle n'est pas
facultative : c'est la seule contrepartie d'une licence qui donne par ailleurs
l'usage commercial, mondial, illimité et gratuit, et le projet a écarté trois
sources lexicales sur cette même question en campagne 5.

## L'étape 2, faite le 13/09/2026 : session autonome

**Le middleware ne fait plus aucun appel réseau.** Il en faisait un par requête,
visiteur anonyme compris (`supabase.auth.getUser()`), plus un `select profiles`
sur `/admin` — sur un VPS sans limite CPU ni rate limiting (audit du 30/08), un
robot d'indexation suffisait à amplifier la charge. Il vérifie désormais une
signature, localement.

### Deux jetons, et pourquoi le second ne porte pas le rôle

| | durée | contenu |
| --- | --- | --- |
| `ed_session` | 30 min | identité **et rôle** — c'est lui que le middleware lit |
| `ed_refresh` | 30 jours | l'identifiant du membre, **rien d'autre** |

Le rôle est délibérément absent du jeton long : recopié de renouvellement en
renouvellement, une promotion faite dans `/admin` n'atteindrait jamais un membre
déjà connecté. Il est donc **relu en base** à chaque renouvellement, par
`/api/session/refresh` — une requête par demi-heure et par membre actif, contre
une par page vue auparavant.

Trois points qui ne sont pas des détails :

- **`SESSION_SECRET` absente fait échouer bruyamment**, au lieu de déconnecter
  tout le monde en silence. Avaler l'erreur aurait reproduit le mode de panne qui
  a coûté trois incidents à ce projet : le site répond 200 alors que rien ne va.
- **Une revendication `typ` signée** empêche un jeton de renouvellement de servir
  de jeton de session : sans rôle dedans, il serait lu « membre » — une
  rétrogradation silencieuse, ou pire dans l'autre sens.
- **`?suite=` est validé** dans la route de renouvellement. Sans ce contrôle,
  elle serait une redirection ouverte portant notre domaine.

La vraie barrière d'administration reste serveur : `adminExige()` relit le rôle
en base. Le middleware n'est qu'un confort de navigation — c'est ce qu'il a
toujours été, et il faut continuer de le lire ainsi.

### Le premier admin s'amorce à la main

    pnpm exec tsx scripts/promouvoir-admin.mts <email>

Le membre doit s'être **connecté une fois** (c'est la connexion qui le crée). Un
`ADMIN_EMAIL` d'environnement aurait rendu quelqu'un admin par configuration,
donc silencieusement et de façon réversible au prochain déploiement. Le script
refuse par ailleurs de retirer le dernier administrateur.

### Ce qui est parti avec Supabase

`/admin/arbitrage`, `/contributions`, leurs actions, les cinq fabriques de
clients, `set-password`, `/auth/confirm`, `/api/auth/me`, et de
`dictionnaire.ts` tout ce qui servait l'arbitrage. Trois gestes d'administration
disparaissent aussi, et aucun n'est à réintroduire :

- **inviter** et **générer un lien de réinitialisation** — Odoo est l'autorité
  sur les comptes et les mots de passe, et il n'y a pas de SMTP côté dico ;
- **supprimer un membre** — ses témoignages sont en cascade : l'effacer
  effacerait des villages que personne d'autre ne porte. « On masque, on ne
  supprime pas. »

Les trois rôles deviennent deux, `membre` et `admin` : le rôle intermédiaire
n'avait de sens que tant que contribuer demandait une habilitation.

### Les écrans de lecture passent sur Prisma

Ils lisaient les 338 entrées arbitrées ; ils lisent les **25 864 lemmes**. La
fiche de mot perd la couronne « Canonique » — il n'y a plus de forme canonique —
et montre pour **chaque** forme ses sources écrites et ses villages, dans deux
blocs distincts. `BadgeConfiance` rend deux pastilles et jamais un total :
additionner des sources et des villages est exactement le bug trouvé en
production le 09/09.

Migration `20260912140000_recherche` : `unaccent`, `pg_trgm` et leurs index GIN.
`unaccent` vit dans la **recherche** — chercher « epreuve » trouve « épreuve » —
et jamais dans une clé d'identité, où il fusionnait `sur`/`sûr` et `ville`/`Villé`
(corrigé le 24/08).

### Mesuré sur la base réelle, puis sur l'artefact produit

`scripts/mesures/recherche.mts` exécute la requête exacte de `rechercherAction()` :

| terme | résultat |
| --- | --- |
| `bonjour` | `buschur` [2 sources] · `göte Tàij` · `grias di wohl` · `güata Tàg` |
| `salaire` | `Lohn`, et non `d'r lohn` |
| `epreuve` | trouve `épreuve` — l'accent ne bloque plus |
| `Milhüsa` | Mulhouse, **7 formes** — le sens alsacien → français marche |

Puis sur le bundle servi, pas sur la source : **le middleware compilé ne contient
ni `supabase`, ni `@prisma`, ni `pg`** — seulement `HS256` et `SESSION_SECRET`.
Et sans cookie, `/` et `/dictionnaire` répondent 307 vers `/login` quand `/login`
et `/sources` répondent 200.

**Deux choses vues au passage, et laissées telles quelles.** Un lemme sur 25 864
est injoignable par le parcours A-Z : `(espèce de) tordu`, dont le français
commence par une parenthèse — verbatim de la source (règle 1), et la recherche le
trouve. Et certaines lettres dépassent le plafond de 200 (C : 3 006, P : 2 622) :
l'écran **affiche** « 200 premiers sur 3 006 » plutôt que de laisser lire une page
comme un total.

## Ce qui reste

1. **Refermer l'accès public de la base** (cf. plus haut) s'il ne s'est pas
   refermé seul.
2. **Poser `SESSION_SECRET` dans Coolify** (runtime, jamais une Build Variable) —
   32 caractères minimum, sinon l'app refuse de démarrer une session. Et retirer
   les deux Build Variables `NEXT_PUBLIC_SUPABASE_*`, qui n'ont plus d'effet :
   les laisser ferait croire qu'elles en ont.
3. **Se connecter une fois**, puis lancer `scripts/promouvoir-admin.mts`.
4. **Juger à l'écran** — le prototype de carte, et les écrans refaits à l'étape 2.
   Non vérifiés visuellement, deux sessions de suite : Chrome force `https://` sur
   le serveur de dev, qui est en HTTP, et `next dev --experimental-https` bute sur
   l'élévation de privilèges que mkcert demande. Le contrôle s'est donc fait en
   `curl` sur le HTML rendu et sur le bundle produit.
5. Les étapes 3 à 5 du doc 20 (écrans publics, carte, contribution).

## Reprendre

Tout est sur `dev`. `.env.local` porte `DATABASE_URL`, `SESSION_SECRET` et les
variables Odoo — **les variables Supabase n'y servent plus à rien** et peuvent
partir.

Les quatre premiers pas de ce document — mesure du marqueur, schéma Prisma,
script de dérivation, auth autonome — **sont faits**. Le suivant est l'étape 3 du
doc 20 : les écrans publics générés statiquement (`/village/[slug]`,
`/prenom/[slug]`), dont le filtre doit être **serveur** — une barrière qui vit
dans le navigateur n'en est pas une.

## Ce que la session distante a appris, pour ne pas le refaire

**Claude Code sur le web tourne dans un conteneur isolé et éphémère.** Il reçoit un
clone frais du dépôt GitHub, et rien d'autre :

- `.env*` est gitignoré, donc **le `.env.local` n'y arrive jamais** — pas d'accès à
  Supabase, pas de mesure en base, pas d'ingestion.
- Le réseau sortant est **bridé** : npm, PyPI et GitHub passent, les API publiques
  non (`geo.api.gouv.fr` répond 403 via le proxy).
- Le disque local (`C:\...`) est invisible depuis le conteneur.

**Ne jamais commiter `.env.local` pour contourner ça.** Il contient la clé
`service_role`, qui court-circuite toute la RLS en lecture et en écriture ; commitée,
elle resterait dans l'historique git de façon permanente et il faudrait la révoquer.
Si une session distante a besoin de la base, la voie est les **variables
d'environnement de l'environnement** (réglages sur claude.ai/code), jamais le dépôt.

**Conclusion pratique** : tout ce qui touche à la base, aux données ou au réseau se
fait **en local**. Une session distante reste utile pour ce qui ne dépend que du
dépôt — lecture de code, conception, documentation, et des données récupérables via
npm ou git (c'est ainsi que le référentiel des communes a été produit).

## Le référentiel des communes, en deux mots

`data/communes/communes.json` — 1 605 communes (514 Bas-Rhin, 366 Haut-Rhin,
725 Moselle), toutes avec un point de placement, aucune sans coordonnées.

Identité administrative depuis `@etalab/decoupage-administratif` (INSEE), point
calculé comme centroïde d'aire du plus grand polygone des contours IGN. Contrôlé sur
repères connus : Colmar 48.110/7.385, Strasbourg 48.571/7.768, Metz 49.108/6.196.

`aireLinguistique` vaut `"alsacien"` pour le 67 et le 68, et **`null` pour toute la
Moselle** — il n'existe aucune liste officielle des communes germanophones du 57, et
tracer cette limite nous-mêmes fabriquerait une donnée que personne n'a établie.
Détail et procédure de regénération dans `data/communes/README.md`.

## Ce qu'il reste à faire dans la documentation

Les articles **Odoo 882 (cap produit), 883 (feuille de route) et 884 (checklists)**
décrivent la cible d'avant la refonte. Ils sont périmés depuis le 11/09/2026 et
doivent être réécrits. En attendant, `20-REFONTE-CARTE-DES-PARLERS.md` fait foi, et
les renvois `10-`, `11-`, `12-` de ce dossier portent un avertissement en tête.

`CLAUDE.md` à la racine a reçu la décision du 11/09 ; il continue de faire foi sur
le passé et sur les décisions prises.
