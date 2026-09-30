@echo off
setlocal
cd /d "%~dp0"
title PDF DIFF - Requirements Setup
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0requirements.ps1" -Rebuild
if errorlevel 1 (
  pause
  exit /b 1
)
echo Setup complete. Double-click Start-PDF-DIFF.cmd to open the app.
pause
exit /b 0
