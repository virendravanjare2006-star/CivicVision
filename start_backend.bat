@echo off
title CivicVision - Backend Server (Cognitech)
echo ========================================================
echo   CivicVision Flask Backend - Team Cognitech
echo   Starting SQLite database and REST API...
echo ========================================================
cd /d "%~dp0backend"
python app.py
pause
