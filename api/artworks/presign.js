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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, workName, files, metadata } = req.body;

    // 验证必填字段
    if (!category || !workName || !files || files.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: category, workName, files'
      });
    }

    // 生成作品 ID
    const artworkId = `${category}-${workName}`;
    const basePath = `artworks/${category}/${workName}`;

    // 准备上传信息
    const uploadUrls = files.map(file => ({
      fileName: file.name,
      blobPath: `${basePath}/${file.name}`,
      size: file.size,
      type: file.type
    }));

    // 生成完整的元数据
    const fullMetadata = {
      id: artworkId,
      ...metadata,
      category,
      images: files
        .filter(f => f.name.startsWith('image_'))
        .map(f => `${basePath}/${f.name}`),
      imageCount: files.filter(f => f.name.startsWith('image_')).length,
      thumbnail: files.find(f => f.name.startsWith('image_'))
        ? `${basePath}/${files.find(f => f.name.startsWith('image_')).name}`
        : null,
      markdownFile: files.find(f => f.name.endsWith('.md'))
        ? `${basePath}/${files.find(f => f.name.endsWith('.md')).name}`
        : null,
      authorAvatar: files.find(f => f.name === 'author.jpg')
        ? `${basePath}/author.jpg`
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'published',
      views: 0,
      likes: 0
    };

    return res.status(200).json({
      success: true,
      uploadUrls,
      metadata: fullMetadata,
      artworkId
    });

  } catch (error) {
    console.error('Presign error:', error);
    return res.status(500).json({
      error: 'Failed to prepare upload',
      message: error.message
    });
  }
}
