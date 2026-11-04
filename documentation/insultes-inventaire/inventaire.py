import json, subprocess, sys, csv, re, unicodedata
from collections import defaultdict
sys.stdout.reconfigure(encoding="utf-8")
def show(p):
    return subprocess.run(["git","show",f"refs/heads/data:{p}"],capture_output=True).stdout.decode("utf-8")
files=[l for l in subprocess.run(["git","ls-tree","-r","--name-only","refs/heads/data","--","data/attestations"],capture_output=True,text=True).stdout.split() if l.endswith(".jsonl")]
autres=defaultdict(set)  # forme lower -> sources
autres_fr=defaultdict(set) # forme lower -> francais
fab=[]
for f in files:
    for line in show(f).splitlines():
        if not line.strip(): continue
        a=json.loads(line)
        if a["source_code"]=="dj_fabz": fab.append(a)
        else:
            k=a["alsacien"].strip().lower()
            autres[k].add(a["source_code"]); autres_fr[k].add(a["francais"])
print("dj_fabz lignes:",len(fab))
fiches=defaultdict(list)
for a in fab:
    td=a["graphie_origine"].split(" | ")
    td+=[""]*(3-len(td))
    a["motamot"]=td[1].strip(); a["sens"]=td[2].strip()
    fiches[(a["francais"].strip().lower(),a["type"])].append(a)
print("fiches:",len(fiches))
SENSIBLES=r"pute|putain|salope|bite|couille|cul\b|chie|merde|pédé|tapette|enculé|nègre|negre|juif|youp|boche|polack|arabe|bougnoul|gitan|romanichel|sexe|baise|branl|nichon|seins?\b|vagin|chatte|pénis|zizi|handicap|débile|mongol|trisomique|attard|pisse|pet\b|péter|cocu|gros|grosse|vieille|vieux|nain|bossu|boiteux|aveugle|sourd"
rows=[]
for (fr,typ),lst in sorted(fiches.items()):
    formes=sorted({a["alsacien"] for a in lst})
    sens_page=any(a["sens"] for a in lst)
    autres_src=sorted({s for x in formes for s in autres.get(x.lower(),())})
    sens_autres=sorted({s for x in formes for s in autres_fr.get(x.lower(),())})
    mm=sorted({a["motamot"] for a in lst if a["motamot"]})
    hit=sorted(set(m.group(0).lower() for t in [fr]+mm+formes for m in re.finditer(SENSIBLES,t,re.I)))
    rows.append(dict(francais=lst[0]["francais"],type=typ,nb_formes=len(formes),formes=" ; ".join(formes),
        mot_a_mot=" ; ".join(mm),francais_vient_de=("sens" if sens_page else "mot à mot seulement"),
        autres_sources=", ".join(autres_src),sens_dans_autres_sources=" ; ".join(sens_autres)[:200],
        mots_a_verifier=", ".join(hit),reference=lst[0]["reference"],garder="",note_john=""))
# synonymes : même premier mot du français
tete=defaultdict(int)
for r in rows: tete[r["francais"].lower().split()[0]]+=1
out=sys.argv[1]
with open(out,"w",newline="",encoding="utf-8-sig") as fh:
    w=csv.DictWriter(fh,fieldnames=list(rows[0].keys()),delimiter=";"); w.writeheader(); w.writerows(rows)
n=len(rows)
print("sens donné par la page:",sum(r["francais_vient_de"]=="sens" for r in rows))
print("mot à mot seulement:",sum(r["francais_vient_de"]!="sens" for r in rows))
print("avec une autre source:",sum(bool(r["autres_sources"]) for r in rows))
print("mots à vérifier:",sum(bool(r["mots_a_verifier"]) for r in rows))
print("formes par fiche: 1:",sum(r["nb_formes"]==1 for r in rows)," 2-4:",sum(2<=r["nb_formes"]<=4 for r in rows)," 5+:",sum(r["nb_formes"]>=5 for r in rows))
top=sorted(rows,key=lambda r:-r["nb_formes"])[:15]
for r in top: print(" ",r["nb_formes"],r["francais"])
print("sens les plus partagés (fiches multiples dans une même fiche = formes):")
src=defaultdict(int)
for r in rows:
    for s in r["autres_sources"].split(", "):
        if s: src[s]+=1
print("autres sources:",dict(src))
for r in rows:
    if r["autres_sources"]: print("  +",r["francais"],"|",r["formes"][:60],"|",r["autres_sources"],"|",r["sens_dans_autres_sources"][:60])
