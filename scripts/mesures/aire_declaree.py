#!/usr/bin/env python3
"""Ce que `culture_alsace` DÉCLARE de son propre parler, croisé avec la mesure.

Complément de `marqueur_ae.py`. Celui-ci mesure un marqueur dans les formes ;
celui-ci lit ce que la source écrit d'elle-même dans l'archive brute — et les
deux se contrôlent l'un l'autre.

Ce que la source déclare, en propres termes :

  * `dictionnaire_alsacien.htm`, en tête du dictionnaire :
      « S'ELSASSISCHA WÖRTERBÜACH — Fer s'Südliga Nederàlamànischa
        Üssdrucksgebiat »
    soit : pour l'aire d'expression du bas-alémanique DU SUD.

  * `cartelinguistique.htm` délimite cette aire, toujours dans ses mots :
      « le bas-alémanique du sud, (région de Colmar et de Mulhouse) »

  * et 7 des 25 pages du lexique portent en tête un bandeau :
      « Cette page a été enrichie avec des expressions du bas alémanique du
        Nord (Bas-Rhinois). »

Ce script établit LESQUELLES, et vérifie que la mesure le confirme. Un signal
déclaré qui prédit un signal mesuré, sans aucun lien technique entre les deux,
vaut mieux que l'un ou l'autre pris seul.

Lecture seule : `git show` sur la branche `data` pour l'archive, PostgREST pour
la base. Aucune écriture.

Usage :
    python scripts/mesures/aire_declaree.py
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

from dotenv import load_dotenv

RACINE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RACINE / "scripts" / "mesures"))

from marqueur_ae import Base, finale_atone, formes_d_une_attestation  # noqa: E402

BANDEAU = re.compile(r"enrichie avec des expressions du bas al", re.I)
PAGE_LEXIQUE = re.compile(r"data/raw/culture_alsace/page_[a-z]+f\.htm$")
LEXIQUE = {"mot", "expression", "proverbe"}


def pages_du_lexique() -> dict[str, bool]:
    """{nom de page: la source la déclare-t-elle enrichie de formes du Nord}.

    Lue par `git show` plutôt que par un checkout : `data/raw/` contient un nom
    de fichier avec un « ? », invalide sur NTFS, et un worktree de la branche
    `data` échoue dès la construction de l'index (note technique du 23/08/2026).
    """
    listage = subprocess.run(
        ["git", "ls-tree", "--name-only", "origin/data", "data/raw/culture_alsace/"],
        cwd=RACINE, capture_output=True, text=True, check=True).stdout.split()

    pages = {}
    for chemin in sorted(c for c in listage if PAGE_LEXIQUE.search(c)):
        brut = subprocess.run(["git", "show", f"origin/data:{chemin}"],
                              cwd=RACINE, capture_output=True, check=True).stdout
        # La source est en latin-1 et a des fins de ligne mixtes — on la lit
        # telle quelle, on ne la normalise pas (cf. `data/raw/** -text`).
        pages[Path(chemin).name] = bool(BANDEAU.search(brut.decode("latin-1")))
    return pages


def pct(c: Counter) -> str:
    t = c["a"] + c["e"]
    return f"{100 * c['a'] / t:6.1f} %" if t else "     —"


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    pages = pages_du_lexique()
    enrichies = sorted(n for n, v in pages.items() if v)
    print(f"Pages de lexique archivées : {len(pages)}")
    print(f"  déclarées enrichies de formes du Bas-Rhin par la source : "
          f"{len(enrichies)} — {', '.join(enrichies)}")
    print(f"  sans bandeau, donc du seul parler déclaré en tête du "
          f"dictionnaire : {len(pages) - len(enrichies)}\n")

    load_dotenv(RACINE / ".env.local")
    url, cle = os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not cle:
        print("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante.",
              file=sys.stderr)
        return 2

    base = Base(url, cle)
    sources = {s["id"]: s["code"] for s in base.tout("sources", "id,code")}
    attestations = base.tout(
        "attestations",
        "id,source_id,alsacien,alsacien_sans_article,type,reference")

    # `attestations.reference` vaut « page_af.htm#L211 » : c'est elle qui
    # rattache une ligne de base à sa page d'origine, donc à sa déclaration.
    par_page: dict[str, dict] = defaultdict(
        lambda: {"n": 0, "prem": Counter(), "suiv": Counter()})
    sans_reference = 0

    for a in attestations:
        if sources.get(a["source_id"]) != "culture_alsace" or a["type"] not in LEXIQUE:
            continue
        page = (a.get("reference") or "").split("#")[0]
        if not page:
            sans_reference += 1
            continue
        formes = formes_d_une_attestation(a["alsacien"], a.get("alsacien_sans_article"))
        if not formes:
            continue
        d = par_page[page]
        d["n"] += 1
        if (f0 := finale_atone(formes[0])):
            d["prem"][f0] += 1
        for f in formes[1:]:
            if (fx := finale_atone(f)):
                d["suiv"][fx] += 1

    if sans_reference:
        print(f"⚠ {sans_reference} attestations lexicales sans référence de page : "
              f"elles ne peuvent être rattachées à aucune déclaration.\n")

    print(f"{'page':<16} {'bandeau':<9} {'attest.':>8} {'% -a 1re forme':>15} "
          f"{'% -a suivantes':>15}")
    print("-" * 68)
    total = {"n": 0, "prem": Counter(), "suiv": Counter()}
    cumul = {True: Counter(), False: Counter()}
    attest = {True: 0, False: 0}
    for page in sorted(par_page):
        d = par_page[page]
        declaree = bool(pages.get(page))
        print(f"{page:<16} {'NORD' if declaree else '—':<9} {d['n']:>8} "
              f"{pct(d['prem']):>15} {pct(d['suiv']):>15}")
        total["n"] += d["n"]
        total["prem"] += d["prem"]
        total["suiv"] += d["suiv"]
        cumul[declaree] += d["prem"] + d["suiv"]
        attest[declaree] += d["n"]
    print("-" * 68)
    print(f"{'TOTAL':<16} {'':<9} {total['n']:>8} {pct(total['prem']):>15} "
          f"{pct(total['suiv']):>15}\n")

    for declaree, libelle in ((False, "pages SANS bandeau"), (True, "pages enrichies nord")):
        c = cumul[declaree]
        print(f"  {libelle:<22} {attest[declaree]:>6} attestations, "
              f"toutes formes confondues : {pct(c)} de finales -a "
              f"({c['a'] + c['e']} finales)")

    print("\nLecture : si la déclaration et la mesure disent la même chose, les pages")
    print("sans bandeau doivent être massivement -a et les autres nettement moins.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
