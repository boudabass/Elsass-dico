#!/usr/bin/env python3
"""Parseur de la rubrique insultes — source dj_fabz.

Lit data/raw/dj_fabz/insultes.htm (JAMAIS le réseau) et produit
data/attestations/dj_fabz__insultes.jsonl.

STRUCTURE DE LA PAGE (constatée sur le brut, jamais déduite)
------------------------------------------------------------
Une table, une ligne <TR> par entrée, trois <TD> :

    TD1 -> forme alsacienne
    TD2 -> mot à mot (souvent vide)
    TD3 -> sens (souvent vide)

Les <TR> portant une ancre <A NAME="X"> sont les en-têtes de lettre (A à Z) :
elles ne sont pas des entrées et ne sortent pas.

RÈGLES APPLIQUÉES (contrat data/README.md + décision John du 09/10/2026)
------------------------------------------------------------------------
- alsacien = TD1, verbatim : entités HTML décodées, espaces de bord retirés,
  rien d'autre. Une espace insécable interne (U+00A0) est conservée telle
  quelle, puisqu'elle est le résultat du décodage de &nbsp;.
- francais = TD3 (sens) si elle n'est pas vide, sinon TD2 (mot à mot), verbatim.
- contexte = "insulte" pour toutes les lignes : sépare « âne (insulte) » de
  l'animal, qui a son propre lemme.
- type = "expression" si le FRANÇAIS retenu contient une espace, sinon "mot".
  Le type entre dans la clé d'un lemme (cle, contexte, type), et le lemme est
  le mot français : typer par l'alsacien coupait « alcoolique (insulte) » en
  deux fiches, une par type (constaté en base le 09/10/2026, 6 clés).
- graphie_origine = la ligne entière « TD1 | TD2 | TD3 », avant tout choix de
  francais.
- reference = raw/dj_fabz/insultes.htm#L<n>, n = ligne physique du <TR>.
- region : absente. La page ne porte aucune information de région.

OMISSIONS (règle 3 du contrat : un doute se signale, il ne se comble pas)
------------------------------------------------------------------------
Une ligne est OMISE, et listée dans le rapport, si :
- TD1 est vide ;
- TD2 et TD3 sont toutes deux vides (aucun français à rattacher) ;
- TD1 contient « / », « , » ou « ; » (plusieurs formes dans une seule case :
  laquelle est la bonne n'est pas dit par la source) ;
- TD1 ou le français retenu contient encore une entité HTML non décodée.

REJOUABILITÉ
------------
Deux exécutions successives sur le même brut produisent un JSONL identique
(git diff vide) : c'est la preuve qu'aucune ligne n'a été saisie à la main.
Le parseur ne lit que data/raw/.
"""

import html
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW = REPO / "data" / "raw" / "dj_fabz" / "insultes.htm"
OUT = REPO / "data" / "attestations" / "dj_fabz__insultes.jsonl"

SOURCE_CODE = "dj_fabz"
CONTEXTE = "insulte"

# Caractères qui signalent plusieurs formes dans une seule case.
SEPARATEURS_MULTIPLES = ("/", ",", ";")


def texte_de_cellule(brut: str) -> str:
    """Texte d'une cellule : balises retirées, <BR> remplacé par une espace,
    entités décodées, espaces de bord retirés. Rien d'autre."""
    sans_br = re.sub(r"<br\s*/?>", " ", brut, flags=re.IGNORECASE)
    sans_balises = re.sub(r"<[^>]+>", "", sans_br)
    return html.unescape(sans_balises).strip()


def a_une_entite(texte: str) -> bool:
    """True si un nom d'entité ou un code numérique survit au décodage."""
    return re.search(r"&(?:[a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#x[0-9a-fA-F]+);", texte) is not None


def lire_entrees(brut: str):
    """Yield (ligne, cellules) pour chaque <TR> qui est une entrée."""
    for m in re.finditer(r"<tr[^>]*>([\s\S]*?)</tr>", brut, flags=re.IGNORECASE):
        corps = m.group(1)
        if re.search(r"<a\s+name=", corps, flags=re.IGNORECASE):
            continue  # en-tête de lettre
        cellules = re.findall(r"<td[^>]*>([\s\S]*?)</td>", corps, flags=re.IGNORECASE)
        ligne = 1 + brut.count("\n", 0, m.start())
        yield ligne, cellules


def main() -> int:
    brut = RAW.read_bytes().decode("latin-1")  # ISO-8859-1, vérifié avec `file`

    lignes_jsonl = []
    omises = []
    total = 0

    for ligne, cellules in lire_entrees(brut):
        total += 1
        if len(cellules) != 3:
            omises.append((ligne, f"{len(cellules)} cellules au lieu de 3", ""))
            continue

        forme, mot_a_mot, sens = (texte_de_cellule(c) for c in cellules)
        graphie = f"{forme} | {mot_a_mot} | {sens}"

        if forme == "":
            omises.append((ligne, "forme alsacienne vide", graphie))
            continue
        if any(s in forme for s in SEPARATEURS_MULTIPLES):
            omises.append((ligne, "plusieurs formes dans la case alsacienne", graphie))
            continue

        francais = sens if sens != "" else mot_a_mot
        if francais == "":
            omises.append((ligne, "ni sens ni mot à mot : aucun français", graphie))
            continue

        if a_une_entite(forme) or a_une_entite(francais):
            omises.append((ligne, "entité HTML non décodée", graphie))
            continue

        type_terme = "expression" if re.search(r"\s", francais) else "mot"

        lignes_jsonl.append({
            "source_code": SOURCE_CODE,
            "francais": francais,
            "alsacien": forme,
            "graphie_origine": graphie,
            "type": type_terme,
            "contexte": CONTEXTE,
            "reference": f"raw/dj_fabz/insultes.htm#L{ligne}",
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="\n") as f:
        for obj in lignes_jsonl:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")

    print(f"entrées lues : {total}")
    print(f"lignes JSONL écrites : {len(lignes_jsonl)}")
    print(f"lignes omises : {len(omises)}")
    for ligne, raison, graphie in omises:
        print(f"  L{ligne} | {raison} | {graphie}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
