#!/usr/bin/env python3
"""Divergence wiktionnaire_fr vs culture_alsace (liste, jamais corrigée)."""
import json
import unicodedata
from pathlib import Path

REPO = Path("/opt/data/elsass-dico")
WIKT = REPO / "data" / "attestations" / "wiktionnaire_fr__mots.jsonl"

wikt = {}
for line in WIKT.read_text(encoding="utf-8").splitlines():
    a = json.loads(line)
    wikt.setdefault(a["alsacien"], []).append(a)

ca = set()
for f in Path(REPO / "data" / "attestations").glob("culture_alsace__*.jsonl"):
    for line in f.open(encoding="utf-8"):
        ca.add(json.loads(line)["alsacien"])


def norm(s):
    return unicodedata.normalize("NFD", s).casefold()


wikt_formes = set(wikt.keys())
identiques = sorted(wikt_formes & ca)
norm_wikt = {norm(s): s for s in wikt_formes}
norm_ca = {norm(s): s for s in ca}
proches = sorted(set(norm_wikt) & set(norm_ca)
                 - {norm(s) for s in identiques})

print("formes wikt uniques:", len(wikt_formes))
print("identiques avec culture_alsace:", len(identiques))
print("proches (casse/accents):", len(proches))
print()
print("=== identiques (toutes, triées) ===")
for s in identiques:
    print(" ", s)
print()
print("=== proches casse/accents (toutes) ===")
for k in proches:
    print(f"  wikt={norm_wikt[k]!r}  ca={norm_ca[k]!r}")
