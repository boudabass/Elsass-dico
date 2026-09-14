#!/usr/bin/env python3
"""Régénère la liste des coquilles connues de `culture_alsace`, en rejouant le
parseur du studio sur les pages brutes archivées.

**Cette liste ne vit dans aucun JSONL** : c'est une sortie du parseur, pas une
colonne des attestations. Elle avait déjà dû être reconstituée ainsi le
07/09/2026, quand on a découvert que « les coquilles connues ne partent jamais
dans un lot de publication » était une intention que rien n'appliquait — on ne
peut pas exclure ce qu'on ne sait pas nommer.

Deux pièges, tous deux rencontrés à cette date et évités ici :

  * **le rapport imprimé du parseur plafonne à 80 anomalies** (`anomalies[:80]`,
    « … et N autres »). Lire ce plafond comme un total donnerait 80 coquilles au
    lieu de 390 — le même piège que les compteurs « 50+ » de l'ancienne file
    d'arbitrage. On importe donc le module et on rappelle `parse_page()` page par
    page, plutôt que de lire sa sortie ;
  * **le mode texte de Python réécrit les fins de ligne** sur Windows, ce qui
    fait diverger le md5 sans que le parseur y soit pour rien. Tout est lu en
    binaire.

Lecture seule : `git show` sur la branche `data`, aucune écriture en base.

    python scripts/mesures/anomalies_culture_alsace.py --sortie anomalies.json
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
PARSEUR = "scripts/extract/culture_alsace/lexique_a_d.py"
PAGE = re.compile(r"data/raw/culture_alsace/(page_[a-z]+f\.htm)$")


def du_depot(ref: str, chemin: str) -> bytes:
    return subprocess.run(["git", "show", f"{ref}:{chemin}"],
                          cwd=RACINE, capture_output=True, check=True).stdout


def lister(ref: str, prefixe: str) -> list[str]:
    sortie = subprocess.run(["git", "ls-tree", "-r", "--name-only", ref, prefixe],
                            cwd=RACINE, capture_output=True, text=True,
                            check=True).stdout
    return [l.strip() for l in sortie.split("\n") if l.strip()]


def charger_parseur(ref: str, sandbox: Path):
    """Dépose le parseur à l'emplacement qu'il attend et l'importe.

    Il déduit la racine du dépôt de sa propre position (`parents[3]`) et lit
    `<racine>/data/raw/culture_alsace/` : on reconstruit donc cette arborescence
    dans un dossier temporaire — le sandbox minimal déjà employé le 04/09/2026,
    faute de pouvoir checkouter la branche `data` sur NTFS."""
    cible = sandbox / "scripts" / "extract" / "culture_alsace" / "lexique_a_d.py"
    cible.parent.mkdir(parents=True, exist_ok=True)
    cible.write_bytes(du_depot(ref, PARSEUR))
    spec = importlib.util.spec_from_file_location("lexique_a_d", cible)
    module = importlib.util.module_from_spec(spec)
    sys.modules["lexique_a_d"] = module
    spec.loader.exec_module(module)
    return module


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", default="origin/data")
    ap.add_argument("--sortie", required=True, help="fichier JSON à écrire")
    args = ap.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    with tempfile.TemporaryDirectory() as tmp:
        sandbox = Path(tmp)
        module = charger_parseur(args.ref, sandbox)

        brut = sandbox / "data" / "raw" / "culture_alsace"
        brut.mkdir(parents=True, exist_ok=True)
        pages = [c for c in lister(args.ref, "data/raw/culture_alsace/") if PAGE.search(c)]
        for chemin in pages:
            # Écriture BINAIRE : la source a des fins de ligne mixtes, et le
            # mode texte de Python les réécrirait sur Windows.
            (brut / PAGE.search(chemin).group(1)).write_bytes(du_depot(args.ref, chemin))
        print(f"Pages de lexique déposées : {len(pages)}")

        anomalies: list[dict] = []
        attestations = 0
        # On rappelle `parse_page()` lettre par lettre plutôt que de lire la
        # sortie de `main()`, dont le rapport imprimé plafonne à 80 anomalies.
        for lettre in module.LETTERS:
            atts, _omissions, anom, _coherence, _lignes = module.parse_page(lettre)
            attestations += len(atts)
            anomalies.extend(anom)

        print(f"Attestations régénérées : {attestations} "
              f"(avant dédoublonnage inter-pages)")
        print(f"Anomalies : {len(anomalies)}")

    # Le format attendu par importer-data.mts : reference / type / detail.
    #
    # Le parseur rend `page` et `ligne` séparément ; la référence qui rattache
    # une anomalie à son attestation est leur concaténation, exactement comme
    # `attestations.reference` — « page_af.htm#L211 ». Reconstruire cette clé
    # autrement ferait une table d'anomalies qui ne se rattache à rien.
    normalisees = []
    for a in anomalies:
        page, ligne = a.get("page"), a.get("ligne")
        normalisees.append({
            "reference": f"{page}#L{ligne}" if page and ligne else "",
            "type": a.get("type") or "non_qualifie",
            "detail": a.get("detail") or "",
        })
    sans_reference = [a for a in normalisees if not a["reference"]]
    if sans_reference:
        print(f"⚠ {len(sans_reference)} anomalies sans référence de rattachement",
              file=sys.stderr)
        for a in sans_reference[:5]:
            print(f"    {a}", file=sys.stderr)

    from collections import Counter
    for t, n in Counter(a["type"] for a in normalisees).most_common():
        print(f"  {t:<40} {n}")

    Path(args.sortie).write_text(
        json.dumps(normalisees, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Écrit : {args.sortie}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
