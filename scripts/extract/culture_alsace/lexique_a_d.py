#!/usr/bin/env python3
"""Parseur de la rubrique lexique_a_d — source culture_alsace.

Lit data/raw/culture_alsace/page_{X}f.htm (X = a…z, xy — le sens
français → alsacien, 25 fichiers) et produit
data/attestations/culture_alsace__lexique_a_d.jsonl.

Le JSONL porte le nom de la RUBRIQUE (lexique_a_d, clé de la fiche source),
pas celui des pages : la fiche décide du nom du lot, jamais la page.

STRUCTURE DES PAGES (constatée sur le brut, jamais déduite)
-----------------------------------------------------------
Chaque page_Xf.htm est un dictionnaire français → alsacien : des entrées
« <B>français.-</B> (contexte) <I>alsacien(s)</I> » dans une ou plusieurs
tables <TABLE> (la page W contient les lettres W, X et Y ; la page XY ne
contient qu'un sous-ensemble de X et Y — mêmes entrées, parfois
légèrement différentes ; on ne prend QUE les tables qui portent le
séparateur « .- », ce qui exclut les tables de navigation et de
prononciation).

RÈGLES APPLIQUÉES (article 720 + contrat data/README.md)
--------------------------------------------------------
- Décodage latin1 puis html.unescape : copie du texte RENDU (balises
  retirées, entités résolues). Les formes sont copiées caractère pour
  caractère, jamais corrigées (règle 1) : une coquille visible (tête sans
  séparateur, « .- » final dans l'alsacien, parenthèse non fermée,
  « &Agrave » sans esperluette…) est copiée telle quelle et SIGNALÉE dans
  le rapport de carte.
- francais : la tête <B>…</B> moins le séparateur final « .- » (ou sa
  coquille « . », « - », « ._ », « ,- », « /- », « ;- », « .-- », « ' »,
  « !- » — le séparateur est structurel, pas une graphie ; la graphie_origine
  garde la tête entière telle qu'écrite).
- alsacien : le contenu <I>…</I> (ou, quand la balise d'ouverture manque,
  le texte jusqu'au dernier </I> de l'entrée), balises retirées, entités
  résolues. Copié verbatim, ponctuation comprise.
- contexte : la parenthèse qui suit la tête, copiée verbatim (parenthèses
  comprises, y compris quand la parenthèse n'est pas fermée — coquille
  signalée). Sépare les homonymes (« abandonner » vs « abandonner (s') »).
- graphie_origine : la tête (séparateur inclus) + contexte + alsacien,
  joints par une espace — le fragment source avant tout découpage, dans
  l'ordre des colonnes de la source.
- type : « expression » si francais contient une espace, « mot » sinon
  (vocabulaire fermé du contrat ; la fiche annonce « mot, expression »).
- region : ABSENTE. La page ne porte aucune information régionale par
  entrée (pas de code postal, pas d'intitulé régional) — la note « bas
  alémanique du Nord (Bas-Rhinois) » en tête de page_af.htm est une note
  d'enrichissement de page, pas une information d'entrée.
- reference : page_Xf.htm#L<n>, n = ligne physique du fichier raw où
  commence la tête de l'entrée.
- DÉCISION JOHN (GATE inventaire 08/08/2026) : le sens inverse
  (page_X.htm, alsacien → français) n'est JAMAIS une seconde attestation.
  Les pages page_X.htm ne sont lues ici que pour un contrôle de cohérence
  interne (échantillon borné), rendu dans le rapport de carte, jamais dans
  le JSONL.
- Dédoublonnage intra-source : les pages W et XY portent les mêmes entrées
  X/Y (parfois identiques au caractère près). Deux entrées identiques
  (francais, alsacien, contexte) de la MÊME source ne font qu'une
  attestation : la première occurrence est gardée (ordre des pages), la
  seconde est listée dans le rapport. Les entrées X/Y dont l'alsacien
  DIFFÈRE entre W et XY (ex. « yeux », « yacht ») restent deux attestations
  distinctes.
- Entrée « a.- (première lettre) » de page_af.htm : note de prononciation
  sur la lettre, pas une traduction (le contenu <I> est du français
  explicatif). Omise (règle 3), listée dans le rapport.
- Entrée dont la tête ne se referme pas (ex. « travail à temps partiel.</IB> »
  dans page_tf.htm) : marquage corrompu — omise (règle 3), listée.

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
RAW = REPO / "data" / "raw" / "culture_alsace"
OUT = REPO / "data" / "attestations" / "culture_alsace__lexique_a_d.jsonl"

SOURCE_CODE = "culture_alsace"

# Ordre de la fiche source (inventaire_miroir.py) : a…w, xy, z.
LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
           "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "xy", "z"]

# Séparateur structurel de tête : « .- » et ses coquilles constatées.
RE_SEP = re.compile(r"[.,;:_'/!-]+$")

RE_OPEN_I = re.compile(r"<I\s*>", re.I)
RE_CLOSE_I = re.compile(r"</I\s*>", re.I)
RE_OPEN_B = re.compile(r"<B\s*>", re.I)
RE_CLOSE_B = re.compile(r"</B\s*>", re.I)
RE_TAG = re.compile(r"<[^>]*>")
RE_BR = re.compile(r"</?BR\s*/?>", re.I)


def line_of(text: str, pos: int) -> int:
    """Numéro de ligne physique (1-based) du caractère pos."""
    return 1 + text.count("\n", 0, pos)


def clean(raw: str) -> str:
    """Balises retirées, entités résolues, blancs de bord retirés."""
    return html.unescape(RE_TAG.sub("", raw)).strip()


def head_francais(tete_brute: str) -> str:
    """Tête moins le séparateur structurel final (coquilles comprises)."""
    t = html.unescape(tete_brute).strip()
    t = RE_SEP.sub("", t).strip()
    return t


def split_contexte(zone: str):
    """(contexte, reste, marqueur) — parenthèse de tête, copiée verbatim.

    La parenthèse peut ne pas être fermée dans la source (coquille) :
    on prend alors ce qui précède le <I> ou la fin de zone. Un marqueur
    « (I> » (balise <I> dégradée, « < » remplacé par « ( ») n'est pas un
    contexte : il est rendu tel quel dans le troisième élément pour que
    graphie_origine garde le fragment source entier.
    """
    if re.match(r"\s*\(I>", zone, re.S):
        return "", re.sub(r"\s*\(I>", "", zone, count=1, flags=re.S), "(I>"
    m = re.match(r"\s*(\([^)]*\))", zone, re.S)
    if m:
        return m.group(1), zone[m.end():], ""
    m = re.match(r"\s*(\([^<]*)(?=<I|</I|<B|$)", zone, re.S)
    if m and m.group(1).strip() != "(":
        return m.group(1).strip(), zone[m.end():], ""
    return "", zone, ""


def zone_alsacien(corps: str) -> str:
    """Le contenu de l'entrée jusqu'au dernier </I> (bornes de balise).

    Certaines entrées n'ouvrent pas <I> (balise manquante) ou portent un
    </I> parasite juste après le contexte : on prend tout ce qui précède
    le DERNIER </I> de l'entrée, puis on retire les balises.
    """
    closes = list(RE_CLOSE_I.finditer(corps))
    if closes:
        return corps[:closes[-1].start()]
    return corps


def alsacien_texte(corps: str) -> str:
    """Texte alsacien : zone jusqu'au dernier </I>, balises retirées,
    entités résolues. Un « < » orphelin en tête (balise dégradée) est
    retiré — c'est du marquage, pas une graphie."""
    zone = zone_alsacien(corps)
    txt = clean(zone)
    while txt.startswith("<"):
        txt = txt[1:].lstrip()
    return txt


def parse_page(letter: str) -> tuple[list, list, list, list, int]:
    """Entrées de page_{letter}f.htm.

    Retourne (attestations, omissions, anomalies, coherence, lignes).
    """
    path = RAW / f"page_{letter}f.htm"
    text = path.read_bytes().decode("latin1")
    n_lignes = 1 + text.count("\n")

    attestations: list[dict] = []
    omissions: list[dict] = []
    anomalies: list[dict] = []
    coherence: list[dict] = []

    # Tables qui portent le séparateur d'entrée « .- » (les tables de
    # navigation / prononciation n'en portent pas).
    tables = [m for m in re.finditer(r"<TABLE.*?</TABLE>", text,
                                     flags=re.S | re.I)
              if ".-" in m.group(0)]

    for tm in tables:
        tbl = tm.group(0)
        tstart = tm.start()

        # États : positions des <B> hors italique (têtes d'entrée) et
        # bornes des corps (prochaine tête).
        marqueurs = list(re.finditer(r"<B\s*>|<I\s*>|</I\s*>", tbl, re.I))
        tete_pos: list[int] = []
        in_i = False
        for mm in marqueurs:
            tok = mm.group(0).upper()
            if tok.startswith("<I"):
                in_i = True
            elif tok == "</I>":
                in_i = False
            elif tok.startswith("<B") and not in_i:
                tete_pos.append(mm.start())

        for idx, hp in enumerate(tete_pos):
            pos_head = tstart + hp
            line = line_of(text, pos_head)

            # Tête : jusqu'au premier </B> avant la prochaine tête.
            fin_proche = (tstart + tete_pos[idx + 1]
                          if idx + 1 < len(tete_pos) else tstart + len(tbl))
            cm = RE_CLOSE_B.search(tbl, hp + 3, fin_proche - tstart)
            if cm is None:
                omissions.append({
                    "page": f"page_{letter}f.htm",
                    "ligne": line,
                    "raison": "tête sans </B> (marquage corrompu, ex. </IB>)",
                    "contenu": clean(tbl[hp:hp + 90]),
                })
                continue
            tete_brute = tbl[hp + 3:cm.start()]
            corps = tbl[cm.end():fin_proche - tstart]

            # Note de prononciation en tête de page (ex. « a.- (première
            # lettre) s'écrit aussi… ») : le « contenu alsacien » est du
            # français explicatif, pas une traduction. Signature : un <B>
            # IMBRIQUÉ dans le <I> (à ne pas confondre avec <BR>). Omise
            # (règle 3).
            if re.search(r"<B\s*>", corps, re.I):
                omissions.append({
                    "page": f"page_{letter}f.htm",
                    "ligne": line,
                    "raison": "note de prononciation (contenu <I> explicatif "
                              "en français, pas une traduction)",
                    "contenu": clean(corps)[:120],
                })
                continue

            francais = head_francais(tete_brute)
            contexte, reste, marqueur = split_contexte(corps)
            contexte = html.unescape(contexte)
            als = alsacien_texte(reste)

            if als == "":
                omissions.append({
                    "page": f"page_{letter}f.htm",
                    "ligne": line,
                    "raison": "contenu alsacien vide",
                    "contenu": clean(corps)[:120],
                })
                continue

            if not tete_brute.strip().rstrip().endswith(".-"):
                anomalies.append({
                    "page": f"page_{letter}f.htm",
                    "ligne": line,
                    "type": "separateur_tete_non_standard",
                    "detail": f"tête « {clean(tete_brute)} » — séparateur "
                              f"absent ou coquille (copié, non corrigé)",
                })
            if contexte and not contexte.endswith(")"):
                anomalies.append({
                    "page": f"page_{letter}f.htm",
                    "ligne": line,
                    "type": "parenthèse_non_fermée",
                    "detail": f"« {contexte} » — parenthèse non fermée dans "
                              f"la source (copiée verbatim)",
                })
            if als.endswith(".-"):
                anomalies.append({
                    "page": f"page_{letter}f.htm",
                    "ligne": line,
                    "type": "alsacien_finissant_par_séparateur",
                    "detail": f"« {als} » — « .- » final dans l'alsacien "
                              f"(coquille, copiée verbatim)",
                })

            graphie = " ".join(p for p in
                               [clean(tete_brute), contexte, marqueur, als]
                               if p)

            attestations.append({
                "source_code": SOURCE_CODE,
                "francais": francais,
                "alsacien": als,
                "graphie_origine": graphie,
                "type": "expression" if " " in francais else "mot",
                "contexte": contexte,
                "reference": f"page_{letter}f.htm#L{line}",
            })

    # Contrôle de cohérence interne (DÉCISION JOHN) : échantillon borné de
    # 5 entrées, premier équivalent alsacien cherché dans le sens inverse.
    sens_inverse = RAW / f"page_{letter}.htm"
    if sens_inverse.exists():
        inv = sens_inverse.read_bytes().decode("latin1")
        n = len(attestations)
        if n:
            echantillon = sorted({0, n // 4, n // 2, 3 * n // 4, n - 1})
            trouves = 0
            for i in echantillon:
                att = attestations[i]
                premier = att["alsacien"].split(",")[0].strip()
                if premier:
                    if re.search(r"<B[^>]*>[^<]*" + re.escape(premier),
                                 inv, re.I):
                        trouves += 1
            coherence.append({
                "page": f"page_{letter}f.htm",
                "sens_inverse": f"page_{letter}.htm",
                "echantillon": len(echantillon),
                "trouves": trouves,
            })

    return attestations, omissions, anomalies, coherence, n_lignes


def main() -> int:
    if not RAW.is_dir():
        print(f"brut introuvable : {RAW}", file=sys.stderr)
        return 1

    attestations: list[dict] = []
    omissions: list[dict] = []
    anomalies: list[dict] = []
    coherence: list[dict] = []
    vues: dict[tuple, int] = {}     # (francais, alsacien, contexte) -> idx
    doublons: list[dict] = []

    for L in LETTERS:
        atts, omis, anom, coh, lignes = parse_page(L)
        for att in atts:
            cle = (att["francais"], att["alsacien"], att["contexte"])
            if cle in vues:
                doublons.append({
                    "page": att["reference"],
                    "francais": att["francais"],
                    "alsacien": att["alsacien"],
                    "garde": attestations[vues[cle]]["reference"],
                })
                continue
            vues[cle] = len(attestations)
            attestations.append(att)
        omissions.extend(omis)
        anomalies.extend(anom)
        coherence.extend(coh)
        print(f"{L}f : {len(atts)} entrées, {len(omis)} omises, "
              f"{len(anom)} anomalies")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        for att in attestations:
            fh.write(json.dumps(att, ensure_ascii=False) + "\n")

    print(f"\nJSONL écrit : {OUT} ({len(attestations)} lignes)")
    print(f"doublons intra-source retirés : {len(doublons)}")
    print(f"omissions : {len(omissions)}")
    print(f"anomalies signalées : {len(anomalies)}")

    if omissions:
        print("\n--- OMISSIONS (non produites, à arbitrer) ---")
        for o in omissions:
            print(f"  {o['page']} L{o['ligne']} — {o['raison']} : "
                  f"« {o['contenu']} »")
    if doublons:
        print("\n--- DOUBLONS INTRA-SOURCE (W/XY — première occurrence gardée) ---")
        for d in doublons:
            print(f"  {d['page']} — {d['francais']} | {d['alsacien']} "
                  f"(gardé : {d['garde']})")
    if anomalies:
        print("\n--- ANOMALIES OBSERVÉES (copiées verbatim, non corrigées) ---")
        for a in anomalies[:80]:
            print(f"  {a['page']} L{a['ligne']} [{a['type']}] {a['detail']}")
        if len(anomalies) > 80:
            print(f"  … et {len(anomalies) - 80} autres")
    if coherence:
        print("\n--- COHÉRENCE INTERNE (sens inverse, échantillon borné — "
              "jamais une seconde attestation) ---")
        for c in coherence:
            print(f"  {c['page']} vs {c['sens_inverse']} : "
                  f"{c['trouves']}/{c['echantillon']} retrouvés")
    return 0


if __name__ == "__main__":
    sys.exit(main())
