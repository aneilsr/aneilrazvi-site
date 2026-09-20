# Source data for the AI Readiness Read

Two public datasets, pinned to a version, so a result page says the same
number in six months and can explain it when it changes.

## Run it

**Terminal (a regular terminal, NOT Claude Code):**

```
cd "/Users/aneilrazvi/Claude projects/aneilrazvi-site-v2/data"
bash fetch.sh
python3 build.py
```

About 300 MB down, then 60 to 90 seconds of processing. Both scripts are safe
to re-run. `fetch.sh` resumes partial downloads and skips finished ones.

## Why it runs on your Mac and not in Claude's sandbox

`huggingface.co` and `onetcenter.org` are both blocked by the egress allowlist
in the Cowork cloud sandbox, which cannot reconfigure its own proxy. Verified
20 September 2026. Your own machine has normal internet, so it does the
downloading.

## Why `raw/` is gitignored

`aei_claude_ai_2026-06-26.csv` is **219 MB** and GitHub hard-rejects any file
over 100 MB. A push containing it fails after the commit already exists, which
means rewriting history to get rid of it.

`build.py` filters it to the few MB that matter. **Those go in git.** Anybody
can rebuild `raw/` with `fetch.sh`.

## What build.py produces

| File | What it is |
|---|---|
| `pinned/aei_onet_tasks.csv` | Automation share per O\*NET task ID, global, task level |
| `pinned/aei_soc_occupations.csv` | Same at the occupation level, read straight from AEI rather than rolled up |
| `pinned/onet_occupations.csv` | The 1,016 occupations |
| `pinned/onet_task_statements.csv` | 18,838 task statements, mapped to occupations |
| `pinned/onet_job_titles.csv` | 54,269 lay job titles. **This is the search index.** Nobody types "Market Research Analyst" |
| `pinned/coverage.csv` | **The census.** Every occupation, its tier, and how many tasks matched |
| `MANIFEST.json` | Versions, row counts, sha256 of every output, and the citation line |

## The number you are running this for

`build.py` prints a coverage census: how many of the 1,016 occupations land in
**full**, **partial** and **thin**.

| Tier | Rule | What the page shows |
|---|---|---|
| full | Occupation published **and** 10+ matched tasks | The number and the task list |
| partial | Published, under 10 tasks | The number, and says the detail is thin |
| thin | Not published | **No number.** The SOC family, and why |

The third tier is what earns trust. The AEI documentation says it plainly: a
missing row means the cell **was not published, not that the value is zero**.
A welder who gets a confident number built on nine conversations is the
failure that ends the tool.

## Two things that would have been silent bugs

**The lay-title column in `job_titles.csv` is `Job Title`, not `Alternate
Title`.** There is also a `Title` column in the same file holding the
*occupation* name. A loose column match returns 54,269 copies of the
occupation title and the search index looks fine while being useless.
`build.py` never falls back to bare `Title` for this field.

**`aei_soc_occupations.csv` and the task-level roll-up should broadly agree.**
They come from different places in the same release. When they disagree badly
for an occupation, that occupation's data is thin regardless of what its tier
says. Free correctness check across 1,016 rows.

## Sources and licences

- [O\*NET 31.0 Database](https://www.onetcenter.org/database.html), CC BY 4.0, US Department of Labor
- [Anthropic Economic Index](https://huggingface.co/datasets/Anthropic/EconomicIndex), CC BY

**Put the citation line from `MANIFEST.json` on every result page.** It does
more for trust than any amount of design, and it is what lets you say "your
number changed because the data updated in March, and here is what it was."

## Updating later

O\*NET updates quarterly. AEI updates irregularly. **Do not auto-update.**
Bump the version constants at the top of `fetch.sh` and `build.py`, re-run
both, and check the coverage census before and after. A data product that
silently changes its answers is not a data product, it is a rumour.
