@echo off
chcp 65001 >nul
title SeqLens Dev Server
cd /d "%~dp0"

echo ============================================
echo   SeqLens - starting dev server
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  echo Please install Node.js 18+ from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo Node version: %NODEVER%
echo.

if not exist "node_modules" (
  echo First run: installing dependencies, this may take a minute...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed. Check your network or proxy.
    pause
    exit /b 1
  )
  echo.
)

echo Starting Vite. The browser will open automatically.
echo Keep this window open. Press Ctrl+C to stop the server.
echo.

start "" http://localhost:5173/
call npm run dev

echo.
echo Server stopped.
pause
