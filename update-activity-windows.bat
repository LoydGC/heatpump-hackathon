@echo off
REM Double-click to regenerate docs\ACTIVITY.md from git history (all branches).
cd /d "%~dp0"
where py >nul 2>nul && ( py tools\activity.py & goto :done )
where python >nul 2>nul && ( python tools\activity.py & goto :done )
echo Python was not found. Install it from https://www.python.org/downloads/ and try again.
:done
echo.
echo Commit docs\ACTIVITY.md to share it (GitHub Desktop: it shows as a changed file).
pause
