@echo off
title CivicVision - Master Launcher (Cognitech)
echo ========================================================
echo   CivicVision - Full-Stack Smart City Hazard Platform
echo   Team Cognitech
echo   Launching Backend (Port 5000) and Frontend (Port 5173)...
echo ========================================================

start "CivicVision Backend" cmd /k "cd /d %~dp0backend && python app.py"
timeout /t 2 /nobreak >nul
start "CivicVision Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Both servers have been launched in separate windows!
echo - Flask Backend API: http://127.0.0.1:5000
echo - React Frontend:    http://localhost:5173
echo.
pause
