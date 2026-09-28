@echo off
cd /d "%~dp0"
title PDF DIFF - Local Drawing Review
echo Starting PDF DIFF at http://127.0.0.1:4321
echo Keep this window open while using the app.
call npm start
if errorlevel 1 pause
