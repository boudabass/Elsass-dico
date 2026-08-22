#!/usr/bin/env python3
"""Inventaire de la rubrique gsw-fr du Wiktionnaire francophone + tirage du lot pilote.

Rejoue le relevé du rapport de prospection campagne 4 (t_ebd325cf,
22/08/2026) : liste les 836 pages portant une section
« == {{langue|gsw-fr}} == » via searchinsource (insource:"{{langue|gsw-fr"),
relève leurs catégories (prop=categories, lots de 50), les classe en
strates (mots / non classés / prénoms / toponymes / autres noms propres),
puis TIRE le lot pilote avec une graine FIXÉE.

CE SCRIPT N'EXTRAIT RIEN : il ne produit que des listes de titres, aucun
contenu de page n'est téléchargé. L'extraction reste le travail de
gsw_fr.py, qui ne lit que data/raw/ (jamais le réseau).

Sorties
-------
data/raw/wiktionnaire_fr/gsw_fr_inventaire.json
    { "<titre>": ["Catégorie:...", ...] } — la copie brute du relevé
    (titres + catégories, ordre de l'API). Si le wiki change entre deux
    exécutions, le diff git le montre.
data/raw/wiktionnaire_fr/gsw_fr_lot.json
    Liste JSON des titres du lot pilote (21 pages), tirée avec la graine
    GRAINE (constante ci-dessous) : les 7 pages doubles gsw∩gsw-fr + 9 mots
    + 3 non classés + 2 prénoms. C'est la liste que lit le parseur
    gsw_fr.py — le pilote ne s'étend pas au-delà.

STRATES (méthode documentée, alignée sur le rapport t_ebd325cf)
----------------------------------------------------------------
- prenom      : catégorie « Catégorie:Prénoms ... en alémanique alsacien ».
- toponyme    : catégorie « Catégorie:Localités ... » ou « Catégorie:Pays
                en alémanique alsacien ».
- nom_propre  : « Catégorie:Noms propres en alémanique alsacien » (hors
                toponyme déjà classé).
- mot         : au moins une catégorie « Catégorie:<type> en alémanique
                alsacien » de type lexical, hors catégories de maintenance
                et hors catégories étymologiques/lexique (listées dans
                MAINTENANCE_ET_AUTRES).
- non_classe  : aucune des strates ci-dessus (en pratique : aucune
                catégorie du tout, ou uniquement des catégories de
                maintenance/d'autres langues).

La strate n'est PAS un champ du JSONL : elle ne sert qu'au tirage
représentatif. Le type de chaque attestation est décidé par le parseur
sur le contenu de la section gsw-fr (décision John 09/08/2026).

Usage
-----
  python3 scripts/extract/wiktionnaire_fr/inventaire_gsw_fr.py
"""

import json
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW_DIR = REPO / "data" / "raw" / "wiktionnaire_fr"
OUT_INVENTAIRE = RAW_DIR / "gsw_fr_inventaire.json"
OUT_LOT = RAW_DIR / "gsw_fr_lot.json"

API = "https://fr.wiktionary.org/w/api.php"
UA = ("elsass-dico-studio/0.1 (inventaire gsw-fr rejoue; "
      "https://dico.theelsassisch.fr)")
SLEEP = 0.25  # politesse MediaWiki
RETRIES = 3   # rejeux d'un lot de catégories à réponse partielle

# Graine FIXÉE du tirage (convention du studio, cf. t_9c816ec1) : la date
# du feu vert John pour ce pilote. Toute exécution sur le même relevé
# tire le même lot.
GRAINE = 20260822

# Les 7 pages doubles gsw∩gsw-fr (rapport t_ebd325cf) : incluses en totalité
# dans le lot, hors tirages aléatoires.
DOUBLES = ["Bredele", "Krizigung", "Kumfitür", "Raiher", "Schutzangel",
           "Strossburi", "ãn"]

# Tailles des tirages aléatoires par strate (21 pages au total avec les 7
# doubles : majorité de mots, quelques non classés, 1-2 prénoms — spec carte).
N_MOTS = 9
N_NON_CLASSES = 3
N_PRENOMS = 2

# Catégories « ... en alémanique alsacien » qui ne sont PAS des types
# lexicaux : maintenance wiki, étymologie, lexique thématique, formes de
# dérivation, etc. (constatées sur le relevé du 22/08/2026).
MAINTENANCE_ET_AUTRES = (
    "Wiktionnaire:", "Lexique en alémanique alsacien",
    "issus d’un mot en", "issus d'un mot en", "suffixés avec", "préfixés avec",
    "à vérifier car créées automatiquement", "Exemples en alémanique alsacien",
    "Prononciations ", "Étymologies en alémanique alsacien",
    "Ébauches en alémanique alsacien", "Dates manquantes en alémanique alsacien",
    "Genres manquants en alémanique alsacien",
    "Références nécessaires en alémanique alsacien",
    "Pluriels manquants en alémanique alsacien",
    "Conjugaisons manquantes en alémanique alsacien",
)


def fetch(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"erreur API {e.code} : {url}", file=sys.stderr)
        raise


def titres_gsw_fr() -> list[str]:
    """Tous les titres portant une section gsw-fr (searchinsource,
    continuation complète, ns0)."""
    titles: list[str] = []
    params = {
        "action": "query", "format": "json", "list": "search",
        "srsearch": 'insource:"{{langue|gsw-fr"', "srlimit": "500",
        "srnamespace": "0",
    }
    while True:
        data = fetch(params)
        for h in data["query"]["search"]:
            titles.append(h["title"])
        if "continue" not in data:
            break
        params["sroffset"] = data["continue"]["sroffset"]
        time.sleep(SLEEP)
    # L'artefact de continuation peut dupliquer des titres entre deux pages
    # de résultats (constaté aussi par ed-prospecteur, rapport t_ebd325cf :
    # « 11 doublons d'artefact de continuation ») : on dédoublonne en
    # conservant le premier ordre d'apparition.
    return list(dict.fromkeys(titles))


def categories(titles: list[str]) -> dict[str, list[str]]:
    """Catégories de chaque titre (prop=categories, lots de 50).

    Un lot qui revient avec moins de pages que demandé est REJOUÉ (jusqu'à
    RETRIES fois) : l'API MediaWiki peut répondre partiellement sur un lot
    isolé (constaté le 22/08/2026, lot 500-550). Un titre toujours absent
    après les rejeux est omis de l'inventaire et compté par l'appelant —
    un doute se signale, il ne se comble pas.
    """
    out: dict[str, list[str]] = {}
    for i in range(0, len(titles), 50):
        lot = titles[i:i + 50]
        pages: dict = {}
        for essai in range(RETRIES + 1):
            data = fetch({
                "action": "query", "format": "json", "prop": "categories",
                "cllimit": "max", "titles": "|".join(lot),
            })
            pages = data["query"]["pages"]
            if len(pages) >= len(lot):
                break
            print(f"lot [{i}:{i + len(lot)}] : {len(pages)}/{len(lot)} pages "
                  f"retournées, rejeu {essai + 1}/{RETRIES}", file=sys.stderr)
            time.sleep(SLEEP)
        for p in pages.values():
            out[p["title"]] = [c["title"] for c in p.get("categories", [])]
        time.sleep(SLEEP)
    return out


def strate(cats: list[str]) -> str:
    """Strate d'une page d'après ses catégories (méthode documentée)."""
    if any(c.startswith("Catégorie:Prénoms ") and "alémanique alsacien" in c
           for c in cats):
        return "prenom"
    if any(c.startswith("Catégorie:Localités ") or c.startswith("Catégorie:Localités")
           for c in cats):
        return "toponyme"
    if "Catégorie:Pays en alémanique alsacien" in cats:
        return "toponyme"
    if "Catégorie:Noms propres en alémanique alsacien" in cats:
        return "nom_propre"
    for c in cats:
        if not c.startswith("Catégorie:") or "en alémanique alsacien" not in c:
            continue
        if any(m in c for m in MAINTENANCE_ET_AUTRES):
            continue
        return "mot"
    return "non_classe"


def tirage(inventaire: dict[str, list[str]]) -> list[str]:
    """Lot pilote : 7 doubles + tirages aléatoires par strate (graine fixe)."""
    strates: dict[str, list[str]] = {"mot": [], "non_classe": [],
                                     "prenom": [], "toponyme": [],
                                     "nom_propre": []}
    for titre, cats in sorted(inventaire.items()):
        strates[strate(cats)].append(titre)

    rng = random.Random(GRAINE)
    lot = list(DOUBLES)
    lot += rng.sample([t for t in strates["mot"] if t not in DOUBLES], N_MOTS)
    lot += rng.sample([t for t in strates["non_classe"] if t not in DOUBLES],
                      N_NON_CLASSES)
    lot += rng.sample(strates["prenom"], N_PRENOMS)
    return lot


def main() -> int:
    print("relevé des pages gsw-fr (searchinsource, API fr.wiktionary.org)...")
    titles = titres_gsw_fr()
    print(f"{len(titles)} titres relevés")
    if len(titles) != 836:
        print(f"ATTENTION : le rapport campagne 4 (t_ebd325cf) comptait 836 "
              f"pages ; le relevé en trouve {len(titles)}. Le lot est tiré "
              f"sur le relevé courant, la différence est signalée, pas comblée.",
              file=sys.stderr)

    cat_by_title = categories(titles)
    if len(cat_by_title) != len(titles):
        perdues = sorted(set(titles) - set(cat_by_title))
        print(f"ATTENTION : {len(titles) - len(cat_by_title)} titre(s) sans "
              f"catégories après rejeux : {perdues}. Ils sont absents de "
              f"l'inventaire et du tirage — signalés, pas comblés.",
              file=sys.stderr)
    lot = tirage(cat_by_title)

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_INVENTAIRE.open("w", encoding="utf-8") as fh:
        json.dump(cat_by_title, fh, ensure_ascii=False, indent=1)
    with OUT_LOT.open("w", encoding="utf-8") as fh:
        json.dump(lot, fh, ensure_ascii=False, indent=1)

    from collections import Counter
    strates = Counter(strate(c) for c in cat_by_title.values())
    print("strates (836 pages) :", dict(strates))
    print(f"lot ({len(lot)} pages, graine {GRAINE}) :")
    for t in lot:
        print(f"  - {t} [{strate(cat_by_title[t])}]")
    print(f"\ninventaire écrit : {OUT_INVENTAIRE} ({len(cat_by_title)} titres)")
    print(f"lot écrit : {OUT_LOT} ({len(lot)} titres)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
