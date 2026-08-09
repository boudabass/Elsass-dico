#!/usr/bin/env python3
"""Parseur de la rubrique toponymes — source alsacien_wikipedia.

Lit les fichiers data/raw/alsacien_wikipedia/*.wikitext.txt (JAMAIS le
réseau) et produit data/attestations/alsacien_wikipedia__toponymes.jsonl.

LOT RESTREINT PILOTE (GATE John 09/08/2026, article 725)
---------------------------------------------------------
Le lot est DÉFINI PAR LES FICHIERS ARCHIVÉS dans data/raw/alsacien_wikipedia/ :
le parseur traite tous les *.wikitext.txt présents, rien d'autre. Le lot
pilote (10 communes) est donc borné par ce qui est archivé — archiver un
fichier de plus, c'est l'étendre. La généralisation à l'ensemble des
communes ne se lance qu'après le GATE (John) ; elle ne demandera aucune
modification du parseur, seulement l'archivage des fichiers manquants.

JOINTURE AVEC LA BASE culture_alsace (recoupement, pas extraction à
l'aveugle)
-------------------------------------------------------------------
Chaque article als.wikipedia.org a pour titre le nom français de la commune
(Altenach, Colmar, …) ; c'est le stem du fichier archivé. Ce titre est la
clé de jointure vers data/attestations/culture_alsace__villes_villages_hr.jsonl
et __br.jsonl :
- francais, contexte, region : REPRIS DE LA BASE culture_alsace (le nom
  officiel et le département, jamais déduits de l'article) ;
- alsacien : la valeur du champ « nomalsacien » de l'infobox « Gemeinde in
  Frankreich », COPIE VERBATIM ;
- graphie_origine : la LIGNE D'INFOBOX ENTIÈRE, avant tout découpage.

Une commune dont le titre ne figure pas en base, ou qui figure dans les
deux pages (homonyme, ex. Bouxwiller), est OMISE du JSONL et LISTÉE dans le
rapport (règle 3 : un doute se signale, il ne se comble pas).

CONTRÔLES (signalés, JAMAIS corrigés — règle 1)
------------------------------------------------
- divergence de forme : alsacien(wikipedia) vs alsacien(culture_alsace)
  pour la même commune — c'est le cœur du recoupement, on liste, on ne
  réconcilie pas ;
- contrôle nomcommune : le champ « nomcommune » de l'infobox vs le nom
  officiel en base ;
- contrôle département : les marqueurs de l'article (Kategorie « Ort
  (Owerelsàss) » / « Ort (Unterelsass) », mention « Département
  Haut-Rhin » / « Département Bas-Rhin ») vs la region en base.

REJOUABILITÉ
------------
Deux exécutions successives sur le même brut produisent un JSONL identique
(git diff vide) : c'est la preuve qu'aucune ligne n'a été saisie à la main.
L'ordre de sortie est l'ordre alphabétique des fichiers archivés.
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW_DIR = REPO / "data" / "raw" / "alsacien_wikipedia"
OUT = REPO / "data" / "attestations" / "alsacien_wikipedia__toponymes.jsonl"
BASE_FILES = [
    REPO / "data" / "attestations" / "culture_alsace__villes_villages_hr.jsonl",
    REPO / "data" / "attestations" / "culture_alsace__villes_villages_br.jsonl",
]

SOURCE_CODE = "alsacien_wikipedia"
TYPE = "toponyme"

INFOBOX_START = re.compile(r"^\s*\{\{\s*Infobox Gemeinde in Frankreich\b")
FIELD_LINE = re.compile(r"^\|\s*nomalsacien\s*=\s*(.*?)\s*$")
NOMCOMMUNE_LINE = re.compile(r"^\|\s*nomcommune\s*=\s*(.*?)\s*$")
# Marqueurs de département présents dans l'article (catégorie ou mention).
# Le « s » non accentué de « Unterelsass » est attesté dans les fichiers
# archivés (catégorie) ; on accepte les deux graphies.
HAUT_RHIN_MARKERS = ("Ort (Owerelsàss)", "Département Haut-Rhin",
                     "Département Haut-Rhin|")
BAS_RHIN_MARKERS = ("Ort (Unterelsass)", "Ort (Unterelsàss)",
                    "Département Bas-Rhin", "Département Bas-Rhin|")


def load_base() -> dict[str, list[dict]]:
    """Base culture_alsace : francais -> liste d'entrées (contexte, region).

    Une clé peut porter plusieurs entrées quand la commune figure dans les
    deux pages (homonyme HR/BR) — c'est précisément le cas à trancher.
    """
    base: dict[str, list[dict]] = {}
    for f in BASE_FILES:
        with f.open(encoding="utf-8") as fh:
            for line in fh:
                att = json.loads(line)
                if att.get("type") != "toponyme":
                    continue
                key = att["francais"]
                entry = {
                    "contexte": att.get("contexte", ""),
                    "region": att.get("region"),
                }
                if entry not in base.setdefault(key, []):
                    base[key].append(entry)
    return base


def infobox_lines(text: str) -> tuple[int, int] | None:
    """Retourne (debut, fin) des lignes (0-based, fin incluse) de l'infobox
    « Gemeinde in Frankreich », ou None si absente.

    Le bloc s'étend de la ligne d'ouverture « {{Infobox Gemeinde in
    Frankreich » jusqu'à la fermeture « }} » qui ramène la profondeur
    d'accolades à zéro (les « {{…}} » imbriqués sur une même ligne se
    neutralisent).
    """
    lines = text.split("\n")
    start = None
    for i, line in enumerate(lines):
        if INFOBOX_START.search(line):
            start = i
            break
    if start is None:
        return None
    depth = 0
    for i in range(start, len(lines)):
        depth += lines[i].count("{{") - lines[i].count("}}")
        if depth <= 0:
            return start, i
    return start, len(lines) - 1


def extract_field(lines: list[str], start: int, end: int,
                  pattern: re.Pattern) -> tuple[str, int] | None:
    """Première ligne du bloc [start, end] (0-based) qui matche `pattern`.

    Retourne (valeur, numéro de ligne 1-based) ou None.
    """
    for i in range(start, end + 1):
        m = pattern.match(lines[i])
        if m:
            return m.group(1), i + 1
    return None


def department_markers(text: str) -> list[str]:
    """Marqueurs de département trouvés dans l'article, pour contrôle."""
    found = []
    if any(m in text for m in HAUT_RHIN_MARKERS):
        found.append("haut_rhin")
    if any(m in text for m in BAS_RHIN_MARKERS):
        found.append("bas_rhin")
    return found


def extract() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    """Retourne (attestations, omissions, divergences, anomalies)."""
    base = load_base()
    files = sorted(p for p in RAW_DIR.glob("*.wikitext.txt"))

    attestations: list[dict] = []
    omissions: list[dict] = []
    divergences: list[dict] = []
    anomalies: list[dict] = []

    for path in files:
        # nom français de la commune = titre de l'article. On retire le
        # suffixe complet « .wikitext.txt » (path.stem ne retirerait que
        # « .txt » et laisserait « Altenach.wikitext »).
        titre = path.name.removesuffix(".wikitext.txt")
        text = path.read_text(encoding="utf-8")

        # --- jointure avec la base culture_alsace -------------------------
        entries = base.get(titre, [])
        if not entries:
            omissions.append({
                "commune": titre,
                "fichier": path.name,
                "raison": "titre absent de la base culture_alsace — "
                          "pas de recoupement possible",
            })
            continue
        if len(entries) > 1:
            omissions.append({
                "commune": titre,
                "fichier": path.name,
                "raison": f"homonyme en base ({len(entries)} contextes : "
                          f"{[e['contexte'] for e in entries]}) — à trancher",
            })
            continue
        base_entree = entries[0]

        # --- infobox et champ nomalsacien ---------------------------------
        bloc = infobox_lines(text)
        if bloc is None:
            omissions.append({
                "commune": titre,
                "fichier": path.name,
                "raison": "infobox « Gemeinde in Frankreich » absente",
            })
            continue
        start, end = bloc
        lines = text.split("\n")

        champ = extract_field(lines, start, end, FIELD_LINE)
        if champ is None:
            omissions.append({
                "commune": titre,
                "fichier": path.name,
                "raison": "champ « nomalsacien » absent de l'infobox",
            })
            continue
        valeur, ligne = champ
        if valeur == "":
            omissions.append({
                "commune": titre,
                "fichier": path.name,
                "raison": "champ « nomalsacien » vide",
            })
            continue

        # graphie_origine : la LIGNE D'INFOBOX ENTIÈRE, avant tout découpage.
        # On ne retire que le saut de ligne ; l'espacement interne du fichier
        # brut est conservé caractère pour caractère (règle 1).
        graphie = lines[ligne - 1].rstrip("\r\n")

        # --- contrôles (signalés, jamais corrigés) ------------------------
        nomcommune = extract_field(lines, start, end, NOMCOMMUNE_LINE)
        if nomcommune is not None and nomcommune[0] != titre:
            anomalies.append({
                "type": "nomcommune_vs_base",
                "commune": titre,
                "fichier": path.name,
                "detail": f"infobox « {nomcommune[0]} » vs base « {titre} »",
            })

        marqueurs = department_markers(text)
        if marqueurs and base_entree["region"] not in marqueurs:
            anomalies.append({
                "type": "departement_article_vs_base",
                "commune": titre,
                "fichier": path.name,
                "detail": f"article {marqueurs} vs base "
                          f"{base_entree['region']}",
            })

        # divergence de forme : le cœur du recoupement, listée, jamais
        # réconciliée (règle 1) — la valeur Wikipedia reste verbatim.
        base_forme = None
        base_ref = None
        for f in BASE_FILES:
            with f.open(encoding="utf-8") as fh:
                for line in fh:
                    att = json.loads(line)
                    if att.get("francais") == titre:
                        base_forme = att.get("alsacien")
                        base_ref = att.get("reference")
                        break
            if base_forme is not None:
                break
        if base_forme != valeur:
            divergences.append({
                "commune": titre,
                "alsacien_wikipedia": valeur,
                "culture_alsace": base_forme,
                "culture_alsace_ref": base_ref,
                "fichier": path.name,
            })

        # --- ligne d'attestation ------------------------------------------
        att = {
            "source_code": SOURCE_CODE,
            "francais": titre,
            "alsacien": valeur,
            "graphie_origine": graphie,
            "type": TYPE,
            "contexte": base_entree["contexte"],
            "region": base_entree["region"],
        }
        att["reference"] = (
            f"{path.name}#L{ligne} — "
            f"https://als.wikipedia.org/wiki/{titre}?action=raw — "
            "champ nomalsacien (infobox Gemeinde in Frankreich)"
        )
        attestations.append(att)

    return attestations, omissions, divergences, anomalies


def main() -> int:
    if not RAW_DIR.is_dir():
        print(f"dossier brut introuvable : {RAW_DIR}", file=sys.stderr)
        return 1

    attestations, omissions, divergences, anomalies = extract()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        for att in attestations:
            fh.write(json.dumps(att, ensure_ascii=False) + "\n")

    print(f"fichiers archivés lus : {len(list(RAW_DIR.glob('*.wikitext.txt')))}")
    print(f"attestations produites : {len(attestations)}")
    print(f"lignes omises : {len(omissions)}")
    print(f"divergences de forme (wikipedia vs culture_alsace) : "
          f"{len(divergences)}")
    print(f"anomalies signalées : {len(anomalies)}")

    if omissions:
        print("\n--- LIGNES OMISES (règle 3, à trancher) ---")
        for o in omissions:
            print(f"  {o['commune']} ({o['fichier']}) — {o['raison']}")
    if divergences:
        print("\n--- DIVERGENCES DE FORME (listées, jamais corrigées) ---")
        for d in divergences:
            print(f"  {d['commune']}: wikipedia « {d['alsacien_wikipedia']} » "
                  f"vs culture_alsace « {d['culture_alsace']} » "
                  f"({d['culture_alsace_ref']})")
    if anomalies:
        print("\n--- ANOMALIES (signalées, jamais corrigées) ---")
        for a in anomalies:
            print(f"  [{a['type']}] {a['commune']} : {a['detail']}")

    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
