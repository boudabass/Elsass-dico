#!/usr/bin/env python3
"""Parseur de la rubrique toponymes — source martin_lienhart (ElsWB).

Lit les fichiers data/raw/martin_lienhart/elswb_*.json (JAMAIS le réseau) et
produit data/attestations/martin_lienhart__toponymes.jsonl.

SOURCE
------
« Wörterbuch der elsässischen Mundarten », Ernst Martin & Hans Lienhart,
Strassburg 1899–1907 (Nachdruck Berlin/New York 1974), servi par le portail
Wörterbuchnetz du Trier Center for Digital Humanities :
https://www.woerterbuchnetz.de/ElsWB — entrées API /dictionaries/ElsWB/
articles/{formid}/formid (réponse : liste de jetons ordonnés par textid,
chacun portant word, elementtype, typeset et la localisation book/col/line).

LOT RESTREINT PILOTE (GATE John 09/08/2026, article 725)
--------------------------------------------------------
Le lot est DÉFINI PAR LES FICHIERS ARCHIVÉS dans data/raw/martin_lienhart/ :
le parseur traite les fichiers *.json dont le contenu est une liste de jetons
(les réponses /articles/{formid}/formid), rien d'autre. Le fichier
elswb_strassburg.json (échantillon de recherche de lemme, structure différente)
et les fichiers cgu_*.html / LISEZMOI_*.txt sont ignorés par construction.
Archiver une entrée de plus, c'est étendre le lot. La généralisation ne se
lance qu'après le GATE (John).

Inventaire des toponymes de communes présents dans ElsWB (vérifié sur la liste
complète des 33521 lemmes + fulltext « Ortsname » + noms allemands historiques,
09/08/2026) : Straßburg, Hagenau, Ittene, Wasselen, Bruemt — les SEULS lemmes
correspondant à une commune de culture_alsace. Tous en Bas-Rhin : ElsWB n'a
aucun lemme toponymique pour une commune du Haut-Rhin (Mülhausen, Kolmar,
Zabern, Gebweiler… absents ; « Münster » = la cathédrale, « Bühl » = la
colline, « Schirmeck » = le jeu de cache-cache, « Niffer » = nom commun,
« Selest »/« Bersch » = prénoms : homographes, pas des toponymes).

MÉTHODE — JOINTURE TOPONYMIQUE, JAMAIS DE TRADUCTION (doctrine article 725)
---------------------------------------------------------------------------
Le dictionnaire apparie l'alsacien à l'ALLEMAND, pas au français. La seule
extraction sûre est la jointure toponymique : le lemme allemand de l'entrée
ElsWB (Straßburg) correspond au nom officiel français déjà présent dans
culture_alsace (Strasbourg) par une correspondance historique connue et non
traduite. La table CORRESPONDANCE ci-dessous est cette correspondance, une
paire par entrée du lot, documentée entrée par entrée (glose du dictionnaire +
correspondance officielle).

- francais, contexte, region : REPRIS DE LA BASE culture_alsace (les fichiers
  data/attestations/culture_alsace__villes_villages_hr.jsonl et __br.jsonl),
  jamais déduits du dictionnaire. La commune doit y figurer exactement une
  fois (homonyme → omission, règle 3).
- alsacien : le bloc de formes de l'entrée (jetons kopfinfos, avec les rs
  « lieux d'attestation » intercalés, assemblés dans l'ordre textid) — copié
  caractère pour caractère, entités HTML décodées (le portail rend ses jetons
  en entités : &#x00df; = ß, &#x02bf; = ʿ, &#x0259; = ə…). Si l'entrée n'a pas
  de bloc de formes (cas Bruemt), alsacien = le lemme (leitwort), qui est la
  forme alsacienne.
- graphie_origine : TOUTE l'entrée assemblée (fragment source entier), jetons
  dans l'ordre textid, entités décodées — c'est elle qui rend la vérification
  possible.
- reference : fichier raw/ + formid + localisation imprimée (bookref
  book,col,line porté par les jetons) + lien Zitierempfehlung du portail.

COQUILLE SIGNALÉE (règle 1, jamais corrigée)
--------------------------------------------
Brumath : la base culture_alsace écrit « Brumaht » (francais), alors que le nom
officiel français est « Brumath » (CP 67170, alsacien base « Bruemt » identique
au lemme ElsWB). Le parseur joint sur la graphie de la base (« Brumaht ») et la
ligne reprend ce francais verbatim ; la coquille est signalée dans le rapport,
sa correction appartient à la carte culture_alsace, pas ici.

CONTRÔLES (signalés, JAMAIS corrigés — règle 1)
-----------------------------------------------
- divergence de forme : alsacien(ElsWB) vs alsacien(culture_alsace) pour la
  même commune — cœur du recoupement, on liste, on ne réconcilie pas ;
- contrôle toponymicité : la glose (jetons bdtg) doit contenir « Ortsname »
  ou « Stadt » — sinon l'entrée est un homographe, pas un toponyme (anomalie) ;
- contrôle lemme : le lemme extrait des jetons doit être la clé attendue.

REJOUABILITÉ
------------
Deux exécutions successives sur le même brut produisent un JSONL identique
(git diff vide) : c'est la preuve qu'aucune ligne n'a été saisie à la main.
L'ordre de sortie est l'ordre alphabétique des fichiers archivés.
"""

import html
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW_DIR = REPO / "data" / "raw" / "martin_lienhart"
OUT = REPO / "data" / "attestations" / "martin_lienhart__toponymes.jsonl"
BASE_FILES = [
    REPO / "data" / "attestations" / "culture_alsace__villes_villages_hr.jsonl",
    REPO / "data" / "attestations" / "culture_alsace__villes_villages_br.jsonl",
]

SOURCE_CODE = "martin_lienhart"
TYPE = "toponyme"

# Elementtypes qui composent le bloc de formes (les formes alsaciennes entre
# crochets, avec les lieux d'attestation rs intercalés).
FORM_TYPES = {"kopfinfos", "rs", "ortsidlinkstart", "ortsidlinkend"}
# Elementtypes qui portent le lemme (mot-titre de l'article).
LEMMA_TYPES = {"lemma", "leitwort", "leitwortvariant"}
# Elementtypes de la glose (sens en allemand).
GLOSS_TYPES = {"bdtg", "sense"}

# Correspondance toponymique historique connue et non traduite :
# lemme ElsWB (allemand) -> nom français TEL QU'ÉCRIT dans culture_alsace.
# Chaque paire est documentée : glose du dictionnaire + correspondance officielle.
CORRESPONDANCE = {
    "Straßburg": {
        "francais": "Strasbourg",
        "note": "glose ElsWB « die Stadt Straßburg, Landeshauptstadt » — "
                "Straßburg = nom officiel allemand de Strasbourg (Reichsland 1871-1918)",
    },
    "Hagenau": {
        "francais": "Hagenau",
        "note": "glose ElsWB « Ortsname: Hagenau » — Hagenau = nom officiel "
                "allemand de Haguenau ; la base culture_alsace écrit « Hagenau » "
                "(repris tel quel, règle 1)",
    },
    "Ittene": {
        "francais": "Ittenheim",
        "note": "glose ElsWB « Ortsname: Ittenheim westl. von Strassburg » — "
                "Ittenheim identique en français ; Ittene = forme alsacienne",
    },
    "Wasselen": {
        "francais": "Wasselonne",
        "note": "glose ElsWB « Ortsname Wasselnheim » — correspondance "
                "historique Wasselnheim/Wasselen = Wasselonne",
    },
    "Bruemt": {
        "francais": "Brumaht",
        "note": "glose ElsWB « Ortsname Brumath » — Brumath identique en "
                "français ; la base culture_alsace écrit « Brumaht » (coquille "
                "probable, signalée, jamais corrigée — règle 1) ; Bruemt = forme "
                "alsacienne (pas de bloc de formes dans l'entrée)",
    },
}


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
                    "alsacien": att.get("alsacien"),
                    "reference": att.get("reference"),
                }
                if entry not in base.setdefault(key, []):
                    base[key].append(entry)
    return base


def load_tokens(path: Path) -> list[dict] | None:
    """Charge un fichier raw ; retourne la liste des jetons triée par textid.

    Retourne None si le fichier n'est pas une réponse d'article (structure
    différente : échantillon de recherche, page CGU, note…). Ces fichiers sont
    ignorés par construction, pas une erreur.
    """
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    if not isinstance(data, list) or not data:
        return None
    if not all(isinstance(t, dict) and "textid" in t and "elementtype" in t
               for t in data):
        return None
    return sorted(data, key=lambda t: t["textid"])


def join_words(tokens: list[dict]) -> str:
    """Assemble les mots des jetons dans l'ordre textid, entités décodées."""
    return html.unescape("".join(t.get("word", "") for t in tokens))


def extract_lemma(tokens: list[dict]) -> str:
    """Lemme de l'article : jetons lemma/leitwort/leitwortvariant, stripés."""
    parts = [t.get("word", "") for t in tokens if t["elementtype"] in LEMMA_TYPES]
    return html.unescape("".join(parts)).strip()


def extract_forms(tokens: list[dict]) -> str | None:
    """Bloc de formes alsaciennes : du premier kopfinfos au ']' inclus.

    Les formes sont entre crochets ; les rs (lieux d'attestation) et les
    ortsidlink* (vides) y sont intercalés dans l'ordre textid. On prend la
    tranche [premier kopfinfos … premier kopfinfos contenant ']'], ce qui
    restitue le bloc exact tel que rendu. None si pas de kopfinfos.
    """
    starts = [i for i, t in enumerate(tokens) if t["elementtype"] == "kopfinfos"]
    if not starts:
        return None
    first = starts[0]
    end = None
    for i in range(first, len(tokens)):
        if tokens[i]["elementtype"] == "kopfinfos" and "]" in tokens[i].get("word", ""):
            end = i
            break
    if end is None:
        return None  # bloc de formes ouvert sans fermeture — anomalie
    return join_words(tokens[first:end + 1])


def extract_gloss(tokens: list[dict]) -> str:
    """Glose (sens) : jetons bdtg/sense assemblés."""
    parts = [t.get("word", "") for t in tokens if t["elementtype"] in GLOSS_TYPES]
    return html.unescape("".join(parts))


def extract() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    """Retourne (attestations, omissions, divergences, anomalies)."""
    base = load_base()
    files = sorted(p for p in RAW_DIR.glob("*.json"))

    attestations: list[dict] = []
    omissions: list[dict] = []
    divergences: list[dict] = []
    anomalies: list[dict] = []

    for path in files:
        tokens = load_tokens(path)
        if tokens is None:
            continue  # fichier non-article (recherche, CGU, note) : hors lot

        # --- lemme et identification ------------------------------------
        lemme = extract_lemma(tokens)
        if lemme not in CORRESPONDANCE:
            omissions.append({
                "entree": lemme or path.name,
                "fichier": path.name,
                "raison": f"lemme « {lemme or '?'} » hors table de correspondance — "
                          "pas de correspondance toponymique sûre avec culture_alsace",
            })
            continue
        corr = CORRESPONDANCE[lemme]

        # --- jointure avec la base culture_alsace ------------------------
        entries = base.get(corr["francais"], [])
        if not entries:
            omissions.append({
                "entree": lemme,
                "fichier": path.name,
                "raison": f"« {corr['francais']} » absent de la base culture_alsace",
            })
            continue
        if len(entries) > 1:
            omissions.append({
                "entree": lemme,
                "fichier": path.name,
                "raison": f"homonyme en base ({len(entries)} contextes : "
                          f"{[e['contexte'] for e in entries]}) — à trancher",
            })
            continue
        base_entree = entries[0]

        # --- forme alsacienne (verbatim, règle 1) -------------------------
        formes = extract_forms(tokens)
        if formes is None:
            formes = lemme  # cas Bruemt : le lemme est la forme alsacienne
        elif "]" not in formes:
            omissions.append({
                "entree": lemme,
                "fichier": path.name,
                "raison": "bloc de formes sans fermeture « ] » — structure "
                          "inattendue, non extractible en toute sécurité",
            })
            continue

        # graphie_origine : TOUTE l'entrée, fragment source entier.
        graphie = join_words(tokens)

        # --- contrôles (signalés, jamais corrigés) ------------------------
        gloss = extract_gloss(tokens)
        if not ("Ortsname" in gloss or "Stadt" in gloss or "Kreisstadt" in gloss):
            anomalies.append({
                "type": "toponymicite",
                "entree": lemme,
                "fichier": path.name,
                "detail": f"glose sans marqueur toponymique (« {gloss[:60]} ») — "
                          "homographe probable (nom commun, prénom…)",
            })

        base_forme = base_entree.get("alsacien")
        if base_forme != formes:
            divergences.append({
                "entree": lemme,
                "fichier": path.name,
                "alsacien_elswb": formes,
                "alsacien_culture_alsace": base_forme,
                "culture_alsace_ref": base_entree.get("reference"),
            })

        # --- ligne d'attestation ------------------------------------------
        first = tokens[0]
        att = {
            "source_code": SOURCE_CODE,
            "francais": corr["francais"],
            "alsacien": formes,
            "graphie_origine": graphie,
            "type": TYPE,
            "contexte": base_entree["contexte"],
            "region": base_entree["region"],
        }
        att["reference"] = (
            f"{path.name} — {first.get('formid', '?')} — "
            f"Bd. {first.get('book', '?')}, Sp. {first.get('col', '?')}, "
            f"Z. {first.get('line', '?')} — "
            f"https://www.woerterbuchnetz.de/ElsWB?lemid={first.get('formid', '?')}"
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

    print(f"entrées API archivées lues : {len(attestations) + len(omissions)}")
    print(f"attestations produites : {len(attestations)}")
    print(f"lignes omises : {len(omissions)}")
    print(f"divergences de forme (ElsWB vs culture_alsace) : {len(divergences)}")
    print(f"anomalies signalées : {len(anomalies)}")

    if omissions:
        print("\n--- LIGNES OMISES (règle 3, à trancher) ---")
        for o in omissions:
            print(f"  {o['entree']} ({o['fichier']}) — {o['raison']}")
    if divergences:
        print("\n--- DIVERGENCES DE FORME (listées, jamais corrigées) ---")
        for d in divergences:
            print(f"  {d['entree']}: ElsWB « {d['alsacien_elswb']} » vs "
                  f"culture_alsace « {d['alsacien_culture_alsace']} » "
                  f"({d['culture_alsace_ref']})")
    if anomalies:
        print("\n--- ANOMALIES (signalées, jamais corrigées) ---")
        for a in anomalies:
            print(f"  [{a['type']}] {a['entree']} : {a['detail']}")

    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
