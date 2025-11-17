import { list } from '@vercel/blob';

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
    // 获取所有存储的作品元数据
    const { blobs } = await list({
      prefix: 'artworks/',
      limit: 1000
    });

    // 筛选出metadata.json文件
    const metadataFiles = blobs.filter(blob => blob.pathname.endsWith('metadata.json'));
    
    // 获取所有作品数据
    const artworks = [];
    for (const metaFile of metadataFiles) {
      try {
        // 获取元数据内容
        const response = await fetch(metaFile.url);
        const metadata = await response.json();
        
        // 添加缩略图（使用第一张图片）
        if (metadata.images && metadata.images.length > 0) {
          metadata.thumbnail = metadata.images[0];
        }
        
        // 添加是否推荐标记
        const pathParts = metaFile.pathname.split('/');
        const folderName = pathParts[pathParts.length - 2];
        
        // 方式1：检查markdown文件中的front matter featured标记
        let isFeatured = false;
        
        // 尝试查找对应的markdown文件
        const markdownFile = blobs.find(blob => 
          blob.pathname.includes(`${folderName}/${folderName}.md`) || 
          blob.pathname.includes(`${folderName}/index.md`) ||
          blob.pathname.match(new RegExp(`${folderName}/.*\\.md$`))
        );
        
        if (markdownFile) {
          try {
            const markdownResponse = await fetch(markdownFile.url);
            const markdownContent = await markdownResponse.text();
            
            // 检查是否有YAML front matter
            const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---/;
            const frontMatterMatch = markdownContent.match(frontMatterRegex);
            
            if (frontMatterMatch) {
              const frontMatter = frontMatterMatch[1];
              // 简单解析featured字段
              const featuredMatch = frontMatter.match(/featured:\s*(true|false)/i);
              if (featuredMatch && featuredMatch[1].toLowerCase() === 'true') {
                isFeatured = true;
              }
            }
          } catch (error) {
            console.warn(`解析markdown文件失败: ${markdownFile.pathname}`, error);
          }
        }
        
        // 方式2：如果front matter中没有设置，检查是否有.featured文件
        if (!isFeatured) {
          const featuredFileCheck = blobs.find(blob => 
            blob.pathname === `artworks/${metadata.category}/${folderName}/.featured`
          );
          isFeatured = !!featuredFileCheck;
        }
        
        metadata.isFeatured = isFeatured;
        
        artworks.push(metadata);
      } catch (error) {
        console.error(`Error loading metadata from ${metaFile.pathname}:`, error);
      }
    }

    // 如果没有作品，返回模拟数据（保持与本地API一致的结构）
    if (artworks.length === 0) {
      const mockArtworks = generateMockArtworks();
      return res.status(200).json({
        success: true,
        artworks: mockArtworks,
        source: 'mock'
      });
    }

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
      source: 'blob'
    });

  } catch (error) {
    console.error('Get artworks error:', error);
    
    // 发生错误时返回模拟数据
    const mockArtworks = generateMockArtworks();
    return res.status(200).json({
      success: true,
      artworks: mockArtworks,
      source: 'mock',
      error: error.message
    });
  }
}

// 生成模拟数据函数（与本地API结构保持一致）
function generateMockArtworks() {
  const mockArtworks = [];

  // 生成18个作品，与本地数据对应
  const works = [
    { name: '作品001', category: 'mecha' },
    { name: '作品002', category: 'mecha' },
    { name: '作品003', category: 'mecha' },
    { name: '作品004', category: 'concept' },
    { name: '作品005', category: 'concept' },
    { name: '作品006', category: 'concept' },
    { name: '作品007', category: 'illustration' },
    { name: '作品008', category: 'illustration' },
    { name: '作品009', category: 'illustration' },
    { name: '作品010', category: 'mecha' },
    { name: '作品011', category: 'mecha' },
    { name: '作品012', category: 'concept' },
    { name: '作品013', category: 'concept' },
    { name: '作品014', category: 'illustration' },
    { name: '作品015', category: 'illustration' },
    { name: '作品016', category: 'mecha' },
    { name: '作品017', category: 'concept' },
    { name: '作品018', category: 'illustration' }
  ];

  works.forEach((work, index) => {
    const imageCount = work.name === '作品018' ? 4 : 5; // 作品018只有4张图
    const images = [];

    // 生成图片路径（需要与实际部署路径匹配）
    for (let i = 1; i <= imageCount; i++) {
      images.push(`/artworks/${work.category}/${work.name}/image_${i}.webp`);
    }

    mockArtworks.push({
      id: `${work.category}-${work.name}`,
      title: `${work.name} - ${getCategoryLabel(work.category)}`,
      description: `这是一个精心设计的${getCategoryLabel(work.category)}作品`,
      category: work.category,
      authorName: `设计师${index + 1}`,
      authorEmail: `designer${index + 1}@example.com`,
      authorAvatar: `/artworks/${work.category}/${work.name}/author.jpg`,
      images: images,
      thumbnail: images[0], // 第一张图作为缩略图
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
      featured: index % 6 === 0, // 每6个作品中有1个精选
      status: 'published',
      views: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 1000) + 100,
      isFeatured: index % 6 === 0
    });
  });

  return mockArtworks;
}

// 获取分类标签
function getCategoryLabel(category) {
  const labels = {
    mecha: '机甲设计',
    concept: '概念设计',
    illustration: '插画艺术'
  };
  return labels[category] || category;
}