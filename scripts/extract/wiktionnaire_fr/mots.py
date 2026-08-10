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
    {{capitales|...}}, {{éléments|...}}, {{métaux|...}}, {{gâteaux|...}},
    {{lexique|...|gsw}}) rendent des parenthèses de contexte (ex.
    « (Alsace) (Géographie) ») : elles alimentent le champ contexte.

TYPE — DÉTECTION TOPONYME (correction t_ade43e0f, décision John 09/08/2026,
article 725)
-----------------------------------------------------------------------------
Toute entrée désignant une commune ou une ville est « toponyme ». Les motifs
de désignation sont constatés sur le rendu de la définition (liens résolus) :

  - « commune française »            → commune (ex. « Epfig, commune
                                       française, située dans le département
                                       du Bas-Rhin. ») ;
  - « ville de/d'/française/allemande/italienne/suisse »
                                     → ville (ex. « Strasbourg (ville de
                                       France). », « Hambourg, ville
                                       d'Allemagne. ») ;
  - « capitale de »                  → ville (ex. « Vienne (capitale de
                                       l'Autriche). », « Le Caire (capitale
                                       de l'Égypte). »).

Toute autre définition reste « mot » (mots communs, éléments chimiques,
régions — « Elsass (région française) » est une région, pas une commune ni
une ville : type mot, inchangé).

FRANCAIS — NOM NU POUR LES TOPONYMES (défaut 2 bloquant)
---------------------------------------------------------
Sur une ligne toponyme, francais porte le NOM NU de la commune/ville, extrait
verbatim de la page (le nom est le texte affiché du premier lien wiki de la
définition, jamais une traduction — règle 1) :

  [[Epfig#fr|Epfig]], [[commune]] …          → francais « Epfig »
  [[Strasbourg#Français|Strasbourg]] (ville…) → francais « Strasbourg »

Le nom nu doit être suivi, dans le rendu, d'une virgule ou d'une parenthèse
ouvrante (« Epfig, … », « Strasbourg (… »). Si ce n'est pas le cas, le nom
n'est pas identifiable dans la phrase (cas Wìnkel : « Commune française,
située dans le département du Haut-Rhin. ») : la ligne est OMISE (règle 3,
un doute se signale) et listée dans le rapport.

RÈGLES APPLIQUÉES (article 720 + spec carte t_ade43e0f)
--------------------------------------------------------
- alsacien : le lemme '''...''', copié verbatim.
- francais : pour un toponyme, le nom nu extrait ci-dessus ; pour un mot,
  la définition rendue (liens résolus, templates de contexte retirés,
  ponctuation de la page conservée, copiée verbatim).
- graphie_origine : la section gsw ENTIÈRE (du == {{langue|gsw}} == au
  titre de niveau 2 suivant, exclus), avant tout découpage.
- contexte : les libellés des parenthèses de contexte rendues, joints par
  « ; » dans l'ordre d'apparition, sinon « ».
- type : « toponyme » si la définition désigne une commune ou une ville
  (motifs ci-dessus), sinon « mot ».
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

# Ancre de la section {{langue|gsw}} : le titre rendu est « Alémanique »
# (constaté via l'API parse, prop=sections, le 09/08/2026).
ANCRE_GSW = "Alémanique"

# Templates de contexte observés en tête de définition, avec leur libellé
# rendu (vérifié sur le rendu HTML des pages du lot, 09/08/2026).
# « lexique » est traité à part : libellé = premier paramètre capitalisé.
CONTEXTES = {
    "Alsace": "Alsace",
    "localités": "Géographie",
    "capitales": "Géographie",
    "Région mulhousienne": "Région mulhousienne",
    "Wolschheim": "Wolschheim",
    "éléments": "Chimie",
    "métaux": "Métallurgie",
    "gâteaux": "Cuisine",
}

# Motifs de désignation commune/ville, constatés sur le rendu des définitions
# (liens résolus) des pages du lot pilote élargi (t_ade43e0f, 10/08/2026).
# « d' » accepte l'apostrophe courbe ’ (U+2019) du Wiktionnaire et l'apostrophe
# droite ' (constatées toutes deux sur le brut : « ville d’Allemagne »,
# « ville d'Italie »).
RE_TOPONYME = re.compile(
    r"commune française|"
    r"ville (?:de|d['’]|française|allemande|italienne|suisse)|"
    r"capitale de"
)

RE_TITRE_GSW = re.compile(r"^== \{\{langue\|gsw\}\} ==\n", re.M)
RE_TITRE_NIVEAU2 = re.compile(r"\n== ")
RE_LEMME = re.compile(r"'''([^']+)'''")
RE_TEMPLATE_TETE = re.compile(r"^\{\{\s*([^{}|]+?)\s*(?:\|([^{}]*?))?\}\}")
RE_LIEN = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
RE_LIEN_TETE = re.compile(r"^\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
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


def nom_nu(texte_wiki: str, rendu: str) -> str | None:
    """Nom nu d'une ligne toponyme : texte affiché du premier lien wiki.

    Retourne None si le nom n'est pas identifiable : pas de lien en tête,
    ou le rendu ne commence pas par le nom suivi d'une virgule ou d'une
    parenthèse ouvrante (cas Wìnkel — le nom n'est pas dans la phrase).
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


def traiter_definition(ligne: str) -> tuple[str | None, list[str], str | None, str, str | None]:
    """Retourne (francais, contextes, region, type_att, code_doute).

    francais = None si la définition est douteuse (template de tête
    inconnu, template résiduel, ou toponyme sans nom nu identifiable) :
    la ligne est alors OMISE (règle 3) et code_doute porte la raison.
    region = "bas_rhin"/"haut_rhin" si la définition porte littéralement
    « département du Bas-Rhin » / « département du Haut-Rhin », sinon None.
    type_att = "toponyme" si la définition désigne une commune ou une ville
    (motifs RE_TOPONYME), sinon "mot".
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

    # type : toponyme si la définition désigne une commune ou une ville
    type_att = "toponyme" if RE_TOPONYME.search(rendu) else "mot"

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
                francais, contextes, region, type_att, code_doute = \
                    traiter_definition(ligne)
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

    print(f"fichiers bruts lus : {len(list(RAW_DIR.glob('*.wikitext.txt')))}")
    print(f"attestations produites : {len(attestations)}")
    toponymes = sum(1 for a in attestations if a["type"] == "toponyme")
    print(f"  dont toponymes : {toponymes}, mots : {len(attestations) - toponymes}")
    if anomalies:
        print(f"\n--- ANOMALIES (lignes OMISES, règle 3) ---")
        for a in anomalies:
            print(f"  [{a['type']}] {a['fichier']} : {a['detail']}")
    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
