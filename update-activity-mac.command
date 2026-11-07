#!/bin/bash
# Double-click to regenerate docs/ACTIVITY.md from git history (all branches).
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 tools/activity.py
else
  echo "Python 3 was not found. Install it from https://www.python.org/downloads/ and try again."
fi
echo
echo "Commit docs/ACTIVITY.md to share it (GitHub Desktop: it shows as a changed file)."
read -n 1 -s -r -p "Press any key to close."
