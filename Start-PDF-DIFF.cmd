@echo off
cd /d "%~dp0"
title PDF DIFF - Local Drawing Review
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required. Install Node.js 20.15 or newer, then try again.
  pause
  exit /b 1
)
if not exist "node_modules\.bin\vite.cmd" (
  echo Installing PDF DIFF dependencies...
  call npm ci --include=dev
  if errorlevel 1 goto :failed
)
if not exist "dist\index.html" (
  echo Building PDF DIFF...
  call npm run build
  if errorlevel 1 goto :failed
)
echo Starting PDF DIFF at http://127.0.0.1:4321
echo Keep this window open while using the app.
call npm start
if errorlevel 1 goto :failed
exit /b 0
:failed
echo PDF DIFF could not start. See the error above.
pause
exit /b 1
