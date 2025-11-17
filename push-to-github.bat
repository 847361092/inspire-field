@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         推送代码到 GitHub                                   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM 检查 git 是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git 未安装，请先安装 Git for Windows
    pause
    exit /b 1
)

REM 显示当前状态
echo 📋 检查 Git 状态...
git status
echo.

REM 配置远程
echo 🔗 配置远程仓库...
git remote set-url origin https://github.com/847361092/inspire-field.git
echo ✅ 远程仓库: https://github.com/847361092/inspire-field.git
echo.

REM 配置凭证助手
echo 🔐 配置凭证助手...
git config --global credential.helper wincred
echo ✅ 凭证将保存在 Windows 凭证管理器中
echo.

REM 推送代码
echo 📤 推送代码到 GitHub...
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 可能的原因：
    echo 1. GitHub 凭证不正确
    echo 2. 没有仓库的写入权限
    echo 3. 网络连接问题
    echo.
    echo 请确保：
    echo - 使用正确的 GitHub 用户名（847361092）
    echo - 使用正确的 Personal Access Token 或密码
    echo - 仓库存在：https://github.com/847361092/inspire-field
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 推送成功！
echo.
echo 🎉 代码已上传到 GitHub
echo.
echo 下一步：
echo 1. 访问: https://github.com/847361092/inspire-field
echo 2. 验证代码已上传
echo 3. 访问 Vercel Dashboard 部署到生产环境
echo.
pause
