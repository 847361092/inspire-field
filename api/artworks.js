import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { list } from '@vercel/blob';

// ES Modules 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // 获取当前部署的基础 URL
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
    const baseUrl = `${protocol}://${host}`;

    console.log('Base URL:', baseUrl);

    // 获取查询参数
    const { category, page = 1, limit = 12, search, featured, sort = 'latest' } = req.query;

    // 详细诊断日志
    console.log('=== Artworks API Debug ===');
    console.log('Environment:', process.env.VERCEL ? 'Vercel' : 'Local');
    console.log('CWD:', process.cwd());
    console.log('__dirname:', __dirname);

    // 尝试多个可能的路径（适配 Vercel 部署环境）
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'artworks'),        // 优先尝试标准路径
      path.join(__dirname, '..', 'public', 'artworks'),      // 相对于 api 目录
      path.join(process.cwd(), 'api', 'public', 'artworks'), // 备用路径
    ];

    let artworksPath = null;
    let pathErrors = [];

    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        artworksPath = p;
        console.log('✅ Found artworks path:', p);

        // 读取目录内容用于诊断
        const contents = await fs.readdir(p);
        console.log('Directory contents:', contents);
        break;
      } catch (e) {
        pathErrors.push({ path: p, error: e.message });
        console.log('❌ Path not accessible:', p, e.message);
      }
    }

    if (!artworksPath) {
      console.error('Failed to find artworks directory. Tried paths:', pathErrors);
    }

    // 同时从两个源获取作品
    const [filesystemArtworks, blobArtworks] = await Promise.all([
      artworksPath ? scanArtworksDirectory(artworksPath, baseUrl) : Promise.resolve([]),
      fetchBlobArtworks()
    ]);

    console.log('Filesystem artworks count:', filesystemArtworks.length);
    console.log('Blob artworks count:', blobArtworks.length);

    // 合并两个源的作品
    const artworks = [...filesystemArtworks, ...blobArtworks];

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
async function scanArtworksDirectory(artworksDir, baseUrl = '') {
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

        // 查找图片 - 使用完整 URL
        const images = files
          .filter(f => f.match(/^image_\d+\.webp$/))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
          })
          .map(f => `${baseUrl}/artworks/${category}/${workFolder}/${f}`);

        if (images.length === 0) continue; // 没有图片的文件夹跳过

        // 查找作者头像 - 使用完整 URL
        const authorAvatar = files.find(f => f === 'author.jpg')
          ? `${baseUrl}/artworks/${category}/${workFolder}/author.jpg`
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

// 从 Vercel Blob 获取用户上传的作品
async function fetchBlobArtworks() {
  const artworks = [];

  try {
    // 尝试读取 Blob 中的作品
    const { blobs } = await list({
      prefix: 'artworks/',
      limit: 1000
    });

    // 筛选出 metadata.json 文件
    const metadataFiles = blobs.filter(blob => blob.pathname.endsWith('metadata.json'));

    for (const metaFile of metadataFiles) {
      try {
        // 获取元数据
        const response = await fetch(metaFile.url);
        const metadata = await response.json();
        const blobOrigin = new URL(metaFile.url).origin;
        const toAbsoluteUrl = (path) => {
          if (!path) return null;
          if (typeof path === 'string' && /^https?:\/\//i.test(path)) {
            return path;
          }
          const normalized = typeof path === 'string' ? path.replace(/^\/+/, '') : '';
          return normalized ? `${blobOrigin}/${normalized}` : null;
        };

        // 处理图片 URL（支持字符串和对象格式）
        const extractUrl = (item) => {
          if (!item) return null;
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item.url) return item.url; // 提取对象中的 url 属性
          return null;
        };

        // 添加缩略图
        if (metadata.images && metadata.images.length > 0) {
          metadata.images = metadata.images
            .map((img) => {
              const url = extractUrl(img);
              return url ? toAbsoluteUrl(url) || url : null;
            })
            .filter(Boolean);

          const thumbnailUrl = extractUrl(metadata.thumbnail);
          metadata.thumbnail = thumbnailUrl ? toAbsoluteUrl(thumbnailUrl) || thumbnailUrl : metadata.images[0];
        } else if (metadata.thumbnail) {
          const thumbnailUrl = extractUrl(metadata.thumbnail);
          metadata.thumbnail = thumbnailUrl ? toAbsoluteUrl(thumbnailUrl) : null;
        }
        if (metadata.authorAvatar) {
          const avatarUrl = extractUrl(metadata.authorAvatar);
          metadata.authorAvatar = avatarUrl ? toAbsoluteUrl(avatarUrl) : null;
        }
        if (metadata.markdownFile) {
          const markdownUrl = extractUrl(metadata.markdownFile);
          metadata.markdownFile = markdownUrl ? toAbsoluteUrl(markdownUrl) : null;
        }
        if (!metadata.imageCount && metadata.images) {
          metadata.imageCount = metadata.images.length;
        }

        // 检查是否精选
        const pathParts = metaFile.pathname.split('/');
        const folderName = pathParts[pathParts.length - 2];

        let isFeatured = false;
        const featuredFile = blobs.find(blob =>
          blob.pathname === `artworks/${metadata.category}/${folderName}/.featured`
        );
        isFeatured = !!featuredFile;

        metadata.isFeatured = isFeatured || metadata.featured || false;
        metadata.source = 'blob'; // 标记来源

        artworks.push(metadata);
      } catch (error) {
        console.error(`Error loading blob metadata from ${metaFile.pathname}:`, error);
      }
    }
  } catch (error) {
    // Blob 读取失败不影响文件系统的作品显示
    console.warn('Blob fetch failed, using filesystem only:', error.message);
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
