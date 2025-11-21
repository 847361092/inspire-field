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

    console.log('=== Artworks API ===');
    console.log('Environment:', process.env.VERCEL ? 'Vercel' : 'Local');

    // 同时从两个源获取作品
    const [filesystemArtworks, blobArtworks] = await Promise.all([
      loadManifestArtworks(baseUrl),
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

// 从清单文件加载作品
async function loadManifestArtworks(baseUrl = '') {
  try {
    // 尝试多个可能的清单文件路径
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'artworks-manifest.json'),
      path.join(__dirname, '..', 'public', 'artworks-manifest.json'),
      path.join(process.cwd(), 'artworks-manifest.json'),
    ];

    let manifestData = null;

    for (const manifestPath of possiblePaths) {
      try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        manifestData = JSON.parse(content);
        console.log('✅ Loaded manifest from:', manifestPath);
        console.log('   Generated at:', manifestData.generatedAt);
        break;
      } catch (error) {
        console.log('❌ Manifest not found at:', manifestPath);
      }
    }

    if (!manifestData || !manifestData.artworks) {
      console.warn('⚠️  No manifest file found, returning empty array');
      return [];
    }

    // 为所有路径添加 baseUrl 前缀
    const artworks = manifestData.artworks.map(artwork => ({
      ...artwork,
      images: artwork.images?.map(img => `${baseUrl}${img}`) || [],
      thumbnail: artwork.thumbnail ? `${baseUrl}${artwork.thumbnail}` : null,
      authorAvatar: artwork.authorAvatar ? `${baseUrl}${artwork.authorAvatar}` : null,
    }));

    return artworks;
  } catch (error) {
    console.error('❌ Load manifest error:', error);
    return [];
  }
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
