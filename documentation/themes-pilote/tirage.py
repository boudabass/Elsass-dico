import json, random, subprocess, sys, re
S = sys.argv[1]
GRAINE = 20261016
fichiers = [l.strip() for l in open(f"{S}/fichiers.txt", encoding="utf-8") if l.strip()]
TYPES = {"mot", "expression", "proverbe"}
lemmes = {}
for f in fichiers:
    brut = subprocess.run(["git", "show", f"origin/data:{f}"], capture_output=True, check=True).stdout.decode("utf-8")
    for ligne in brut.splitlines():
        if not ligne.strip():
            continue
        d = json.loads(ligne)
        if d.get("type") not in TYPES:
            continue
        francais = re.sub(r"[.;,\s]+$", "", d["francais"].strip()) or d["francais"].strip()
        cle = francais.lower()
        cle = re.sub(r"[.;,\s]+$", "", cle.strip())
        contexte = d.get("contexte") or ""
        cle_lemme = (cle, contexte, d["type"])
        if cle_lemme not in lemmes:
            lemmes[cle_lemme] = francais
ordre = sorted(lemmes.keys())
print("lemmes distincts (mot, expression, proverbe) :", len(ordre))
rng = random.Random(GRAINE)
tire = rng.sample(ordre, 300)
with open(f"{S}/echantillon.tsv", "w", encoding="utf-8", newline="\n") as out:
    out.write("n\tfrancais\tcontexte\ttype\n")
    for i, (cle, contexte, typ) in enumerate(tire, 1):
        out.write(f"{i}\t{lemmes[(cle, contexte, typ)]}\t{contexte}\t{typ}\n")
print("graine :", GRAINE, "tirés :", len(tire))
