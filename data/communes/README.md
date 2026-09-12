# `data/communes/` — référentiel des communes d'Alsace-Moselle

**1 605 communes** : 514 (Bas-Rhin), 366 (Haut-Rhin), 725 (Moselle). Chacune porte
son identité administrative et un point de placement sur la carte.

Ce n'est **pas une source au sens de `data/sources/`** : aucune forme alsacienne
n'en sort, aucune attestation ne s'y rattache. C'est un référentiel externe, qui
sert à ancrer les témoignages de locuteurs à un lieu — le village ne se détecte
jamais, il se choisit dans cette liste.

## Provenance

| Champ | Origine |
|---|---|
| `code`, `nom`, `departement`, `codesPostaux`, `population` | `@etalab/decoupage-administratif` 6.0.0 (données INSEE) |
| `latitude`, `longitude` | centroïde calculé sur les contours de `github.com/gregoiredavid/france-geojson`, commit `5d34ee6` |

Les deux jeux sont publics et dérivés de données administratives officielles.
**Vérifier leur licence avant toute publication** : la question des droits se pose
avant la première copie, pas après (leçon de la campagne 5, où trois sources
lexicales ont été écartées sur ce motif).

## Rejouer la génération

```bash
npm install @etalab/decoupage-administratif
git clone --depth 1 --filter=blob:none --no-checkout \
    https://github.com/gregoiredavid/france-geojson.git
cd france-geojson && git sparse-checkout set --no-cone \
    departements/57-moselle departements/67-bas-rhin departements/68-haut-rhin
git checkout HEAD -- departements/*/communes-*.geojson
node scripts/communes/generer-communes.js
```

Comme pour les parseurs du studio, **rejouer doit produire un `git diff` vide**.

## Le point de placement

Centroïde d'**aire** du plus grand polygone de la commune, jamais le centre de la
boîte englobante : sur une commune de vallée, allongée et coudée, le centre de la
boîte tombe sur la crête d'à côté. Une enclave ne déplace pas le point, puisque
seul le plus grand morceau compte.

Arrondi à 5 décimales, soit environ un mètre — très au-delà de ce qu'un point de
commune exige, et le fichier reste lisible.

**Zéro commune sans coordonnées** sur les 1 605. Le script échouerait bruyamment
plutôt que de placer une commune approximativement.

## `aireLinguistique`

`"alsacien"` pour le Bas-Rhin et le Haut-Rhin. **`null` pour toute la Moselle**, et
ce n'est pas un oubli.

La Moselle est partagée entre parlers franciques et parler roman, mais **il
n'existe aucune liste officielle des communes germanophones du 57** — la limite est
linguistique, pas administrative, et elle est discutée. La tracer nous-mêmes
reviendrait à fabriquer une donnée que personne n'a établie, exactement ce que la
règle 3 du contrat interdit : *un doute ne se comble pas, il se signale.*

L'interface dit donc « parler local » pour ces communes, sans le nommer. L'étiquette
se remplira le jour où une source le permettra, ou jamais — un champ vide se répare,
une frontière inventée se propage.
