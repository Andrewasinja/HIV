@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment and installing packages, please wait...
  python -m venv .venv || goto :error
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt || goto :error
)
if not exist ".env" (
  echo Creating backend\.env from .env.example - add your SUNBIRD_API_TOKEN there for the Luganda voice.
  copy ".env.example" ".env" >nul
)
".venv\Scripts\python.exe" manage.py migrate
".venv\Scripts\python.exe" manage.py runserver 8000
goto :eof

:error
echo Setup failed. Make sure Python 3.12+ is installed and on PATH.
pause
