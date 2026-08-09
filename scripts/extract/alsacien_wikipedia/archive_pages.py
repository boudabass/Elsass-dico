#!/usr/bin/env python3
"""Archivage des pages als.wikipedia.org pour la rubrique toponymes.

Généralisation du pilote (t_68eb41ab, 10 communes) à l'ensemble des
communes de la base culture_alsace (villes_villages_hr + villes_villages_br,
GATE John 09/08/2026, article 725 — carte t_8efbd6d7).

CE SCRIPT N'EXTRAIT RIEN : il ne fait que copier dans data/raw/ le wikitext
brut, tel que téléchargé, de chaque page manquante. L'extraction reste
entièrement le travail de toponymes.py, qui ne lit que data/raw/ (jamais le
réseau) — la rejouabilité du JSONL n'est pas affectée par ce script.

Méthode
-------
- Clé de jointure : le nom français de la commune dans la base culture_alsace
  (francais des attestations villes_villages_hr/br). C'est le titre de la
  page sur als.wikipedia.org, tel que le pilote l'a archivé (Colmar.wikitext.txt
  est byte-identique à https://als.wikipedia.org/wiki/Colmar?action=raw).
- URL : https://als.wikipedia.org/wiki/<titre encodé>?action=raw (wikitext brut).
- Fichier : data/raw/alsacien_wikipedia/<titre>.wikitext.txt — copie verbatim
  du corps de réponse, sans aucune retouche (règle 1 du contrat data/README.md).
- Un fichier déjà présent n'est jamais réécrit (les 10 du pilote restent tels
  quels, commit 5ef0979).
- Une page absente (HTTP 404) n'a pas de fichier : la commune reste omise et
  sera listée dans le rapport de carte (règle 3 : un doute se signale).

REDIRECTIONS (décision de généralisation, carte t_8efbd6d7)
----------------------------------------------------------
Sur als.wikipedia.org, 299 titres français sont des redirections vers
l'article sous titre alsacien (ex. « Strasbourg » -> « Straßburg »). La
commune A un article gsw : la redirection EST le pointeur de la source vers
cet article. Le script la suit (jusqu'à 5 sauts) et archive le wikitext de
la CIBLE, sous le nom de fichier français (la clé de jointure du parseur).
Aucune forme n'est inventée : le contenu archivé est le wikitext brut de la
page, téléchargé tel quel. La commune est ensuite extraite par toponymes.py
comme les autres. Si la cible finale n'existe pas (chaîne cassée) ou est une
page d'homonymie sans infobox (ex. « Saint-Louis » -> « St. Louis
(Begriffsklärung) »), le wikitext archivé est celui de la cible ; le parseur
l'omet (infobox absente) et la carte le liste — règle 3.

Usage
-----
  python3 scripts/extract/alsacien_wikipedia/archive_pages.py          # archive
  python3 scripts/extract/alsacien_wikipedia/archive_pages.py --dry-run
      # n'écrit rien : rapporte le statut HTTP et le début du contenu de
      # chaque page manquante (200 article / 404 absente / redirection)
"""

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
RAW_DIR = REPO / "data" / "raw" / "alsacien_wikipedia"
BASE_FILES = [
    REPO / "data" / "attestations" / "culture_alsace__villes_villages_hr.jsonl",
    REPO / "data" / "attestations" / "culture_alsace__villes_villages_br.jsonl",
]

WIKI = "https://als.wikipedia.org/wiki/"
UA = ("elsass-dico-studio/0.1 (archivage data/raw; "
      "https://dico.theelsassisch.fr)")
SLEEP = 0.25  # politesse MediaWiki entre deux requêtes
MAX_REDIRECTS = 5

REDIRECT_RE = re.compile(
    r"^#(?:REDIRECT|WEITERLEITUNG)\s*\[\[([^\]|#]+)(?:#[^\]]*)?\]\]",
    re.IGNORECASE)


def base_names() -> list[str]:
    """Noms français distincts (union hr ∪ br), triés — l'ordre du parseur."""
    names: set[str] = set()
    for f in BASE_FILES:
        with f.open(encoding="utf-8") as fh:
            for line in fh:
                att = json.loads(line)
                if att.get("type") == "toponyme":
                    names.add(att["francais"])
    return sorted(names)


def fetch(name: str) -> tuple[int, bytes]:
    """GET ?action=raw pour `name`. Retourne (statut HTTP, corps).

    Un 404 est retourné proprement (statut, b'') plutôt que levé : c'est un
    cas attendu (commune sans page), pas une erreur.
    """
    url = WIKI + urllib.parse.quote(name, safe="") + "?action=raw"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, b""


def resolve(name: str) -> tuple[str, str, bytes]:
    """Suit la chaîne de redirections.

    Retourne (titre_final, chaine, corps) :
    - titre_final : le titre dont provient le corps archivé (nom français si
      aucune redirection, sinon la cible finale) ;
    - chaine : « nom -> cible1 -> cible2 » pour le rapport (nom seul si pas
      de redirection) ;
    - corps : le wikitext brut de la page finale (b'' si introuvable).
    """
    current = name
    chain = [name]
    for _ in range(MAX_REDIRECTS + 1):
        status, body = fetch(current)
        if status != 200:
            return current, " -> ".join(chain), b""
        head = body[:200].decode("utf-8", "replace")
        m = REDIRECT_RE.match(head)
        if not m:
            return current, " -> ".join(chain), body
        current = m.group(1).strip()
        chain.append(current)
    return current, " -> ".join(chain), b""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true",
                    help="ne rien écrire, seulement rapporter les statuts")
    args = ap.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    names = base_names()
    existing = {p.name.removesuffix(".wikitext.txt")
                for p in RAW_DIR.glob("*.wikitext.txt")}
    missing = [n for n in names if n not in existing]

    print(f"noms en base culture_alsace : {len(names)}")
    print(f"déjà archivés (pilote)      : {len(existing)}")
    print(f"pages manquantes à traiter  : {len(missing)}")

    ok, resolved, absent, other = [], [], [], []
    for i, name in enumerate(missing, 1):
        try:
            final, chain, body = resolve(name)
        except Exception as e:  # timeout, connexion, …
            print(f"  [{i}/{len(missing)}] {name} — ERREUR {e!r}")
            other.append((name, "erreur", repr(e)))
            time.sleep(SLEEP)
            continue

        if body:
            if chain != name:
                resolved.append((name, chain))
                tag = f"redirection résolue -> {final}"
            else:
                ok.append(name)
                tag = "article"
            if not args.dry_run:
                out = RAW_DIR / f"{name}.wikitext.txt"
                out.write_bytes(body)
        else:
            absent.append((name, final, chain))
            tag = f"ABSENTE (cible finale « {final} » introuvable)" \
                if chain != name else "ABSENTE (404)"

        if args.dry_run:
            head = body[:80].decode("utf-8", "replace").strip() \
                .replace("\n", " ") if body else ""
            print(f"  [{i}/{len(missing)}] {name} — {tag}"
                  + (f" | {head}" if body else ""))
        else:
            print(f"  [{i}/{len(missing)}] {name} — {tag}")

        time.sleep(SLEEP)

    print("\n--- BILAN ---")
    print(f"articles directs (fichier archivé) : {len(ok)}")
    print(f"redirections résolues (fichier archivé, wikitext de la cible) : "
          f"{len(resolved)}")
    print(f"pages absentes (aucune archive) : {len(absent)}")
    if other:
        print(f"autres statuts / erreurs : {len(other)}")
        for o in other:
            print("  ", o)

    if absent:
        print("\n--- COMMUNES SANS PAGE (404) — omises, à lister au rapport ---")
        for name, final, chain in absent:
            if chain != name:
                print(f"  {name} (chaîne cassée : {chain})")
            else:
                print(f"  {name}")
    if resolved:
        print("\n--- REDIRECTIONS RÉSOLUES (fichier = wikitext de la cible) ---")
        for name, chain in resolved:
            print(f"  {name}: {chain}")

    if not args.dry_run and (ok or resolved):
        print(f"\n{len(ok) + len(resolved)} fichiers écrits dans {RAW_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
