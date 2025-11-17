import { list, del, put } from '@vercel/blob';

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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing artwork ID' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(id, res);
    } else if (req.method === 'PUT') {
      return await handlePut(id, req.body, res);
    } else if (req.method === 'DELETE') {
      return await handleDelete(id, req.query.soft === 'true', res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error handling ${req.method} request for ${id}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 获取单个作品
async function handleGet(id, res) {
  const { blobs } = await list({ prefix: 'artworks/', limit: 1000 });

  // 查找对应的 metadata.json
  const metadataFile = blobs.find(b =>
    b.pathname.includes(id) && b.pathname.endsWith('metadata.json')
  );

  if (!metadataFile) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  const response = await fetch(metadataFile.url);
  const metadata = await response.json();

  return res.status(200).json({
    success: true,
    artwork: metadata
  });
}

// 更新作品
async function handlePut(id, updates, res) {
  const { blobs } = await list({ prefix: 'artworks/', limit: 1000 });

  // 查找现有 metadata.json
  const metadataFile = blobs.find(b =>
    b.pathname.includes(id) && b.pathname.endsWith('metadata.json')
  );

  if (!metadataFile) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  // 读取现有元数据
  const response = await fetch(metadataFile.url);
  const metadata = await response.json();

  // 合并更新
  const updatedMetadata = {
    ...metadata,
    ...updates,
    id: metadata.id, // 保持 ID 不变
    createdAt: metadata.createdAt, // 保持创建时间
    updatedAt: new Date().toISOString() // 更新修改时间
  };

  // 上传更新后的 metadata.json
  await put(
    metadataFile.pathname,
    JSON.stringify(updatedMetadata, null, 2),
    {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false
    }
  );

  return res.status(200).json({
    success: true,
    artwork: updatedMetadata
  });
}

// 删除作品
async function handleDelete(id, soft, res) {
  const { blobs } = await list({ prefix: 'artworks/', limit: 1000 });

  // 查找作品所有文件
  const artworkFiles = blobs.filter(b => b.pathname.includes(id));

  if (artworkFiles.length === 0) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  if (soft) {
    // 软删除：只更新 metadata.json 的 status
    const metadataFile = artworkFiles.find(f => f.pathname.endsWith('metadata.json'));

    if (!metadataFile) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    const response = await fetch(metadataFile.url);
    const metadata = await response.json();

    metadata.status = 'deleted';
    metadata.deletedAt = new Date().toISOString();
    metadata.updatedAt = new Date().toISOString();

    await put(
      metadataFile.pathname,
      JSON.stringify(metadata, null, 2),
      {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Artwork soft deleted',
      deletedCount: 1
    });
  } else {
    // 硬删除：删除所有文件
    await Promise.all(
      artworkFiles.map(file => del(file.url))
    );

    return res.status(200).json({
      success: true,
      message: 'Artwork permanently deleted',
      deletedCount: artworkFiles.length
    });
  }
}
