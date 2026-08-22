#!/usr/bin/env python3
"""Parseur de la rubrique gsw_fr — source wiktionnaire_fr.

Dérivé du parseur mots.py (même structure de page, même famille de
règles). Lit data/raw/wiktionnaire_fr/ (JAMAIS le réseau) et produit
data/attestations/wiktionnaire_fr__gsw_fr.jsonl pour le LOT PILOTE
(carte t_bb75ea0e, feu vert John 22/08/2026, article 725) :
PETIT ÉCHANTILLON, PAS DE GÉNÉRALISATION.

PÉRIMÈTRE — LE LOT
------------------
Le parseur lit la liste data/raw/wiktionnaire_fr/gsw_fr_lot.json
(produite par inventaire_gsw_fr.py, graine 20260822) et n'extrait que
les pages de cette liste : les 7 pages doubles gsw∩gsw-fr (Bredele,
Krizigung, Kumfitür, Raiher, Schutzangel, Strossburi, ãn) + 9 mots
+ 3 non classés + 2 prénoms (21 pages). Il ne s'étend pas au-delà du
lot : la généralisation à la rubrique complète (836 pages, rapport
t_ebd325cf) est une décision John, pas une décision de ce parseur.

STRUCTURE DES PAGES (constatée sur le brut, jamais déduite)
-----------------------------------------------------------
Les sections gsw-fr sont des titres de niveau 2 :

    == {{langue|gsw-fr}} ==    section alsacien de France (celle qu'on extrait)
    == {{langue|gsw}} ==       alémanique — IGNORÉE (rubrique gsw, parseur mots.py)
    == {{langue|fr}} ==        autre langue — ignorée

Dans la section gsw-fr :
  - le lemme alsacien est la première occurrence de '''...''' (gras) ;
  - les sens sont les lignes commençant par « # » (niveau 1) ;
  - les lignes « #* » sont des exemples — ignorées ;
  - les lignes « * » sont des listes (variantes, apparentés) — ignorées ;
  - la sous-section « === {{S|étymologie}} === » décrit l'origine du mot,
    pas ses sens : ses lignes « # » seraient omises (règle 3), comme dans
    mots.py ;
  - en tête de définition, des templates de contexte ({{gâteaux|gsw-fr}},
    {{oiseaux|gsw-fr}}, {{lexique|...|gsw-fr}}, {{localités|gsw-fr|...}})
    rendent des parenthèses de contexte : elles alimentent le champ
    contexte.

POINT 1 — LA DÉFINITION FRANÇAISE EXISTE (constat pilote, 22/08/2026)
--------------------------------------------------------------------
Les sections gsw-fr portent une définition française exploitable : le
texte affiché des liens wiki ([[héron|Héron]] → « Héron »,
[[confiture|Confiture]] → « Confiture », [[Strasbourg#Français|Strasbourg]]
→ « Strasbourg »), ou une phrase complète (Fritz : « Prénom masculin
alsacien, correspondant à Frédéric en français. »). La ponctuation de la
page est conservée, y compris son absence (lâfera : « Faire le niais,
dire des bêtises, déconner » sans point final — règle 1, copie verbatim).
Aucune traduction n'est jamais générée pour combler : le français vient
de la page.

TYPE (décision John 09/08/2026, article 725 — commune/ville ⇒ toponyme)
-----------------------------------------------------------------------
- Sous-section « {{S|prénom|gsw-fr|...}} » ⇒ type « prenom » (Fritz,
  Hàns, Schannele dans le lot) ;
- Sinon, motifs RE_TOPONYME constatés sur le rendu (« commune française »,
  « ville de/d'/du/... », « capitale de/du ») ⇒ type « toponyme » ;
- Sinon, sous-section « {{S|nom propre|gsw-fr}} » ⇒ DOUTE (règle 3) :
  la définition d'un nom propre gsw-fr est souvent un NOM NU (Strossburi :
  « Strasbourg. », Milhüsa : « Mulhouse. », Vogesa : « Vosges ») dont la
  section ne dit pas s'il désigne une commune (toponyme) ou une région /
  un autre nom propre (mot) : la ligne est OMISE et listée dans le rapport
  (cas Strossburi du lot — le motif « ville de France » n'existe que dans
  la section gsw de la même page, hors périmètre gsw-fr) ;
- Sinon ⇒ type « mot » (noms communs, verbes, adjectifs, interjections…).

LEMME ≠ TITRE (cas Gald du lot)
-------------------------------
La page « Gald » porte le lemme '''Gãld''' : le titre et le lemme peuvent
différer (page renommée). alsacien = le lemme de la section, copié
verbatim ; reference = le titre de la page (le nom du fichier brut).

ANCRE DE LA SECTION
-------------------
reference = https://fr.wiktionary.org/wiki/<Titre>#Alémanique_alsacien —
l'ancre « Alémanique_alsacien » est le titre rendu de la section
{{langue|gsw-fr}} (constaté via l'API parse, prop=sections, le
22/08/2026 ; « Alémanique » sans suffixe est l'ancre de la section gsw,
parseur mots.py).

REJOUABILITÉ
------------
Deux exécutions successives sur le même brut produisent un JSONL
identique (git diff vide) : c'est la preuve qu'aucune ligne n'a été
saisie à la main. Le parseur ne lit que data/raw/.
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW_DIR = REPO / "data" / "raw" / "wiktionnaire_fr"
LOT = RAW_DIR / "gsw_fr_lot.json"
OUT = REPO / "data" / "attestations" / "wiktionnaire_fr__gsw_fr.jsonl"

SOURCE_CODE = "wiktionnaire_fr"

# Ancre de la section {{langue|gsw-fr}} : le titre rendu est
# « Alémanique alsacien » (constaté via l'API parse, prop=sections, le
# 22/08/2026). L'ancre MediaWiki remplace l'espace par un souligné.
ANCRE_GSW_FR = "Alémanique_alsacien"

# Templates de contexte observés en tête de définition gsw-fr, avec leur
# libellé rendu (vérifié sur le rendu HTML via l'API parse, 22/08/2026).
# « lexique » est traité à part : libellé = premier paramètre capitalisé.
# « oiseaux » est propre à gsw-fr (absent de mots.py — constaté sur le
# rendu : {{oiseaux|gsw-fr}} → « (Ornithologie) »).
CONTEXTES = {
    "Alsace": "Alsace",
    "localités": "Géographie",
    "capitales": "Géographie",
    "Région mulhousienne": "Région mulhousienne",
    "Wolschheim": "Wolschheim",
    "éléments": "Chimie",
    "métaux": "Métallurgie",
    "gâteaux": "Cuisine",
    "oiseaux": "Ornithologie",
}

# Motifs de désignation commune/ville — mêmes que mots.py (décision John
# 09/08/2026, article 725), constatés sur le rendu des définitions.
RE_TOPONYME = re.compile(
    r"commune française|"
    r"ville (?:de|d['’]|du|française|allemande|italienne|suisse)|"
    r"capitale (?:de|du)",
    re.IGNORECASE)

RE_TITRE_GSW_FR = re.compile(r"^== \{\{langue\|gsw-fr\}\} ==\n", re.M)
RE_TITRE_NIVEAU2 = re.compile(r"\n== ")
RE_SOUS_SECTION = re.compile(r"^===\s*\{\{S\|([^}|]+)(?:\|[^}]*)?\}\}\s*===$")
RE_LEMME = re.compile(r"'''([^'](?:[^']|'(?!''))*)'''")
RE_TEMPLATE_TETE = re.compile(r"^\{\{\s*([^{}|]+?)\s*(?:\|([^{}]*?))?\}\}")
RE_LIEN = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
RE_LIEN_TETE = re.compile(r"^\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
RE_ESPACES = re.compile(r" {2,}")


def sections_gsw_fr(texte: str) -> list[str]:
    """Découpe le wikicode en sections {{langue|gsw-fr}} (titre inclus).

    Chaque section va du titre « == {{langue|gsw-fr}} == » au titre de
    niveau 2 suivant (exclus) ou à la fin du fichier. Les titres de
    niveau 3 (« === ... === ») ne coupent pas la section : ils en font
    partie (graphie_origine = section entière).
    """
    sections: list[str] = []
    for m in RE_TITRE_GSW_FR.finditer(texte):
        debut = m.start()
        fin = RE_TITRE_NIVEAU2.search(texte, m.end())
        if fin is None:
            sections.append(texte[debut:])
        else:
            sections.append(texte[debut:fin.start()])
    return sections


def lemme(section: str) -> str | None:
    """Première occurrence de '''...''' dans la section (le mot-titre)."""
    m = RE_LEMME.search(section)
    return m.group(1) if m else None


def types_sous_sections(section: str) -> dict[int, str]:
    """Type de la sous-section {{S|...}} englobante pour chaque ligne.

    Retourne {indice_de_ligne: type} pour chaque ligne située sous une
    sous-section « === {{S|<type>|...}} === ». Le type est le premier
    paramètre du template (nom, adjectif, verbe, prénom, nom propre,
    interjection…). Les lignes hors sous-section (avant la première,
    après la dernière) n'y figurent pas.
    """
    types: dict[int, str] = {}
    courant = ""
    for i, ligne in enumerate(section.split("\n")):
        m = RE_SOUS_SECTION.match(ligne)
        if m:
            courant = m.group(1).strip()
            continue
        if courant:
            types[i] = courant
    return types


def resoudre_liens(texte: str) -> str:
    """[[cible|affiché]] → affiché ; [[cible]] → cible (sans ancre #...)."""
    def repl(m: re.Match) -> str:
        cible, affiche = m.group(1), m.group(2)
        if affiche is not None:
            return affiche
        return cible.split("#", 1)[0]
    return RE_LIEN.sub(repl, texte)


def nom_nu(texte_wiki: str, rendu: str) -> str | None:
    """Nom nu d'une ligne toponyme : texte affiché du premier lien wiki.

    Mêmes règles que mots.py : le nom doit être suivi, dans le rendu,
    d'une virgule ou d'une parenthèse ouvrante ; sinon il n'est pas
    identifiable dans la phrase (cas Wìnkel) et la ligne est omise.
    """
    m = RE_LIEN_TETE.match(texte_wiki)
    if not m:
        return None
    nom = m.group(2) if m.group(2) is not None else m.group(1).split("#", 1)[0]
    if not nom:
        return None
    if not (rendu.startswith(nom + ",") or rendu.startswith(nom + " (")):
        return None
    return nom


def traiter_definition(ligne: str, type_sous_section: str) -> tuple[str | None, list[str], str | None, str, str | None]:
    """Retourne (francais, contextes, region, type_att, code_doute).

    francais = None si la définition est douteuse (template de tête
    inconnu, template résiduel, toponyme sans nom nu identifiable, ou nom
    propre sans motif de désignation commune/ville) : la ligne est alors
    OMISE (règle 3) et code_doute porte la raison.
    region = « bas_rhin »/« haut_rhin » si la définition porte
    littéralement « département du Bas-Rhin » / « département du
    Haut-Rhin », sinon None. Jamais déduite.
    """
    texte_wiki = ligne[2:]  # après « # »
    contextes: list[str] = []

    # templates de contexte en tête de définition
    while True:
        m = RE_TEMPLATE_TETE.match(texte_wiki)
        if not m:
            break
        nom_tpl, args = m.group(1), m.group(2) or ""
        if nom_tpl == "lexique":
            p1 = args.split("|")[0].strip() if args else ""
            if not p1:
                return None, contextes, None, "mot", "template_tete_inconnu"
            lib = p1[0].upper() + p1[1:]
        elif nom_tpl in CONTEXTES:
            lib = CONTEXTES[nom_tpl]
        else:
            return None, contextes, None, "mot", "template_tete_inconnu"
        contextes.append(lib)
        texte_wiki = texte_wiki[m.end():].lstrip()

    # liens wiki → texte affiché (pour la détection et le rendu)
    rendu = resoudre_liens(texte_wiki)

    # template résiduel (non résolu) → doute
    if "{{" in rendu or "}}" in rendu:
        return None, contextes, None, "mot", "template_residuel"

    # espaces multiples : artefacts du retrait des templates
    rendu = RE_ESPACES.sub(" ", rendu).strip()

    if not rendu:
        return None, contextes, None, "mot", "definition_vide"

    # type : prénom d'abord (la sous-section fait foi — {{S|prénom|...}}),
    # puis motifs commune/ville sur le rendu, puis mot.
    if type_sous_section == "prénom":
        type_att = "prenom"
    elif RE_TOPONYME.search(rendu):
        type_att = "toponyme"
    elif type_sous_section == "nom propre":
        # Nom propre dont la définition ne porte aucun motif de désignation
        # commune/ville (souvent un nom nu : « Strasbourg. », « Mulhouse. ») :
        # impossible de trancher toponyme/mot sur la section — doute, règle 3.
        return None, contextes, None, "mot", "nom_propre_sans_motif_toponyme"
    else:
        type_att = "mot"

    region = None
    if "département du Bas-Rhin" in rendu:
        region = "bas_rhin"
    elif "département du Haut-Rhin" in rendu:
        region = "haut_rhin"

    if type_att == "toponyme":
        nom = nom_nu(texte_wiki, rendu)
        if nom is None:
            return None, contextes, region, type_att, "toponyme_sans_nom_nu"
        return nom, contextes, region, type_att, None

    return rendu, contextes, region, type_att, None


def zones_etymologie(section: str) -> set[int]:
    """Indices des lignes situées sous « === {{S|étymologie}} === »."""
    indices: set[int] = set()
    dans_etymo = False
    for i, ligne in enumerate(section.split("\n")):
        m = RE_SOUS_SECTION.match(ligne)
        if m:
            dans_etymo = "étymologie" in m.group(1).lower()
            continue
        if dans_etymo:
            indices.add(i)
    return indices


def titres_du_lot() -> list[str]:
    """Titres du lot pilote (data/raw/wiktionnaire_fr/gsw_fr_lot.json)."""
    if not LOT.exists():
        print(f"lot introuvable : {LOT} (lancer inventaire_gsw_fr.py d'abord)",
              file=sys.stderr)
        sys.exit(1)
    with LOT.open(encoding="utf-8") as fh:
        return json.load(fh)


def extraire() -> tuple[list[dict], list[dict]]:
    """Retourne (attestations, anomalies). Lit UNIQUEMENT le lot."""
    attestations: list[dict] = []
    anomalies: list[dict] = []

    for titre in titres_du_lot():
        fichier = RAW_DIR / f"{titre}.wikitext.txt"
        if not fichier.exists():
            anomalies.append({
                "fichier": fichier.name,
                "type": "lot_sans_brut",
                "detail": "page du lot non archivée dans data/raw/",
            })
            continue
        texte = fichier.read_text(encoding="utf-8")
        ref = f"https://fr.wiktionary.org/wiki/{titre}#{ANCRE_GSW_FR}"

        for section in sections_gsw_fr(texte):
            lem = lemme(section)
            if lem is None:
                anomalies.append({
                    "fichier": fichier.name,
                    "type": "lemme_introuvable",
                    "detail": "aucun '''...''' dans la section gsw-fr",
                })
                continue

            etymologie = zones_etymologie(section)
            types_ss = types_sous_sections(section)
            for i, ligne in enumerate(section.split("\n")):
                if i in etymologie:
                    # étymologie ≠ sens : jamais une définition
                    continue
                if not ligne.startswith("# "):
                    continue
                francais, contextes, region, type_att, code_doute = \
                    traiter_definition(ligne, types_ss.get(i, ""))
                if francais is None:
                    anomalies.append({
                        "fichier": fichier.name,
                        "type": code_doute or "definition_douteuse",
                        "detail": ligne[:120],
                    })
                    continue
                att = {
                    "source_code": SOURCE_CODE,
                    "francais": francais,
                    "alsacien": lem,
                    "graphie_origine": section,
                    "type": type_att,
                    "contexte": " ; ".join(contextes),
                }
                if region is not None:
                    att["region"] = region
                att["reference"] = ref
                attestations.append(att)

    return attestations, anomalies


def main() -> int:
    if not RAW_DIR.exists():
        print(f"dossier brut introuvable : {RAW_DIR}", file=sys.stderr)
        return 1

    attestations, anomalies = extraire()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        for att in attestations:
            fh.write(json.dumps(att, ensure_ascii=False) + "\n")

    lot = titres_du_lot()
    print(f"pages du lot : {len(lot)}")
    print(f"attestations produites : {len(attestations)}")
    from collections import Counter
    types = Counter(a["type"] for a in attestations)
    print(f"  par type : {dict(types)}")
    if anomalies:
        print(f"\n--- ANOMALIES (lignes OMISES, règle 3) ---")
        for a in anomalies:
            print(f"  [{a['type']}] {a['fichier']} : {a['detail']}")
    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
