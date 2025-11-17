@echo off
REM Push to GitHub script
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
echo         Pushing code to GitHub
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

REM Push code
echo Step 4: Pushing code to GitHub...
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
    echo.
    echo Please check:
    echo - GitHub username is correct (847361092)
    echo - Personal Access Token is valid
    echo - Repository exists: https://github.com/847361092/inspire-field
    echo.
    pause
    exit /b 1
)

echo.
echo SUCCESS: Code pushed to GitHub!
echo.
echo Next steps:
echo 1. Visit: https://github.com/847361092/inspire-field
echo 2. Verify code was uploaded
echo 3. Vercel will auto-deploy from GitHub
echo.
pause
