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
    // 获取所有artworks下的内容
    const { blobs } = await list({
      prefix: 'artworks/',
      limit: 1000
    });

    // 从路径中提取分类
    const categoriesMap = new Map();
    
    for (const blob of blobs) {
      // 解析路径: artworks/category/workname/file
      const pathParts = blob.pathname.split('/');
      if (pathParts.length >= 3) {
        const category = pathParts[1];
        if (category && category !== 'artworks') {
          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, new Set());
          }
          // 添加作品名称到分类
          if (pathParts[2]) {
            categoriesMap.get(category).add(pathParts[2]);
          }
        }
      }
    }

    // 转换为数组格式
    const categories = [];
    const categoryLabels = {
      'mecha': '机甲设计',
      'concept': '概念艺术',
      'illustration': '插画作品'
    };

    for (const [key, works] of categoriesMap) {
      categories.push({
        value: key,
        label: categoryLabels[key] || key,
        count: works.size
      });
    }

    // 如果没有分类，返回默认分类
    if (categories.length === 0) {
      return res.status(200).json({
        success: true,
        categories: [
          { value: 'mecha', label: '机甲设计', count: 0 },
          { value: 'concept', label: '概念艺术', count: 0 },
          { value: 'illustration', label: '插画作品', count: 0 }
        ],
        source: 'default'
      });
    }

    // 按作品数量排序
    categories.sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      categories,
      source: 'blob'
    });

  } catch (error) {
    console.error('Get categories error:', error);
    
    // 发生错误时返回默认分类
    return res.status(200).json({
      success: true,
      categories: [
        { value: 'mecha', label: '机甲设计', count: 0 },
        { value: 'concept', label: '概念艺术', count: 0 },
        { value: 'illustration', label: '插画作品', count: 0 }
      ],
      source: 'default',
      error: error.message
    });
  }
}