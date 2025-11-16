@echo off
echo ========================================
echo WebP 图片批量转换工具
echo ========================================
echo.
echo 此脚本将执行以下操作：
echo 1. 将所有PNG/JPG图片转换为WebP格式（质量80%%）
echo 2. 更新代码中的图片引用
echo 3. 删除原始图片文件
echo.
echo 警告：此操作不可逆！建议先备份项目。
echo.
pause

echo.
echo [步骤1] 转换图片为WebP格式...
echo ----------------------------------------
node convert-to-webp.cjs
if errorlevel 1 (
    echo 图片转换失败！请检查错误信息。
    pause
    exit /b 1
)

echo.
echo [步骤2] 更新代码中的图片引用...
echo ----------------------------------------
node update-image-references.cjs
if errorlevel 1 (
    echo 更新引用失败！请检查错误信息。
    pause
    exit /b 1
)

echo.
echo ========================================
echo 转换完成！
echo ========================================
echo.
echo 请执行以下操作验证：
echo 1. 运行 npm run dev 启动开发服务器
echo 2. 检查所有图片是否正常显示
echo 3. 如有问题，使用Git恢复: git checkout .
echo.
pause