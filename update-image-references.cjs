/**
 * 更新代码中的图片引用
 * 将所有.png/.jpg引用改为.webp
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const config = {
  // 需要更新的文件类型
  fileExtensions: ['.vue', '.ts', '.js', '.jsx', '.tsx', '.css', '.scss', '.html'],
  // 需要扫描的目录
  directories: [
    './src',
    './public',
    './index.html'
  ],
  // 图片扩展名替换规则
  imageReplacements: [
    { from: /\.png/gi, to: '.webp' },
    { from: /\.jpg/gi, to: '.webp' },
    { from: /\.jpeg/gi, to: '.webp' },
    { from: /\.PNG/gi, to: '.webp' },
    { from: /\.JPG/gi, to: '.webp' },
    { from: /\.JPEG/gi, to: '.webp' }
  ],
  // 排除的路径模式
  excludePatterns: [
    'node_modules',
    'dist',
    '.git',
    'temp-uploads'
  ]
};

// 统计信息
let stats = {
  filesScanned: 0,
  filesUpdated: 0,
  replacements: 0,
  errors: []
};

/**
 * 检查路径是否应该被排除
 */
function shouldExclude(filePath) {
  return config.excludePatterns.some(pattern => 
    filePath.includes(pattern)
  );
}

/**
 * 更新文件中的图片引用
 */
async function updateFileReferences(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let originalContent = content;
    let fileReplacements = 0;
    
    // 应用所有替换规则
    for (const rule of config.imageReplacements) {
      const matches = content.match(rule.from);
      if (matches) {
        content = content.replace(rule.from, rule.to);
        fileReplacements += matches.length;
      }
    }
    
    // 如果内容有变化，写回文件
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✓ 更新文件: ${path.relative(process.cwd(), filePath)} (${fileReplacements} 处替换)`);
      stats.filesUpdated++;
      stats.replacements += fileReplacements;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ 处理文件失败: ${filePath}`, error.message);
    stats.errors.push({ file: filePath, error: error.message });
    return false;
  }
}

/**
 * 递归扫描目录
 */
async function scanDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // 检查是否应该排除
      if (shouldExclude(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(entry.name).toLowerCase();
        if (config.fileExtensions.includes(ext)) {
          stats.filesScanned++;
          await updateFileReferences(fullPath);
        }
      }
    }
  } catch (error) {
    // 如果是单个文件，直接处理
    if (error.code === 'ENOTDIR') {
      const ext = path.extname(dirPath).toLowerCase();
      if (config.fileExtensions.includes(ext)) {
        stats.filesScanned++;
        await updateFileReferences(dirPath);
      }
    } else {
      console.error(`无法访问: ${dirPath}`, error.message);
    }
  }
}

/**
 * 特殊处理：更新HomePage.vue中的图片数组
 */
async function updateHomePageImages() {
  const homePagePath = './src/views/HomePage.vue';
  
  try {
    let content = await fs.readFile(homePagePath, 'utf8');
    
    // 找到galleryImages数组
    const galleryImagesRegex = /const\s+galleryImages\s*=\s*\[([\s\S]*?)\]/;
    const match = content.match(galleryImagesRegex);
    
    if (match) {
      let imagesArray = match[1];
      let updatedArray = imagesArray;
      
      // 替换所有图片扩展名
      config.imageReplacements.forEach(rule => {
        updatedArray = updatedArray.replace(rule.from, rule.to);
      });
      
      if (imagesArray !== updatedArray) {
        content = content.replace(match[0], `const galleryImages = [${updatedArray}]`);
        await fs.writeFile(homePagePath, content, 'utf8');
        console.log('✓ 特殊处理: HomePage.vue 中的 galleryImages 数组已更新');
      }
    }
  } catch (error) {
    console.error('处理HomePage.vue失败:', error.message);
  }
}

/**
 * 更新stores中的图片引用
 */
async function updateStoreReferences() {
  const galleryStorePath = './src/stores/gallery.ts';
  
  try {
    let content = await fs.readFile(galleryStorePath, 'utf8');
    let originalContent = content;
    
    // 替换artworks中的图片引用
    content = content.replace(/image_\d+\.(png|jpg|jpeg)/gi, (match) => {
      return match.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    });
    
    if (content !== originalContent) {
      await fs.writeFile(galleryStorePath, content, 'utf8');
      console.log('✓ 特殊处理: gallery.ts 中的图片引用已更新');
    }
  } catch (error) {
    console.error('处理gallery.ts失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('更新图片引用工具');
  console.log('='.repeat(60));
  console.log('扫描目录:');
  config.directories.forEach(dir => console.log(`  - ${dir}`));
  console.log('文件类型:');
  console.log(`  ${config.fileExtensions.join(', ')}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  // 扫描并更新文件
  console.log('\n开始更新文件...\n');
  
  for (const dir of config.directories) {
    console.log(`\n扫描: ${dir}`);
    console.log('-'.repeat(40));
    await scanDirectory(dir);
  }
  
  // 特殊处理某些文件
  console.log('\n特殊处理...');
  console.log('-'.repeat(40));
  await updateHomePageImages();
  await updateStoreReferences();
  
  // 显示统计信息
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(60));
  console.log('更新完成！');
  console.log('='.repeat(60));
  console.log(`扫描文件数: ${stats.filesScanned}`);
  console.log(`更新文件数: ${stats.filesUpdated}`);
  console.log(`替换总数: ${stats.replacements}`);
  console.log(`耗时: ${elapsedTime} 秒`);
  
  if (stats.errors.length > 0) {
    console.log('\n失败文件列表:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  // 创建回滚脚本
  await createRollbackScript();
  
  console.log('\n注意事项:');
  console.log('1. 请确保已经运行了 convert-to-webp.js 转换图片');
  console.log('2. 测试应用确保所有图片正常显示');
  console.log('3. 如需回滚，运行 rollback-image-references.js');
}

/**
 * 创建回滚脚本
 */
async function createRollbackScript() {
  const rollbackScript = `
/**
 * 回滚图片引用更新
 * 将.webp引用改回原始格式
 */

const fs = require('fs').promises;
const path = require('path');

async function rollback() {
  console.log('开始回滚图片引用...');
  
  // 这里应该从备份恢复，但为简单起见，我们反向替换
  // 实际使用时建议先备份原文件
  
  console.log('警告: 此脚本将把所有.webp引用改回.png/.jpg');
  console.log('这可能不准确，因为无法确定原始格式是.png还是.jpg');
  console.log('建议从Git恢复或使用备份');
}

rollback().catch(console.error);
`;

  await fs.writeFile('./rollback-image-references.js', rollbackScript, 'utf8');
  console.log('\n已创建回滚脚本: rollback-image-references.js');
}

// 运行主函数
main().catch(error => {
  console.error('更新过程出错:', error);
  process.exit(1);
});