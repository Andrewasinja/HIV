@echo off
rem Opens backend and frontend in two windows, then the browser.
start "HIV app - backend" cmd /k "%~dp0start_backend.bat"
start "HIV app - frontend" cmd /k "%~dp0start_frontend.bat"
timeout /t 8 /nobreak >nul
start http://localhost:5173
