@echo off
cd /d "%~dp0frontend"
if not exist "node_modules" (
  echo Installing frontend packages, please wait...
  call npm install || goto :error
)
call npm run dev
goto :eof

:error
echo Setup failed. Make sure Node.js is installed.
pause
