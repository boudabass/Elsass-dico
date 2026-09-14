# documentation/ — index

> **Odoo est la source de vérité.** C'est la base de connaissance de tout
> l'univers The Elsassisch, tous projets confondus. Ce dossier reste utilisé,
> mais il ne fait autorité sur rien : il renvoie.
>
> Index rétabli le 02/09/2026, après le constat que ce dossier n'avait reçu
> **qu'un seul commit en six mois** pendant que tout le projet se construisait.
> Une référence ORTHAL complète y dormait, directement utile au chantier
> d'arbitrage en cours, et n'a jamais été ouverte : ce qui n'est pas rangé à un
> endroit connu n'est pas utilisé, même par quelqu'un qui a accès au fichier.

## Où lire quoi

| Support | Fait foi sur |
|---|---|
| **`20-REFONTE-CARTE-DES-PARLERS.md`** | **La cible**, depuis le 11/09/2026 — *exception temporaire, cf. ci-dessous* |
| **`21-REPRISE.md`** | Où en est le chantier, et comment le reprendre |
| **`22-MESURE-MARQUEUR-AE.md`** | Le résultat de la mesure du 12/09/2026 : `culture_alsace` déclare son parler |
| **Odoo 878** | La méthode et les gabarits réutilisables — **tous projets** |
| **Odoo 669** | État des lieux (mis à jour le 07/09/2026) |
| **Odoo, hub 117** | Le reste du projet : doctrine, modèle de données, studio, campagnes |
| **`../CLAUDE.md`** | Le passé : décisions prises, incidents, doctrine opérationnelle |
| ~~Odoo 882, 883, 884~~ | **Périmés le 11/09/2026** — cap produit, jalons et checklists d'avant la refonte. À réécrire. |

### Pourquoi le document 20 fait foi alors que ce dossier ne fait foi sur rien

C'est une exception assumée et temporaire. La refonte du 11/09/2026 périme les
articles Odoo 882, 883 et 884 d'un coup ; tant qu'ils n'ont pas été réécrits, les
laisser seuls détenteurs de la cible ferait lire une cible abandonnée. La règle
« deux documents sur le même sujet divergent en silence » est respectée autrement :
les renvois `10-`, `11-` et `12-` portent un avertissement en tête qui dit où est
la version vivante.

**Une fois Odoo réécrit**, le document 20 redevient un renvoi comme les autres.

La répartition se fait **par nature, jamais par sujet** : deux documents qui
parlent du même sujet à deux endroits divergent en silence.

**Test avant d'écrire un paragraphe ici** : est-ce qu'un article Odoo le
contredirait s'il devenait faux ? Si oui, il ne va pas dans ce dossier — il va
dans Odoo, et ce dossier y renvoie.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `20-REFONTE-CARTE-DES-PARLERS.md` | **La cible** : pourquoi, décisions, modèle de données, étapes |
| `21-REPRISE.md` | État d'avancement et reprise en local |
| `22-MESURE-MARQUEUR-AE.md` | Mesure du marqueur a~e sur le lexique — résultat, contrôles, limites |
| `10-VISION-PRODUIT.md` | Renvoi vers Odoo 882 — **périmé** |
| `11-FEUILLE-DE-ROUTE.md` | Renvoi vers Odoo 883 — **périmé** |
| `12-CHECKLISTS.md` | Renvoi vers Odoo 884 — **partiellement périmé** (section D) |
| `orthal/` | **Référence ORTHAL 2023** — la seule ressource de fond du dossier |
| `01-` à `06-` | Périmés, étiquetés en tête, conservés pour mémoire |
| `archive/` | Documents traités ou obsolètes, plus le texte intégral d'ORTHAL 2023 |

### `orthal/` gagne en importance, malgré « ORTHAL devient secondaire »

Les deux ne se contredisent pas. Ce qui devient secondaire, c'est ORTHAL **comme
arbitre** : plus personne ne choisit une forme au nom de la norme. Mais quand on
affiche côte à côte `Barr` et `Bàrr`, il faut toujours savoir que `< à >` note un
/a/ sombre et non un ornement — sinon on croit voir deux façons d'écrire la même
chose là où il y a deux sons. `06-VARIANTES.md` (continuum dialectal) explique
l'isoglosse `a ~ e` sur laquelle repose toute la lecture de la carte.

### Pourquoi `orthal/` reste ici et non dans Odoo

C'est une **référence normative externe**, pas une décision du projet : elle ne
périme pas, ne se discute pas, et se consulte pendant qu'on code ou qu'on
arbitre. Elle n'entre donc pas en concurrence avec Odoo.

`06-VARIANTES.md` documente le continuum dialectal (francique au nord,
bas-alémanique au centre, haut-alémanique au sud) qui explique l'isoglosse
`a ~ e` mesurée en base le 01/09. **À ouvrir avant tout arbitrage de forme** —
ne pas redécouvrir à la main une règle qui y est écrite.

## Règle d'hygiène

Un document périmé se marque en tête et dit où lire la version vivante ; il ne
se supprime pas. Un document périmé **non marqué** est le plus dangereux de
tous — il ment sans le dire.
