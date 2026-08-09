#!/usr/bin/env python3
"""Parseur de la rubrique villes_villages_br — source culture_alsace.

Lit data/raw/culture_alsace/villes_villagesB.R.htm (JAMAIS le réseau) et
produit data/attestations/culture_alsace__villes_villages_br.jsonl.

MAPPING DE COLONNES DÉCLARÉ (constaté sur la page, jamais déduit)
------------------------------------------------------------------
Comme le Haut-Rhin (villes_villages.htm), chaque <TABLE> porte DEUX blocs
de 3 colonnes séparés par une cellule image (WIDTH=10%). MAIS l'ordre des
colonnes est INVERSÉ par rapport au HR (décision John, GATE inventaire) :

    bloc gauche : WIDTH=8%  -> code postal
                  WIDTH=18% -> nom FRANÇAIS
                  WIDTH=19% -> nom ALSACIEN
    bloc droit  : idem, après la cellule image.

Ce mapping est DÉCLARÉ PAR FICHIER : on ne copie pas le mapping du parseur
HR (où 18% = alsacien, 19% = français). Les 24 tables suivent ce gabarit ;
toute table hors gabarit est signalée sur stdout et ignorée.

RÈGLES APPLIQUÉES (décisions John, GATE inventaire 08/08/2026)
--------------------------------------------------------------
- Copie verbatim après décodage des entités HTML (html.unescape). Une entité
  malformée est décodée comme html.unescape le fait (déterministe) et
  signalée — jamais corrigée.
- Alignement par position dans chaque bloc. Les colonnes sont déséquilibrées
  (l'inventaire annonce 596 codes / 573 français / 601 alsaciens ; le parse
  observe 602 cellules de code dont 2 vides, 601 français, 601 alsaciens dont
  28 vides — l'inventaire a inversé les libellés français/alsacien : la
  colonne 18% porte 601 noms, la 19% en porte 573 non vides). Toute cellule
  vide (ou rangée manquante en fin de colonne) entraîne l'OMISSION de la
  ligne ; la ligne est listée avec son numéro. Un trou est réparable, une
  invention ne l'est pas.
- region : AMENDEMENT GATE 2 (message opérateur 08/08/2026) — la région se
  déduit de l'INTITULÉ DE PAGE, plus du code postal : villes_villagesB.R.htm
  est la page du Bas-Rhin -> region=bas_rhin pour TOUTES les lignes produites.
  Le code postal devient un CONTRÔLE : il signale les désaccords (codes hors
  67, coquilles O/0, formats anormaux), il ne décide plus. Les 18 coquilles
  « O » pour « 0 » (16 cellules observées, ex. 6731O) NE SE CORRIGENT PAS ;
  aucun code n'est réécrit ; le code reste dans graphie_origine.
- contexte : même dérivation que region — l'INTITULÉ DE PAGE est
  « Villes et villages du Bas-Rhin » -> contexte="Bas-Rhin" (EN
  CLAIR, valeur affichée à l'utilisateur, pas en snake_case) pour
  TOUTES les lignes du JSONL. Le contexte sépare les homonymes
  (CLAUDE.md) : Bouxwiller existe dans les DEUX pages — 68480
  (Haut-Rhin) et 67330 (Bas-Rhin), deux communes distinctes à la même
  forme alsacienne. La clé d'unicité (source_id, francais, alsacien,
  contexte) porte le contexte, pas region : sans lui, l'ingestion
  fusionne les deux attestations (celle du Bas-Rhin disparaissait).
  Décision John, 09/08/2026 (article 720).
- CONTRÔLE DE MAPPING (décision John, GATE inventaire, consigne 5 — il a
  attrapé 2 erreurs réelles sur HR : Eschie→Strueth, Owersààsa→Obersaasheim) :
  la colonne française doit correspondre aux noms officiels associés au code
  postal 67 (pièce : BOCP La Poste, versionnée dans referentiel_bocp_67.json —
  Nom_de_la_commune ∪ Ligne_5). Le calage est mécanique, à 4 niveaux :
    L1 : égalité exacte (normalisation typographique) dans les noms du code
         (code de recherche = chiffres du code brut après O→0 — GATE 2 : les
         coquilles O/0 visent la forme en 0, la ligne garde le O verbatim).
    L2 : égalité exacte dans l'UNION des noms du Bas-Rhin : le nom est un
         toponyme officiel réel mais le code de la page n'est pas celui que
         le référentiel lui associe (précédent HR : 58500 Bergholtz accepté).
    L3 : le nom de la page est un PRÉFIXE d'un nom du référentiel pour ce
         code (abréviation — précédent HR : « Saint-Louis-la-Chau. »).
    L4 : distance de Damerau-Levenshtein ≤ 2 avec un nom du référentiel pour
         ce code (variante orthographique d'une lettre ou transposition —
         précédent HR : « Spechbach--le-Bas », « Dornach (Mulh.) »).
  Toute ligne dont la colonne française reste hors référentiel après L1-L4
  est OMISE du JSONL (règle 3) et LISTÉE dans le rapport avec les noms
  officiels du code pour ré-admission par arbitrage — jamais corrigée
  (règle 1). Les niveaux L2/L3/L4 sont signalés comme anomalies
  informatives (le nom reste produit tel quel).
- Le code postal étant un contrôle, les lignes dont le code est anormal
  (4 chiffres 6730, 6 chiffres 667350, « 67440< », préfixe hors 67 comme
  57580) restent PRODUITES si la colonne française est conforme au
  référentiel (précédent HR : 58500/65130 produits avec anomalie) ; le code
  anormal est signalé, jamais réécrit. La ligne 6730 Kerzfeld est omise :
  « Kerzfeld » n'est le nom officiel d'aucune commune 67 (officiel attendu :
  Kertzfeld, 67230) — même signature que les 2 écarts HR (français ==
  alsacien et hors référentiel).
- graphie_origine : la ligne logique complète « <code> <français> <alsacien> »
  avant découpage (format de ligne de la fiche source, ordre de la page).
- reference : villes_villagesB.R.htm#L<n>, où n est la ligne physique du
  fichier raw contenant la cellule du code postal.

REJOUABILITÉ
------------
Deux exécutions successives sur le même brut produisent un JSONL identique
(git diff vide) : c'est la preuve qu'aucune ligne n'a été saisie à la main.
Le parseur ne lit que data/raw/ + referentiel_bocp_67.json (versionné).
"""

import html
import json
import re
import sys
import unicodedata
from html.entities import html5
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW = REPO / "data" / "raw" / "culture_alsace" / "villes_villagesB.R.htm"
OUT = REPO / "data" / "attestations" / "culture_alsace__villes_villages_br.jsonl"
REF = Path(__file__).resolve().parent / "referentiel_bocp_67.json"

SOURCE_CODE = "culture_alsace"
TYPE = "toponyme"

# Gabarit déclaré d'une table : 2 blocs de 3 colonnes + cellule image.
# ORDRE BR : code postal | nom FRANÇAIS | nom ALSACIEN (inversé vs HR).
GABARIT = ["8", "18", "19", "10", "8", "18", "19"]


def norm2(s: str) -> str:
    """Normalisation typographique pour l'IDENTITÉ du contrôle de mapping :
    accents retirés, casse aplatie, ponctuation/espace/tiret supprimés,
    « st »/« ste » (abréviation La Poste, ex. « ST LOUIS ») -> « saint »/
    « sainte ». Ne touche JAMAIS au JSONL : sert uniquement à comparer la
    colonne française au référentiel."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.casefold()
    s = re.sub(r"\bst\.?\b", "saint", s)
    s = re.sub(r"\bste\.?\b", "sainte", s)
    return "".join(c for c in s if c.isalnum())


def damerau(a: str, b: str) -> int:
    """Distance de Damerau-Levenshtein (transposition = 1), bornée à 3."""
    if abs(len(a) - len(b)) > 3:
        return 4
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        d[i][0] = i
    for j in range(len(b) + 1):
        d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1,
                          d[i - 1][j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[-1][-1]


def load_referentiel() -> tuple[dict[str, set], set]:
    """Charge la pièce BOCP versionnée : {code: set(noms normalisés)} + union
    Bas-Rhin. Le fichier porte les noms bruts du CSV (majuscules) ; la
    normalisation se fait ici, au chargement — déterministe."""
    doc = json.loads(REF.read_text(encoding="utf-8"))
    ref: dict[str, set] = {}
    union: set = set()
    for code, names in doc.items():
        if code.startswith("_"):
            continue
        s = {norm2(n) for n in names}
        ref[code] = s
        union |= s
    return ref, union


def has_malformed_entity(raw: str) -> bool:
    """True si le texte brut porte un token « &xxx » qui n'est pas une
    entité HTML5 connue (nom avec ou sans « ; »)."""
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


def extract(ref: dict[str, set], union: set
            ) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    """Retourne (attestations, omissions, anomalies, a_verifier)."""
    text = RAW.read_bytes().decode("latin1")
    lines_total = text.count("\n") + (0 if text.endswith("\n") else 1)

    attestations: list[dict] = []
    omissions: list[dict] = []
    anomalies: list[dict] = []
    a_verifier: list[dict] = []
    tables_vues = 0
    blocs_vus = 0
    cellules_code = 0
    coquilles_o = 0

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
                while cells and cells[-1][0] == "":
                    cells.pop()
                cols.append(cells)

            n = max(len(c) for c in cols)
            cellules_code += len(cols[0])
            for i in range(n):
                row = [c[i][0] if i < len(c) else "" for c in cols]
                lines = [c[i][1] if i < len(c) else 0 for c in cols]
                malf = [c[i][2] if i < len(c) else False for c in cols]
                bloc = f"table {tables_vues} bloc {block}"

                if any(r == "" for r in row):
                    manquante = ["code postal", "nom français",
                                 "nom alsacien"][row.index("")]
                    omissions.append({
                        "bloc": bloc,
                        "position": i + 1,
                        "ligne": lines[row.index("")] or max(lines),
                        "raison": f"cellule {manquante} vide",
                        "contenu": " ".join(row),
                    })
                    continue

                code, francais, alsacien = row
                l_code = lines[0]
                contenu = f"{code} {francais} {alsacien}"

                # --- coquille « O » pour « 0 » (GATE 2) : signalée, jamais
                # corrigée. Le code de RECHERCHE du référentiel passe O->0
                # (la coquille vise la forme en 0) ; la ligne garde le O.
                if "O" in code:
                    coquilles_o += 1
                    anomalies.append({
                        "type": "coquille_O_pour_0",
                        "ligne": l_code,
                        "detail": code,
                    })
                lookup = re.sub(r"\D", "", code.replace("O", "0"))

                # --- anomalies de format du code (contrôle, pas correction)
                if not re.fullmatch(r"\d{5}", code):
                    anomalies.append({
                        "type": "code_format_anormal",
                        "ligne": l_code,
                        "detail": code,
                    })
                if not code.startswith("67"):
                    anomalies.append({
                        "type": "code_hors_67",
                        "ligne": l_code,
                        "detail": f"{code} {francais}",
                    })

                # --- entité HTML malformée dans le BRUT : décodée comme
                # html.unescape le fait, signalée — jamais corrigée.
                if any(malf):
                    anomalies.append({
                        "type": "entite_malformee",
                        "ligne": lines[malf.index(True)],
                        "detail": f"{francais} / {alsacien}",
                    })

                # --- CONTRÔLE DE MAPPING (GATE 5) : 4 niveaux mécaniques.
                nfr = norm2(francais)
                cands = ref.get(lookup, set())
                if nfr in cands:
                    niveau = None
                elif nfr in union:
                    niveau = "L2"
                elif any(len(c) >= 4 and (c.startswith(nfr) or
                                          (len(nfr) >= 4 and nfr.startswith(c)))
                         for c in cands):
                    niveau = "L3"
                elif any(len(c) >= 4 and damerau(nfr, c) <= 2 for c in cands):
                    niveau = "L4"
                else:
                    niveau = "HORS"

                if niveau == "HORS":
                    # colonne française hors référentiel officiel : la ligne
                    # est OMISE du JSONL (règle 3), jamais corrigée (règle 1).
                    # Les noms officiels du code portent la ré-admission.
                    omissions.append({
                        "bloc": bloc,
                        "position": i + 1,
                        "ligne": l_code,
                        "raison": "colonne française hors référentiel officiel "
                                  "(BOCP La Poste, GATE inventaire)",
                        "contenu": contenu,
                        "officiels_du_code": REF_RAW_DOC.get(lookup, []),
                    })
                    continue

                if niveau in ("L2", "L3", "L4"):
                    detail = {
                        "L2": "nom officiel réel mais code de la page non "
                              "associé dans le référentiel",
                        "L3": "forme abrégée d'un nom officiel du code",
                        "L4": "variante orthographique d'un nom officiel "
                              "du code",
                    }[niveau]
                    anomalies.append({
                        "type": f"mapping_{niveau}",
                        "ligne": lines[2],
                        "detail": f"{detail} : « {francais} »",
                    })

                # colonne française == colonne alsacienne : candidat au
                # contrôle 2 (nom identique légitime OU forme alsacienne
                # recopiée par erreur) — à trancher par ed-verificateur.
                if francais == alsacien:
                    a_verifier.append({
                        "type": "francais_egal_alsacien",
                        "ligne": lines[2],
                        "detail": contenu,
                    })

                att = {
                    "source_code": SOURCE_CODE,
                    "francais": francais,
                    "alsacien": alsacien,
                    "graphie_origine": contenu,
                    "type": TYPE,
                    # contexte : dérivé de L'INTITULÉ DE PAGE — cette page
                    # est la page du Bas-Rhin (« Villes et villages du
                    # Bas-Rhin », fiche source). En clair : le contexte est
                    # affiché à l'utilisateur (« Bouxwiller (Bas-Rhin) »).
                    # Sépare les homonymes inter-pages (Bouxwiller 67330 /
                    # 68480) dans la clé d'unicité (décision John,
                    # 09/08/2026). Même information que region, pas un
                    # jugement sur la forme.
                    "contexte": "Bas-Rhin",
                    # AMENDEMENT GATE 2 : région de l'INTITULÉ DE PAGE —
                    # villes_villagesB.R.htm est la page du Bas-Rhin. Le code
                    # postal ne décide plus (il signale).
                    "region": "bas_rhin",
                    "reference": f"villes_villagesB.R.htm#L{l_code}",
                }
                attestations.append(att)

    print(f"fichier lu : {RAW}")
    print(f"lignes physiques : {lines_total}")
    print(f"tables : {tables_vues}, blocs de 3 colonnes : {blocs_vus}")
    print(f"cellules de code postal lues : {cellules_code}")
    print(f"coquilles « O » pour « 0 » (cellules) : {coquilles_o}")
    print(f"attestations produites : {len(attestations)}")
    print(f"lignes omises : {len(omissions)}")
    print(f"anomalies signalées : {len(anomalies)}")
    print(f"candidats à vérifier (contrôle 2) : {len(a_verifier)}")
    return attestations, omissions, anomalies, a_verifier


REF_RAW_DOC: dict[str, list] = {}


def main() -> int:
    if not RAW.exists():
        print(f"brut introuvable : {RAW}", file=sys.stderr)
        return 1
    if not REF.exists():
        print(f"référentiel introuvable : {REF}", file=sys.stderr)
        return 1

    doc = json.loads(REF.read_text(encoding="utf-8"))
    ref: dict[str, set] = {}
    union: set = set()
    for code, names in doc.items():
        if code.startswith("_"):
            continue
        ref[code] = {norm2(n) for n in names}
        union |= ref[code]
        REF_RAW_DOC[code] = sorted(names)

    attestations, omissions, anomalies, a_verifier = extract(ref, union)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        for att in attestations:
            fh.write(json.dumps(att, ensure_ascii=False) + "\n")

    if omissions:
        print("\n--- LIGNES OMISES (non produites, à arbitrer) ---")
        for o in omissions:
            extra = ""
            if "officiels_du_code" in o and o["officiels_du_code"]:
                extra = " | officiels du code : " + ", ".join(
                    o["officiels_du_code"])
            print(f"  {o['bloc']} pos {o['position']} ligne {o['ligne']} "
                  f"— {o['raison']} : « {o['contenu']} »{extra}")
    if anomalies:
        print("\n--- ANOMALIES OBSERVÉES (non corrigées) ---")
        for a in anomalies:
            print(f"  [{a['type']}] ligne {a.get('ligne', '?')} : "
                  f"{a.get('detail', '')}".rstrip())
    if a_verifier:
        print("\n--- CANDIDATS CONTRÔLE 2 (français == alsacien, "
              "à trancher par ed-verificateur) ---")
        for v in a_verifier:
            print(f"  [{v['type']}] ligne {v['ligne']} : {v['detail']}")

    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
