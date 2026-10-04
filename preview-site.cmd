@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python or run: npm run preview
  pause
  exit /b 1
)

echo Building the IIS publish folder...
call npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

echo Starting a static layout preview at http://127.0.0.1:4173/
echo Note: production routing and headers are controlled by dist\web.config on IIS.
start "OS Technology local server" /min python -m http.server 4173 -d "%~dp0dist"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173/"
endlocal
