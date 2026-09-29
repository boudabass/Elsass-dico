# Elsass Dico

Dictionnaire français-alsacien de la marque The Elsassisch, publié sur
[elsass-dico.theelsassisch.com](https://elsass-dico.theelsassisch.com).

L'alsacien n'a pas une forme juste, il en a une par village. Le dictionnaire
garde donc toutes les variantes, chacune avec les **sources écrites** qui la
portent et les **villages** qui la revendiquent, et les montre sur une carte
des parlers. Rien n'y est inventé : chaque forme vient d'une source ou d'un
membre qui la parle.

## Ce que fait l'app

- **Public** : une page de présentation, une fiche par village et par prénom,
  le défi du jour (« Quel village dit ça ? »), jouable sans compte.
- **Membres** (compte The Elsassisch, connexion via Odoo) : recherche dans les
  deux sens (français → alsacien et alsacien → français), dictionnaire A-Z,
  carte des parlers, et contribution : « chez moi aussi » sur une forme, ou une
  nouvelle forme pour son village.
- **Admin** : membres, signalements, sources, mots ajoutés par les membres.

## Stack

- Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- PostgreSQL 18 + Prisma 7 (`pg_trgm`, `unaccent`)
- Sessions signées avec `jose`, authentification déléguée à Odoo
- Carte Leaflet sur un fond versionné (`public/carte/contours.topojson`), sans
  aucun service de tuiles : l'app ne dépend d'aucun service extérieur
- Déploiement Docker sur Coolify ; `prisma migrate deploy` au démarrage du
  conteneur

## Développement

Le dépôt utilise **pnpm** (npm ne fonctionne pas ici).

```bash
pnpm install
pnpm dev
pnpm run typecheck
pnpm build
```

Variables d'environnement (`.env.local`) :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Base PostgreSQL (aussi requise au build : les fiches village et prénom sont pré-rendues) |
| `SESSION_SECRET` | Clé de signature des sessions ; l'app refuse de démarrer sans |
| `ODOO_URL`, `ODOO_DB` | Instance Odoo qui authentifie les membres |
| `AUTOMATISATION_API_TOKEN` | Jeton des routes `/api/automatisation/*` |

## Les données

`data/` est la source de vérité, pas la base. La base se reconstruit des
fichiers versionnés par des scripts rejouables, sans aucune décision humaine
mot par mot :

```bash
pnpm exec prisma migrate deploy
pnpm exec tsx scripts/seed-communes.mts         # 1 605 communes (67, 68, 57)
pnpm exec tsx scripts/importer-data.mts --anomalies <fichier>  # attestations des sources
pnpm exec tsx scripts/deriver.mts               # lemmes, variantes, témoignages
pnpm exec tsx scripts/importer-contributions.mts # contributions des membres
pnpm exec tsx scripts/verifier-derivation.mts   # contrôles relus en base
```

Le détail (anomalies connues, base de test locale) est dans
[`documentation/21-REPRISE.md`](documentation/21-REPRISE.md).

## Documentation

- [`documentation/README.md`](documentation/README.md) : où lire quoi. La
  base de connaissance Odoo fait foi, ce dossier y renvoie.
- [`documentation/20-REFONTE-CARTE-DES-PARLERS.md`](documentation/20-REFONTE-CARTE-DES-PARLERS.md) :
  la refonte du 11/09/2026 et le modèle de données.
- [`documentation/orthal/`](documentation/orthal/) : la graphie ORTHAL 2023,
  clé de lecture des formes (`Barr` et `Bàrr` ne notent pas le même son).
- [`PRODUCT.md`](PRODUCT.md) : utilisateurs, voix et principes de design.
- [`CLAUDE.md`](CLAUDE.md) : l'historique des décisions et des incidents.

## Licence

Code sous licence Apache 2.0 (`LICENSE`). Les données réutilisées gardent
leurs propres licences, déclarées par source dans `data/sources/` et sur la
page `/sources` de l'app.
