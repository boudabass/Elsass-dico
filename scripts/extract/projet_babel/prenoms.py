#!/usr/bin/env python3
"""Parseur de la rubrique prenoms — source projet_babel.

Lit data/raw/projet_babel/prenoms.htm (JAMAIS le réseau) et produit
data/attestations/projet_babel__prenoms.jsonl.

STRUCTURE DE LA PAGE (constatée sur le brut, jamais déduite)
------------------------------------------------------------
Une table, deux cellules de contenu, une ligne physique par entrée, les
entrées séparées par <br> :

    <td width="14%" nowrap>  -> prénoms FRANÇAIS
    <td width="86%" nowrap>  -> prénoms ALSACIENS (texte dans <font>)

L'alignement est POSITIONNEL : la ligne i de la colonne française est
appariée à la ligne i de la colonne alsacienne. Chaque cellule se termine
par un <br> final, dont le segment vide est ignoré. Les deux colonnes
doivent avoir le même nombre de lignes, sinon le parseur s'arrête sans
rien écrire.

RÈGLES APPLIQUÉES (contrat data/README.md)
------------------------------------------
- Décodage UTF-8 strict, puis html.unescape. Rien d'autre : aucune
  correction, aucune normalisation.
- Côté français : une virgule sépare deux prénoms (« Fernand, Ferdinand »).
  Une attestation par prénom français et par forme alsacienne.
- Côté alsacien : une virgule ou une espace sépare des formes (« Schang,
  Schängele, Hans, Hansel » ; « Madel Len »). Une attestation par forme.
  La découpe est mécanique : le contrôle des formes en plusieurs mots
  reste à faire par un humain (voir le rapport).
- graphie_origine = la ligne entière « <français>  <alsacien> », deux
  espaces, colonnes dans l'ordre de la source (français d'abord ici),
  avant tout découpage.
- reference = prenoms.htm#L<n>, n = ligne physique où commence la forme
  alsacienne dans le brut.
- contexte = "", type = "prenom", region ABSENTE (la page n'en porte pas).

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
RAW = REPO / "data" / "raw" / "projet_babel" / "prenoms.htm"
OUT = REPO / "data" / "attestations" / "projet_babel__prenoms.jsonl"

SOURCE_CODE = "projet_babel"
TYPE = "prenom"
CONTEXTE = ""

MARQUE_FR = '<td width="14%" nowrap>'
MARQUE_AL = '<td width="86%" nowrap>'
BR = re.compile(r"<br\s*/?>", re.IGNORECASE)
ENTITE_RESTANTE = re.compile(r"&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);")


class Arret(Exception):
    """Erreur qui arrête le parseur sans rien écrire."""


def cellule(texte: str, marque: str) -> tuple[int, int]:
    """Bornes (début, fin) du contenu d'une cellule identifiée par sa marque."""
    if texte.count(marque) != 1:
        raise Arret(f"marque de cellule présente {texte.count(marque)} fois : {marque}")
    debut = texte.index(marque) + len(marque)
    fin = texte.index("</td>", debut)
    return debut, fin


def premier_texte(brut: str) -> int:
    """Index du premier caractère de texte, hors blancs et balises."""
    i = 0
    while i < len(brut):
        if brut[i].isspace():
            i += 1
        elif brut[i] == "<":
            j = brut.find(">", i)
            i = len(brut) if j == -1 else j + 1
        else:
            break
    return i


def lignes_de_cellule(texte: str, debut: int, fin: int) -> list[tuple[int, str]]:
    """[(ligne physique, texte propre)] pour chaque segment séparé par <br>."""
    lignes = []
    pos = debut
    coupures = list(BR.finditer(texte, debut, fin))
    for m in coupures + [None]:
        seg_fin = m.start() if m else fin
        brut = texte[pos:seg_fin]
        ligne = 1 + texte.count("\n", 0, pos + premier_texte(brut))
        propre = html.unescape(re.sub(r"<[^>]*>", "", brut)).strip()
        if ENTITE_RESTANTE.search(propre):
            raise Arret(f"ligne {ligne} : entité HTML non décodée : {propre!r}")
        lignes.append((ligne, propre))
        if m:
            pos = m.end()
    return lignes


def extraire() -> tuple[list[dict], int]:
    """Retourne (attestations, nombre de lignes source par colonne)."""
    texte = RAW.read_bytes().decode("utf-8")  # strict : une erreur d'encodage arrête tout

    fr = lignes_de_cellule(texte, *cellule(texte, MARQUE_FR))
    al = lignes_de_cellule(texte, *cellule(texte, MARQUE_AL))

    # Segment vide final de chaque cellule : retiré. Tout autre vide est une anomalie.
    if fr[-1][1] != "" or al[-1][1] != "":
        raise Arret("une cellule ne se termine pas par un <br> vide")
    fr, al = fr[:-1], al[:-1]
    vides = [l for l, t in fr + al if t == ""]
    if vides:
        raise Arret(f"ligne vide à l'intérieur d'une cellule : lignes {vides}")
    if len(fr) != len(al):
        raise Arret(f"colonnes déséquilibrées : {len(fr)} français / {len(al)} alsaciens")

    attestations = []
    for (l_fr, t_fr), (l_al, t_al) in zip(fr, al):
        prenoms_fr = [p.strip() for p in t_fr.split(",") if p.strip()]
        formes = [f for f in re.split(r"[,\s]+", t_al) if f]
        graphie = f"{t_fr}  {t_al}"
        for prenom in prenoms_fr:
            for forme in formes:
                attestations.append({
                    "source_code": SOURCE_CODE,
                    "francais": prenom,
                    "alsacien": forme,
                    "graphie_origine": graphie,
                    "type": TYPE,
                    "contexte": CONTEXTE,
                    "reference": f"prenoms.htm#L{l_al}",
                })
    return attestations, len(al)


def main() -> int:
    if not RAW.exists():
        print(f"brut introuvable : {RAW}", file=sys.stderr)
        return 1
    try:
        attestations, nb_lignes = extraire()
    except Arret as e:
        print(f"ARRÊT, rien écrit : {e}", file=sys.stderr)
        return 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="\n") as f:
        for att in attestations:
            f.write(json.dumps(att, ensure_ascii=False) + "\n")

    print(f"lignes source par colonne : {nb_lignes}")
    print(f"attestations écrites : {len(attestations)}")
    print(f"JSONL : {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
