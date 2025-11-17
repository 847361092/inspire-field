@echo off
REM Sync and push to GitHub script
REM This script pulls latest changes and pushes new commits

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    echo Please install Git for Windows from https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo ============================================================
echo         Sync and Push to GitHub
echo ============================================================
echo.

REM Check git status
echo Step 1: Checking Git status...
git status
echo.

REM Configure remote
echo Step 2: Setting up remote repository...
git remote set-url origin https://github.com/847361092/inspire-field.git
echo Remote configured: https://github.com/847361092/inspire-field.git
echo.

REM Configure credential helper
echo Step 3: Configuring credential helper...
git config --global credential.helper wincred
echo Credentials will be saved in Windows Credential Manager
echo.

REM Pull latest changes
echo Step 4: Pulling latest changes from GitHub...
echo.
git pull origin main --rebase

if errorlevel 1 (
    echo.
    echo WARNING: Pull encountered an issue
    echo Attempting to continue with push...
    echo.
)

REM Push code
echo Step 5: Pushing code to GitHub...
echo.
echo When prompted, enter your GitHub credentials:
echo   Username: 847361092
echo   Password: Your Personal Access Token (PAT)
echo.
echo To create a PAT: https://github.com/settings/tokens/new?scopes=repo
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ERROR: Push failed!
    echo.
    echo Possible reasons:
    echo 1. Incorrect GitHub credentials
    echo 2. No write permission to repository
    echo 3. Network connection issue
    echo 4. Conflicting changes between local and remote
    echo.
    echo To resolve conflicts:
    echo 1. Run: git pull origin main
    echo 2. Resolve any conflicts in your editor
    echo 3. Run: git add .
    echo 4. Run: git commit -m "Merge remote changes"
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo SUCCESS: Code synced and pushed to GitHub!
echo.
echo Next steps:
echo 1. Visit: https://github.com/847361092/inspire-field
echo 2. Verify code was uploaded
echo 3. Check Vercel Dashboard for auto-deployment
echo.
pause
