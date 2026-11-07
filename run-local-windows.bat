@echo off
REM Double-click to view the site on your computer at http://localhost:8000
cd /d "%~dp0"
set PORT=8000

where py >nul 2>nul && (
  start "" http://localhost:%PORT%
  py -m http.server %PORT%
  goto :eof
)
where python >nul 2>nul && (
  start "" http://localhost:%PORT%
  python -m http.server %PORT%
  goto :eof
)
where npx >nul 2>nul && (
  start "" http://localhost:%PORT%
  npx --yes serve -l %PORT% .
  goto :eof
)

echo Python and Node were not found, so opening index.html directly.
start "" "%~dp0index.html"
pause
