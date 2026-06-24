@echo off
title Adam — Volcano Vent Dice preview
cd /d "%~dp0"
echo.
echo  Starting preview at http://localhost:8765
echo  Press Ctrl+C to stop.
echo.
start "" "http://localhost:8765"
npx --yes serve . -l 8765