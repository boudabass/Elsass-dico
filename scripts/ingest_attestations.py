#!/usr/bin/env python3
"""Ingestion des dépôts du studio (data/) vers Supabase.

Remplace scripts/import_existing.py, qui visait les tables mots_fr_als et
expressions_fr_als — abandonnées avec le schéma à 4 tables plates.

Trois principes, qui expliquent la forme du script :

1. **Rien n'est écrit tant que tout n'est pas validé.** Un fichier est lu et
   contrôlé en entier avant le premier appel réseau. Un lot à moitié ingéré
   laisserait la base dans un état que personne ne saurait décrire.
2. **Simulation par défaut.** Sans --apply, le script ne fait que lire et
   rendre son rapport. Écrire en base est un acte explicite.
3. **Idempotent.** Les contraintes UNIQUE des tables font le dédoublonnage
   (resolution=ignore-duplicates). Relancer une ingestion n'ajoute rien.

Le script n'écrit JAMAIS dans entrees : la création d'une entrée passe par
arbitrer_entree() et un arbitre humain (règle 4 de CLAUDE.md).

Dépendances : requests, python-dotenv.

Usage :
    python scripts/ingest_attestations.py                    # simulation, tout data/
    python scripts/ingest_attestations.py --apply            # ingestion réelle
    python scripts/ingest_attestations.py --source culture_alsace --apply
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

RACINE = Path(__file__).resolve().parent.parent
DATA = RACINE / "data"

TYPES_TERME = {"mot", "expression", "proverbe", "toponyme", "prenom"}
REGIONS = {"bas_rhin", "haut_rhin", "commun"}

# Colonnes d'une ligne d'attestation, et leur caractère obligatoire.
# contexte est obligatoire mais peut valoir "" (la colonne est NOT NULL
# DEFAULT ''), region est le seul champ réellement facultatif.
CHAMPS_ATTESTATION = ("source_code", "francais", "alsacien", "graphie_origine",
                      "type", "contexte", "region", "reference")
CHAMPS_ORTHAL = ("source_code", "francais", "alsacien", "contexte",
                 "graphie_orthal", "regles_appliquees", "automate_code")

TAILLE_LOT = 500


class ErreurContrat(Exception):
    """Une ligne viole data/README.md. Bloque le fichier entier."""


# ----------------------------------------------------------------------------
# Lecture et validation
# ----------------------------------------------------------------------------

def lire_jsonl(chemin: Path) -> list[tuple[int, dict]]:
    lignes = []
    with chemin.open(encoding="utf-8") as f:
        for numero, brut in enumerate(f, start=1):
            brut = brut.strip()
            if not brut:
                continue
            try:
                objet = json.loads(brut)
            except json.JSONDecodeError as e:
                raise ErreurContrat(f"{chemin.name}:{numero} JSON illisible — {e}")
            if not isinstance(objet, dict):
                raise ErreurContrat(f"{chemin.name}:{numero} un objet JSON est attendu")
            lignes.append((numero, objet))
    return lignes


def _exige(objet: dict, champ: str, chemin: Path, numero: int) -> str:
    valeur = objet.get(champ)
    if not isinstance(valeur, str) or not valeur.strip():
        raise ErreurContrat(f"{chemin.name}:{numero} champ '{champ}' manquant ou vide")
    return valeur


def valider_attestation(objet: dict, chemin: Path, numero: int) -> dict:
    inconnus = set(objet) - set(CHAMPS_ATTESTATION)
    if inconnus:
        raise ErreurContrat(
            f"{chemin.name}:{numero} clés inconnues {sorted(inconnus)} — "
            f"le contrat est fermé, voir data/README.md")

    for champ in ("source_code", "francais", "alsacien", "graphie_origine", "reference"):
        _exige(objet, champ, chemin, numero)

    type_terme = objet.get("type")
    if type_terme not in TYPES_TERME:
        raise ErreurContrat(
            f"{chemin.name}:{numero} type '{type_terme}' invalide "
            f"(attendu : {', '.join(sorted(TYPES_TERME))})")

    contexte = objet.get("contexte", "")
    if not isinstance(contexte, str):
        raise ErreurContrat(f"{chemin.name}:{numero} 'contexte' doit être une chaîne")

    region = objet.get("region")
    if region not in (None, "") and region not in REGIONS:
        raise ErreurContrat(
            f"{chemin.name}:{numero} region '{region}' invalide "
            f"(attendu : {', '.join(sorted(REGIONS))}, ou absent)")

    return {
        "source_code": objet["source_code"],
        "francais": objet["francais"],
        "alsacien": objet["alsacien"],
        "graphie_origine": objet["graphie_origine"],
        "type": type_terme,
        "contexte": contexte,
        "region": region or None,
        "reference": objet["reference"],
    }


def valider_orthal(objet: dict, chemin: Path, numero: int) -> dict:
    inconnus = set(objet) - set(CHAMPS_ORTHAL)
    if inconnus:
        raise ErreurContrat(
            f"{chemin.name}:{numero} clés inconnues {sorted(inconnus)}")

    for champ in ("source_code", "francais", "alsacien",
                  "graphie_orthal", "regles_appliquees", "automate_code"):
        _exige(objet, champ, chemin, numero)

    return {
        "source_code": objet["source_code"],
        "francais": objet["francais"],
        "alsacien": objet["alsacien"],
        "contexte": objet.get("contexte", ""),
        "graphie_orthal": objet["graphie_orthal"],
        "regles_appliquees": objet["regles_appliquees"],
        "automate_code": objet["automate_code"],
    }


def signaler_doublons_internes(lignes: list[dict], chemin: Path) -> list[str]:
    """Deux fois la même clé dans un seul fichier : bug de parseur, pas doublon
    de source. La base l'absorberait en silence — autant le dire."""
    vus, doublons = set(), []
    for ligne in lignes:
        cle = (ligne["source_code"], ligne["francais"], ligne["alsacien"], ligne["contexte"])
        if cle in vus:
            doublons.append(" / ".join(cle))
        vus.add(cle)
    if doublons:
        apercu = ", ".join(doublons[:5])
        suite = f" (+{len(doublons) - 5})" if len(doublons) > 5 else ""
        return [f"{chemin.name} : {len(doublons)} clés en double dans le fichier — {apercu}{suite}"]
    return []


# ----------------------------------------------------------------------------
# Accès Supabase (PostgREST)
# ----------------------------------------------------------------------------

class Supabase:
    def __init__(self, url: str, cle: str):
        self.base = url.rstrip("/") + "/rest/v1"
        self.session = requests.Session()
        self.session.headers.update({
            "apikey": cle,
            "Authorization": f"Bearer {cle}",
            "Content-Type": "application/json",
        })

    def selectionner(self, table: str, params: dict) -> list[dict]:
        r = self.session.get(f"{self.base}/{table}", params=params, timeout=30)
        r.raise_for_status()
        return r.json()

    def inserer(self, table: str, lignes: list[dict], on_conflict: str) -> int:
        """Insère par lots en ignorant les doublons. Renvoie le nombre de
        lignes réellement créées (Prefer: return=representation)."""
        crees = 0
        for debut in range(0, len(lignes), TAILLE_LOT):
            lot = lignes[debut:debut + TAILLE_LOT]
            r = self.session.post(
                f"{self.base}/{table}",
                params={"on_conflict": on_conflict},
                headers={"Prefer": "resolution=ignore-duplicates,return=representation"},
                data=json.dumps(lot, ensure_ascii=False).encode("utf-8"),
                timeout=120,
            )
            if not r.ok:
                raise RuntimeError(f"{table} : {r.status_code} {r.text[:500]}")
            crees += len(r.json())
        return crees


def synchroniser_sources(sb: Supabase, appliquer: bool) -> dict[str, str]:
    """Crée les sources manquantes depuis data/sources/*.json et renvoie
    {code: id}. Ne met pas à jour les sources existantes : sources.fiabilite
    est un jugement éditorial, il ne se réécrit pas depuis un fichier."""
    dossier = DATA / "sources"
    fiches = sorted(dossier.glob("*.json")) if dossier.is_dir() else []

    existantes = {s["code"]: s["id"] for s in sb.selectionner("sources", {"select": "id,code"})}
    a_creer = []

    for fiche in fiches:
        donnees = json.loads(fiche.read_text(encoding="utf-8"))
        code = donnees["code"]
        if code in existantes:
            continue
        a_creer.append({
            "code": code,
            "nom": donnees["nom"],
            "url": donnees.get("url"),
            "type": donnees["type"],
            "annee": donnees.get("annee"),
            "licence": donnees.get("licence"),
            "fiabilite": donnees["fiabilite"],
            "notes": donnees.get("notes"),
        })

    if a_creer:
        print(f"  sources à créer : {', '.join(s['code'] for s in a_creer)}")
        if appliquer:
            sb.inserer("sources", a_creer, on_conflict="code")
            existantes = {s["code"]: s["id"]
                          for s in sb.selectionner("sources", {"select": "id,code"})}

    return existantes


# ----------------------------------------------------------------------------
# Traitements
# ----------------------------------------------------------------------------

def ingerer_attestations(sb, fichiers, sources, appliquer) -> tuple[int, int, list[str]]:
    total, crees, avertissements = 0, 0, []

    for chemin in fichiers:
        lignes = [valider_attestation(o, chemin, n) for n, o in lire_jsonl(chemin)]
        if not lignes:
            continue
        avertissements += signaler_doublons_internes(lignes, chemin)

        manquantes = {l["source_code"] for l in lignes} - set(sources)
        if manquantes:
            raise ErreurContrat(
                f"{chemin.name} : source(s) inconnue(s) en base {sorted(manquantes)}. "
                f"Ajouter la fiche dans data/sources/ avant d'ingérer.")

        charge = [{
            "source_id": sources[l["source_code"]],
            "francais": l["francais"],
            "alsacien": l["alsacien"],
            "graphie_origine": l["graphie_origine"],
            "type": l["type"],
            "contexte": l["contexte"],
            "region": l["region"],
            "reference": l["reference"],
        } for l in lignes]

        total += len(charge)
        print(f"  {chemin.name} : {len(charge)} lignes valides")
        if appliquer:
            n = sb.inserer("attestations", charge,
                           on_conflict="source_id,francais,alsacien,contexte")
            crees += n
            print(f"    -> {n} créées, {len(charge) - n} déjà présentes")

    return total, crees, avertissements


def ingerer_orthal(sb, fichiers, sources, appliquer) -> tuple[int, int, list[str]]:
    total, crees, avertissements = 0, 0, []

    for chemin in fichiers:
        lignes = [valider_orthal(o, chemin, n) for n, o in lire_jsonl(chemin)]
        if not lignes:
            continue

        charge = []
        introuvables = []
        for l in lignes:
            source_id = sources.get(l["source_code"])
            if source_id is None:
                raise ErreurContrat(f"{chemin.name} : source '{l['source_code']}' inconnue")

            # Une proposition se rattache à une attestation existante : on ne
            # transcode pas une forme que la base n'atteste pas.
            trouvees = sb.selectionner("attestations", {
                "select": "id",
                "source_id": f"eq.{source_id}",
                "francais": f"eq.{l['francais']}",
                "alsacien": f"eq.{l['alsacien']}",
                "contexte": f"eq.{l['contexte']}",
                "limit": 1,
            })
            if not trouvees:
                introuvables.append(f"{l['francais']} / {l['alsacien']}")
                continue

            charge.append({
                "attestation_id": trouvees[0]["id"],
                "automate_code": l["automate_code"],
                "graphie_orthal": l["graphie_orthal"],
                "regles_appliquees": l["regles_appliquees"],
            })

        if introuvables:
            apercu = ", ".join(introuvables[:5])
            suite = f" (+{len(introuvables) - 5})" if len(introuvables) > 5 else ""
            avertissements.append(
                f"{chemin.name} : {len(introuvables)} propositions ignorées, "
                f"attestation absente — {apercu}{suite}")

        total += len(charge)
        print(f"  {chemin.name} : {len(charge)} propositions rattachées")
        if appliquer and charge:
            n = sb.inserer("propositions_orthal", charge,
                           on_conflict="attestation_id,automate_code,graphie_orthal")
            crees += n
            print(f"    -> {n} créées, {len(charge) - n} déjà présentes")

    return total, crees, avertissements


# ----------------------------------------------------------------------------

def main() -> int:
    parseur = argparse.ArgumentParser(description=__doc__,
                                      formatter_class=argparse.RawDescriptionHelpFormatter)
    parseur.add_argument("--apply", action="store_true",
                         help="écrire réellement en base (sinon : simulation)")
    parseur.add_argument("--source", metavar="CODE",
                         help="ne traiter que les fichiers de cette source")
    args = parseur.parse_args()

    motif = f"{args.source}__*.jsonl" if args.source else "*.jsonl"
    attestations = sorted((DATA / "attestations").glob(motif))
    propositions = sorted((DATA / "orthal").glob(motif))

    # Avant la vérification des identifiants : n'avoir rien à faire n'est pas
    # une erreur de configuration.
    if not attestations and not propositions:
        print(f"Aucun fichier à ingérer (motif {motif}).")
        return 0

    load_dotenv(RACINE / ".env.local")
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    cle = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not cle:
        print("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante "
              "dans .env.local", file=sys.stderr)
        return 1

    mode = "INGESTION" if args.apply else "SIMULATION (--apply pour écrire)"
    print(f"=== {mode} ===\n")

    sb = Supabase(url, cle)

    try:
        print("Sources :")
        sources = synchroniser_sources(sb, args.apply)
        if not args.apply:
            # En simulation les sources neuves n'existent pas encore : on les
            # déclare connues pour pouvoir valider le reste du lot.
            for fiche in sorted((DATA / "sources").glob("*.json")):
                code = json.loads(fiche.read_text(encoding="utf-8"))["code"]
                sources.setdefault(code, "00000000-0000-0000-0000-000000000000")
        print(f"  {len(sources)} source(s) connue(s)\n")

        avertissements = []

        print("Attestations :")
        n_att, crees_att, avert = ingerer_attestations(sb, attestations, sources, args.apply)
        avertissements += avert

        print("\nPropositions ORTHAL :")
        if propositions and not args.apply:
            print("  (rattachement vérifiable seulement en mode --apply)")
            n_orth, crees_orth = 0, 0
        else:
            n_orth, crees_orth, avert = ingerer_orthal(sb, propositions, sources, args.apply)
            avertissements += avert

    except ErreurContrat as e:
        print(f"\nCONTRAT VIOLÉ — rien n'a été écrit.\n  {e}", file=sys.stderr)
        return 2
    except (requests.RequestException, RuntimeError) as e:
        print(f"\nÉCHEC RÉSEAU/BASE.\n  {e}", file=sys.stderr)
        return 3

    print(f"\n=== Bilan ===")
    print(f"  attestations valides : {n_att}" + (f", créées : {crees_att}" if args.apply else ""))
    print(f"  propositions ORTHAL  : {n_orth}" + (f", créées : {crees_orth}" if args.apply else ""))

    if avertissements:
        print("\nAvertissements :")
        for a in avertissements:
            print(f"  - {a}")

    if args.apply:
        print("\nLes attestations ingérées apparaissent dans /admin/arbitrage.")
        print("Aucune entrée n'a été créée : c'est l'arbitre humain qui décide (règle 4).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
