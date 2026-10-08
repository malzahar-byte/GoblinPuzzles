@echo off
setlocal
cd /d "%~dp0"
title GoblinPuzzles - local runner

where node >nul 2>nul
if errorlevel 1 goto nonode

if exist "node_modules\playwright-core\package.json" goto run

echo.
echo First run: installing the one package the browser test needs (playwright-core).
echo No browser is downloaded - your installed Chrome is used.
echo.
call npm install --no-audit --no-fund
if errorlevel 1 goto npmfail

:run
node "dev-tools\local-runner.mjs"
if errorlevel 1 goto runfail
goto end

:nonode
echo.
echo Node.js is not installed. Opening the download page.
echo Install the LTS version, then run this file again.
echo.
start "" "https://nodejs.org/en/download"
pause
goto end

:npmfail
echo.
echo Could not install playwright-core. Check your internet connection, then run this file again.
echo.
pause
goto end

:runfail
echo.
echo The local runner stopped with an error - the message above says why.
echo.
pause

:end
endlocal
