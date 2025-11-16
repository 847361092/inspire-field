@echo off
echo =========================================
echo   InspireField - Install Dependencies
echo =========================================
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 20.19.0 or higher
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK: Node.js %NODE_VERSION%

:: Check npm
echo.
echo [2/5] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please reinstall Node.js
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
echo OK: npm %NPM_VERSION%

:: Clean cache
echo.
echo [3/5] Cleaning npm cache...
npm cache clean --force >nul 2>&1
echo OK: Cache cleaned

:: Remove old dependencies
echo.
echo [4/5] Removing old dependencies...
if exist node_modules (
    echo Removing node_modules...
    rd /s /q node_modules 2>nul
    echo OK: Old dependencies removed
) else (
    echo OK: No old dependencies
)

if exist package-lock.json (
    del /f /q package-lock.json 2>nul
    echo OK: package-lock.json removed
)

:: Install dependencies
echo.
echo [5/5] Installing dependencies...
echo This may take 3-5 minutes...
echo.

npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed!
    echo.
    echo Try these solutions:
    echo 1. Check your internet connection
    echo 2. Run as administrator
    echo 3. Try: npm install
    echo.
    pause
    exit /b 1
)

:: Success
echo.
echo =========================================
echo SUCCESS: All dependencies installed!
echo =========================================
echo.
echo Available commands:
echo   npm run dev      - Start development server
echo   npm run build    - Build for production
echo   npm run preview  - Preview production build
echo.
echo Tip: Run start.bat to start the project
echo.

pause