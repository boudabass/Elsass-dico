#!/usr/bin/env python3
"""Mesure du marqueur a~e sur le LEXIQUE de culture_alsace (23 851 attestations).

Question posée (documentation/20-REFONTE-CARTE-DES-PARLERS.md, étape 1) : le
marqueur dialectal a~e — finale atone `-a` contre `-e`, digrammes `ia`/`ua`
contre `ie`/`ue` — n'a jamais été mesuré que sur les 954 TOPONYMES de la base
(mesure du 01/09/2026 : `culture_alsace` écrit `-a` à 99 % au Haut-Rhin et 2 %
au Bas-Rhin). S'il se retrouve dans le lexique général, alors le lexique écrit
de cette source peut teinter une zone de la carte. Sinon, la piste s'abandonne
plutôt que de se coder.

**Le résultat peut être négatif, et c'est un résultat.** Trois façons dont il
peut l'être, toutes distinguées ci-dessous :
  1. le lexique est intermédiaire — ni le profil nord ni le profil sud ;
  2. le lexique est homogène mais sur un profil qu'on ne sait pas localiser ;
  3. la source mélange les deux parlers dans une même ligne (mesure 3) — auquel
     cas aucune teinte de zone n'est défendable, quel que soit le profil global.

Aucune écriture : lecture seule via PostgREST (`.env.local`, `service_role`).
Rejouable à l'identique — c'est la règle de maison, on recompte en base et on ne
croit pas un rapport.

Usage :
    python scripts/mesures/marqueur_ae.py            # rapport complet
    python scripts/mesures/marqueur_ae.py --echantillons 20
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import requests
from dotenv import load_dotenv

RACINE = Path(__file__).resolve().parents[2]

# --- Normalisation : reprise à l'identique de src/lib/dictionnaire.ts ---------
#
# `cleDeForme` et `scinderSynonymes` existent déjà en TypeScript et sont
# mesurées (10 608 chaînes scindables, 0 violation de la règle 1). On les
# recopie ici plutôt que de normaliser « à peu près » : mesurer un phénomène
# avec une règle plus lâche que celle du code ne trouve rien, ça efface la
# question (erreur du « +13 » du 24/08/2026).

SEPARATEUR_SYNONYME = re.compile(r"\s*[;,]\s*")
GLOSE = re.compile(r"[()\[\]]")
SYNONYMES_MAX = 6
MOTS_PAR_SYNONYME_MAX = 3


def cle_de_forme(alsacien: str) -> str:
    return re.sub(r"[.;,\s]+$", "", alsacien.strip())


def scinder_synonymes(alsacien: str) -> list[str]:
    """Port Python de scinderSynonymes(). Rend [] quand le découpage n'est pas
    sûr — mêmes gardes, même garantie de fidélité."""
    brut = alsacien.strip()
    if GLOSE.search(brut):
        return []

    fragments = SEPARATEUR_SYNONYME.split(brut)
    if len(fragments) < 2:
        return []

    formes = [cle_de_forme(f) for f in fragments]
    if not (2 <= len(formes) <= SYNONYMES_MAX):
        return []
    if any((not f) or len(f.split()) > MOTS_PAR_SYNONYME_MAX for f in formes):
        return []

    for fragment, forme in zip(fragments, formes):
        propre = fragment.strip()
        if not propre.startswith(forme):
            return []
        if not re.fullmatch(r"[.;,\s]*", propre[len(forme):]):
            return []
    return formes


def formes_d_une_attestation(alsacien: str, sans_article: str | None) -> list[str]:
    """Les formes comparables portées par une attestation.

    L'article défini collé (`d'r lohn`) est retiré quand la base l'a déjà
    décomposé (migration 20260903010000) : le marqueur porte sur le mot, pas
    sur l'article. Sinon la chaîne entière, scindée si elle empile des
    synonymes.
    """
    base = sans_article if sans_article else alsacien
    fragments = scinder_synonymes(base)
    if fragments:
        return fragments
    forme = cle_de_forme(base)
    return [forme] if forme else []


# --- Les deux marqueurs ------------------------------------------------------
#
# Définis étroitement, et le dénominateur est toujours explicite : un
# pourcentage dont on ne sait pas sur quoi il porte ne se compare à rien.

VOYELLES = set("aàáâäãeéèêëiìíîïoòóôöøuùúûüyÿ")


def _sans_diacritiques(mot: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", mot)
                   if unicodedata.category(c) != "Mn")


def finale_atone(forme: str) -> str | None:
    """`'a'`, `'e'` ou None si la forme ne porte pas le marqueur.

    Conditions, choisies pour que toponymes et mots communs soient comparables :
      * on regarde le DERNIER mot de la forme ;
      * il finit par `a` ou `e` nu (sans diacritique — `à` final est un autre
        phénomène, et `é`/`è` sont toniques) ;
      * cette voyelle est précédée d'une CONSONNE : `-ie`, `-ue`, `-oa` sont des
        digrammes, ils relèvent du second marqueur ;
      * le mot compte au moins deux voyelles, donc il est polysyllabique : un
        monosyllabe (`da`, `de`, `se`) n'a pas de finale atone au sens de
        l'isoglosse.
    """
    mots = forme.split()
    if not mots:
        return None
    mot = mots[-1].strip("-'’")
    if len(mot) < 3:
        return None
    if mot[-1] not in ("a", "e"):
        return None
    avant = _sans_diacritiques(mot[-2]).lower()
    if avant in VOYELLES or not avant.isalpha():
        return None
    if sum(1 for c in _sans_diacritiques(mot).lower() if c in VOYELLES) < 2:
        return None
    return mot[-1]


# Le digramme se cherche dans la forme entière, en ignorant les diacritiques de
# la première voyelle (`üa` compte comme `ua`, `ìe` comme `ie`), jamais ceux de
# la seconde : c'est `a` contre `e` qui fait le marqueur.
DIGRAMMES_SUD = ("ia", "ua", "oa")
DIGRAMMES_NORD = ("ie", "ue", "oe")


def digrammes(forme: str) -> tuple[int, int]:
    """(occurrences sud, occurrences nord) dans la forme."""
    plat = _sans_diacritiques(forme).lower()
    sud = sum(plat.count(d) for d in DIGRAMMES_SUD)
    nord = sum(plat.count(d) for d in DIGRAMMES_NORD)
    return sud, nord


# --- Accès base --------------------------------------------------------------


class Base:
    def __init__(self, url: str, cle: str):
        self.base = url.rstrip("/") + "/rest/v1"
        self.session = requests.Session()
        self.session.headers.update({"apikey": cle, "Authorization": f"Bearer {cle}"})

    def tout(self, table: str, select: str, lot: int = 1000) -> list[dict]:
        """Pagination explicite : PostgREST plafonne silencieusement une requête
        sans `Range`, et un plafond lu comme un total est le piège des « 50+ »
        de la file d'arbitrage (07/09/2026)."""
        lignes: list[dict] = []
        debut = 0
        while True:
            r = self.session.get(
                f"{self.base}/{table}",
                params={"select": select, "order": "id.asc",
                        "offset": debut, "limit": lot},
                timeout=60,
            )
            r.raise_for_status()
            page = r.json()
            lignes.extend(page)
            if len(page) < lot:
                return lignes
            debut += lot


# --- Agrégation --------------------------------------------------------------


class Profil:
    """Le profil a~e d'un groupe de formes."""

    def __init__(self, nom: str):
        self.nom = nom
        self.formes = 0
        self.finale = Counter()          # 'a' / 'e'
        self.digr_sud = 0
        self.digr_nord = 0
        self.formes_digr = Counter()     # formes portant au moins un digramme
        self.exemples = defaultdict(list)

    def ajouter(self, forme: str, francais: str = "") -> None:
        self.formes += 1
        f = finale_atone(forme)
        if f:
            self.finale[f] += 1
            if len(self.exemples[f"finale_{f}"]) < 200:
                self.exemples[f"finale_{f}"].append((francais, forme))
        sud, nord = digrammes(forme)
        self.digr_sud += sud
        self.digr_nord += nord
        if sud or nord:
            self.formes_digr["sud" if sud > nord else
                              ("nord" if nord > sud else "mixte")] += 1
            cle = "digr_sud" if sud > nord else ("digr_nord" if nord > sud else "digr_mixte")
            if len(self.exemples[cle]) < 200:
                self.exemples[cle].append((francais, forme))

    @property
    def finales_totales(self) -> int:
        return self.finale["a"] + self.finale["e"]

    @property
    def pct_a(self) -> float | None:
        t = self.finales_totales
        return 100 * self.finale["a"] / t if t else None

    @property
    def digr_totaux(self) -> int:
        return self.digr_sud + self.digr_nord

    @property
    def pct_digr_sud(self) -> float | None:
        t = self.digr_totaux
        return 100 * self.digr_sud / t if t else None

    def ligne(self) -> str:
        pa = self.pct_a
        pd = self.pct_digr_sud
        return (f"{self.nom:<34} {self.formes:>7} "
                f"{self.finales_totales:>7} "
                f"{(f'{pa:5.1f} %' if pa is not None else '     —'):>8} "
                f"{self.digr_totaux:>7} "
                f"{(f'{pd:5.1f} %' if pd is not None else '     —'):>8}")


ENTETE = (f"{'groupe':<34} {'formes':>7} {'fin.a+e':>7} {'% -a':>8} "
          f"{'digr.':>7} {'% ia/ua':>8}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--echantillons", type=int, default=12,
                    help="nombre d'exemples affichés par catégorie")
    args = ap.parse_args()

    # La console Windows est en cp1252 : sans ça, `Müaschpa` sort mutilé et un
    # rapport de mesure sur des graphies illisible ne prouve rien.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    load_dotenv(RACINE / ".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    cle = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not cle:
        print("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante "
              "dans .env.local", file=sys.stderr)
        return 2

    base = Base(url, cle)
    sources = {s["id"]: s["code"] for s in base.tout("sources", "id,code")}
    attestations = base.tout(
        "attestations",
        "id,source_id,francais,alsacien,alsacien_sans_article,type,region,contexte")

    print(f"Sources : {', '.join(sorted(sources.values()))}")
    print(f"Attestations lues : {len(attestations)}\n")

    par_source = Counter()
    for a in attestations:
        par_source[(sources.get(a["source_id"], "?"), a["type"])] += 1
    print("Répartition source × type (recomptée, pas reprise d'un rapport) :")
    for (src, typ), n in sorted(par_source.items()):
        print(f"  {src:<22} {typ:<12} {n:>7}")
    print()

    # --- Les groupes comparés ------------------------------------------------
    LEXIQUE = {"mot", "expression", "proverbe"}
    groupes: dict[str, Profil] = {}

    def profil(nom: str) -> Profil:
        return groupes.setdefault(nom, Profil(nom))

    # Mesure 3 : une même ligne porte-t-elle les deux parlers ?
    lignes_scindables = 0
    lignes_melangees = 0
    exemples_melange: list[tuple[str, str]] = []

    # Mesure 3 bis, ajoutée après lecture des échantillons du premier passage.
    # Le critère ci-dessus (« deux formes qui ne diffèrent QUE par a~e ») rate
    # `d'r Todawààga, de Todewàwe` — deux variantes régionales du même mot, qui
    # diffèrent aussi par l'article et par ww/gg. Le bon critère est plus
    # large : la ligne porte-t-elle à la fois une finale -a et une finale -e ?
    # Et si oui, dans quel ORDRE — une source qui écrit systématiquement le sud
    # puis le nord ne se teinte pas en bloc, elle se teinte forme par forme.
    lignes_deux_finales = 0
    lignes_deux_finales_sud_dabord = 0
    exemples_deux_finales: list[tuple[str, str]] = []
    profil_unique = Profil("culture_alsace lexique — attestation à UNE forme")
    profil_premier = Profil("culture_alsace lexique — 1er fragment")
    profil_suivants = Profil("culture_alsace lexique — fragments suivants")

    for a in attestations:
        code = sources.get(a["source_id"], "?")
        typ = a["type"]
        formes = formes_d_une_attestation(a["alsacien"], a.get("alsacien_sans_article"))
        if not formes:
            continue

        if typ == "toponyme" and code == "culture_alsace":
            # Le calibrage : même source, même graphie, département connu.
            cible = profil(f"culture_alsace toponymes {a.get('contexte') or '?'}")
        elif typ in LEXIQUE:
            cible = profil(f"{code} lexique")
        elif typ == "toponyme":
            cible = profil(f"{code} toponymes")
        else:
            cible = profil(f"{code} {typ}")

        for f in formes:
            cible.ajouter(f, a["francais"])

        # Mélange intra-ligne : deux fragments d'une même attestation qui ne
        # diffèrent QUE par le marqueur a~e. Si c'est fréquent, la source note
        # les deux parlers côte à côte et aucune teinte de zone ne tient.
        if len(formes) >= 2:
            lignes_scindables += 1
            plates = {re.sub(r"[ae]", "@", _sans_diacritiques(f).lower()) for f in formes}
            distinctes = {_sans_diacritiques(f).lower() for f in formes}
            if len(plates) < len(distinctes):
                lignes_melangees += 1
                if len(exemples_melange) < 200:
                    exemples_melange.append((a["francais"], a["alsacien"]))

        if code == "culture_alsace" and typ in LEXIQUE:
            if len(formes) == 1:
                profil_unique.ajouter(formes[0], a["francais"])
            else:
                profil_premier.ajouter(formes[0], a["francais"])
                for f in formes[1:]:
                    profil_suivants.ajouter(f, a["francais"])

                finales = [finale_atone(f) for f in formes]
                presentes = {x for x in finales if x}
                if presentes == {"a", "e"}:
                    lignes_deux_finales += 1
                    portees = [x for x in finales if x]
                    if portees[0] == "a":
                        lignes_deux_finales_sud_dabord += 1
                    if len(exemples_deux_finales) < 200:
                        exemples_deux_finales.append((a["francais"], a["alsacien"]))

    print("PROFIL a~e PAR GROUPE")
    print(ENTETE)
    print("-" * len(ENTETE))
    for nom in sorted(groupes):
        print(groupes[nom].ligne())
    print()

    print("MÉLANGE DES DEUX PARLERS DANS UNE MÊME ATTESTATION")
    pct = 100 * lignes_melangees / lignes_scindables if lignes_scindables else 0
    print(f"  attestations à plusieurs formes : {lignes_scindables}")
    print(f"  dont deux formes ne diffèrent que par a~e : {lignes_melangees} ({pct:.1f} %)")
    for fr, als in exemples_melange[:args.echantillons]:
        print(f"    {fr:<28} {als}")
    print()

    print("LES DEUX FINALES DANS UNE MÊME LIGNE (critère large, lexique culture_alsace)")
    n = lignes_deux_finales
    print(f"  lignes portant à la fois une finale -a et une finale -e : {n}")
    if n:
        pct_ordre = 100 * lignes_deux_finales_sud_dabord / n
        print(f"  dont le -a vient en premier : {lignes_deux_finales_sud_dabord} ({pct_ordre:.1f} %)")
    for fr, als in exemples_deux_finales[:args.echantillons]:
        print(f"    {fr:<28} {als}")
    print()

    print("OÙ VIT LE MARQUEUR DANS UNE LIGNE (lexique culture_alsace)")
    print(ENTETE)
    print("-" * len(ENTETE))
    for p in (profil_unique, profil_premier, profil_suivants):
        print(p.ligne())
    print()

    print("ÉCHANTILLONS")
    for nom in sorted(groupes):
        p = groupes[nom]
        if not p.exemples:
            continue
        print(f"  — {nom}")
        for cle_ex in ("finale_a", "finale_e", "digr_sud", "digr_nord"):
            ex = p.exemples.get(cle_ex, [])
            if not ex:
                continue
            apercu = "  ".join(f"{f}→{g}" for f, g in ex[:args.echantillons])
            print(f"      {cle_ex:<10} ({len(ex)}+) {apercu}")
    print()

    # --- Comparaison directe, lemme à lemme ----------------------------------
    #
    # Le profil global peut mentir : deux sources parlant de mots différents ne
    # se comparent pas. Sur les lemmes français que les deux couvrent, qui écrit
    # la forme du sud ?
    lexique_par_source: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))
    # Le PREMIER fragment de culture_alsace, à part : la mesure ci-dessus montre
    # qu'il porte la forme du sud à 99,7 % et que les suivants sont des
    # variantes ajoutées. Comparer l'ensemble des formes des deux sources
    # mélangerait les deux populations et n'apprendrait rien.
    premier_fragment: dict[str, set[str]] = defaultdict(set)
    for a in attestations:
        if a["type"] not in LEXIQUE:
            continue
        code = sources.get(a["source_id"], "?")
        cle_fr = re.sub(r"[.\s]+$", "", a["francais"].strip().lower())
        formes = formes_d_une_attestation(a["alsacien"], a.get("alsacien_sans_article"))
        for f in formes:
            lexique_par_source[code][cle_fr].add(f)
        if code == "culture_alsace" and formes:
            premier_fragment[cle_fr].add(formes[0])

    if "culture_alsace" in lexique_par_source:
        ca = lexique_par_source["culture_alsace"]
        for autre, lexique in sorted(lexique_par_source.items()):
            if autre == "culture_alsace":
                continue
            communs = sorted(set(ca) & set(lexique))
            if not communs:
                continue
            desaccords = []
            for fr in communs:
                fa = {finale_atone(f) for f in ca[fr]} - {None}
                fb = {finale_atone(f) for f in lexique[fr]} - {None}
                if fa and fb and fa != fb:
                    desaccords.append((fr, sorted(ca[fr]), sorted(lexique[fr]), fa, fb))
            print(f"LEMMES COMMUNS culture_alsace × {autre} : {len(communs)}")
            ca_a = sum(1 for _, _, _, fa, _ in desaccords if fa == {"a"})
            print(f"  désaccords de finale atone : {len(desaccords)}"
                  f" — culture_alsace exclusivement -a dans {ca_a}")
            for fr, x, y, fa, fb in desaccords[:args.echantillons]:
                print(f"    {fr:<24} culture_alsace {x} ({'/'.join(sorted(fa))})"
                      f"   {autre} {y} ({'/'.join(sorted(fb))})")
            print()

            # Le test qui écarte le raisonnement circulaire. Si le lexique
            # alsacien avait « naturellement » 99 % de finales -a, deux sources
            # écriraient la même finale sur les mêmes mots. Si au contraire
            # culture_alsace note un parler, elle doit se retrouver du côté -a
            # nettement plus souvent que l'autre, sur les MÊMES lemmes.
            face_a_face = 0
            ca_sud = 0
            autre_sud = 0
            exemples_ff = []
            for fr in communs:
                fa = {finale_atone(f) for f in premier_fragment.get(fr, ())} - {None}
                fb = {finale_atone(f) for f in lexique[fr]} - {None}
                if len(fa) != 1 or len(fb) != 1:
                    continue
                face_a_face += 1
                if fa == {"a"}:
                    ca_sud += 1
                if fb == {"a"}:
                    autre_sud += 1
                if fa != fb and len(exemples_ff) < 200:
                    exemples_ff.append((fr, sorted(premier_fragment[fr]), sorted(lexique[fr])))
            if face_a_face:
                print(f"  MÊMES LEMMES, finale tranchée des deux côtés : {face_a_face}")
                print(f"    culture_alsace (1er fragment) du côté -a : {ca_sud}"
                      f" ({100 * ca_sud / face_a_face:.1f} %)")
                print(f"    {autre} du côté -a : {autre_sud}"
                      f" ({100 * autre_sud / face_a_face:.1f} %)")
                for fr, x, y in exemples_ff[:args.echantillons]:
                    print(f"      {fr:<24} {x}   ≠   {y}")
            print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
