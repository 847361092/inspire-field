/**
 * WebP图片转换脚本
 * 将项目中的所有PNG和JPG图片转换为WebP格式
 * 质量设置为80%以减小文件大小
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// 配置
const config = {
  quality: 80,  // WebP质量 (0-100)
  directories: [
    './public/images/gallery',
    './public/artworks'
  ],
  extensions: ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'],
  keepOriginal: false  // 是否保留原文件
};

// 统计信息
let stats = {
  totalFiles: 0,
  convertedFiles: 0,
  failedFiles: 0,
  originalSize: 0,
  newSize: 0,
  errors: []
};

/**
 * 将单个图片文件转换为WebP格式
 */
async function convertToWebP(inputPath, outputPath) {
  try {
    const inputStats = await fs.stat(inputPath);
    stats.originalSize += inputStats.size;
    
    await sharp(inputPath)
      .webp({ quality: config.quality })
      .toFile(outputPath);
    
    const outputStats = await fs.stat(outputPath);
    stats.newSize += outputStats.size;
    
    console.log(`✓ 转换成功: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    console.log(`  原大小: ${(inputStats.size / 1024).toFixed(2)} KB -> 新大小: ${(outputStats.size / 1024).toFixed(2)} KB (减少 ${((1 - outputStats.size / inputStats.size) * 100).toFixed(1)}%)`);
    
    // 如果不保留原文件，删除原文件
    if (!config.keepOriginal) {
      await fs.unlink(inputPath);
      console.log(`  已删除原文件: ${path.basename(inputPath)}`);
    }
    
    stats.convertedFiles++;
    return true;
  } catch (error) {
    console.error(`✗ 转换失败: ${inputPath}`, error.message);
    stats.failedFiles++;
    stats.errors.push({ file: inputPath, error: error.message });
    return false;
  }
}

/**
 * 递归遍历目录并转换所有图片
 */
async function processDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(entry.name).toLowerCase();
        if (config.extensions.includes(ext)) {
          stats.totalFiles++;
          // 生成新的WebP文件路径
          const webpPath = fullPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
          
          // 检查是否已经存在WebP文件
          try {
            await fs.access(webpPath);
            console.log(`⚠ 跳过: ${path.basename(webpPath)} 已存在`);
          } catch {
            // WebP文件不存在，进行转换
            await convertToWebP(fullPath, webpPath);
          }
        }
      }
    }
  } catch (error) {
    console.error(`无法访问目录: ${dirPath}`, error.message);
  }
}

/**
 * 创建文件映射表（用于更新代码引用）
 */
async function createMappingFile() {
  const mapping = {};
  
  for (const dir of config.directories) {
    await scanForMapping(dir, mapping);
  }
  
  // 保存映射文件
  await fs.writeFile(
    './image-mapping.json',
    JSON.stringify(mapping, null, 2),
    'utf8'
  );
  
  console.log('\n已创建图片映射文件: image-mapping.json');
  return mapping;
}

async function scanForMapping(dirPath, mapping) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await scanForMapping(fullPath, mapping);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.webp') {
          // 记录原文件名到WebP文件名的映射
          const originalName = entry.name.replace('.webp', '');
          config.extensions.forEach(originalExt => {
            const possibleOriginal = originalName + originalExt;
            mapping[possibleOriginal] = entry.name;
          });
        }
      }
    }
  } catch (error) {
    console.error(`扫描目录失败: ${dirPath}`, error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('WebP 图片转换工具');
  console.log('='.repeat(60));
  console.log(`质量设置: ${config.quality}%`);
  console.log(`保留原文件: ${config.keepOriginal ? '是' : '否'}`);
  console.log('处理目录:');
  config.directories.forEach(dir => console.log(`  - ${dir}`));
  console.log('='.repeat(60));
  
  // 检查sharp是否已安装
  try {
    require.resolve('sharp');
  } catch {
    console.error('\n错误: 未安装 sharp 模块');
    console.log('请先运行: npm install sharp');
    process.exit(1);
  }
  
  // 开始转换
  console.log('\n开始转换图片...\n');
  const startTime = Date.now();
  
  for (const dir of config.directories) {
    console.log(`\n处理目录: ${dir}`);
    console.log('-'.repeat(40));
    await processDirectory(dir);
  }
  
  // 创建映射文件
  await createMappingFile();
  
  // 显示统计信息
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(60));
  console.log('转换完成！');
  console.log('='.repeat(60));
  console.log(`总文件数: ${stats.totalFiles}`);
  console.log(`成功转换: ${stats.convertedFiles}`);
  console.log(`转换失败: ${stats.failedFiles}`);
  console.log(`原始总大小: ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`转换后总大小: ${(stats.newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`节省空间: ${((stats.originalSize - stats.newSize) / 1024 / 1024).toFixed(2)} MB (${((1 - stats.newSize / stats.originalSize) * 100).toFixed(1)}%)`);
  console.log(`耗时: ${elapsedTime} 秒`);
  
  if (stats.errors.length > 0) {
    console.log('\n失败文件列表:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  console.log('\n下一步:');
  console.log('1. 运行 update-image-references.js 更新代码中的图片引用');
  console.log('2. 测试应用确保所有图片正常显示');
}

// 运行主函数
main().catch(error => {
  console.error('转换过程出错:', error);
  process.exit(1);
});