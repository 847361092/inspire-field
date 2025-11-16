const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());
app.use(express.json());

// 静态文件服务 - 直接提供 public 目录下的文件
app.use('/artworks', express.static(path.join(__dirname, '..', 'public', 'artworks')));

// API路由：获取作品列表
app.get('/api/artworks', async (req, res) => {
  try {
    const artworksDir = path.join(__dirname, '..', 'public', 'artworks');
    const categories = await fs.readdir(artworksDir);
    const artworks = [];

    for (const category of categories) {
      const categoryPath = path.join(artworksDir, category);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory()) {
        const works = await fs.readdir(categoryPath);
        
        for (const work of works) {
          const workPath = path.join(categoryPath, work);
          const workStat = await fs.stat(workPath);
          
          if (workStat.isDirectory()) {
            // 获取文件夹的创建时间（使用修改时间作为近似值）
            const folderCreatedTime = workStat.mtime || workStat.birthtime || new Date();
            
            // 查找该作品目录下的所有图片
            const files = await fs.readdir(workPath);
            const images = files
              .filter(file => file.startsWith('image_') && file.endsWith('.webp'))
              .sort((a, b) => {
                const numA = parseInt(a.match(/image_(\d+)/)?.[1] || '0');
                const numB = parseInt(b.match(/image_(\d+)/)?.[1] || '0');
                return numA - numB;
              })
              .map(file => `/artworks/${category}/${encodeURIComponent(work)}/${file}`);
            
            // 读取MD文件获取元数据
            const mdFile = files.find(file => file.endsWith('.md'));
            let mdFileName = mdFile || null;  // 保存实际的MD文件名
            let title = work;
            let description = '';
            let authorName = '未知作者';
            let authorAvatar = null;
            let createdAt = folderCreatedTime.toISOString();  // 使用文件夹时间
            let isFeatured = false; // 精选标记
            
            // 检查是否有作者头像文件
            const hasAuthorAvatar = files.includes('author.jpg');
            if (hasAuthorAvatar) {
              authorAvatar = `/artworks/${category}/${encodeURIComponent(work)}/author.jpg`;
            }
            
            if (mdFile) {
              try {
                const mdContent = await fs.readFile(path.join(workPath, mdFile), 'utf-8');
                
                // 首先尝试解析YAML frontmatter
                const frontmatterMatch = mdContent.match(/^---\n([\s\S]*?)\n---/);
                if (frontmatterMatch) {
                  const frontmatter = frontmatterMatch[1];
                  // 提取title
                  const titleMatch = frontmatter.match(/title:\s*(.+)/);
                  if (titleMatch) title = titleMatch[1].trim();
                  // 提取description
                  const descMatch = frontmatter.match(/description:\s*(.+)/);
                  if (descMatch) description = descMatch[1].trim();
                  // 提取author name - 更准确的正则匹配
                  const authorMatch = frontmatter.match(/author:\s*\n?\s*name:\s*(.+)/);
                  if (authorMatch) {
                    authorName = authorMatch[1].trim();
                  }
                  // 提取创建时间（优先使用MD文件中的时间）
                  const createdAtMatch = frontmatter.match(/createdAt:\s*(.+)/);
                  if (createdAtMatch) {
                    const parsedDate = createdAtMatch[1].trim();
                    // 如果是有效日期，使用它；否则保留文件夹时间
                    try {
                      const date = new Date(parsedDate);
                      if (!isNaN(date.getTime())) {
                        createdAt = date.toISOString();
                      }
                    } catch (e) {
                      // 保留文件夹时间
                    }
                  }
                  // 提取featured标记
                  const featuredMatch = frontmatter.match(/featured:\s*(true|false)/i);
                  if (featuredMatch && featuredMatch[1].toLowerCase() === 'true') {
                    isFeatured = true;
                  }
                } else {
                  // 如果没有frontmatter，尝试解析Markdown格式
                  // 提取标题（# 开头的行）
                  const titleMdMatch = mdContent.match(/^#\s+(.+)$/m);
                  if (titleMdMatch) title = titleMdMatch[1].trim();
                  
                  // 提取作者（- **作者**: xxx 格式）
                  const authorMdMatch = mdContent.match(/^-\s*\*\*作者\*\*:\s*(.+)$/m);
                  if (authorMdMatch) {
                    authorName = authorMdMatch[1].trim();
                  }
                  
                  // 提取创建时间
                  const createdAtMdMatch = mdContent.match(/^-\s*\*\*创建时间\*\*:\s*(.+)$/m);
                  if (createdAtMdMatch) {
                    // 转换日期格式
                    const dateStr = createdAtMdMatch[1].trim();
                    // 尝试解析各种日期格式
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                      createdAt = date.toISOString();
                    }
                  }
                  
                  // 提取描述（## 作品描述 下面的段落）
                  const descMdMatch = mdContent.match(/##\s*作品描述\s*\n+([^\n#]+)/);
                  if (descMdMatch) {
                    description = descMdMatch[1].trim();
                  }
                }
              } catch (err) {
                console.error(`读取MD文件失败: ${mdFile}`, err);
              }
            }
            
            // 如果没有通过front matter设置精选，检查是否有.featured文件
            if (!isFeatured) {
              const hasFeaturedFile = files.includes('.featured');
              if (hasFeaturedFile) {
                isFeatured = true;
              }
            }
            
            if (images.length > 0) {
              artworks.push({
                id: `${category}-${work}`,
                title: title,
                description: description,
                category: category,
                authorName: authorName,  // 直接返回作者名
                authorAvatar: authorAvatar,  // 返回作者头像路径
                mdFileName: mdFileName,  // 返回实际的MD文件名
                images: images,
                imageCount: images.length,  // 添加图片数量
                thumbnail: images[0],
                createdAt: createdAt,
                isFeatured: isFeatured  // 使用真实的精选标记
              });
            }
          }
        }
      }
    }

    // 按创建时间倒序排序（最新的在前）
    artworks.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;  // 倒序：新的在前
    });
    
    console.log('🔍 作品排序结果（前5个）:', artworks.slice(0, 5).map(a => ({
      title: a.title,
      createdAt: a.createdAt,
      category: a.category
    })));
    
    res.json({
      success: true,
      artworks: artworks,
      source: 'local',
      totalCount: artworks.length
    });
  } catch (error) {
    console.error('获取作品列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API路由：获取分类列表
app.get('/api/categories', async (req, res) => {
  try {
    const artworksDir = path.join(__dirname, '..', 'public', 'artworks');
    const entries = await fs.readdir(artworksDir);
    const categories = [];

    for (const entry of entries) {
      const entryPath = path.join(artworksDir, entry);
      const stat = await fs.stat(entryPath);
      
      if (stat.isDirectory()) {
        // 计算该分类下的作品数量
        const works = await fs.readdir(entryPath);
        let workCount = 0;
        
        for (const work of works) {
          const workPath = path.join(entryPath, work);
          const workStat = await fs.stat(workPath);
          if (workStat.isDirectory()) {
            workCount++;
          }
        }

        categories.push({
          id: entry,
          name: getCategoryName(entry),
          count: workCount
        });
      }
    }

    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 分类名称映射
function getCategoryName(id) {
  const categoryNames = {
    'mecha': '机甲设计',
    'concept': '概念设计',
    'illustration': '插画艺术'
  };
  return categoryNames[id] || id;
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`✨ 图片服务器已启动: http://localhost:${PORT}`);
  console.log(`📁 静态文件路径: /artworks/...`);
  console.log(`🔌 API接口:`);
  console.log(`   - GET /api/artworks - 获取作品列表`);
  console.log(`   - GET /api/categories - 获取分类列表`);
});