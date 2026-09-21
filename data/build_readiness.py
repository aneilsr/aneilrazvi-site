#!/usr/bin/env python3
"""
Turns data/pinned/*.csv into the JSON the readiness page loads.

    Terminal (a regular terminal, NOT Claude Code):
    cd "/Users/aneilrazvi/Claude projects/aneilrazvi-site-v2/data"
    python3 build_readiness.py

Writes into ../assets/readiness/ :

    occ.json          1,016 occupations, share, tier, counts, family
    titles.json       the lay-title search index
    tasks/<mg>.json   task lists sharded by SOC major group, 23 files

Sharding matters. One file is 2 MB on every page load and 718 files is 718
round trips. A shard is the two digits in front of the dash, so a lookup
fetches one file of roughly 100 KB.
"""
import csv, json, os, pathlib, sys
from collections import defaultdict

HERE = pathlib.Path(__file__).resolve().parent
PIN  = HERE / "pinned"
OUT  = HERE.parent / "assets" / "readiness"

if not PIN.exists():
    sys.exit(f"{PIN} is missing. Run fetch.sh then build.py first.")

# SOC major groups. Stable since 2018, safe to hardcode.
FAMILY = {
 "11":"Management","13":"Business and Financial Operations","15":"Computer and Mathematical",
 "17":"Architecture and Engineering","19":"Life, Physical, and Social Science",
 "21":"Community and Social Service","23":"Legal","25":"Educational Instruction and Library",
 "27":"Arts, Design, Entertainment, Sports, and Media","29":"Healthcare Practitioners and Technical",
 "31":"Healthcare Support","33":"Protective Service","35":"Food Preparation and Serving",
 "37":"Building and Grounds Cleaning and Maintenance","39":"Personal Care and Service",
 "41":"Sales and Related","43":"Office and Administrative Support",
 "45":"Farming, Fishing, and Forestry","47":"Construction and Extraction",
 "49":"Installation, Maintenance, and Repair","51":"Production",
 "53":"Transportation and Material Moving","55":"Military Specific",
}

def rows(name):
    with open(PIN / name, newline="", encoding="utf-8") as f:
        yield from csv.DictReader(f)

# ---- occupations -----------------------------------------------------------
# aei_soc_occupations.csv is the authoritative occupation-level source. Two
# occupations AEI does publish, Food Scientists and Technologists and Pharmacy
# Aides, come through coverage.csv with a blank share. Reading AEI directly
# takes the count from 716 back to the 718 AEI actually publishes.
aei_occ = {}
for r in rows("aei_soc_occupations.csv"):
    try:
        aei_occ[r["onetsoc_code"]] = round(float(r["automation_share"]), 1)
    except (TypeError, ValueError):
        pass

occ, idx = [], {}
for r in rows("coverage.csv"):
    code = r["onetsoc_code"]
    tier = r["coverage_tier"]
    share = r["occupation_automation_share"]
    if share in ("", None) and code in aei_occ:
        share = aei_occ[code]
    idx[code] = len(occ)
    occ.append([
        code,
        r["title"],
        (round(float(share), 1) if share not in ("", None) else None),
        {"full": 2, "partial": 1, "thin": 0}[tier],
        int(r["tasks_total"] or 0),
        int(r["tasks_matched"] or 0),
        code[:2],
    ])

# Family averages, over occupations that actually have a number. A family
# average built on the ones we could not measure would be a made-up number.
fam_vals = defaultdict(list)
for o in occ:
    if o[2] is not None:
        fam_vals[o[6]].append(o[2])
fam = {k: {"n": FAMILY.get(k, k), "avg": round(sum(v) / len(v), 1), "count": len(v)}
       for k, v in fam_vals.items()}
for k in FAMILY:
    fam.setdefault(k, {"n": FAMILY[k], "avg": None, "count": 0})

# ---- lay job titles --------------------------------------------------------
# "reported_job_title" is what a person actually calls themselves. Nobody types
# "Market Research Analysts and Marketing Specialists".
seen, titles = set(), []
for r in rows("onet_job_titles.csv"):
    code, t = r["onetsoc_code"], r["reported_job_title"].strip()
    if not t or code not in idx:
        continue
    key = (t.lower(), code)
    if key in seen:
        continue
    seen.add(key)
    titles.append([t, idx[code]])
# The occupation's own name is a valid thing to type, too.
for o in occ:
    key = (o[1].lower(), o[0])
    if key not in seen:
        seen.add(key)
        titles.append([o[1], idx[o[0]]])

# ---- tasks, with the AEI share attached ------------------------------------
share_by_task = {}
for r in rows("aei_onet_tasks.csv"):
    try:
        share_by_task[r["task_id"]] = round(float(r["automation_share"]), 1)
    except (TypeError, ValueError):
        pass

shards = defaultdict(lambda: defaultdict(list))
for r in rows("onet_task_statements.csv"):
    code = r["onetsoc_code"]
    if code not in idx:
        continue
    shards[code[:2]][code].append([
        r["task"],
        share_by_task.get(r["task_id"]),
        1 if r.get("task_type") == "Core" else 0,
    ])

# A measured task sorts above an unmeasured one, never mixed silently.
for mg in shards:
    for code in shards[mg]:
        shards[mg][code].sort(key=lambda t: (t[1] is None, -(t[1] or 0)))

# Military Specific, major group 55, has occupations and zero task statements
# in O*NET. The page has to say that rather than render an empty list.
if "55" in {o[6] for o in occ} and "55" not in shards:
    print("note: SOC 55 Military Specific has no task statements. Expected.")

have_n = sum(1 for o in occ if o[2] is not None)
if have_n != len(aei_occ):
    print(f"WARNING: {have_n} occupations carry a number but AEI publishes "
          f"{len(aei_occ)}. Investigate before shipping.")

matched = sum(1 for t in share_by_task if t)
if not titles or not shards or matched == 0:
    sys.exit("BUILD FAILED. Empty index, empty tasks, or no AEI shares joined. "
             "Re-run build.py and check pinned/ before shipping this.")

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "tasks").mkdir(exist_ok=True)

def dump(p, obj):
    p.write_text(json.dumps(obj, separators=(",", ":"), ensure_ascii=False))
    return p.stat().st_size

CITE = "Source: O*NET 31.0, Anthropic Economic Index 2026-06-26 release."
n_occ = dump(OUT / "occ.json", {"cite": CITE, "fam": fam, "occ": occ})
n_tit = dump(OUT / "titles.json", titles)
n_tsk = sum(dump(OUT / "tasks" / f"{mg}.json", dict(v)) for mg, v in shards.items())

have = sum(1 for o in occ if o[2] is not None)
print(f"occupations      {len(occ):>7,}   with a number {have:,}  without {len(occ)-have:,}")
print(f"search index     {len(titles):>7,} titles")
print(f"task shards      {len(shards):>7}   files")
print()
print(f"occ.json         {n_occ/1024:>7.0f} KB")
print(f"titles.json      {n_tit/1024:>7.0f} KB")
print(f"tasks/*.json     {n_tsk/1024:>7.0f} KB total")
print()
print(CITE)
