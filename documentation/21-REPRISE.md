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
pnpm exec tsx scripts/importer-archive.mts   # Supabase -> archive (27 179)
pnpm exec tsx scripts/deriver.mts            # -> Lemme / Variante / Temoignage
pnpm exec tsx scripts/verifier-derivation.mts   # contrôles relus EN BASE
```

Les quatre scripts sont **idempotents** et **n'effacent jamais rien**. Le
dernier sort un code 1 si un contrôle échoue.

### Ce que la dérivation produit, mesuré le 12/09/2026

| | |
|---|---:|
| lemmes | 25 893 |
| variantes | 41 662 |
| témoignages | 42 135 |
| toponymes rattachés à une commune | 862 |
| communes ayant au moins une forme attestée | 819 / 1 605 |
| témoignages portant une aire déclarée | 17 392 |
| témoignages sans aucun lieu | 24 743 |

Ces 24 743 sont la dette de données qui devient le moteur de contribution :
« personne n'a encore dit d'où ça vient ».

### Ce qu'elle ne rattache pas, et pourquoi

**249 toponymes ne joignent aucune commune** : ce sont des communes fusionnées
depuis la publication de la source (`Auenheim` → Rountzenheim-Auenheim,
`Allenwiller` → Sommerau, `Altenbach` → Goldbach-Altenbach). Le référentiel
INSEE ne connaît que les communes actuelles. Piste, non faite : les communes
déléguées existent dans `@etalab/decoupage-administratif` et pourraient entrer
au référentiel — mais leur donner un point sur la carte suppose de décider ce
qu'on affiche pour un village qui n'est plus une commune.

**2 restent ambigus** (`Bouxwiller`, `Buhl` avec le contexte
« Alsace ; Géographie ») : sans département, rien ne tranche entre les deux
communes homonymes. Le doute se signale, il ne se comble pas.

## Ce qui reste avant la bascule

1. **Un dump SQL complet de Supabase**, avant tout (doc 20). Les 338 entrées
   arbitrées sont perdues volontairement, mais volontairement ≠ sans filet.
2. **Faire tourner la chaîne contre le Postgres de Coolify.** Son `DATABASE_URL`
   est une URL **interne** au réseau Docker du VPS : elle n'est pas joignable
   depuis un poste. Les migrations s'appliqueront donc au démarrage du conteneur
   (`docker-entrypoint.sh`), et les trois scripts de chargement demandent soit un
   accès temporaire depuis l'extérieur, soit une exécution depuis le serveur.
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
