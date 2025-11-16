@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════╗
echo ║    InspireField 快速创建作品         ║
echo ╚══════════════════════════════════════╝
echo.
npm run artwork:create
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 作品创建成功！下一步操作：
echo.
echo 1. 复制图片到作品目录
echo 2. 运行 npm run dev 预览效果
echo 3. 运行 deploy.bat 部署到 Vercel
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
pause