# 22 — Le marqueur a~e sur le lexique : résultat (12/09/2026)

> Répond au point ouvert de `20-REFONTE-CARTE-DES-PARLERS.md`, étape 1 : « le
> marqueur a~e n'a jamais été mesuré que sur les toponymes. Il dira si le
> lexique écrit peut teinter une zone sur la carte. Une heure de travail, **et
> le résultat peut être négatif**. »
>
> **Il est positif, et par un chemin qui n'était pas prévu : la source déclare
> son parler elle-même.** On n'a donc pas besoin de le déduire d'un marqueur —
> le marqueur ne fait que confirmer la déclaration.

Rejouable : `scripts/mesures/marqueur_ae.py` et `scripts/mesures/aire_declaree.py`.
Lecture seule, aucune écriture en base.

## Ce que la source écrit d'elle-même

Trouvé dans l'archive brute (`data/raw/culture_alsace/`, branche `data`), pas
déduit :

- **En tête du dictionnaire** (`dictionnaire_alsacien.htm`) :
  « S'ELSASSISCHA WÖRTERBÜACH — **Fer s'Südliga Nederàlamànischa
  Üssdrucksgebiat** » — pour l'aire d'expression du bas-alémanique **du sud**.
- **Sa propre carte linguistique** (`cartelinguistique.htm`), d'après
  l'Office pour la Langue et la Culture d'Alsace et le professeur Albert
  Hudlett, délimite cette aire : « le bas-alémanique du sud, **(région de
  Colmar et de Mulhouse)** ».
- **7 des 25 pages du lexique** portent en tête un bandeau : « Cette page a été
  enrichie avec des expressions du bas alémanique du Nord **(Bas-Rhinois)**. »

## Ce que la mesure en base dit

Le calibrage est porté par la mesure elle-même : les toponymes de la même
source, dont on connaît le département, sont recomptés avec exactement les
mêmes fonctions que le lexique. Ils reproduisent la mesure du 01/09/2026, donc
le compteur est bon.

| Groupe | formes | % finale `-a` | % digrammes `ia`/`ua` |
|---|---:|---:|---:|
| `culture_alsace` toponymes Haut-Rhin | 396 | **99,3 %** | 87,5 % |
| `culture_alsace` toponymes Bas-Rhin | 558 | **2,5 %** | 0,0 % |
| `culture_alsace` **lexique** | 38 811 | **88,8 %** | 95,3 % |
| `wiktionnaire_fr` lexique | 1 058 | 66,5 % | 18,1 % |

Le 88,8 % est une moyenne qui mélange deux populations, et c'est le découpage
qui est instructif :

| Lexique `culture_alsace` | formes | % finale `-a` |
|---|---:|---:|
| attestation à **une seule** forme | 13 243 | **98,7 %** |
| **1er** fragment d'une attestation à plusieurs formes | 10 608 | **99,7 %** |
| fragments **suivants** | 14 960 | 72,9 % |

**1 343 lignes portent à la fois une finale `-a` et une finale `-e`, et dans
98,5 % des cas le `-a` vient en premier** : `corbillard → d'r Todawààga, de
Todewàwe`, `fer à cheval → s'Rossisa, s'Rossise, s'Hufisa, s'Hufise`. La source
donne sa forme, puis l'équivalent du nord.

## Les deux signaux se recoupent, et c'est ça qui tranche

Le bandeau est du HTML dans une archive ; le marqueur est une mesure sur des
formes en base. Rien ne relie techniquement les deux. Ils disent la même chose :

| | attestations | % finales `-a` |
|---|---:|---:|
| 18 pages **sans** bandeau (H–Z) | 12 662 | **99,9 %** |
| 7 pages **déclarées enrichies** (A–G) | 11 189 | 80,0 % |

Sur les pages sans bandeau, même les formes en deuxième position sont à 100 %
de `-a` : il n'y a rien d'autre que le parler déclaré.

## Un troisième contrôle : écarter le raisonnement circulaire

Reste une objection : et si le lexique alsacien avait « naturellement » plus de
finales `-a` que les toponymes, indépendamment de toute région ? Alors deux
sources écriraient la même finale sur les mêmes mots.

Sur les **99 lemmes français** où les deux sources tranchent une finale :

- `culture_alsace` (1er fragment) est du côté `-a` : **100 %**
- `wiktionnaire_fr` : **82,8 %**

Les 17 désaccords vont **tous dans le même sens** (`àhnama` / `ànahme`,
`Àckselhehla` / `Àchselhehle`, `àbwàrta` / `warte`) — jamais l'inverse. C'est le
même constat unidirectionnel que le 01/09 sur les toponymes. Une convention de
source, donc, et non une propriété de la langue.

## Ce que ça autorise, et ce que ça n'autorise pas

**Autorisé, parce que la source le dit** : rattacher les **12 662 attestations
des 18 pages sans bandeau** à l'aire « bas-alémanique du sud — région de Colmar
et de Mulhouse ». Ce n'est pas une inférence, c'est une citation.

**Non autorisé** : rattacher les 11 189 attestations des pages A–G. La source
dit que ces pages **contiennent** des formes du nord, sans dire lesquelles.
Le marqueur suggère que la première forme est du sud à 99,7 %, mais suggérer
n'est pas attester — et 0,3 % de 10 608, c'est une trentaine de formes placées
au mauvais endroit sur une carte, sans que rien ne le signale. L'ambiguïté se
signale, elle ne se comble pas.

**Non autorisé non plus** : traiter cette aire comme un village. Une aire
déclarée par une source écrite n'est pas le témoignage d'un locuteur sur son
parler. Les deux ne s'additionnent jamais dans un même chiffre — c'est la règle
posée par le doc 20 pour l'affichage d'une fiche, et elle vaut sur la carte.

## Limites de la mesure, écrites pour qu'on ne les oublie pas

- Le marqueur « finale atone » ne regarde que le **dernier mot** d'une forme,
  et exige une voyelle `a`/`e` nue précédée d'une consonne dans un mot d'au
  moins deux voyelles. 13 744 formes sur 38 811 qualifient : les pourcentages
  portent sur elles, pas sur tout le lexique.
- Le marqueur « digrammes » compte `ie`/`ue` sans distinguer la diphtongue de
  l'usage graphique allemand du `ie` long — `Marie` y compte comme « nord ». Il
  est indicatif ; le raisonnement s'appuie sur la finale atone.
- Ces normalisations **trient et décrivent, elles ne décident jamais**. Écraser
  `a` et `e` pour décider d'un rapprochement de formes effacerait la question —
  c'est l'erreur du « +13 » du 24/08/2026.
