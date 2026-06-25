@echo off
cd /d "%~dp0"
echo.
echo === Adam Cloudflare Worker deploy ===
echo.
echo First time only: Cloudflare may open your browser to pick a workers.dev subdomain
echo   (example: darradam1975  --^>  volcano-vent-adam-api.darradam1975.workers.dev)
echo.
npx.cmd --yes wrangler login
npx.cmd --yes wrangler deploy
if errorlevel 1 (
  echo.
  echo Deploy failed. If you have not picked a workers.dev subdomain yet, open:
  echo   https://dash.cloudflare.com/workers/onboarding
  echo Then run this file again.
  pause
  exit /b 1
)
echo.
echo === Success ===
echo Copy the workers.dev URL above into js/cloud-config.js as ADAM_CLOUD_API_BASE
echo Then commit and push to GitHub for GPT on the live site.
echo.
pause