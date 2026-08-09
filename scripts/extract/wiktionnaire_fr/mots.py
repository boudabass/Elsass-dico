#!/usr/bin/env python3
"""Parseur de la rubrique mots — source wiktionnaire_fr.

Lit data/raw/wiktionnaire_fr/*.wikitext.txt (JAMAIS le réseau) et produit
data/attestations/wiktionnaire_fr__mots.jsonl.

STRUCTURE DES PAGES (constatée sur le brut, jamais déduite)
------------------------------------------------------------
Chaque fichier <Titre>.wikitext.txt est le wikicode complet d'une page du
Wiktionnaire francophone. Les sections de langue sont des titres de niveau 2 :

    == {{langue|gsw}} ==       section alémanique (celle qu'on extrait)
    == {{langue|gsw-fr}} ==    alsacien de France — IGNORÉE (spec : gsw seul)
    == {{langue|de}} ==        autre langue — ignorée

Dans la section gsw :
  - le lemme alsacien est la première occurrence de '''...''' (gras) ;
  - les sens sont les lignes commençant par « # » (niveau 1) ;
  - les lignes « #* » sont des exemples — ignorées ;
  - les lignes « * » sont des listes (synonymes, dérivés) — ignorées ;
  - en tête de définition, des templates de contexte ({{Alsace|gsw}},
    {{localités|...}}, {{Région mulhousienne|...}}, {{Wolschheim|...}},
    {{éléments|...}}, {{métaux|...}}, {{gâteaux|...}}, {{lexique|...|gsw}})
    rendent des parenthèses de contexte (ex. « (Alsace) (Géographie) ») :
    elles alimentent le champ contexte.

RÈGLES APPLIQUÉES (article 720 + spec carte t_1211f9ea)
--------------------------------------------------------
- alsacien : le lemme '''...''', copié verbatim.
- francais : la définition rendue : liens wiki résolus en leur texte
  affiché ([[cible|affiché]] → affiché, [[cible]] → cible), templates de
  contexte retirés, ponctuation de la page conservée, copiée verbatim.
- graphie_origine : la section gsw ENTIÈRE (du == {{langue|gsw}} == au
  titre de niveau 2 suivant, exclus), avant tout découpage. C'est elle qui
  rend la vérification possible.
- contexte : les libellés des parenthèses de contexte rendues, joints par
  « ; » dans l'ordre d'apparition, sinon « ».
- type : « mot » (spec de carte).
- region : renseignée UNIQUEMENT si la définition porte littéralement un
  département (« département du Bas-Rhin » → bas_rhin). Jamais déduite.
- reference : https://fr.wiktionary.org/wiki/<Titre>#Alémanique — l'ancre
  « Alémanique » est le titre rendu de la section {{langue|gsw}} (constaté
  via l'API parse, prop=sections, le 09/08/2026).

REJOUABILITÉ
------------
Deux exécutions successives sur le même brut produisent un JSONL identique
(git diff vide) : c'est la preuve qu'aucune ligne n'a été saisie à la main.
Le parseur ne lit que data/raw/.
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW_DIR = REPO / "data" / "raw" / "wiktionnaire_fr"
OUT = REPO / "data" / "attestations" / "wiktionnaire_fr__mots.jsonl"

SOURCE_CODE = "wiktionnaire_fr"
TYPE = "mot"

# Ancre de la section {{langue|gsw}} : le titre rendu est « Alémanique »
# (constaté via l'API parse, prop=sections, le 09/08/2026).
ANCRE_GSW = "Alémanique"

# Templates de contexte observés en tête de définition, avec leur libellé
# rendu (vérifié sur le rendu HTML des pages du lot, 09/08/2026).
# « lexique » est traité à part : libellé = premier paramètre capitalisé.
CONTEXTES = {
    "Alsace": "Alsace",
    "localités": "Géographie",
    "Région mulhousienne": "Région mulhousienne",
    "Wolschheim": "Wolschheim",
    "éléments": "Chimie",
    "métaux": "Métallurgie",
    "gâteaux": "Cuisine",
}

RE_TITRE_GSW = re.compile(r"^== \{\{langue\|gsw\}\} ==\n", re.M)
RE_TITRE_NIVEAU2 = re.compile(r"\n== ")
RE_LEMME = re.compile(r"'''([^']+)'''")
RE_TEMPLATE_TETE = re.compile(r"^\{{\s*([^{}|]+?)\s*(?:\|([^{}]*?))?\}\}")
RE_LIEN = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
RE_ESPACES = re.compile(r" {2,}")


def sections_gsw(texte: str) -> list[str]:
    """Découpe le wikicode en sections {{langue|gsw}} (titre inclus).

    Chaque section va du titre « == {{langue|gsw}} == » au titre de
    niveau 2 suivant (exclus) ou à la fin du fichier. Le titre gsw-fr
    (« == {{langue|gsw-fr}} == ») n'est PAS un titre gsw : la regex
    exige « gsw }} » exactement.
    """
    sections: list[str] = []
    for m in RE_TITRE_GSW.finditer(texte):
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


def resoudre_liens(texte: str) -> str:
    """[[cible|affiché]] → affiché ; [[cible]] → cible (sans ancre #...)."""
    def repl(m: re.Match) -> str:
        cible, affiche = m.group(1), m.group(2)
        if affiche is not None:
            return affiche
        return cible.split("#", 1)[0]
    return RE_LIEN.sub(repl, texte)


def traiter_definition(ligne: str) -> tuple[str | None, list[str], str | None]:
    """Retourne (francais, contextes, region).

    francais = None si la définition est douteuse (template de tête
    inconnu ou template résiduel) : la ligne est alors OMISE.
    region = "bas_rhin"/"haut_rhin" si la définition porte littéralement
    « département du Bas-Rhin » / « département du Haut-Rhin », sinon None.
    """
    texte = ligne[2:]  # après « # »
    contextes: list[str] = []

    # templates de contexte en tête de définition
    while True:
        m = RE_TEMPLATE_TETE.match(texte)
        if not m:
            break
        nom, args = m.group(1), m.group(2) or ""
        if nom == "lexique":
            p1 = args.split("|")[0].strip() if args else ""
            if not p1:
                return None, contextes, None
            lib = p1[0].upper() + p1[1:]
        elif nom in CONTEXTES:
            lib = CONTEXTES[nom]
        else:
            return None, contextes, None  # template de tête inconnu → doute
        contextes.append(lib)
        texte = texte[m.end():].lstrip()

    # liens wiki → texte affiché
    texte = resoudre_liens(texte)

    # template résiduel (non résolu) → doute
    if "{{" in texte or "}}" in texte:
        return None, contextes, None

    # espaces multiples : artefacts du retrait des templates
    texte = RE_ESPACES.sub(" ", texte).strip()

    if not texte:
        return None, contextes, None

    region = None
    if "département du Bas-Rhin" in texte:
        region = "bas_rhin"
    elif "département du Haut-Rhin" in texte:
        region = "haut_rhin"

    return texte, contextes, region


def extraire() -> tuple[list[dict], list[dict]]:
    """Retourne (attestations, anomalies)."""
    attestations: list[dict] = []
    anomalies: list[dict] = []

    fichiers = sorted(RAW_DIR.glob("*.wikitext.txt"))
    if not fichiers:
        print(f"aucun fichier brut dans {RAW_DIR}", file=sys.stderr)
        return attestations, anomalies

    for fichier in fichiers:
        titre = fichier.name[:-len(".wikitext.txt")]
        texte = fichier.read_text(encoding="utf-8")
        ref = f"https://fr.wiktionary.org/wiki/{titre}#{ANCRE_GSW}"

        for section in sections_gsw(texte):
            lem = lemme(section)
            if lem is None:
                anomalies.append({
                    "fichier": fichier.name,
                    "type": "lemme_introuvable",
                    "detail": "aucun '''...''' dans la section gsw",
                })
                continue

            for ligne in section.split("\n"):
                if not ligne.startswith("# "):
                    continue
                francais, contextes, region = traiter_definition(ligne)
                if francais is None:
                    anomalies.append({
                        "fichier": fichier.name,
                        "type": "definition_douteuse",
                        "detail": ligne[:120],
                    })
                    continue
                att = {
                    "source_code": SOURCE_CODE,
                    "francais": francais,
                    "alsacien": lem,
                    "graphie_origine": section,
                    "type": TYPE,
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

    print(f"fichiers bruts lus : {len(list(RAW_DIR.glob('*.wikitext.txt')))}")
    print(f"attestations produites : {len(attestations)}")
    if anomalies:
        print(f"\n--- ANOMALIES (lignes OMISES, règle 3) ---")
        for a in anomalies:
            print(f"  [{a['type']}] {a['fichier']} : {a['detail']}")
    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
