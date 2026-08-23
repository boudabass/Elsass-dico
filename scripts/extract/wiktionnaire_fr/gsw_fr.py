#!/usr/bin/env python3
"""Parseur de la rubrique gsw_fr — source wiktionnaire_fr.

Dérivé du parseur mots.py (même structure de page, même famille de
règles). Lit data/raw/wiktionnaire_fr/ (JAMAIS le réseau) et produit
data/attestations/wiktionnaire_fr__gsw_fr.jsonl.

PÉRIMÈTRE — GÉNÉRALISATION (carte t_06e56f33, verdict John au GATE
t_4aa8dee1, 22/08/2026, article 725)
-----------------------------------------
Le parseur lit la liste data/raw/wiktionnaire_fr/gsw_fr_inventaire.json
(produite par inventaire_gsw_fr.py, graine 20260822, relevé API
searchinsource insource:"{{langue|gsw-fr" du 22/08/2026 — 836 pages) et
n'extrait que les pages de cette liste : c'est le périmètre exact de la
rubrique, zéro généralisation au-delà. Le lot pilote (21 pages,
t_bb75ea0e, commit 83ebe8f) est un sous-ensemble de ce périmètre.

STRUCTURE DES PAGES (constatée sur le brut, jamais déduite)
-----------------------------------------------------------
Les sections gsw-fr sont des titres de niveau 2 :

    == {{langue|gsw-fr}} ==    section alsacien de France (celle qu'on extrait)
    == {{langue|gsw}} ==       alémanique — SIGNAL du garde-fou (jamais extraite)
    == {{langue|fr}} ==        autre langue — ignorée

Dans la section gsw-fr :
  - le lemme alsacien est la première occurrence de '''...''' (gras) ;
  - les sens sont les lignes commençant par « # » (niveau 1) ;
  - les lignes « #* » sont des exemples — ignorées ;
  - les lignes « * » sont des listes (variantes, apparentés) — ignorées ;
  - la sous-section « === {{S|étymologie}} === » décrit l'origine du mot,
    pas ses sens : ses lignes « # » sont omises (règle 3), comme dans
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

GARDE-FOU TOPONYME — SECTION GSW JUMELLE (décision John, GATE
t_4aa8dee1, à mettre en œuvre AVANT la généralisation)
--------------------------------------------------------
La section gsw-fr seule ne permet PAS de distinguer un nom propre
toponyme d'un mot commun (constat pilote : Strossburi « Strasbourg. »,
Milhüsa « Mulhouse. », Vogesa « Vosges » — motif commune/ville absent de
la section gsw-fr). Le parseur consulte donc la SECTION GSW JUMELLE de
la même page (== {{langue|gsw}} ==) comme signal, en réutilisant les
motifs commune/ville déjà gérés par le parseur gsw existant (mots.py) :
« commune française », « ville de/d'/du/... », « capitale de/du ».

- Sous-section « {{S|prénom|gsw-fr|...}} » ⇒ type « prenom » (Fritz,
  Hàns, Schannele…) ;
- Sinon, motifs RE_TOPONYME constatés sur le RENDU de la définition
  gsw-fr (« commune française », « ville de/d'/du/... », « capitale
  de/du ») ⇒ type « toponyme » (décision John 09/08/2026, article 725) ;
- Sinon, sous-section « {{S|nom propre|gsw-fr}} » ⇒ GARDE-FOU : le
  parseur rend les lignes « # » de la section gsw jumelle de la même
  page (mêmes templates de tête, mêmes liens résolus) et cherche les
  motifs RE_TOPONYME :
  - un motif y apparaît ⇒ type « toponyme » : la définition gsw-fr
    (nom nu, souvent « Strasbourg. ») EST le nom du lieu, francais = le
    rendu de la définition gsw-fr, copié verbatim (zéro traduction : le
    français vient de la page, jamais déduit) ;
  - la section gsw jumelle est ABSENTE (cas général : seules 7 pages du
    périmètre portent les deux sections) ou ne porte aucun motif ⇒
    RÈGLE 3 : la ligne est OMISE du JSONL et signalée « type incertain »
    dans le rapport, avec son motif (gsw_jumelle_absente /
    gsw_jumelle_presente_sans_motif). JAMAIS devinée.
- Sinon ⇒ type « mot » (noms communs, verbes, adjectifs, interjections…).

Cas constatés en généralisation (23/08/2026) :
- Strossburi : gsw-fr « [[Strasbourg#Français|Strasbourg]]. » sans
  motif ; la section gsw jumelle porte « [[Strasbourg#Français|Strasbourg]]
  (ville de [[France]]). » ⇒ toponyme via le garde-fou.
- Milhüsa / Milhüse / Milhüüse / Mïlhüsa (« Mulhouse »), Vogesa
  (« Vosges »), Gawiller (« Guebwiller »), Zàwera (« Saverne »),
  Spanïa (« Espagne (pays européen) »), Frankrïïch (« France »),
  Suntiklàuis (« Saint-Nicolas »), Kindelesbrunnen (phrase descriptive),
  Strossburg (« Strasbourg ») : nom propre sans motif ET sans section
  gsw jumelle ⇒ type incertain, listées dans le rapport (règle 3).
- Scheenài / Strosbùri / Zàwere : définition gsw-fr avec motif
  « commune française » mais nom nu suivi d'un POINT-VIRGULE (« Saverne ;
  commune française… ») — la règle nom_nu du pilote n'accepte que la
  virgule ou la parenthèse ouvrante : c'est un PATRON NOUVEAU, signalé
  dans le rapport (règle 3), jamais ajouté au parseur (même doctrine que
  mots.py : « un patron nouveau serait SIGNALÉ dans le rapport, jamais
  ajouté ici »).

TEMPLATES DE CONTEXTE — EXTENSION GÉNÉRALISATION (23/08/2026)
-------------------------------------------------------------
Le pilote avait vérifié 9 libellés de templates (API parse, 22/08/2026).
La généralisation révèle des templates supplémentaires, vérifiés de la
même façon (rendu HTML via l'API parse, 23/08/2026) : {{fruits}} et
{{plantes}} → « Botanique », {{mammifères}} → « Mammalogie »,
{{plans d’eau}} et {{localités}} → « Géographie », {{pays}} → « Pays »,
{{meubles}} → « Mobilier », {{préparations}} et {{gâteaux}} → « Cuisine »,
{{insectes}} → « Entomologie », {{figuré}} → « Sens figuré »,
{{péjoratif}} → « Péjoratif », {{langues}} → « Linguistique »,
{{maladie}} → « Nosologie », {{désuet}} → « Désuet »,
{{ironique}} → « Ironique », {{argot}} → « Argot ». {{term|...}} rend
comme {{lexique}} : libellé = premier paramètre capitalisé (vérifié :
{{term|couverture|gsw-fr}} → « (Couverture) »).

{{lien|...}} est un LIEN (pas un template de contexte) : {{lien|par|fr}}
rend « par », {{lien|chéri|dif=Chéri}} rend « Chéri » (paramètre dif=).
Il est résolu comme les liens [[...]] — vérifié via l'API parse.

LIGNES DE FORME — OMISES (précédent studio, 23/08/2026)
-------------------------------------------------------
Les lignes « # » qui ne sont pas des définitions mais des NOTES DE FORME
— « ''Pluriel de'' … », « ''Participe passé de'' … »,
« {{variante de|…}} » (appetit, àbg’làde, Blätter, Kàntona,
Schwàrzàrwaiter…) — sont OMISES et signalées « ligne_de_forme » (règle
3) : la rubrique gsw du même studio (mots.py, 773 attestations) n'a
extrait AUCUNE ligne de forme ; un doute de traitement (forme = entrée
lexicale ou non) se signale, il ne se tranche pas ici.

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
PERIMETRE = RAW_DIR / "gsw_fr_inventaire.json"
OUT = REPO / "data" / "attestations" / "wiktionnaire_fr__gsw_fr.jsonl"

SOURCE_CODE = "wiktionnaire_fr"

# Ancre de la section {{langue|gsw-fr}} : le titre rendu est
# « Alémanique alsacien » (constaté via l'API parse, prop=sections, le
# 22/08/2026). L'ancre MediaWiki remplace l'espace par un souligné.
ANCRE_GSW_FR = "Alémanique_alsacien"

# Templates de contexte observés en tête de définition gsw-fr, avec leur
# libellé rendu. Le pilote a vérifié les 9 premiers via l'API parse le
# 22/08/2026 ; la généralisation a vérifié les suivants le 23/08/2026
# (rendu HTML via l'API parse — cf. docstring). « lexique » et « term »
# sont traités à part : libellé = premier paramètre capitalisé.
CONTEXTES = {
    # pilote (22/08/2026)
    "Alsace": "Alsace",
    "localités": "Géographie",
    "capitales": "Géographie",
    "Région mulhousienne": "Région mulhousienne",
    "Wolschheim": "Wolschheim",
    "éléments": "Chimie",
    "métaux": "Métallurgie",
    "gâteaux": "Cuisine",
    "oiseaux": "Ornithologie",
    # généralisation (23/08/2026)
    "fruits": "Botanique",
    "plantes": "Botanique",
    "mammifères": "Mammalogie",
    "plans d’eau": "Géographie",
    "pays": "Pays",
    "meubles": "Mobilier",
    "préparations": "Cuisine",
    "insectes": "Entomologie",
    "figuré": "Sens figuré",
    "péjoratif": "Péjoratif",
    "langues": "Linguistique",
    "maladie": "Nosologie",
    "désuet": "Désuet",
    "ironique": "Ironique",
    "argot": "Argot",
}

# Motifs de désignation commune/ville — mêmes que mots.py (décision John
# 09/08/2026, article 725), constatés sur le rendu des définitions.
RE_TOPONYME = re.compile(
    r"commune française|"
    r"ville (?:de|d['’]|du|française|allemande|italienne|suisse)|"
    r"capitale (?:de|du)",
    re.IGNORECASE)

# Lignes de forme (omises, règle 3 — cf. docstring) : notes « Pluriel
# de… », « Participe passé de… » en italique, template {{variante de|…}}.
RE_FORME = re.compile(
    r"\{\{variante de\||''(?:Pluriel de|Participe passé de|pluriel de)''")

RE_TITRE_GSW_FR = re.compile(r"^== \{\{langue\|gsw-fr\}\} ==\n", re.M)
RE_TITRE_GSW = re.compile(r"^== \{\{langue\|gsw\}\} ==\n", re.M)
RE_TITRE_NIVEAU2 = re.compile(r"\n== ")
RE_SOUS_SECTION = re.compile(r"^===\s*\{\{S\|([^}|]+)(?:\|[^}]*)?\}\}\s*===$")
RE_LEMME = re.compile(r"'''([^'](?:[^']|'(?!''))*)'''")
RE_TEMPLATE_TETE = re.compile(r"^\{\{\s*([^{}|]+?)\s*(?:\|([^{}]*?))?\}\}")
RE_LIEN = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
RE_LIEN_TETE = re.compile(r"^\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
RE_LIEN_TPL = re.compile(r"\{\{\s*lien\|([^}|]+)(?:\|([^}]*))?\}\}")
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


def sections_gsw(texte: str) -> list[str]:
    """Découpe le wikicode en sections {{langue|gsw}} (titre inclus).

    C'est la SECTION JUMELLE du garde-fou : le signal toponyme vient de
    ses lignes « # ». La regex exige « gsw }} » exactement : le titre
    gsw-fr (« == {{langue|gsw-fr}} == ») n'est PAS un titre gsw.
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
    """[[cible|affiché]] → affiché ; [[cible]] → cible (sans ancre #...).

    {{lien|...}} est la forme en template d'un lien (vérifié via l'API
    parse, 23/08/2026) : {{lien|par|fr}} → « par » ; le paramètre dif=
    force le texte affiché ({{lien|chéri|dif=Chéri}} → « Chéri »).
    """
    def repl_wiki(m: re.Match) -> str:
        cible, affiche = m.group(1), m.group(2)
        if affiche is not None:
            return affiche
        return cible.split("#", 1)[0]

    def repl_tpl(m: re.Match) -> str:
        cible = m.group(1).strip()
        args = m.group(2) or ""
        dif = re.search(r"dif=([^|}]+)", args)
        if dif:
            return dif.group(1).strip()
        return cible.split("#", 1)[0]

    texte = RE_LIEN_TPL.sub(repl_tpl, texte)
    return RE_LIEN.sub(repl_wiki, texte)


def rendre_ligne(ligne: str) -> tuple[str | None, list[str], str | None]:
    """Rendu d'une ligne « # » : templates de tête retirés, liens résolus.

    Retourne (rendu, contextes, code_doute) :
    - rendu = le texte après retrait des templates de contexte de tête et
      résolution des liens, espaces multiples réduits (None si doute) ;
    - contextes = libellés des parenthèses de contexte rendues ;
    - code_doute = None si la ligne est exploitable, sinon la raison
      (ligne_de_forme, template_tete_inconnu, template_residuel,
      definition_vide).
    """
    texte_wiki = ligne[2:]  # après « # »
    contextes: list[str] = []

    # lignes de forme (Pluriel de…, Participe passé de…, variante de…)
    if RE_FORME.search(ligne):
        return None, contextes, "ligne_de_forme"

    # templates de contexte en tête de définition
    while True:
        m = RE_TEMPLATE_TETE.match(texte_wiki)
        if not m:
            break
        nom_tpl, args = m.group(1), m.group(2) or ""
        if nom_tpl == "lien":
            # {{lien|...}} est un lien, pas un template de contexte : on
            # le laisse en place, resoudre_liens s'en charge.
            break
        if nom_tpl in ("lexique", "term"):
            p1 = args.split("|")[0].strip() if args else ""
            if not p1:
                return None, contextes, "template_tete_inconnu"
            lib = p1[0].upper() + p1[1:]
        elif nom_tpl in CONTEXTES:
            lib = CONTEXTES[nom_tpl]
        else:
            return None, contextes, "template_tete_inconnu"
        contextes.append(lib)
        texte_wiki = texte_wiki[m.end():].lstrip()

    # liens wiki et {{lien}} → texte affiché (pour la détection et le rendu)
    rendu = resoudre_liens(texte_wiki)

    # template résiduel (non résolu) → doute
    if "{{" in rendu or "}}" in rendu:
        return None, contextes, "template_residuel"

    # espaces multiples : artefacts du retrait des templates
    rendu = RE_ESPACES.sub(" ", rendu).strip()

    if not rendu:
        return None, contextes, "definition_vide"

    return rendu, contextes, None


def nom_nu(texte_wiki: str, rendu: str) -> str | None:
    """Nom nu d'une ligne toponyme : texte affiché du premier lien wiki.

    Mêmes règles que mots.py : le nom doit être suivi, dans le rendu,
    d'une virgule ou d'une parenthèse ouvrante ; sinon il n'est pas
    identifiable dans la phrase (cas Wìnkel) et la ligne est omise.
    Le point-virgule (« Saverne ; commune française… », cas Scheenài /
    Strosbùri / Zàwere) est un PATRON NOUVEAU constaté en généralisation
    — signalé au rapport, pas ajouté ici (même doctrine que mots.py).
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


def signal_gsw_jumelle(texte: str) -> bool:
    """Le garde-fou : la section gsw jumelle de la même page tranche-t-elle ?

    Rend les lignes « # » des sections == {{langue|gsw}} == de la page
    (mêmes templates de tête, mêmes liens résolus que la définition
    gsw-fr) et cherche les motifs commune/ville RE_TOPONYME. Une ligne
    douteuse (template inconnu/résiduel) ne tranche pas. Retourne True
    dès qu'un motif apparaît sur le rendu d'une ligne.
    """
    for section in sections_gsw(texte):
        for ligne in section.split("\n"):
            if not ligne.startswith("# "):
                continue
            rendu, _, code_doute = rendre_ligne(ligne)
            if rendu is None or code_doute is not None:
                continue
            if RE_TOPONYME.search(rendu):
                return True
    return False


def traiter_definition(ligne: str, type_sous_section: str,
                       signal_jumelle: bool) -> tuple[str | None, list[str], str | None, str, str | None]:
    """Retourne (francais, contextes, region, type_att, code_doute).

    francais = None si la définition est douteuse (ligne de forme,
    template de tête inconnu, template résiduel, toponyme sans nom nu
    identifiable, ou nom propre sans motif ET sans signal de la section
    gsw jumelle) : la ligne est alors OMISE (règle 3) et code_doute
    porte la raison (« type_incertain » pour le garde-fou — l'appelant
    précise le motif gsw_jumelle_absente / gsw_jumelle_presente_sans_motif).
    region = « bas_rhin »/« haut_rhin » si la définition porte
    littéralement « département du Bas-Rhin » / « département du
    Haut-Rhin », sinon None. Jamais déduite.
    """
    rendu, contextes, code_doute = rendre_ligne(ligne)
    if rendu is None:
        return None, contextes, None, "mot", code_doute

    region = None
    if "département du Bas-Rhin" in rendu:
        region = "bas_rhin"
    elif "département du Haut-Rhin" in rendu:
        region = "haut_rhin"

    # type : prénom d'abord (la sous-section fait foi — {{S|prénom|...}}),
    # puis motifs commune/ville sur le rendu, puis le garde-fou de la
    # section gsw jumelle pour les noms propres, puis mot.
    if type_sous_section == "prénom":
        return rendu, contextes, region, "prenom", None

    if RE_TOPONYME.search(rendu):
        # toponyme par la définition gsw-fr elle-même : francais = nom nu
        nom = nom_nu(ligne[2:], rendu)
        if nom is None:
            return None, contextes, region, "toponyme", "toponyme_sans_nom_nu"
        return nom, contextes, region, "toponyme", None

    if type_sous_section == "nom propre":
        if signal_jumelle:
            # La section gsw jumelle porte un motif commune/ville : la
            # définition gsw-fr (nom nu : « Strasbourg. ») EST le nom du
            # lieu. francais = le rendu de la définition gsw-fr, copié
            # verbatim — zéro traduction, le français vient de la page.
            return rendu, contextes, region, "toponyme", None
        # Garde-fou : la section gsw jumelle est absente ou ne porte
        # aucun motif commune/ville — impossible de trancher toponyme/mot
        # sur pièces. Règle 3 : omise, signalée (l'appelant documente le
        # motif exact).
        return None, contextes, region, "mot", "type_incertain"

    return rendu, contextes, region, "mot", None


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


def titres_du_perimetre() -> list[str]:
    """Titres du périmètre (gsw_fr_inventaire.json, 836 pages).

    C'est la copie brute du relevé API (inventaire_gsw_fr.py, graine
    20260822) : l'ordre du fichier est l'ordre de l'API, rejouable.
    """
    if not PERIMETRE.exists():
        print(f"inventaire introuvable : {PERIMETRE} "
              f"(lancer inventaire_gsw_fr.py d'abord)", file=sys.stderr)
        sys.exit(1)
    with PERIMETRE.open(encoding="utf-8") as fh:
        inventaire = json.load(fh)
    # L'inventaire est un objet {titre: [catégories]} : le périmètre de la
    # rubrique est l'ensemble de ses clés, dans l'ordre du relevé.
    return list(inventaire.keys())


def extraire() -> tuple[list[dict], list[dict], list[str]]:
    """Retourne (attestations, anomalies, pages_sans_attestation).

    Lit UNIQUEMENT les 836 pages de l'inventaire gsw_fr (jamais le
    réseau, jamais au-delà du périmètre).
    """
    attestations: list[dict] = []
    anomalies: list[dict] = []
    pages_sans_attestation: list[str] = []

    for titre in titres_du_perimetre():
        fichier = RAW_DIR / f"{titre}.wikitext.txt"
        if not fichier.exists():
            anomalies.append({
                "fichier": f"{titre}.wikitext.txt",
                "type": "brut_manquant",
                "detail": "page du périmètre non archivée dans data/raw/",
            })
            pages_sans_attestation.append(titre)
            continue
        texte = fichier.read_text(encoding="utf-8")
        ref = f"https://fr.wiktionary.org/wiki/{titre}#{ANCRE_GSW_FR}"

        sections = sections_gsw_fr(texte)
        if not sections:
            anomalies.append({
                "fichier": fichier.name,
                "type": "page_sans_section_gswfr",
                "detail": "aucune section == {{langue|gsw-fr}} == dans le brut",
            })
            pages_sans_attestation.append(titre)
            continue

        signal_jumelle = signal_gsw_jumelle(texte)
        jumelle_presente = bool(sections_gsw(texte))
        page_produite = False
        for section in sections:
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
                    traiter_definition(ligne, types_ss.get(i, ""),
                                       signal_jumelle)
                if francais is None:
                    if code_doute == "type_incertain":
                        # Garde-fou : la section gsw jumelle est absente
                        # ou ne porte aucun motif commune/ville — le
                        # motif exact est documenté dans le rapport.
                        motif = ("gsw_jumelle_presente_sans_motif"
                                 if jumelle_presente
                                 else "gsw_jumelle_absente")
                        anomalies.append({
                            "fichier": fichier.name,
                            "type": "type_incertain",
                            "detail": f"{motif} — {ligne[:120]}",
                        })
                    else:
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
                page_produite = True

        if not page_produite:
            pages_sans_attestation.append(titre)

    return attestations, anomalies, pages_sans_attestation


def main() -> int:
    if not RAW_DIR.exists():
        print(f"dossier brut introuvable : {RAW_DIR}", file=sys.stderr)
        return 1

    attestations, anomalies, pages_sans_attestation = extraire()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        for att in attestations:
            fh.write(json.dumps(att, ensure_ascii=False) + "\n")

    from collections import Counter
    types = Counter(a["type"] for a in attestations)
    pages = titres_du_perimetre()
    print(f"pages du périmètre : {len(pages)}")
    print(f"attestations produites : {len(attestations)}")
    print(f"  par type : {dict(types)}")
    print(f"pages sans attestation : {len(pages_sans_attestation)}")
    if pages_sans_attestation:
        print("  " + ", ".join(sorted(pages_sans_attestation)))

    if anomalies:
        print(f"\n--- ANOMALIES (lignes OMISES, règle 3) ---")
        types_anom = Counter(a["type"] for a in anomalies)
        print(f"  par type : {dict(types_anom)}")
        for a in anomalies:
            print(f"  [{a['type']}] {a['fichier']} : {a['detail']}")
    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
