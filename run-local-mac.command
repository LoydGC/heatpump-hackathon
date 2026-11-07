#!/bin/bash
# Double-click to view the site on your computer at http://localhost:8000
cd "$(dirname "$0")"
PORT=8000

if command -v python3 >/dev/null 2>&1; then
  (sleep 1; open "http://localhost:$PORT") &
  python3 -m http.server "$PORT"
elif command -v npx >/dev/null 2>&1; then
  (sleep 2; open "http://localhost:$PORT") &
  npx --yes serve -l "$PORT" .
else
  echo "Python and Node were not found, so opening index.html directly."
  open index.html
fi
