#!/usr/bin/env python3
"""Archivage des 834 pages de Catégorie:alémanique du Wiktionnaire fr.

Généralisation du pilote élargi (t_ade43e0f, 51 pages) à l'inventaire
complet (t_d228cb2f : 834 pages, GATE John 10/08/2026, carte t_a804e6a2).

CE SCRIPT N'EXTRAIT RIEN : il ne fait que copier dans data/raw/ le wikitext
brut, tel que téléchargé, de chaque page manquante. L'extraction reste
entièrement le travail de mots.py, qui ne lit que data/raw/ (jamais le
réseau) — la rejouabilité du JSONL n'est pas affectée par ce script.

Méthode
-------
- Entrée : data/raw/wiktionnaire_fr/categorie_alemanique.json — la liste
  des titres produite par inventaire_categorie.py (la copie brute du
  relevé, jamais une liste retapée à la main).
- URL : https://fr.wiktionary.org/wiki/<titre encodé>?action=raw (wikitext
  brut, même méthode que le pilote — md5 identique à l'existant).
- Fichier : data/raw/wiktionnaire_fr/<titre>.wikitext.txt — copie verbatim
  du corps de réponse, sans aucune retouche (règle 1 du contrat).
- Un fichier déjà présent n'est jamais réécrit (les 51 du pilote restent
  tels quels, commit 4934f86).
- Une page absente (HTTP 404) n'a pas de fichier : le titre reste omis et
  sera listé dans le rapport de carte (règle 3 : un doute se signale).
- Une redirection (titre pointant vers une autre page) est suivie une fois
  (le wikicode des pages gsw du Wiktionnaire fr peut être une redirection,
  cas rare) et le corps de la CIBLE est archivé sous le nom du titre
  d'origine : le parseur lit le fichier, pas le titre.

Usage
-----
  python3 scripts/extract/wiktionnaire_fr/archive_pages.py          # archive
  python3 scripts/extract/wiktionnaire_fr/archive_pages.py --dry-run
      # n'écrit rien : rapporte le statut HTTP et la taille de chaque page
      # manquante (200 article / 404 absente / redirection suivie)
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
RAW_DIR = REPO / "data" / "raw" / "wiktionnaire_fr"
INVENTAIRE = RAW_DIR / "categorie_alemanique.json"

WIKI = "https://fr.wiktionary.org/wiki/"
UA = ("elsass-dico-studio/0.1 (archivage data/raw; "
      "https://dico.theelsassisch.fr)")
SLEEP = 0.25  # politesse MediaWiki entre deux requêtes
MAX_REDIRECTS = 1

REDIRECT_RE = re.compile(
    r"^#(?:REDIRECT|WEITERLEITUNG)\s*\[\[([^\]|#]+)(?:#[^\]]*)?\]\]",
    re.IGNORECASE)


def titres() -> list[str]:
    """Titres depuis l'inventaire (copie brute du relevé API)."""
    if not INVENTAIRE.exists():
        print(f"inventaire introuvable : {INVENTAIRE} "
              "(lancer inventaire_categorie.py d'abord)", file=sys.stderr)
        sys.exit(1)
    with INVENTAIRE.open(encoding="utf-8") as fh:
        return json.load(fh)


def fetch(titre: str) -> tuple[int, bytes]:
    """GET ?action=raw pour `titre`. Retourne (statut HTTP, corps)."""
    url = WIKI + urllib.parse.quote(titre, safe="") + "?action=raw"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, b""


def resolve(titre: str) -> tuple[str, bytes]:
    """Suit la chaîne de redirections (au plus MAX_REDIRECTS sauts).

    Retourne (titre_final, corps) : le corps archivé provient de la cible
    finale ; le fichier garde le nom du titre d'origine (clé du parseur).
    """
    current = titre
    for _ in range(MAX_REDIRECTS + 1):
        status, body = fetch(current)
        if status != 200:
            return current, b""
        head = body[:200].decode("utf-8", "replace")
        m = REDIRECT_RE.match(head)
        if not m:
            return current, body
        current = m.group(1).strip()
    return current, b""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true",
                    help="ne rien écrire, seulement rapporter les statuts")
    args = ap.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    titles = titres()
    existing = {p.name.removesuffix(".wikitext.txt")
                for p in RAW_DIR.glob("*.wikitext.txt")}
    missing = [t for t in titles if t not in existing]

    print(f"titres à l'inventaire : {len(titles)}")
    print(f"déjà archivés (pilote) : {len(existing)}")
    print(f"pages manquantes       : {len(missing)}")

    ok, absent, other = [], [], []
    for i, titre in enumerate(missing, 1):
        try:
            final, body = resolve(titre)
        except Exception as e:  # timeout, connexion, …
            other.append((titre, f"EXCEPTION {type(e).__name__}: {e}"))
            continue
        if body == b"":
            absent.append((titre, f"HTTP sans corps (cible {final})"))
            continue
        if not args.dry_run:
            (RAW_DIR / f"{titre}.wikitext.txt").write_bytes(body)
        ok.append((titre, len(body)))
        if args.dry_run:
            print(f"  [{i}/{len(missing)}] {titre} : {len(body)} octets "
                  f"(cible {final})")
        time.sleep(SLEEP)

    print(f"\narchivées : {len(ok)}")
    if absent:
        print(f"\n--- ABSENTES (omises, règle 3) ---")
        for t, d in absent:
            print(f"  {t} : {d}")
    if other:
        print(f"\n--- ERREURS ---")
        for t, d in other:
            print(f"  {t} : {d}")
    return 0 if not absent and not other else 2


if __name__ == "__main__":
    sys.exit(main())
