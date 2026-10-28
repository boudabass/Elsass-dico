# Inventaire des insultes (28/10/2026)

Préparation de « l'insulte du week-end » (post du samedi, décision de John du
28/10 : pas un défi). Lecture seule, depuis la branche `data`
(`data/attestations/*.jsonl`), sans la base.

`python documentation/insultes-inventaire/inventaire.py <sortie.csv>` (depuis
la racine du dépôt) refait `inventaire.csv` (séparateur `;`, s'ouvre dans
Excel).

Colonnes : `francais` (le français retenu à l'import), `formes` (verbatim),
`mot_a_mot` (TD2 de la page), `francais_vient_de` (« sens » = la page donne
un sens ; « mot à mot seulement » = le français est une traduction littérale),
`autres_sources` (même forme ailleurs, en minuscules), `mots_a_verifier`
(repérage grossier par mots-clés, **ne remplace pas la relecture** : il rate
par exemple « suceur de con » ou « sale Souabe »), `garder` et `note_john` à
remplir.

Chiffres : 863 lignes, 662 fiches ; 241 avec un sens donné par la page, 421 en
mot à mot seulement ; 6 seulement ont une seconde source (`wiktionnaire_fr`) ;
604 fiches n'ont qu'une forme. 184 ont un sens et aucun mot repéré.

Rien n'est écrit ici : chaque texte vient de la page de DJ Fab'z.

**`a-choisir.csv`** : les 241 insultes avec un sens, seules publiables, dans
l'ordre du post (forme, mot à mot, sens). John met « oui » dans `garder`.
