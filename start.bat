@echo off
cd /d "%~dp0"

echo Starting InspireField...
echo.

taskkill /f /im node.exe 2>nul

echo Starting upload server...
start cmd /k "node server/upload.cjs"

ping localhost -n 2 >nul

echo Starting frontend server...
start cmd /k "npm run dev"

echo.
echo System started!
echo Frontend: http://localhost:5173
echo Upload API: http://localhost:3001
echo.
pause