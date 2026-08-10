#!/usr/bin/env python3
"""Inventaire de Catégorie:alémanique du Wiktionnaire francophone.

Rejoue le relevé de la carte t_d228cb2f (09/08/2026) : liste les pages de
Catégorie:alémanique via l'API MediaWiki (continuation complète,
cmtype=page), vérifie l'absence de redirection (prop=info, par lots), et
écrit la liste des titres dans data/raw/wiktionnaire_fr/categorie_alemanique.json
— la copie brute de l'inventaire, la seule entrée de l'archivage (archive_pages.py).

CE SCRIPT N'EXTRAIT RIEN : il ne produit qu'une liste de titres, aucun
contenu de page n'est téléchargé. L'extraction reste le travail de
mots.py, qui ne lit que data/raw/ (jamais le réseau).

Sortie
------
data/raw/wiktionnaire_fr/categorie_alemanique.json — liste JSON des titres
(ordre de l'API), + comptes imprimés sur stdout. Le fichier est la copie
brute du relevé : s'il change entre deux exécutions (la catégorie vit),
le diff git le montre.

Usage
-----
  python3 scripts/extract/wiktionnaire_fr/inventaire_categorie.py
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "data" / "raw" / "wiktionnaire_fr" / "categorie_alemanique.json"

API = "https://fr.wiktionary.org/w/api.php"
UA = ("elsass-dico-studio/0.1 (inventaire rejoue; "
      "https://dico.theelsassisch.fr)")
SLEEP = 0.25  # politesse MediaWiki


def fetch(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"erreur API {e.code} : {url}", file=sys.stderr)
        raise


def titres_categorie() -> list[str]:
    """Tous les titres de Catégorie:alémanique (cmtype=page, continuation)."""
    titles: list[str] = []
    params = {
        "action": "query",
        "format": "json",
        "list": "categorymembers",
        "cmtitle": "Catégorie:alémanique",
        "cmlimit": "500",
        "cmtype": "page",
    }
    while True:
        data = fetch(params)
        for m in data["query"]["categorymembers"]:
            titles.append(m["title"])
        if "continue" not in data:
            break
        params["cmcontinue"] = data["continue"]["cmcontinue"]
    return titles


def redirections(titles: list[str]) -> list[str]:
    """Titres qui sont des redirections (prop=info, lots de 50)."""
    redirs: list[str] = []
    for i in range(0, len(titles), 50):
        lot = titles[i:i + 50]
        data = fetch({
            "action": "query",
            "format": "json",
            "prop": "info",
            "titles": "|".join(lot),
        })
        pages = data["query"]["pages"]
        for p in pages.values():
            if p.get("redirect", False):
                redirs.append(p.get("title", "?"))
    return redirs


def main() -> int:
    print("relevé de Catégorie:alémanique (API fr.wiktionary.org)...")
    titles = titres_categorie()
    print(f"{len(titles)} titres relevés")
    redirs = redirections(titles)
    if redirs:
        print(f"ATTENTION : {len(redirs)} redirection(s) dans la catégorie :")
        for t in redirs:
            print(f"  - {t}")
    else:
        print("0 redirection (cohérent avec l'inventaire t_d228cb2f)")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        json.dump(titles, fh, ensure_ascii=False, indent=1)
    print(f"inventaire écrit : {OUT} ({len(titles)} titres)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
