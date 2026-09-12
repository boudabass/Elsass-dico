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
| Script de dérivation | ✅ fait le 12/09 — `scripts/deriver.mts`, rejoué deux fois |
| Mesure du marqueur a~e | ✅ faite le 12/09, **résultat positif** — `22-MESURE-MARQUEUR-AE.md` |
| Bascule vers la base de production | ⬜ reste à faire — cf. ci-dessous |
| Le reste (auth, écrans, carte, contribution) | ⬜ étapes 2 à 5 |

Rien n'a été supprimé, rien n'a été migré, **la prod n'a pas bougé** : tout ce
qui précède a été exécuté contre un Postgres 18 local, jamais contre la base
Coolify. Supabase est intact et reste la base vivante de l'app actuelle.

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
| témoignages portant une aire déclarée | 17 392 |
| témoignages sans aucun lieu | 24 743 |

**Un toponyme EST une commune** : le lemme est indexé par sa commune, plus par
(français, contexte). `Roeschwoog` de `culture_alsace` et `Rœschwoog` du
wiktionnaire portent donc leurs deux formes sur la même fiche de village —
c'est ce qui rend la recontextualisation définitivement inutile, le département
venant du référentiel INSEE et non du contexte d'une source recopié sur une
autre.

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

## Ce qui reste avant la bascule

1. ~~Un dump SQL complet de Supabase~~ — **abandonné le 12/09/2026, décision de
   John.** Le doc 20 le demandait pour ne pas perdre les 338 entrées arbitrées.
   Il ne reste rien à protéger : la base se reconstruit intégralement du dépôt,
   et ce qui n'existait qu'en base (entrées publiées, comptes, votes) n'a plus
   d'intérêt — *« j'étais le seul à avoir fait quelque chose, le projet n'est
   toujours pas public ; sinon on n'aurait pas recommencé en plein milieu »*.
2. **Charger la chaîne dans le Postgres de Coolify**
   (`l11x6p591gah952rrbbgl24o`, postgres:18-alpine). Il est exposé
   publiquement sur le **port 5444** depuis le 12/09 — attention,
   `public_port_timeout` vaut 3 600 s, l'ouverture se referme d'elle-même.
   **Refermer l'accès public une fois le chargement fait** : l'utilisateur est
   `postgres` et la base est sur l'Internet ouvert le temps de l'opération.
   Les migrations, elles, s'appliquent au démarrage du conteneur
   (`docker-entrypoint.sh`) et n'ont pas besoin de cet accès.
3. Les étapes 2 à 5 du doc 20 (auth sans Supabase, écrans, carte, contribution).

## Reprendre

```bash
cd "C:\Users\George\Desktop\The Elsassisch\App\Elsass_dico"
git fetch origin claude/blissful-lovelace-d41f7h
git checkout claude/blissful-lovelace-d41f7h
```

Ton `.env.local` est en place localement, donc l'accès à la base fonctionne
immédiatement — c'est exactement ce qui manquait à la session distante.

**Premier pas suggéré**, dans l'ordre du doc 20 :

1. La mesure du marqueur a~e sur les 23 851 mots du lexique. Une heure, et elle
   peut annuler une partie du travail de carte — donc elle passe avant.
2. Le schéma Prisma, copiable tel quel depuis le doc 20.
3. Le script de dérivation `attestations` → `Lemme` / `Variante` / `Temoignage`.

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
