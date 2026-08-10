#!/usr/bin/env python3
"""Vérifie que raw/wiktionnaire_fr/ couvre exactement l'inventaire."""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW = REPO / "data" / "raw" / "wiktionnaire_fr"

titres = set(json.load(open(RAW / "categorie_alemanique.json", encoding="utf-8")))
fichiers = {p.name.removesuffix(".wikitext.txt")
            for p in RAW.glob("*.wikitext.txt")}
print("titres inventaire:", len(titres))
print("fichiers archives:", len(fichiers))
manquants = sorted(titres - fichiers)
en_trop = sorted(fichiers - titres)
print("manquants:", manquants)
print("en trop:", en_trop)
sys.exit(0 if not manquants and not en_trop else 1)
