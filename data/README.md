# `data/` — contrat de dépôt du studio Elsass Dico

Tout ce que le studio produit atterrit ici, en fichiers versionnés. **Aucun profil
`ed-*` n'écrit dans Supabase** : l'ingestion est lancée à la main, après relecture du
diff git. C'est ce qui permet de refuser un lot avant qu'il touche la base, pas après.

## Arborescence

```
data/
  sources/<code>.json                fiche d'une source (identité, licence, rubriques)
  raw/<code>/<rubrique>.<ext>        copie brute de la source, telle que téléchargée
  attestations/<code>__<rub>.jsonl   attestations verbatim, prêtes à ingérer
  orthal/<code>__<rub>.jsonl         propositions de graphie ORTHAL (jamais des attestations)
```

`<code>` est la valeur de `sources.code` en base. Deux rubriques d'une même source
partagent le même `<code>` : ce sont des pages différentes du même auteur, pas deux
sources indépendantes — les compter deux fois annulerait la règle 2.

## Pourquoi `raw/` est versionné

Sans la copie brute, une extraction n'est pas vérifiable. `raw/` sert trois usages :

1. `ed-verificateur` compare le JSONL au brut **hors ligne**, sans dépendre de la
   disponibilité du site ni d'une éventuelle modification de la page entre-temps.
2. Rejouer un parseur doit regénérer un JSONL identique au fichier commité. Un
   `git diff` vide est la preuve qu'aucune ligne n'a été saisie à la main.
3. Un site personnel peut disparaître. `culture.alsace.pagesperso-orange.fr` en est
   déjà à son miroir.

## Statut d'une rubrique — vocabulaire fermé

Le champ `statut` de chaque rubrique de `sources/<code>.json` ne prend que quatre
valeurs, dans l'ordre du cycle de vie :

| Valeur | Signification |
|---|---|
| `inventorié` | Page relevée et archivée dans `raw/`, pas encore extraite. |
| `extrait` | Parseur produit et JSONL déposé, non encore vérifié. |
| `vérifié` | `ed-verificateur` a rendu un verdict CONFORME. |
| `ingéré` | John a lancé l'ingestion après relecture du diff. |

Toute autre valeur est un défaut de la fiche (décision John, GATE inventaire
08/08/2026).

## Format d'une ligne `attestations/*.jsonl`

Un objet JSON par ligne, encodage UTF-8, `\n` en fin de ligne. Les clés reprennent
exactement les colonnes de `public.attestations` :

```json
{"source_code":"culture_alsace","francais":"Algolsheim","alsacien":"Àlgelsa","graphie_origine":"68600 Àlgelsa Algolsheim","type":"toponyme","contexte":"","region":"haut_rhin","reference":"villes_villages.htm#L142"}
```

| Clé | Obligatoire | Règle |
|---|---|---|
| `source_code` | oui | Doit exister dans `data/sources/`. |
| `francais` | oui | Copié verbatim. |
| `alsacien` | oui | **Copié verbatim.** Jamais normalisé, jamais corrigé, jamais complété. |
| `graphie_origine` | oui | La ligne brute d'origine, entière, avant tout découpage. C'est elle qui rend la vérification possible. |
| `type` | oui | `mot`, `expression`, `proverbe`, `toponyme` ou `prenom`. |
| `contexte` | oui | `""` si la source n'en donne pas. Sépare les homonymes. |
| `region` | non | `bas_rhin`, `haut_rhin`, `commun`, ou absent. Ne se déduit que d'une information **présente dans la source** (un code postal, un intitulé de page). Jamais d'un jugement sur la forme. |
| `reference` | oui | Localisation précise et rejouable : fichier `raw/` + numéro de ligne, page, ou URL exacte. |

### Les trois règles qui font foi

1. **`alsacien` et `francais` sont des copies.** Si la source écrit `z'f üass`, le JSONL
   écrit `z'f üass`. Une coquille visible se signale dans le rapport de carte, elle ne
   se corrige pas ici. Corriger, c'est déjà éditorialiser une source qu'on n'a pas
   recoupée.
2. **Une ligne qu'aucun parseur ne peut regénérer est un défaut bloquant**, même si son
   contenu est juste. La saisie manuelle est indétectable après coup, donc interdite
   sans exception.
3. **Un doute ne se comble pas, il se signale.** Une entrée ambiguë est omise du JSONL
   et listée dans le rapport de la carte. Un trou est réparable ; une invention
   publiée sous la marque The Elsassisch ne l'est pas.

## Format d'une ligne `orthal/*.jsonl`

```json
{"source_code":"culture_alsace","francais":"Algolsheim","alsacien":"Àlgelsa","contexte":"","graphie_orthal":"…","regles_appliquees":"…","automate_code":"orthal_bot"}
```

Les quatre premières clés ne décrivent pas une donnée nouvelle : elles **désignent
l'attestation** à laquelle la proposition se rattache, en reprenant sa clé d'unicité
`(source_id, francais, alsacien, contexte)`. Une proposition dont l'attestation
n'existe pas en base est rejetée — on ne transcode pas dans le vide.

Une proposition Orthal **n'est pas une attestation** : elle réécrit une forme déjà
attestée, elle n'en apporte aucune. Elle n'entre jamais dans `attestations`, ne compte
ni dans `nb_attestations` ni dans `nb_sources`, et va dans la table
`propositions_orthal`. `regles_appliquees` est obligatoire : sans la règle invoquée, la
proposition est invérifiable, donc inutilisable en arbitrage.

## Après l'ingestion

Les attestations ingérées apparaissent dans `candidats_arbitrage()`, marquées du nombre
de sources distinctes qui les portent. Elles n'existent **pas** comme entrées tant qu'un
administrateur ne les a pas arbitrées dans `/admin/arbitrage` : `arbitrer_entree()`
refuse toute validation sous deux sources distinctes sans note d'arbitrage. Le studio
s'arrête ici.
