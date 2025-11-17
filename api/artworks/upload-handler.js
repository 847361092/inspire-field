import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  // 处理 @vercel/blob 客户端上传
  const jsonResponse = await handleUpload({
    request: req,
    onBeforeGenerateToken: async (pathname) => {
      // 可以在这里添加权限验证
      // 例如：检查用户是否登录，是否有上传权限

      // 验证路径格式
      if (!pathname.startsWith('artworks/')) {
        throw new Error('Invalid upload path');
      }

      return {
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'text/markdown', 'application/json'],
        maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      // 上传完成后的回调
      console.log('Upload completed:', blob.pathname);

      // 可以在这里执行额外的操作：
      // - 更新数据库
      // - 发送通知
      // - 触发图片处理任务
    },
  });

  return res.status(200).json(jsonResponse);
}
