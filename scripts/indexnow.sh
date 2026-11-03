#!/bin/bash
# Ping IndexNow (Bing, Yandex, and the AI answer engines that read Bing) with changed URLs.
# Usage, from the repo root on the Mac:  bash scripts/indexnow.sh /cubby.html /build/faq /blog/<slug>.html
[ $# -eq 0 ] && { echo "Pass one or more paths, e.g. /cubby.html"; exit 1; }
list=$(printf '"https://aneilrazvi.com%s",' "$@"); list="[${list%,}]"
curl -s -o /dev/null -w 'IndexNow HTTP %{http_code}\n' -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{\"host\":\"aneilrazvi.com\",\"key\":\"86d3e88a5362e070b296f5e8eed8d8ab\",\"keyLocation\":\"https://aneilrazvi.com/86d3e88a5362e070b296f5e8eed8d8ab.txt\",\"urlList\":$list}"
