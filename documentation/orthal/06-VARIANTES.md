# Variantes Régionales

## Les Grandes Zones Dialectales

L'Alsace présente un continuum dialectal allant du francique au nord au haut-alémanique au sud.

```
┌─────────────────────────────────────────────────────┐
│ NORD - Francique                                    │
│   • Wissembourg : Francique méridional (FMP)        │
│   • Alsace Bossue : Francique rhénan lorrain (FRL)  │
├─────────────────────────────────────────────────────┤
│ CENTRE - Bas-alémanique du nord (BAN)               │
│   • Strasbourg et environs                          │
│   • Terminaisons en -e                              │
├─────────────────────────────────────────────────────┤
│ "Landgraben" (frontière dialectale)                 │
├─────────────────────────────────────────────────────┤
│ SUD-CENTRE - Bas-alémanique du sud (BAS)            │
│   • Colmar, Mulhouse                                │
│   • Terminaisons en -a                              │
├─────────────────────────────────────────────────────┤
│ SUD - Haut-alémanique (HA)                          │
│   • Sundgau                                         │
│   • Terminaisons en -a                              │
└─────────────────────────────────────────────────────┘

## Le Défi de l'Unification : "e" vs "a"
Le point de divergence le plus critique pour l'unification de l'alsacien est la terminaison des verbes et des articles :
- **Nord (67)** : `màche`, `de Mànn` (terminaison en `-e`).
- **Sud (68)** : `màcha`, `der Mànn` (terminaison en `-a`).

### La Stratégie "Elsass Dico"
Pour éviter de fragmenter la langue, le dictionnaire adopte une **posture tranchée** :
1.  **Une Seule Forme Affichée** : L'utilisateur ne verra jamais "màche / màcha". Il verra une seule forme (définie par l'Index 0 de la donnée).
2.  **Cohérence de Bloc** : Si un verbe est affiché en `-e`, son contexte doit suivre la même logique (articles en `de`, etc.) pour éviter les "phrases Frankenstein".
3.  **Choix Éditorial** : Le choix entre `-e` et `-a` pour la forme canonique est déterminé lors de la constitution du dictionnaire (Dossier `Dictionnaire/`). Ce choix constitue la norme du projet.
```

---

## Principales Différences

### Les Terminaisons Verbales

| Infinitif | 67 (BAN) | 68 (BAS/HA) | Traduction |
|-----------|----------|-------------|------------|
| faire | `màche` | `màcha` | machen |
| lire | `lase` | `lasa` | lesen |
| écrire | `schriwe` | `schriba` | schreiben |
| rire | `làche` | `làcha` | lachen |

### L'Article Défini

| Genre/Nombre | 67 | 68 | Traduction |
|--------------|----|----|------------|
| Masc. sing. | `de Mànn` | `der Mànn` | l'homme |
| Fém. sing. | `d Fràu` | `d Fràu` | la femme |
| Pluriel | `d Litt` | `d Litt` | les gens |

### L'Article Indéfini

| Genre | 67 | 68 | Traduction |
|-------|----|----|------------|
| Masc. | `e Mànn` | `a Mànn` | un homme |
| Fém. | `e Fràu` | `a Fràu` | une femme |

---

## Les Diphtongues Régionales

### "bon, bien" (gut)

| Zone | Graphie | Prononciation |
|------|---------|---------------|
| BAN (67) | `guet` | /guet/ |
| BAS (68) | `güet` | /gyət/ |
| HA (68) | `güat` | /gyat/ |

### "trois" (drei)

| Zone | Graphie | Prononciation |
|------|---------|---------------|
| Standard | `drei` | /drai/ |
| Val de Munster | `dréi` | /drei/ |
| Répandu | `drèi` | /drɛi/ |

### "arbre" (Baum)

| Zone | Graphie | Prononciation |
|------|---------|---------------|
| Standard | `Baum` | /baum/ |
| 68 variante | `Bauim` / `Bàuim` | /bɔim/ |
| 67 variante | `Boim` | /boim/ |

---

## Le Pronom Démonstratif

| Zone | "ce, cette" | "ces" |
|------|-------------|-------|
| 67 | `die` | `die` |
| 68 | `dia` | `dia` |

---

## Le Pronom Personnel 3ème pers.

| Zone | "elle" | "ils/elles" |
|------|--------|-------------|
| 67 | `sie` | `sie` |
| 68 | `sìe` | `sìe` |

---

## Exemple Comparatif Complet

**Phrase** : « Il était une fois quatre petits lapins. »

### Haut-Rhin (68 - BAS/HA)
> As sìn amol viar kleina Hàsa gsì. Sa han Flopsi, Mopsi un Peter gheisa.

### Bas-Rhin (67 - BAN)
> Es sìn emol vìer klëëni Hasle gewann. Sie hàn Flopsi, Mopsi ùn Peter ghëise.

---

## Tableau des Variantes Courantes

| Français | 67 (BAN) | 68 (BAS/HA) | Allemand |
|----------|----------|-------------|----------|
| aussi | `àu`, `öi` | `àui`, `aui` | auch |
| non | `nà`, `nëë` | `nai`, `na` | nein |
| oui | `jo` | `jo` | ja |
| aujourd'hui | `hitt` | `hit` | heute |
| demain | `morn` | `morn` | morgen |
| maintenant | `jetz` | `jetz` | jetzt |
| toujours | `ìmmer` | `ìmmer` | immer |
| jamais | `nie` | `nia` | nie |
| quelque chose | `ebbis` | `ebbis` | etwas |
| rien | `nix` | `nix` | nichts |

---

## Comment Utiliser les Variantes dans Elsass Dico

Bien que le projet applique une politique d'**Alsacien Unifié** (un seul résultat affiché), les variantes régionales sont cruciales pour le système :

1. **Recherche Large (Search Discovery)** : Le moteur de recherche indexe toutes les variantes. Si un utilisateur tape "Hüüs" (67), il trouvera l'entrée "Maison" même si le résultat affiché est "Hüss" (Canonique).
2. **Arbitrage Automatique** : La base de données stocke les variantes pour permettre aux éditeurs d'affiner le choix canonique au fil du temps.
3. **Zéro Confusion** : L'utilisateur final ne voit jamais de liste de choix régionaux. Le système choisit la forme la plus standard ("Canonique") pour garantir une lecture fluide.

```json
{
  "francais": "maison",
  "traductions": [
    { "alsacien": "Hüss", "region": "général", "variante": "", "niveau": "", "note": "" },
    { "alsacien": "Hüüs", "region": "67", "variante": "", "niveau": "", "note": "" }
  ]
}
```
> [!NOTE]
> Les variantes régionales sont des "synonymes de zone" pour un même sens. Elles diffèrent des **Homonymes**, qui représentent des sens totalement différents pour un même mot source.
