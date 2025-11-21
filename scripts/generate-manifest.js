/**
 * 构建时生成作品清单
 * 扫描 public/artworks 目录，生成 JSON 清单文件
 * 用于 Vercel Serverless Functions 读取
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const ARTWORKS_DIR = path.join(PROJECT_ROOT, 'public', 'artworks');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'public', 'artworks-manifest.json');

// 获取分类标签
function getCategoryLabel(category) {
  const labels = {
    mecha: '机甲设计',
    concept: '概念设计',
    illustration: '插画艺术',
    '77777': '特别作品',
    '新作品分类': '新作品'
  };
  return labels[category] || category;
}

// 扫描作品目录
async function scanArtworksDirectory() {
  const artworks = [];

  try {
    // 检查目录是否存在
    try {
      await fs.access(ARTWORKS_DIR);
    } catch (error) {
      console.warn(`⚠️  Artworks directory not found: ${ARTWORKS_DIR}`);
      return artworks;
    }

    // 读取所有分类文件夹
    const categories = await fs.readdir(ARTWORKS_DIR);
    console.log(`📂 Found ${categories.length} categories`);

    for (const category of categories) {
      const categoryPath = path.join(ARTWORKS_DIR, category);
      const stats = await fs.stat(categoryPath);

      if (!stats.isDirectory()) continue;

      // 读取分类下的所有作品文件夹
      const workFolders = await fs.readdir(categoryPath);
      console.log(`  📁 ${category}: ${workFolders.length} folders`);

      for (const workFolder of workFolders) {
        const workPath = path.join(categoryPath, workFolder);
        const workStats = await fs.stat(workPath);

        if (!workStats.isDirectory()) continue;

        // 扫描作品文件夹中的文件
        const files = await fs.readdir(workPath);

        // 查找图片 - 使用相对路径（前端会拼接基础URL）
        const images = files
          .filter(f => f.match(/^image_\d+\.webp$/))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
          })
          .map(f => `/artworks/${category}/${workFolder}/${f}`);

        if (images.length === 0) continue; // 没有图片的文件夹跳过

        // 查找作者头像 - 使用相对路径
        const authorAvatar = files.find(f => f === 'author.jpg')
          ? `/artworks/${category}/${workFolder}/author.jpg`
          : null;

        // 查找 Markdown 文件
        const mdFile = files.find(f => f.endsWith('.md'));
        let title = workFolder;
        let description = '';
        let isFeatured = false;

        if (mdFile) {
          try {
            const mdPath = path.join(workPath, mdFile);
            const mdContent = await fs.readFile(mdPath, 'utf-8');

            // 解析 YAML front matter
            const frontMatterMatch = mdContent.match(/^---\s*\n([\s\S]*?)\n---/);
            if (frontMatterMatch) {
              const frontMatter = frontMatterMatch[1];

              // 提取标题
              const titleMatch = frontMatter.match(/title:\s*(.+)/);
              if (titleMatch) {
                title = titleMatch[1].trim();
              }

              // 提取 featured 标记
              const featuredMatch = frontMatter.match(/featured:\s*(true|false)/i);
              if (featuredMatch && featuredMatch[1].toLowerCase() === 'true') {
                isFeatured = true;
              }
            }

            // 提取正文作为描述（去掉 front matter 后的第一段）
            const contentWithoutFM = mdContent.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
            const firstParagraph = contentWithoutFM.trim().split('\n\n')[0];
            description = firstParagraph.replace(/^#+\s*/, '').trim().substring(0, 200);
          } catch (error) {
            console.warn(`    ⚠️  Failed to read markdown: ${mdFile}`, error.message);
          }
        }

        // 检查是否有 .featured 文件
        if (!isFeatured && files.includes('.featured')) {
          isFeatured = true;
        }

        // 构造作品对象
        const artwork = {
          id: `${category}-${workFolder}`,
          title: title || workFolder,
          description: description || `这是一个${getCategoryLabel(category)}作品`,
          category: category,
          authorName: '作者',
          authorEmail: 'author@example.com',
          authorAvatar: authorAvatar,
          images: images,
          thumbnail: images[0],
          createdAt: workStats.birthtime.toISOString(),
          updatedAt: workStats.mtime.toISOString(),
          featured: isFeatured,
          status: 'published',
          views: Math.floor(Math.random() * 10000) + 1000,
          likes: Math.floor(Math.random() * 1000) + 100,
          isFeatured: isFeatured,
          source: 'filesystem'
        };

        artworks.push(artwork);
        console.log(`    ✅ ${artwork.id}: ${images.length} images`);
      }
    }
  } catch (error) {
    console.error('❌ Scan directory error:', error);
  }

  return artworks;
}

// 主函数
async function main() {
  console.log('🚀 Generating artworks manifest...\n');
  console.log(`📂 Artworks directory: ${ARTWORKS_DIR}`);
  console.log(`📄 Output file: ${OUTPUT_FILE}\n`);

  const artworks = await scanArtworksDirectory();

  console.log(`\n✅ Found ${artworks.length} artworks`);

  // 写入清单文件
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify({ artworks, generatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );

  console.log(`✅ Manifest saved to ${OUTPUT_FILE}`);
  console.log('🎉 Done!\n');
}

// 执行
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
