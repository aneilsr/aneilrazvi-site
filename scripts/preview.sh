#!/bin/bash
# Local preview screenshots. Usage on the Mac, from the repo root:  bash scripts/preview.sh cubby about 1440
# Writes _to_delete/preview/<page>.png. Headless Chrome will not render narrower than about 500px.
W=${@: -1}; [[ "$W" =~ ^[0-9]+$ ]] && set -- "${@:1:$(($#-1))}" || W=1440
mkdir -p _to_delete/preview
pgrep -f "http.server 8765" >/dev/null || (nohup python3 -m http.server 8765 >/tmp/site-preview.log 2>&1 &)
sleep 1; C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for p in "$@"; do ("$C" --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion --user-data-dir=/tmp/pv-$p-$W \
  --window-size=$W,900 --virtual-time-budget=2500 --screenshot="$PWD/_to_delete/preview/$p.png" "http://localhost:8765/$p.html" >/dev/null 2>&1 &); done
sleep 10; ls -la _to_delete/preview
