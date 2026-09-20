#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Downloads the two source datasets for the AI Readiness Read.
#
# Run this from a REGULAR TERMINAL on your Mac. It will not work from inside
# Claude's sandbox: huggingface.co and onetcenter.org are both blocked there
# by the egress allowlist.
#
#   cd "/Users/aneilrazvi/Claude projects/aneilrazvi-site-v2/data"
#   bash fetch.sh
#
# Safe to re-run. It resumes partial downloads and skips finished ones.
# Total download: about 300 MB. On a normal connection, 2 to 5 minutes.
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")"
mkdir -p raw/onet raw/aei

ONET_VER="31_0"
AEI_REL="release_2026_06_26"
AEI_DATE="2026-06-26"
HF="https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main"
ON="https://www.onetcenter.org/dl_files/database/db_${ONET_VER}_csv"

fail=0

get () {  # get <url> <destination> <human label>
  local url="$1" dest="$2" label="$3"
  if [ -s "$dest" ]; then
    printf '  skip   %-46s (already have %s)\n' "$label" "$(du -h "$dest" | cut -f1)"
    return 0
  fi
  printf '  fetch  %s\n' "$label"
  if curl -fL --progress-bar -C - -o "$dest" "$url"; then
    printf '         done, %s\n' "$(du -h "$dest" | cut -f1)"
  else
    printf '  FAILED %s\n         %s\n' "$label" "$url"
    rm -f "$dest"
    fail=1
  fi
}

echo
echo "O*NET ${ONET_VER//_/.}  (7 files, about 40 MB)"
for f in occupation_data task_statements task_ratings job_titles \
         sample_of_reported_titles tasks_to_dwas content_model_reference; do
  get "${ON}/${f}.csv" "raw/onet/${f}.csv" "${f}.csv"
done

echo
echo "Anthropic Economic Index  ${AEI_REL}  (2 files, about 296 MB)"
get "${HF}/${AEI_REL}/data/aei_claude_ai_${AEI_DATE}.csv" \
    "raw/aei/aei_claude_ai_${AEI_DATE}.csv" "aei_claude_ai_${AEI_DATE}.csv  (219 MB, the big one)"
get "${HF}/${AEI_REL}/data/aei_1p_api_${AEI_DATE}.csv" \
    "raw/aei/aei_1p_api_${AEI_DATE}.csv"   "aei_1p_api_${AEI_DATE}.csv  (77 MB)"

echo
echo "-----------------------------------------------------------------"
if [ "$fail" -eq 0 ]; then
  echo "All files downloaded."
  du -sh raw/onet raw/aei
  echo
  echo "NEXT:  python3 build.py"
else
  echo "Some files failed. Re-run this script, it resumes where it stopped."
  echo "If one keeps failing, open its URL in Chrome and check the site is up."
  exit 1
fi
