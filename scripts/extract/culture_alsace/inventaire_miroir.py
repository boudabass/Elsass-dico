#!/usr/bin/env python3
"""Inventaire du miroir culture_alsace (campagne 1) — ed-prospecteur.

Génère data/sources/culture_alsace.json (rubriques complètes,
inventaire_complet=true) et dépose les copies brutes dans
data/raw/culture_alsace/ à partir d'un répertoire de téléchargement.

Rejouable : le même répertoire source doit produire le même JSON et les
mêmes octets dans raw/. Aucune forme alsacienne n'est lue ni recopiée ici —
seuls des comptages structurels (lignes « .- », cellules des tables
villes/prénoms) et les URL servent à documenter la fiche.

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


def analyse_villes_br(path: Path) -> dict:
    """Comptages structurels de la page Bas-Rhin (villes_villagesB.R.htm),
    mêmes gabarit et découpage que le parseur villes_villages_br.py : 2
    blocs de 3 colonnes (code postal | nom français | nom alsacien) séparés
    par une cellule image. Ne lit aucune forme : ne renvoie que des
    comptages — c'est LE compteur de la fiche pour cette rubrique."""
    text = path.read_bytes().decode("latin1", errors="replace")
    gabarit = ["8", "18", "19", "10", "8", "18", "19"]
    cellules_code = 0
    codes_vides = 0
    coquilles_par_code: dict[str, int] = {}
    codes_4: list[str] = []
    noms_francais = 0   # colonne 18% (déclaration BR : nom français)
    noms_alsaciens = 0  # colonne 19% (déclaration BR : nom alsacien)
    for tmatch in re.finditer(r"<TABLE.*?</TABLE>", text,
                              flags=re.S | re.I):
        tds = list(re.finditer(
            r'<TD\s+WIDTH="(\d+)%"[^>]*>(.*?)</TD>', tmatch.group(0),
            flags=re.S | re.I))
        if [m.group(1) for m in tds] != gabarit:
            continue  # table hors gabarit : ignorée (comme le parseur)
        for idxs in ((0, 1, 2), (4, 5, 6)):
            cols = []
            for ti in idxs:
                inner = tds[ti].group(2)
                cells = []
                for p in re.split(r"(<BR\s*/?>)", inner, flags=re.I):
                    if re.match(r"<BR\s*/?>", p, flags=re.I):
                        continue
                    cells.append(html.unescape(
                        re.sub(r"<[^>]+>", "", p)).strip())
                while cells and cells[-1] == "":
                    cells.pop()
                cols.append(cells)
            n = max(len(c) for c in cols)
            cellules_code += len(cols[0])
            for i in range(n):
                code = cols[0][i] if i < len(cols[0]) else ""
                fr = cols[1][i] if i < len(cols[1]) else ""
                als = cols[2][i] if i < len(cols[2]) else ""
                if code == "":
                    codes_vides += 1
                if "O" in code:
                    coquilles_par_code[code] = \
                        coquilles_par_code.get(code, 0) + 1
                if re.fullmatch(r"\d{4}", code):
                    codes_4.append(code)
                if fr != "":
                    noms_francais += 1
                if als != "":
                    noms_alsaciens += 1
    return {
        "cellules_code": cellules_code,
        "codes_vides": codes_vides,
        "coquilles": sum(coquilles_par_code.values()),
        "coquilles_distincts": len(coquilles_par_code),
        "coquilles_multi": {c: n for c, n in coquilles_par_code.items()
                            if n > 1},
        "noms_francais": noms_francais,
        "noms_alsaciens": noms_alsaciens,
        "codes_4": sorted(codes_4),
    }


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
        dst = RAW / f.name
        if dst.exists() and dst.read_bytes() == f.read_bytes():
            continue  # déjà en place, octets identiques (rejeu sur raw/)
        shutil.copy2(f, dst)
        copied.append(f.name)

    # --- 2. rubriques du dictionnaire (une entrée par page) ---
    # On conserve les rubriques de l'ancienne fiche qui ne décrivent pas une
    # page du miroir : lexique_a_d documente l'extraction antérieure au studio
    # (dossier Dictionnaire/, 7260 entrées A-D) — un fait d'historique, pas une
    # page. Les trois rubriques villes/prenoms sont remplacées par leur version
    # inventoriée ci-dessous. Les statuts de cycle de vie (inventorié → extrait
    # → vérifié → ingéré) appartiennent au studio : la régénération les
    # préserve, elle ne les réinitialise pas. Idem pour les blocs
    # « verification » (verdict de carte, graine, échantillon).
    ancienne = json.loads(FICHE.read_text(encoding="utf-8"))["rubriques"]
    statut_precedent = {r["cle"]: r["statut"] for r in ancienne}
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
                "statut": statut_precedent.get(f"dico_{sens}_{L}",
                                               "inventorié"),
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
        "statut": statut_precedent.get("villes_villages_hr", "inventorié"),
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
    br_path = src / "villes_villagesB.R.htm"
    if not br_path.exists():
        print("page manquante : villes_villagesB.R.htm")
        return 1
    br = analyse_villes_br(br_path)
    multi = " ; ".join(f"{c} ×{n}" for c, n in
                       sorted(br["coquilles_multi"].items()))
    coq = "coquille" if br["coquilles"] == 1 else "coquilles"
    if br["codes_4"]:
        if len(br["codes_4"]) == 1:
            code4 = f"1 code à 4 chiffres : {br['codes_4'][0]}"
        else:
            code4 = (f"{len(br['codes_4'])} codes à 4 chiffres : "
                     f"{', '.join(br['codes_4'])}")
    else:
        code4 = "aucun code à 4 chiffres"
    note_br = (
        "Ordre des colonnes DIFFÉRENT du Haut-Rhin : code postal | "
        "nom français | nom alsacien. Comptage : "
        f"{br['cellules_code']} cellules de codes "
        f"(dont {br['codes_vides']} vides), "
        f"{br['coquilles']} {coq} « O » pour « 0 » "
        f"({br['coquilles_distincts']} codes distincts"
    )
    if multi:
        note_br += f" ; {multi}"
    note_br += (
        f"), {code4} — colonnes déséquilibrées : "
        f"{br['noms_francais']} noms français (colonne 18%), "
        f"{br['noms_alsaciens']} noms alsaciens non vides "
        "(colonne 19%), alignement par position à vérifier au parse. "
        "Le code postal 67xxx porte la région."
    )
    rubriques.append({
        "cle": "villes_villages_br",
        "libelle": "Villes et villages du Bas-Rhin",
        "statut": statut_precedent.get("villes_villages_br", "inventorié"),
        "type_terme": "toponyme",
        "url": BASE + "villes_villagesB.R.htm",
        "format_ligne": "<code postal> <nom français> <nom alsacien>",
        "region": "bas_rhin",
        "volumetrie_estimee": br["cellules_code"],
        "notes": note_br,
    })
    rubriques.append({
        "cle": "prenoms",
        "libelle": "Prénoms alsaciens",
        "statut": statut_precedent.get("prenoms", "inventorié"),
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

    # --- 3bis. verdicts de verification preserves (comme statut) ---
    # Regle John (09/08/2026) : le generateur calcule ce qu'il tire du brut
    # et PRESERVE ce qui releve d'un jugement humain ou d'un verdict de carte.
    # S'il ecrase un verdict, c'est le generateur qui a un defaut — pas le
    # verdict qui etait mal range.
    verification_precedente = {
        r["cle"]: r.get("verification") for r in ancienne
    }
    for r in rubriques:
        v = verification_precedente.get(r["cle"])
        if v:
            r["verification"] = v

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
