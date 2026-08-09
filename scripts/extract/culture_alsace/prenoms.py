#!/usr/bin/env python3
"""Parseur de la rubrique prenoms — source culture_alsace.

Lit data/raw/culture_alsace/prenomsalsaciens.htm (JAMAIS le réseau) et
produit data/attestations/culture_alsace__prenoms.jsonl.

Le brut garde le nom de la page (prenomsalsaciens.htm) et le JSONL prend celui
de la RUBRIQUE (prenoms) : c'est la clé de rubrique de la fiche source qui
nomme le lot, sinon --rubrique ne le désigne pas.

STRUCTURE DE LA PAGE (constatée sur le brut, jamais déduite)
------------------------------------------------------------
19 tables <TABLE> à 5 cellules : une cellule image (WIDTH=10%) puis DEUX
blocs de 2 colonnes (WIDTH=22.5%) :

    bloc gauche : TD1 -> prénoms ALSACIENS (en gras <B>)
                  TD2 -> prénoms FRANÇAIS
    bloc droit  : TD3 -> prénoms ALSACIENS (en gras <B>)
                  TD4 -> prénoms FRANÇAIS

Chaque cellule contient des lignes séparées par <BR> (ou <Br>). L'alignement
est POSITIONNEL : la ligne i de la colonne alsacienne appariée à la ligne i
de la colonne française (format de ligne de la fiche : « <prénom(s)
alsacien(s) séparés par /> <prénom français> »).

RÈGLES APPLIQUÉES (article 720 + décisions de carte)
----------------------------------------------------
- Copie verbatim après décodage des entités HTML (html.unescape).
- UNE ligne JSONL PAR VARIANTE alsacienne : une ligne alsacienne « Màri /
  Maria » appariée à « Marie » produit (Marie, Màri) et (Marie, Maria), avec
  la MÊME graphie_origine pour toutes (la ligne de paire entière avant
  découpage : « Màri / Maria  Marie », deux espaces — format documenté de
  l'article 720).
- Le séparateur de variantes est « / » (espace-slash-espace), tel qu'écrit
  dans la source. Seule la colonne ALSACIENNE est découpée. La colonne
  FRANÇAISE est copiée verbatim, y compris quand elle porte elle-même un
  « / » (5 cas : Barbe / Barbara L55, Sylvain / Sylvestre L258, Gilles /
  Gilbert L266, Stéphane / Stéphanie L267, Théodore / Théophile L278) : ce
  sont des variantes côté français, signalées en anomalies, jamais découpées
  ni appariées (on ne sait pas quelle variante alsacienne correspond à
  laquelle).
- CELLULE VIDE = SÉPARATEUR (décision de carte, alignée sur l'inventaire
  136 paires / 179 formes) : une ligne vide dans une colonne est une ligne
  de blanc (saut visuel), pas une donnée manquante. Les cellules vides sont
  retirées des DEUX colonnes avant l'appariement positionnel. Un seul cas
  dans la page : la cellule française vide du bloc droit de la table S
  (ligne 266, « Gilles / Gilbert<BR><BR>Georges ») — sans ce retrait,
  « Schorsch / Schorschala » resterait sans français et « Christophe » sans
  alsacien, et l'inventaire (136 paires / 179 formes) ne serait pas
  atteint. L'appariement compacté est sémantiquement cohérent (Schorsch =
  Georges, Schtoffel / Kreschti = Christophe, Stani = Stanislas…).
- region : ABSENTE. La page ne porte aucune information de région (pas de
  code postal, pas d'intitulé régional) — la règle du contrat interdit de
  la déduire de l'allure des formes.
- graphie_origine : la ligne de paire entière « <alsacien>  <français> »
  (deux espaces, format de l'article 720) avant tout découpage — c'est elle
  qui rend la vérification possible.
- reference : prenomsalsaciens.htm#L<n>, n = ligne physique du fichier raw
  où commence la ligne ALSACIENNE de la paire (colonne de tête du bloc).

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
RAW = REPO / "data" / "raw" / "culture_alsace" / "prenomsalsaciens.htm"
OUT = REPO / "data" / "attestations" / "culture_alsace__prenoms.jsonl"

SOURCE_CODE = "culture_alsace"
TYPE = "prenom"

# Gabarit déclaré d'une table : image + 2 blocs de 2 colonnes.
GABARIT = ["10", "22.5", "22.5", "22.5", "22.5"]

# Séparateur de variantes alsaciennes, tel qu'écrit dans la source.
SEP_VARIANTS = " / "


def has_malformed_entity(raw: str) -> bool:
    """True si le texte brut porte un token « &xxx » qui n'est pas une
    entité HTML5 connue (nom avec ou sans « ; »)."""
    from html.entities import html5
    for m in re.finditer(r"&([a-zA-Z]{2,12});?", raw):
        name = m.group(1)
        key = name + (";" if m.group(0).endswith(";") else "")
        if key not in html5:
            return True
    return False


def line_of(text: str, seg_start: int, inner_start: int, lead: int) -> int:
    """Numéro de ligne (1-based) du premier caractère significatif."""
    pos = inner_start + seg_start + lead
    return 1 + text.count("\n", 0, pos)


def split_cell(inner: str, text: str, inner_start: int
               ) -> tuple[list[str], list[int], list[bool], list[int]]:
    """Découpe le contenu d'une cellule sur <BR> (insensible à la casse).

    Retourne (valeurs nettoyées, numéros de ligne physiques, entité
    malformée ?, lignes des blancs INTÉRIEURS retirés). Les segments vides
    sont RETIRÉS : c'est la règle « cellule vide = séparateur » (décision
    de carte, alignée sur l'inventaire 136 paires / 179 formes). Seuls les
    blancs INTÉRIEURS (une valeur au moins après eux dans la même cellule)
    sont retournés : les blancs de fin de cellule (le <BR> de fermeture du
    markup) ne décalent aucun alignement et ne sont pas des données.
    """
    values: list[str] = []
    lines: list[int] = []
    malformed: list[bool] = []
    blanks: list[int] = []
    seg_start = 0
    for p in re.split(r"(<BR\s*/?>)", inner, flags=re.I):
        if re.match(r"<BR\s*/?>", p, flags=re.I):
            seg_start += len(p)
            continue
        # position du premier caractère significatif (hors tags et espaces)
        idx = 0
        while idx < len(p):
            ch = p[idx]
            if ch.isspace():
                idx += 1
            elif ch == "<":
                m = re.match(r"<[^>]*>", p[idx:])
                idx += len(m.group(0)) if m else 1
            else:
                break
        clean = html.unescape(re.sub(r"<[^>]+>", "", p)).strip()
        if clean == "":
            blanks.append(line_of(text, seg_start, inner_start, idx))
            seg_start += len(p)
            continue
        values.append(clean)
        lines.append(line_of(text, seg_start, inner_start, idx))
        malformed.append(has_malformed_entity(re.sub(r"<[^>]+>", "", p)))
        seg_start += len(p)
    # ne garder que les blancs intérieurs : un blanc est intérieur s'il
    # n'est pas le dernier segment vide (tous les segments vides ont été
    # collectés dans l'ordre ; le dernier est le blanc de fin de cellule).
    if blanks and values:
        # un blanc de fin de cellule est le DERNIER segment : il apparaît
        # après la dernière valeur. On garde les blancs dont la position
        # est avant la position de la dernière valeur.
        last_val_line = lines[-1]
        blanks = [b for b in blanks if b < last_val_line]
    else:
        blanks = []
    return values, lines, malformed, blanks


def extract() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    """Retourne (attestations, omissions, anomalies, infos_variantes)."""
    text = RAW.read_bytes().decode("latin1")
    lines_total = text.count("\n") + (0 if text.endswith("\n") else 1)

    attestations: list[dict] = []
    omissions: list[dict] = []
    anomalies: list[dict] = []
    infos_variantes: list[dict] = []
    tables_vues = 0
    paires = 0
    variantes = 0

    for tmatch in re.finditer(r"<TABLE.*?</TABLE>", text, flags=re.S | re.I):
        tbl = tmatch.group(0)
        tables_vues += 1
        tds = list(re.finditer(
            r'<TD\s+WIDTH="(\d+(?:\.\d+)?)%"[^>]*>(.*?)</TD>',
            tbl, flags=re.S | re.I))
        widths = [m.group(1) for m in tds]
        if widths != GABARIT:
            anomalies.append({
                "type": "structure",
                "detail": f"table {tables_vues} hors gabarit "
                          f"{widths} — ignorée",
            })
            continue

        for block, (ia, ifr) in (("gauche", (1, 2)), ("droite", (3, 4))):
            als, l_als, malf_als, blanks_als = split_cell(
                tds[ia].group(2), text,
                tmatch.start() + tds[ia].start(2))
            fr, l_fr, malf_fr, blanks_fr = split_cell(
                tds[ifr].group(2), text,
                tmatch.start() + tds[ifr].start(2))
            blk = f"table {tables_vues} bloc {block}"

            # lignes de blanc retirées (cellule vide = séparateur) :
            # signaler chaque retrait — c'est la décision qui rend
            # l'appariement conforme à l'inventaire.
            for lb in blanks_als + blanks_fr:
                anomalies.append({
                    "type": "ligne_de_blanc_retiree",
                    "ligne": lb,
                    "detail": f"{blk} — ligne de blanc retirée avant "
                              f"appariement (cellule vide = séparateur)",
                })

            # déséquilibre résiduel après retrait des blancs : omettre
            # les lignes excédentaires (règle 3), les lister.
            if len(als) != len(fr):
                anomalies.append({
                    "type": "colonnes_desequilibrees",
                    "detail": f"{blk} : {len(als)} alsaciens / {len(fr)} "
                              f"français après retrait des lignes de blanc",
                })

            n = min(len(als), len(fr))
            for i in range(n):
                paires += 1
                lref = l_als[i]
                ligne_brute = f"{als[i]}  {fr[i]}"
                variants = [v.strip() for v in als[i].split(SEP_VARIANTS)]
                variants = [v for v in variants if v != ""]
                for v in variants:
                    variantes += 1
                    attestations.append({
                        "source_code": SOURCE_CODE,
                        "francais": fr[i],
                        "alsacien": v,
                        "graphie_origine": ligne_brute,
                        "type": TYPE,
                        "contexte": "",
                        "reference": f"prenomsalsaciens.htm#L{lref}",
                    })
                if len(variants) > 1:
                    infos_variantes.append({
                        "ligne": lref,
                        "detail": f"{blk} : {als[i]} — {len(variants)} "
                                  f"variantes éclatées",
                    })
                if malf_als[i] or malf_fr[i]:
                    anomalies.append({
                        "type": "entite_malformee",
                        "ligne": lref,
                        "detail": f"{blk} : {ligne_brute}",
                    })
                # variantes côté FRANÇAIS : copiées verbatim, jamais
                # découpées (on ne sait pas apparier).
                if SEP_VARIANTS in fr[i]:
                    anomalies.append({
                        "type": "variantes_cote_francais",
                        "ligne": l_fr[i],
                        "detail": f"{blk} : « {fr[i]} » copié verbatim, "
                                  f"non découpé",
                    })

            if n < len(als):
                for i in range(n, len(als)):
                    omissions.append({
                        "bloc": blk,
                        "position": i + 1,
                        "ligne": l_als[i],
                        "raison": "ligne alsacienne sans français après "
                                  "retrait des lignes de blanc",
                        "contenu": als[i],
                    })
            if n < len(fr):
                for i in range(n, len(fr)):
                    omissions.append({
                        "bloc": blk,
                        "position": i + 1,
                        "ligne": l_fr[i],
                        "raison": "ligne française sans alsacien après "
                                  "retrait des lignes de blanc",
                        "contenu": fr[i],
                    })

    print(f"fichier lu : {RAW}")
    print(f"lignes physiques : {lines_total}")
    print(f"tables : {tables_vues}")
    print(f"paires appariées : {paires}")
    print(f"variantes alsaciennes éclatées (attestations) : {variantes}")
    print(f"lignes omises : {len(omissions)}")
    print(f"anomalies signalées : {len(anomalies)}")
    print(f"paires à variantes multiples : {len(infos_variantes)}")
    return attestations, omissions, anomalies, infos_variantes


def main() -> int:
    if not RAW.exists():
        print(f"brut introuvable : {RAW}", file=sys.stderr)
        return 1

    attestations, omissions, anomalies, infos_variantes = extract()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        for att in attestations:
            fh.write(json.dumps(att, ensure_ascii=False) + "\n")

    if omissions:
        print("\n--- LIGNES OMISES (non produites, à arbitrer) ---")
        for o in omissions:
            print(f"  {o['bloc']} pos {o['position']} ligne {o['ligne']} "
                  f"— {o['raison']} : « {o['contenu']} »")
    if anomalies:
        print("\n--- ANOMALIES OBSERVÉES (non corrigées) ---")
        for a in anomalies:
            print(f"  [{a['type']}] ligne {a.get('ligne', '?')} : "
                  f"{a.get('detail', '')}".rstrip())
    if infos_variantes:
        print("\n--- PAIRES À VARIANTES MULTIPLES (éclatées, format 720) ---")
        for v in infos_variantes:
            print(f"  ligne {v['ligne']} : {v['detail']}")

    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
