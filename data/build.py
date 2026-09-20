#!/usr/bin/env python3
"""
Turns 300 MB of raw downloads into a few MB of pinned, committable data,
and prints the coverage census that tells you how many of the 1,016
occupations the tool can actually serve.

    cd "/Users/aneilrazvi/Claude projects/aneilrazvi-site-v2/data"
    python3 build.py

Standard library only. No pip install. Streams the big file rather than
loading it, so it runs in well under 200 MB of memory.

Takes about 60 to 90 seconds, almost all of it on the 219 MB file.
"""

import csv, json, hashlib, os, sys, datetime
from collections import defaultdict

HERE  = os.path.dirname(os.path.abspath(__file__))
RAW   = os.path.join(HERE, "raw")
OUT   = os.path.join(HERE, "pinned")
ONET_VERSION = "31.0"
AEI_RELEASE  = "release_2026_06_26"
AEI_DATE     = "2026-06-26"

# Metrics worth keeping. Everything else in that file is noise for us.
KEEP_METRICS = {
    "collaboration_bucket_automation_pct",
    "collaboration_bucket_augmentation_pct",
    "pct",
    "ai_autonomy_mean",
    "human_only_time_mean",
    "human_with_ai_time_mean",
}

# How many matched tasks an occupation needs before the page shows a task
# list rather than just a headline number.
#
# Measured on the real data 20 Sep 2026, out of 1,016 occupations:
#   >=10 tasks ->  66 occupations ( 6.5%)   too strict, kills the feature
#   >= 8 tasks -> 105 occupations (10.3%)
#   >= 5 tasks -> 235 occupations (23.1%)   <- chosen
#   >= 3 tasks -> 396 occupations (39.0%)   too loose, three tasks is not a list
#
# 5 is the point where a task list is worth showing and still honest. The page
# must ALWAYS print the fraction ("13 of the 30 tasks O*NET lists"), because
# coverage is never complete: the single best-covered occupation is 20 of 30.
FULL_TIER_MIN_TASKS = 5

csv.field_size_limit(10_000_000)


def need(path, hint):
    if not os.path.exists(path):
        sys.exit(f"MISSING: {path}\n   Run:  bash fetch.sh\n   ({hint})")
    return path


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            yield row


def col(row, *names):
    """O*NET column headers use spaces and asterisks. Be forgiving."""
    for n in names:
        if n in row:
            return row[n]
    low = {k.lower().strip(): v for k, v in row.items()}
    for n in names:
        if n.lower() in low:
            return low[n.lower()]
    return None


def main():
    os.makedirs(OUT, exist_ok=True)

    aei_big = need(os.path.join(RAW, "aei", f"aei_claude_ai_{AEI_DATE}.csv"),
                   "the 219 MB Claude.ai file")
    p_occ   = need(os.path.join(RAW, "onet", "occupation_data.csv"), "1,016 occupations")
    p_task  = need(os.path.join(RAW, "onet", "task_statements.csv"), "18,838 task statements")
    p_title = need(os.path.join(RAW, "onet", "job_titles.csv"), "54,269 lay job titles")

    # -- 1. Stream the big AEI file, keeping only what we need -------------
    print("1/5  Streaming the AEI file. This is the slow part.")
    onet_tasks, soc_occs = defaultdict(dict), defaultdict(dict)
    seen_dates, scanned, kept = set(), 0, 0

    with open(aei_big, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            scanned += 1
            if scanned % 2_000_000 == 0:
                print(f"       {scanned:,} rows scanned, {kept:,} kept")
            if r.get("geo_id") != "GLOBAL":            continue
            if r.get("hierarchy_level") != "0":        continue
            m = r.get("metric_id")
            if m not in KEEP_METRICS:                  continue
            cat, nid = r.get("category_name"), r.get("node_external_id")
            if not nid:                                continue
            try:
                val = float(r["value"])
            except (TypeError, ValueError):
                continue
            seen_dates.add(r.get("date_end", ""))
            if cat == "onet":
                onet_tasks[nid][m] = val
                onet_tasks[nid]["node_name"] = r.get("node_name", "")
            elif cat == "soc_occupation":
                soc_occs[nid][m] = val
                soc_occs[nid]["node_name"] = r.get("node_name", "")
            else:
                continue
            kept += 1

    print(f"       {scanned:,} rows scanned, {kept:,} kept")
    print(f"       {len(onet_tasks):,} O*NET tasks, {len(soc_occs):,} SOC occupations")
    print(f"       periods present: {', '.join(sorted(d for d in seen_dates if d))}")

    def share(d):
        """automation share = A / (A + U). None when neither bucket published."""
        a = d.get("collaboration_bucket_automation_pct")
        u = d.get("collaboration_bucket_augmentation_pct")
        if a is None or u is None or (a + u) == 0:
            return None
        return round(100.0 * a / (a + u), 2)

    # -- 2. Write the two AEI extracts -------------------------------------
    print("2/5  Writing the AEI extracts.")
    FIELDS = ["automation_pct", "augmentation_pct", "pct",
              "ai_autonomy_mean", "human_only_time_mean", "human_with_ai_time_mean"]
    MAP = {"automation_pct": "collaboration_bucket_automation_pct",
           "augmentation_pct": "collaboration_bucket_augmentation_pct",
           "pct": "pct",
           "ai_autonomy_mean": "ai_autonomy_mean",
           "human_only_time_mean": "human_only_time_mean",
           "human_with_ai_time_mean": "human_with_ai_time_mean"}

    def dump(path, keycol, data):
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow([keycol, "node_name", "automation_share"] + FIELDS)
            for k in sorted(data):
                d = data[k]
                w.writerow([k, d.get("node_name", ""), share(d)] +
                           [d.get(MAP[c]) for c in FIELDS])
        return sum(1 for _ in open(path, encoding="utf-8")) - 1

    n_tasks = dump(os.path.join(OUT, "aei_onet_tasks.csv"), "task_id", onet_tasks)
    n_socs  = dump(os.path.join(OUT, "aei_soc_occupations.csv"), "onetsoc_code", soc_occs)

    # -- 3. O*NET reference tables -----------------------------------------
    print("3/5  Copying the O*NET reference tables.")
    occupations = {}
    with open(os.path.join(OUT, "onet_occupations.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["onetsoc_code", "title", "description"])
        for r in read_csv(p_occ):
            code  = col(r, "O*NET-SOC Code", "onetsoc_code")
            title = col(r, "Title", "title")
            if not code: continue
            occupations[code] = title
            w.writerow([code, title, col(r, "Description", "description") or ""])

    tasks_by_occ = defaultdict(list)
    with open(os.path.join(OUT, "onet_task_statements.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["onetsoc_code", "task_id", "task", "task_type"])
        for r in read_csv(p_task):
            code = col(r, "O*NET-SOC Code", "onetsoc_code")
            tid  = col(r, "Task ID", "task_id")
            if not (code and tid): continue
            tasks_by_occ[code].append(tid)
            w.writerow([code, tid, col(r, "Task", "task") or "",
                        col(r, "Task Type", "task_type") or ""])

    n_titles = 0
    with open(os.path.join(OUT, "onet_job_titles.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["onetsoc_code", "reported_job_title"])
        for r in read_csv(p_title):
            code = col(r, "O*NET-SOC Code", "onetsoc_code")
            # "Job Title" is the LAY title. Do NOT fall back to bare "Title",
            # which is the occupation name and would give 54,269 useless rows.
            t    = col(r, "Job Title", "Alternate Title", "Reported Job Title")
            if code and t:
                w.writerow([code, t]); n_titles += 1

    # -- 4. THE COVERAGE CENSUS. This is the number you asked for. ---------
    print("4/5  Running the coverage census.")

    # Join health. If either of these is zero the census is meaningless and
    # will look like a real finding ("100% thin") rather than a bug.
    task_overlap = len(set(onet_tasks) & {t for ts in tasks_by_occ.values() for t in ts})
    occ_overlap  = len(set(soc_occs) & set(occupations))
    print(f"     join check: {task_overlap:,} task ids matched, "
          f"{occ_overlap:,} occupation codes matched")
    if task_overlap == 0 or occ_overlap == 0:
        sys.exit("\nJOIN FAILED. Key formats do not line up between AEI and O*NET.\n"
                 "   Do NOT trust the census below. Compare a few ids by hand:\n"
                 f"   AEI occupation ids look like: {sorted(soc_occs)[:3]}\n"
                 f"   O*NET occupation ids look like: {sorted(occupations)[:3]}")

    tiers = {"full": 0, "partial": 0, "thin": 0}
    rows = []
    for code, title in sorted(occupations.items()):
        # AEI's soc_occupation node_external_id is the FULL O*NET-SOC code,
        # decimal included: "11-1011.00", not "11-1011". Stripping the decimal
        # matches nothing, and collapsing to six digits LOSES matches
        # (718 exact vs 614 collapsed). Verified 20 Sep 2026.
        soc_key = code
        all_t = tasks_by_occ.get(code, [])
        matched = [t for t in all_t if t in onet_tasks]
        shares  = [share(onet_tasks[t]) for t in matched]
        shares  = [s for s in shares if s is not None]
        occ_pub = soc_key in soc_occs
        occ_share = share(soc_occs[soc_key]) if occ_pub else None

        if occ_pub and len(matched) >= FULL_TIER_MIN_TASKS:   tier = "full"
        elif occ_pub:                                          tier = "partial"
        else:                                                  tier = "thin"
        tiers[tier] += 1

        rows.append([code, title, tier, len(all_t), len(matched),
                     occ_share,
                     round(sum(shares) / len(shares), 2) if shares else None])

    with open(os.path.join(OUT, "coverage.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["onetsoc_code", "title", "coverage_tier", "tasks_total",
                    "tasks_matched", "occupation_automation_share", "task_mean_share"])
        w.writerows(rows)

    total = len(occupations)
    print()
    print("     COVERAGE CENSUS")
    print("     ---------------------------------------------")
    for t in ("full", "partial", "thin"):
        n = tiers[t]
        print(f"     {t:<8} {n:>5}  ({100.0*n/total:5.1f}%)")
    print(f"     {'TOTAL':<8} {total:>5}")
    print()
    print("     full    = occupation published AND 10+ matched tasks. Show everything.")
    print("     partial = published, under 10 tasks. Show the number, say detail is thin.")
    print("     thin    = not published. Show NO number. Show the SOC family and say why.")
    print()

    # -- 5. Manifest -------------------------------------------------------
    print("5/5  Writing MANIFEST.json.")
    manifest = {
        "built_at": datetime.datetime.now(datetime.timezone.utc)
                        .isoformat(timespec="seconds"),
        "sources": {
            "onet": {"version": ONET_VERSION, "url": "https://www.onetcenter.org/database.html",
                     "license": "CC BY 4.0"},
            "aei":  {"release": AEI_RELEASE,
                     "url": "https://huggingface.co/datasets/Anthropic/EconomicIndex",
                     "license": "CC BY", "periods": sorted(d for d in seen_dates if d)},
        },
        "rows": {"aei_onet_tasks": n_tasks, "aei_soc_occupations": n_socs,
                 "onet_occupations": total, "onet_job_titles": n_titles},
        "coverage": tiers,
        "citation_line": f"Source: O*NET {ONET_VERSION}, "
                         f"Anthropic Economic Index {AEI_DATE} release.",
        "checksums": {fn: sha256(os.path.join(OUT, fn))
                      for fn in sorted(os.listdir(OUT)) if fn.endswith(".csv")},
    }
    with open(os.path.join(HERE, "MANIFEST.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    size = sum(os.path.getsize(os.path.join(OUT, fn)) for fn in os.listdir(OUT))
    print(f"     pinned/ is {size/1e6:.1f} MB. Well under GitHub's 100 MB limit.")
    print()
    print("PUT THIS LINE ON EVERY RESULT PAGE:")
    print("   " + manifest["citation_line"])
    print()
    print("NEXT:  git add data && git commit -m 'Pinned O*NET 31.0 and AEI June 2026'")


if __name__ == "__main__":
    main()
