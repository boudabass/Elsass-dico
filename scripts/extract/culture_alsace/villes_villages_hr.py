#!/usr/bin/env python3
"""Parseur de la rubrique villes_villages_hr — source culture_alsace.

Lit data/raw/culture_alsace/villes_villages.htm (JAMAIS le réseau) et
produit data/attestations/culture_alsace__villes_villages_hr.jsonl.

MAPPING DE COLONNES DÉCLARÉ (constaté sur la page, jamais déduit)
------------------------------------------------------------------
Chaque <TABLE> du fichier porte DEUX blocs de 3 colonnes parallèles,
séparés par une cellule image (WIDTH=10%) :

    bloc gauche : WIDTH=8%  -> code postal
                  WIDTH=18% -> nom alsacien
                  WIDTH=19% -> nom français
    bloc droit  : idem, après la cellule image.

Les 23 tables du fichier suivent toutes ce gabarit ; toute table hors
gabarit est signalée sur stdout et ignorée.

RÈGLES APPLIQUÉES (décision John, GATE inventaire 08/08/2026)
--------------------------------------------------------------
- Copie verbatim après décodage des entités HTML (html.unescape).
  Une entité malformée (ex. « &uumlsa ») est décodée comme html.unescape
  le fait (déterministe) et signalée comme anomalie — jamais corrigée.
- Alignement par position dans chaque bloc. Toute cellule vide (nom
  alsacien manquant) ou colonne déficitaire entraîne l'OMISSION de la
  ligne du JSONL ; la ligne est listée sur stdout avec son numéro.
- region : « haut_rhin » si le code commence par 68, « bas_rhin » si
  par 67, ABSENT sinon. Le code postal est une information présente
  dans la source : le lire n'est pas une déduction. Un code à préfixe
  65/58 (coquilles probables) garde region absent et est signalé.
- EXCLUSIONS_MAPPING (décision John, GATE inventaire 08/08/2026) : la
  colonne française doit correspondre au nom officiel de la commune
  associée au code postal (pièce : BOCP La Poste). Deux lignes de la
  source portent une colonne française hors référentiel, confirmées par
  ed-verificateur (carte t_c1be5ce4) :
      « 68580 Schtrüet Eschie »     — officiel attendu : Strueth
      « 68600 Owersààsa Owersààsa » — officiel attendu : Obersaasheim
  Règle 1 interdit de corriger (copie verbatim) : ces lignes sont OMISES
  du JSONL et listées dans le rapport (règle 3), avec la valeur officielle
  attendue. La clé d'exclusion est le triplet décodé (code, alsacien,
  francais) — unique dans la source, à la différence de la reference qui
  est partagée par tout un bloc.
- graphie_origine : la ligne logique complète « <code> <alsacien>
  <français> » avant découpage (format de ligne de la fiche source).
- reference : villes_villages.htm#L<n>, où n est la ligne physique du
  fichier raw contenant la cellule du code postal.

REJOUABILITÉ
------------
Deux exécutions successives sur le même brut produisent un JSONL
identique (git diff vide) : c'est la preuve qu'aucune ligne n'a été
saisie à la main.
"""

import html
import json
import re
import sys
from html.entities import html5
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW = REPO / "data" / "raw" / "culture_alsace" / "villes_villages.htm"
OUT = REPO / "data" / "attestations" / "culture_alsace__villes_villages_hr.jsonl"

SOURCE_CODE = "culture_alsace"
TYPE = "toponyme"

# Gabarit déclaré d'une table : 2 blocs de 3 colonnes + cellule image.
GABARIT = ["8", "18", "19", "10", "8", "18", "19"]

# Colonnes françaises hors référentiel officiel (décision John, GATE
# inventaire 08/08/2026 — pièce : BOCP La Poste, vérifiée par
# ed-verificateur t_c1be5ce4). Clé : triplet décodé (code, alsacien,
# francais), unique dans la source — la reference est partagée par tout
# un bloc et ne peut pas servir de clé. Valeur : nom officiel attendu,
# pour le rapport (jamais écrit dans le JSONL — règle 1, copie verbatim ;
# la ligne est OMISE, règle 3).
EXCLUSIONS_MAPPING = {
    ("68580", "Schtrüet", "Eschie"): "Strueth",
    ("68600", "Owersààsa", "Owersààsa"): "Obersaasheim",
}


def has_malformed_entity(raw: str) -> bool:
    """True si le texte brut porte un token « &xxx » qui n'est pas une
    entité HTML5 connue (nom avec ou sans « ; »). Ex. « &uumlsa » :
    html.unescape la décode quand même (« üsa »), on la signale."""
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


def extract() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    """Retourne (attestations, omissions, anomalies, a_verifier)."""
    text = RAW.read_bytes().decode("latin1")
    lines_total = text.count("\n") + (0 if text.endswith("\n") else 1)

    attestations: list[dict] = []
    omissions: list[dict] = []
    anomalies: list[dict] = []
    a_verifier: list[dict] = []
    tables_vues = 0
    blocs_vus = 0

    for tmatch in re.finditer(r"<TABLE.*?</TABLE>", text, flags=re.S | re.I):
        tbl = tmatch.group(0)
        tds = list(re.finditer(
            r'<TD\s+WIDTH="(\d+)%"[^>]*>(.*?)</TD>', tbl, flags=re.S | re.I))
        widths = [m.group(1) for m in tds]
        tables_vues += 1
        if widths != GABARIT:
            anomalies.append({
                "type": "structure",
                "detail": f"table {tables_vues} hors gabarit "
                          f"{widths} — ignorée",
            })
            continue

        for block, idxs in (("gauche", (0, 1, 2)), ("droite", (4, 5, 6))):
            blocs_vus += 1
            cols = []
            for j, ti in enumerate(idxs):
                inner = tds[ti].group(2)
                inner_start = tmatch.start() + tds[ti].start(2)
                cells = []
                seg_start = 0
                for p in re.split(r"(<BR\s*/?>)", inner, flags=re.I):
                    if re.match(r"<BR\s*/?>", p, flags=re.I):
                        seg_start += len(p)
                        continue
                    # premier caractère significatif du segment brut
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
                    malformed = has_malformed_entity(
                        re.sub(r"<[^>]+>", "", p))
                    cells.append((clean, line_of(text, seg_start,
                                                 inner_start, idx), malformed))
                    seg_start += len(p)
                # retirer la cellule vide traînante
                while cells and cells[-1][0] == "":
                    cells.pop()
                cols.append(cells)

            n = max(len(c) for c in cols)
            for i in range(n):
                row = [c[i][0] if i < len(c) else "" for c in cols]
                lines = [c[i][1] if i < len(c) else 0 for c in cols]
                malf = [c[i][2] if i < len(c) else False for c in cols]
                if any(r == "" for r in row):
                    manquante = ["code postal", "nom alsacien",
                                 "nom français"][row.index("")]
                    omissions.append({
                        "bloc": f"table {tables_vues} bloc {block}",
                        "position": i + 1,
                        "ligne": lines[row.index("")] or max(lines),
                        "raison": f"cellule {manquante} vide",
                        "contenu": " ".join(row),
                    })
                    continue
                code, alsacien, francais = row
                l_code = lines[0]

                # colonne française hors référentiel officiel (GATE
                # inventaire) : la ligne est OMISE du JSONL (règle 3),
                # jamais corrigée (règle 1 — copie verbatim). L'officiel
                # attendu est porté dans le rapport pour ré-admission
                # ultérieure par arbitrage.
                exclusion = EXCLUSIONS_MAPPING.get((code, alsacien, francais))
                if exclusion is not None:
                    omissions.append({
                        "bloc": f"table {tables_vues} bloc {block}",
                        "position": i + 1,
                        "ligne": l_code,
                        "raison": f"colonne française hors référentiel "
                                  f"officiel — attendu « {exclusion} » "
                                  f"(BOCP La Poste, GATE inventaire)",
                        "contenu": " ".join(row),
                    })
                    continue

                # coquilles / codes hors 67/68
                if not re.fullmatch(r"\d{5}", code):
                    anomalies.append({
                        "type": "code_non_numerique",
                        "ligne": l_code,
                        "detail": code,
                    })
                if not code.startswith(("67", "68")):
                    anomalies.append({
                        "type": "code_hors_67_68",
                        "ligne": l_code,
                        "detail": f"{code} {alsacien} {francais}",
                    })

                # contrôle colonne française (consigne 2) :
                # écarts structurels CONFIRMÉS (la source n'écrit pas le
                # nom officiel complet) — jamais corrigés.
                for marker, label in ((".", "abréviation"),
                                      ("(", "qualificatif entre parenthèses"),
                                      ("--", "double trait d'union")):
                    if marker in francais:
                        anomalies.append({
                            "type": f"francais_{label.replace(' ', '_')}",
                            "ligne": lines[2],
                            "detail": francais,
                        })

                # entité HTML malformée dans le BRUT (ex. « &uumlsa » sans
                # point-virgule) : décodée comme html.unescape le fait,
                # signalée — jamais corrigée.
                if any(malf):
                    anomalies.append({
                        "type": "entite_malformee",
                        "ligne": lines[malf.index(True)],
                        "detail": f"{alsacien} / {francais}",
                    })

                # colonne française == colonne alsacienne : candidat au
                # contrôle 2 (nom identique légitime OU forme alsacienne
                # recopiée par erreur dans la colonne française, ex.
                # « Owersààsa ») — à trancher par ed-verificateur.
                if francais == alsacien:
                    a_verifier.append({
                        "type": "francais_egal_alsacien",
                        "ligne": lines[2],
                        "detail": f"{code} {alsacien} {francais}",
                    })

                region = "haut_rhin" if code.startswith("68") else (
                    "bas_rhin" if code.startswith("67") else None)

                att = {
                    "source_code": SOURCE_CODE,
                    "francais": francais,
                    "alsacien": alsacien,
                    "graphie_origine": f"{code} {alsacien} {francais}",
                    "type": TYPE,
                    "contexte": "",
                }
                if region is not None:
                    att["region"] = region
                att["reference"] = f"villes_villages.htm#L{l_code}"
                attestations.append(att)

    print(f"fichier lu : {RAW}")
    print(f"lignes physiques : {lines_total}")
    print(f"tables : {tables_vues}, blocs de 3 colonnes : {blocs_vus}")
    print(f"attestations produites : {len(attestations)}")
    print(f"lignes omises : {len(omissions)}")
    print(f"anomalies signalées : {len(anomalies)}")
    print(f"candidats à vérifier (contrôle 2) : {len(a_verifier)}")
    return attestations, omissions, anomalies, a_verifier


def main() -> int:
    if not RAW.exists():
        print(f"brut introuvable : {RAW}", file=sys.stderr)
        return 1

    attestations, omissions, anomalies, a_verifier = extract()

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
                  f"{a.get('detail', '')} "
                  f"{a.get('contenu', '')}".rstrip())
    if a_verifier:
        print("\n--- CANDIDATS CONTRÔLE 2 (français == alsacien, "
              "à trancher par ed-verificateur) ---")
        for v in a_verifier:
            print(f"  [{v['type']}] ligne {v['ligne']} : {v['detail']}")

    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
