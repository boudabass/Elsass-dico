#!/usr/bin/env python3
"""Inventaire du miroir culture_alsace (campagne 1) — ed-prospecteur.

Génère data/sources/culture_alsace.json (rubriques complètes,
inventaire_complet=true) et dépose les copies brutes dans
data/raw/culture_alsace/ à partir d'un répertoire de téléchargement.

Rejouable : le même répertoire source doit produire le même JSON et les
mêmes octets dans raw/. Aucune forme alsacienne n'est lue ni recopiée ici —
seuls des comptages structurels (lignes « .- ») et les URL servent à
documenter la fiche.

Usage:
    python3 scripts/extract/culture_alsace/inventaire_miroir.py <dir_downloads>
"""

import html
import json
import re
import shutil
import sys
from pathlib import Path

BASE = "https://www.elsassisch.eu/culture.alsace.pagesperso-orange.archive/"
LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
           "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "xy", "z"]

REPO = Path(__file__).resolve().parents[3]
FICHE = REPO / "data" / "sources" / "culture_alsace.json"
RAW = REPO / "data" / "raw" / "culture_alsace"


def text_lines(path: Path) -> list[str]:
    """Lignes de texte visible d'une page (structure seulement, pas de copie)."""
    t = path.read_bytes().decode("latin1", errors="replace")
    t = re.sub(r"<script.*?</script>", "", t, flags=re.S | re.I)
    t = re.sub(r"<(P|/P|TR|/TR|TD|/TD|BR)>", "\n", t, flags=re.I)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    return [l.strip() for l in t.split("\n") if l.strip()]


def count_entries(path: Path) -> int:
    """Nombre de lignes d'entrée (séparateur « .- ») — volumétrie estimée."""
    return sum(1 for l in text_lines(path) if ".-" in l)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    src = Path(sys.argv[1])
    if not src.is_dir():
        print(f"répertoire introuvable : {src}")
        return 2

    # --- 1. copies brutes dans raw/ (octets tels que téléchargés) ---
    RAW.mkdir(parents=True, exist_ok=True)
    copied = []
    for f in sorted(src.glob("*.htm")) + sorted(src.glob("index.html")):
        shutil.copy2(f, RAW / f.name)
        copied.append(f.name)

    # --- 2. rubriques du dictionnaire (une entrée par page) ---
    # On conserve les rubriques de l'ancienne fiche qui ne décrivent pas une
    # page du miroir : lexique_a_d documente l'extraction antérieure au studio
    # (dossier Dictionnaire/, 7260 entrées A-D) — un fait d'historique, pas une
    # page. Les trois rubriques villes/prenoms sont remplacées par leur version
    # inventoriée ci-dessous.
    ancienne = json.loads(FICHE.read_text(encoding="utf-8"))["rubriques"]
    rubriques = [r for r in ancienne if r["cle"] == "lexique_a_d"]
    for L in LETTERS:
        for sens, suffix, lib in (
            ("fr_als", "f", "français → alsacien"),
            ("als_fr", "", "alsacien → français"),
        ):
            name = f"page_{L}{suffix}.htm"
            path = src / name
            if not path.exists():
                print(f"page manquante : {name}")
                return 1
            rubriques.append({
                "cle": f"dico_{sens}_{L}",
                "libelle": f"Dictionnaire {lib} — lettre {L.upper()} ({name})",
                "statut": "inventorié",
                "type_terme": "mot, expression",
                "url": BASE + name,
                "format_ligne": (
                    "<français>.- <alsacien(s) séparés par des virgules>"
                    if sens == "fr_als"
                    else "<alsacien>.- <traduction(s) française(s)>"
                ),
                "volumetrie_estimee": count_entries(path),
                "notes": "Comptage brut des lignes « .- » (certaines entrées "
                         "s'étendent sur plusieurs lignes, certaines pages "
                         "portent des notes de prononciation en tête).",
            })

    # --- 3. pages villes / prénoms : complément d'observations ---
    rubriques.append({
        "cle": "villes_villages_hr",
        "libelle": "Villes et villages du Haut-Rhin",
        "statut": "inventorié",
        "type_terme": "toponyme",
        "url": BASE + "villes_villages.htm",
        "format_ligne": "<code postal> <nom alsacien> <nom français>",
        "region": "haut_rhin",
        "volumetrie_estimee": 401,
        "notes": "3 colonnes parallèles par bloc de lettre (ordre : code "
                 "postal | nom alsacien | nom français). Comptage : 401 codes, "
                 "399 noms alsaciens, 401 noms français — la colonne alsacienne "
                 "compte 2 cellules de moins : alignement par position à "
                 "vérifier au parse. Le code postal 68xxx porte la région.",
    })
    rubriques.append({
        "cle": "villes_villages_br",
        "libelle": "Villes et villages du Bas-Rhin",
        "statut": "inventorié",
        "type_terme": "toponyme",
        "url": BASE + "villes_villagesB.R.htm",
        "format_ligne": "<code postal> <nom français> <nom alsacien>",
        "region": "bas_rhin",
        "volumetrie_estimee": 596,
        "notes": "Ordre des colonnes DIFFÉRENT du Haut-Rhin : code postal | "
                 "nom français | nom alsacien. Comptage : 596 cellules de "
                 "codes (dont 18 coquilles « O » pour « 0 », ex. 6731O, et un "
                 "code à 4 chiffres : 6730), 573 noms français, 601 noms "
                 "alsaciens — colonnes déséquilibrées, alignement par position "
                 "à vérifier au parse. Le code postal 67xxx porte la région.",
    })
    rubriques.append({
        "cle": "prenoms",
        "libelle": "Prénoms alsaciens",
        "statut": "inventorié",
        "type_terme": "prenom",
        "url": BASE + "prenomsalsaciens.htm",
        "format_ligne": "<prénom(s) alsacien(s) séparés par /> <prénom français>",
        "volumetrie_estimee": 136,
        "notes": "Paires de colonnes (alsacien en gras | français) par bloc de "
                 "lettre. 136 paires, 179 formes alsaciennes une fois les "
                 "variantes « / » éclatées : chaque variante d'une même paire "
                 "produira une attestation pour le même prénom français, avec "
                 "la même graphie_origine.",
    })

    # --- 4. fiche ---
    fiche = json.loads(FICHE.read_text(encoding="utf-8"))
    fiche["rubriques"] = rubriques
    fiche["inventaire_complet"] = True
    fiche.pop("_a_faire", None)
    FICHE.write_text(
        json.dumps(fiche, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    total = sum(r.get("volumetrie_estimee", 0) for r in rubriques
                if r["cle"].startswith("dico_"))
    print(f"fiche écrite : {FICHE}")
    print(f"rubriques : {len(rubriques)} (dont {len(LETTERS)*2} pages de "
          f"dictionnaire, ~{total} entrées dictionnaire comptées)")
    print(f"copies brutes : {len(copied)} fichiers dans {RAW}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
