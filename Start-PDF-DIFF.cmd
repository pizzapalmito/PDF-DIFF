@echo off
setlocal
cd /d "%~dp0"
title PDF DIFF - Local Drawing Review
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0requirements.ps1" -StartApp
if errorlevel 1 (
  pause
  exit /b 1
)
exit /b 0
