@echo off
title Adam The Volcano Vent Bot — local preview
cd /d "%~dp0"
echo.
echo  Adam The Volcano Vent Bot — local preview
echo  Opening http://localhost:8765
echo  Press Ctrl+C to stop.
echo.
start "" "http://localhost:8765"
npm start