import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取查询参数
    const { category, page = 1, limit = 12, search, featured, sort = 'latest' } = req.query;

    // 扫描 public/artworks 目录
    const artworksDir = path.join(process.cwd(), 'public', 'artworks');
    const artworks = await scanArtworksDirectory(artworksDir);

    // 筛选作品
    let filteredArtworks = artworks;

    // 分类筛选
    if (category && category !== 'all') {
      filteredArtworks = filteredArtworks.filter(a => a.category === category);
    }

    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArtworks = filteredArtworks.filter(a =>
        a.title?.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower) ||
        a.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 精选筛选
    if (featured === 'true') {
      filteredArtworks = filteredArtworks.filter(a => a.isFeatured === true);
    }

    // 排序
    if (sort === 'latest') {
      filteredArtworks.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    } else if (sort === 'popular') {
      filteredArtworks.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'oldest') {
      filteredArtworks.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });
    }

    // 分页
    const total = filteredArtworks.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedArtworks = filteredArtworks.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      artworks: paginatedArtworks,
      total,
      page: pageNum,
      pageSize: limitNum,
      totalPages: Math.ceil(total / limitNum),
      source: 'filesystem'
    });

  } catch (error) {
    console.error('Get artworks error:', error);

    // 发生错误时返回空数组
    return res.status(200).json({
      success: true,
      artworks: [],
      total: 0,
      source: 'error',
      error: error.message
    });
  }
}

// 扫描作品目录
async function scanArtworksDirectory(artworksDir) {
  const artworks = [];

  try {
    // 读取所有分类文件夹
    const categories = await fs.readdir(artworksDir);

    for (const category of categories) {
      const categoryPath = path.join(artworksDir, category);
      const stats = await fs.stat(categoryPath);

      if (!stats.isDirectory()) continue;

      // 读取分类下的所有作品文件夹
      const workFolders = await fs.readdir(categoryPath);

      for (const workFolder of workFolders) {
        const workPath = path.join(categoryPath, workFolder);
        const workStats = await fs.stat(workPath);

        if (!workStats.isDirectory()) continue;

        // 扫描作品文件夹中的文件
        const files = await fs.readdir(workPath);

        // 查找图片
        const images = files
          .filter(f => f.match(/^image_\d+\.webp$/))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
          })
          .map(f => `/artworks/${category}/${workFolder}/${f}`);

        if (images.length === 0) continue; // 没有图片的文件夹跳过

        // 查找作者头像
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
            console.warn(`Failed to read markdown: ${mdFile}`, error);
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
          isFeatured: isFeatured
        };

        artworks.push(artwork);
      }
    }
  } catch (error) {
    console.error('Scan directory error:', error);
  }

  return artworks;
}

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
