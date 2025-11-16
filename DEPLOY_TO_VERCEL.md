# 📚 Inspire Field - Vercel 部署指南

本文档详细说明如何将 Inspire Field 项目部署到 Vercel 平台。

## 🚀 快速部署步骤

### 1. 准备工作

#### 1.1 确保代码已提交到 Git
```bash
git add .
git commit -m "准备部署到Vercel"
```

#### 1.2 推送到 GitHub
如果还没有 GitHub 仓库，先创建一个：
```bash
# 在 GitHub 上创建新仓库后
git remote add origin https://github.com/你的用户名/inspire-field.git
git branch -M main
git push -u origin main
```

### 2. 部署到 Vercel

#### 方法一：通过 Vercel 网站（推荐）

1. **访问 Vercel**
   - 打开 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择 "Import Git Repository"
   - 选择你的 `inspire-field` 仓库

3. **配置项目**
   - **Framework Preset**: 自动检测为 `Vue.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **配置环境变量**（重要！）
   
   点击 "Environment Variables" 添加以下变量：
   
   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `BLOB_READ_WRITE_TOKEN` | （自动生成） | Vercel会自动创建，用于存储功能 |

5. **点击 Deploy**
   - 等待部署完成（约2-3分钟）
   - 部署成功后会获得一个 URL，如：`https://inspire-field.vercel.app`

#### 方法二：使用 Vercel CLI

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
# 在项目根目录执行
vercel

# 按提示操作：
# ? Set up and deploy "inspire-field"? [Y/n] Y
# ? Which scope do you want to deploy to? 选择你的账号
# ? Link to existing project? [y/N] N
# ? What's your project's name? inspire-field
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] N
```

## 🔧 功能配置说明

### 已配置的功能

项目已经完全配置好以下功能，部署后即可使用：

| 功能 | 状态 | 说明 |
|------|------|------|
| **图片上传** | ✅ 可用 | 使用 Vercel Blob 存储，支持多图上传 |
| **动态分类** | ✅ 可用 | 自动检测并创建新分类 |
| **作品展示** | ✅ 可用 | 瀑布流展示所有作品 |
| **搜索功能** | ✅ 可用 | 支持作品标题、作者、分类搜索 |
| **响应式设计** | ✅ 可用 | 自动适配 PC 和移动端 |
| **主题切换** | ✅ 可用 | 深色/浅色模式切换 |

### API 端点

部署后自动可用的 API：

- `GET /api/artworks` - 获取所有作品
- `GET /api/categories` - 获取分类列表
- `POST /api/upload` - 上传新作品

### 存储说明

- **Vercel Blob Storage**: 自动配置，用于存储上传的图片和作品数据
- **容量限制**: 免费账号有 100GB 存储限制
- **带宽限制**: 免费账号每月 1TB 带宽

## 📝 部署后验证

### 1. 检查基本功能
- 访问部署的 URL
- 确认页面正常加载
- 检查瀑布流展示是否正常

### 2. 测试上传功能
- 点击上传按钮
- 选择图片文件夹
- 填写作品信息
- 确认上传成功

### 3. 验证 API
```bash
# 测试获取作品列表
curl https://你的域名.vercel.app/api/artworks

# 测试获取分类
curl https://你的域名.vercel.app/api/categories
```

## 🛠️ 故障排除

### 常见问题

#### 1. 部署失败
**问题**: Build 过程报错
**解决**: 
- 检查 `package.json` 中的依赖是否完整
- 确保本地 `npm run build` 能成功执行
- 查看 Vercel 的构建日志了解具体错误

#### 2. 上传功能不工作
**问题**: 上传时报错或无响应
**解决**:
- 检查 Vercel 项目设置中是否启用了 Blob Storage
- 确认环境变量配置正确
- 查看函数日志：Vercel Dashboard → Functions → Logs

#### 3. 图片不显示
**问题**: 上传的图片无法显示
**解决**:
- 检查 Blob Storage 配额是否用完
- 确认图片 URL 是否正确
- 清除浏览器缓存后重试

#### 4. API 调用失败
**问题**: API 返回 404 或 500 错误
**解决**:
- 确认 `api/` 文件夹中的函数文件存在
- 检查 `vercel.json` 配置是否正确
- 查看函数执行日志

## 🔄 更新部署

### 自动更新
推送代码到 GitHub 后，Vercel 会自动重新部署：
```bash
git add .
git commit -m "更新内容"
git push
```

### 手动重新部署
1. 登录 Vercel Dashboard
2. 选择项目
3. 点击 "Redeploy"

## 📊 监控和分析

### Vercel Dashboard 功能
- **Analytics**: 查看访问统计
- **Functions**: 监控 API 函数调用
- **Logs**: 查看实时日志
- **Storage**: 管理 Blob 存储

### 性能优化建议
1. 使用 WebP 格式图片（已配置）
2. 启用图片懒加载（已实现）
3. 使用 CDN 加速（Vercel 自动提供）
4. 监控 API 响应时间

## 🔒 安全建议

1. **限制上传大小**: 已设置单文件最大 50MB
2. **文件类型验证**: 仅允许图片格式
3. **CORS 配置**: API 已配置跨域headers
4. **敏感信息**: 不要在代码中硬编码密钥

## 💰 费用说明

### Vercel 免费套餐限制
- **部署次数**: 无限制
- **带宽**: 100GB/月
- **Blob Storage**: 100GB 存储空间
- **函数调用**: 100,000次/月
- **函数执行时间**: 10秒超时

### 升级建议
如果超出免费限制，考虑：
- Pro 套餐：$20/月
- 或使用外部存储服务（如 Cloudinary）

## 📚 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Vue on Vercel](https://vercel.com/guides/deploying-vuejs-to-vercel)
- [项目 GitHub 仓库](https://github.com/你的用户名/inspire-field)

## 🤝 支持

如遇到问题：
1. 查看 Vercel 部署日志
2. 检查浏览器控制台错误
3. 查看本文档的故障排除部分
4. 在 GitHub Issues 中提问

---

**最后更新**: 2024年8月18日
**作者**: Inspire Field Team
**版本**: 1.0.0