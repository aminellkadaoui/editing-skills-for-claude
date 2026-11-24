#!/bin/bash
# Render the calligraphy comp to a plain H.264 MP4 (no ProRes / .mov / alpha).
# usage: render_mp4.sh PROJECT.aep "COMP NAME" OUT.mp4 [END_FRAME=195]
# The project must be saved first. Uses the newest installed After Effects.
set -e
PROJ="$1"; COMP="$2"; OUT="$3"; END="${4:-195}"
AER=$(ls -d /Applications/Adobe\ After\ Effects\ 20*/aerender 2>/dev/null | sort | tail -1)
[ -x "$AER" ] || { echo "aerender not found"; exit 1; }
"$AER" -project "$PROJ" -comp "$COMP" -s 0 -e "$END" \
  -RStemplate "Best Settings" -OMtemplate "H.264 - Match Render Settings - 40 Mbps" -output "$OUT"
ls -la "$OUT"
