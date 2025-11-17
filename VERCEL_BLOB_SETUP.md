# Vercel Blob 配置指南

## 第一步：安装 Vercel CLI

```bash
npm install -g vercel
```

## 第二步：登录 Vercel

```bash
vercel login
```

按照提示完成登录（会打开浏览器）。

## 第三步：链接项目

在项目根目录运行：

```bash
vercel link
```

选择你的 Vercel 团队和项目。

## 第四步：启用 Vercel Blob 存储

### 方式一：通过 Vercel Dashboard（推荐）

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Storage** 标签
4. 点击 **Create Database** → 选择 **Blob**
5. 输入数据库名称（例如：`artworks-blob`）
6. 点击 **Create**

### 方式二：通过 CLI

```bash
vercel storage create blob artworks-blob
```

## 第五步：获取 BLOB_READ_WRITE_TOKEN

### 自动方式（推荐）

```bash
vercel env pull .env.local
```

这会自动创建 `.env.local` 文件并包含 `BLOB_READ_WRITE_TOKEN`。

### 手动方式

1. 在 Vercel Dashboard → 项目 → Storage → Blob
2. 点击你创建的 Blob 存储
3. 在 **Settings** 中找到 **Access Token**
4. 复制 token
5. 创建 `.env.local` 文件：

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
VITE_API_URL=/api
VITE_TWIKOO_ENV_ID=https://twiko-rose.vercel.app
```

## 第六步：配置 Vercel 环境变量

在 Vercel Dashboard 中配置生产环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量（**Production** 和 **Preview** 都勾选）：
   - `BLOB_READ_WRITE_TOKEN`: 从 Storage 获取的 token
   - `MONGODB_URI`: （Twikoo 已配置）

## 第七步：验证配置

运行以下命令验证 Blob 连接：

```bash
node -e "import('@vercel/blob').then(async ({ list }) => { const { blobs } = await list(); console.log('✅ Blob 连接成功，当前文件数:', blobs.length); })"
```

如果看到 "✅ Blob 连接成功"，说明配置正确！

## 第八步：启动开发服务器

```bash
npm run dev
```

这会启动 `vercel dev`，同时运行前端和 Serverless Functions。

---

## 常见问题

### Q: 为什么需要 Vercel CLI？

A: 因为我们使用 `vercel dev` 来模拟 Vercel 的 Serverless 环境，确保本地开发与生产环境一致。

### Q: 免费额度够用吗？

A: Vercel Blob 免费版提供 100GB 存储 + 1TB 流量/月，对于个人作品集完全够用。

### Q: 如何监控用量？

A: 在 Vercel Dashboard → Storage → Blob，可以看到实时用量统计。

### Q: 如果不想用 Blob，有其他选择吗？

A: 可以使用：
- Cloudflare R2（免费 10GB）
- AWS S3
- 其他对象存储服务

只需修改 API 代码中的上传逻辑即可。

---

## 下一步

配置完成后，请继续执行：

1. **Phase 2**：后端 API 开发
2. **Phase 3**：前端改造
3. **Phase 4**：CLI 工具改造
4. **Phase 5**：数据迁移

详见项目的 `README.md` 或 `CLAUDE.md`。
