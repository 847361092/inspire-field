@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════╗
echo ║    InspireField 一键部署             ║
echo ╚══════════════════════════════════════╝
echo.
echo 正在构建项目...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败，请检查错误信息
    pause
    exit /b 1
)
echo.
echo ✅ 构建成功！
echo.
echo 正在提交到 Git...
git add .
set /p commit_msg="请输入提交信息 (默认: 更新作品): "
if "%commit_msg%"=="" set commit_msg=更新作品
git commit -m "%commit_msg%"
echo.
echo 正在推送到远程仓库...
git push
if errorlevel 1 (
    echo ❌ 推送失败，请检查网络连接
    pause
    exit /b 1
)
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ 部署成功！
echo.
echo Vercel 将在几分钟内自动部署您的更新
echo 访问 https://vercel.com/dashboard 查看部署状态
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
pause