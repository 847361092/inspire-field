# InspireField - 艺术作品展示平台

> 🎨 基于 Vue 3 + TypeScript 的静态艺术作品展示平台，采用博客式内容管理，支持 Vercel 一键部署

## 📌 核心特性

- **静态内容管理** - 像管理博客文章一样管理作品，无需数据库
- **自动部署** - Git 提交后 Vercel 自动构建部署
- **响应式设计** - 自动适配 PC/移动端
- **瀑布流画廊** - 优雅的作品展示效果
- **高性能** - WebP 图片优化，懒加载，虚拟滚动

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- Git

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/yourusername/inspire-field.git

# 进入项目目录
cd inspire-field

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 查看效果

## 📝 作品管理指南

### 🎯 快速上手

作品存放位置：`public/artworks/[分类]/[作品文件夹]/`

每个作品需要：
1. **文件夹** - 存放在对应分类目录下
2. **图片** - `image_1.webp`, `image_2.webp`...（按顺序命名）
3. **元数据** - `作品名.md` 文件（控制标题、描述、作者等信息）
4. **作者头像**（可选）- `author.jpg`

### 📂 完整示例

```
public/artworks/
└── mecha/                    # 分类文件夹
    └── 作品001/              # 作品文件夹（名称自定）
        ├── 作品001.md        # 元数据（控制作品信息）
        ├── image_1.webp      # 第一张图片
        ├── image_2.webp      # 第二张图片
        ├── image_3.webp      # 第三张图片
        └── author.jpg        # 作者头像（可选）
```

### ✏️ 元数据文件模板

创建 `作品名.md` 文件，复制以下内容并修改：

```markdown
---
title: 作品标题              # 显示在画廊的标题
description: 一句话描述      # 作品简介
category: mecha            # 分类（mecha/concept/illustration）
tags: 机甲, 概念设计         # 标签，逗号分隔
author:
  name: 作者名称
  email: 可选@example.com
  website: https://可选.com
createdAt: 2024-08-20T10:00:00Z   # 创建时间
updatedAt: 2024-08-20T10:00:00Z   # 更新时间
featured: true             # 是否精选
status: published          # 发布状态
---

# 作品详细介绍

这里写作品的详细说明...
```

### 🔧 三种管理方式

#### 方式1：使用管理工具（推荐）
```bash
npm run artwork:create    # 创建新作品
npm run artwork:list      # 查看所有作品
npm run artwork:update    # 更新作品信息
npm run artwork:delete    # 删除作品
```

#### 方式2：手动创建
1. 在 `public/artworks/[分类]/` 下创建文件夹
2. 放入图片文件（image_1.webp, image_2.webp...）
3. 创建 `.md` 文件填写作品信息
4. 提交并推送到 Git

#### 方式3：Windows快捷操作
- 双击 `quick-create.bat` 创建作品
- 双击 `deploy.bat` 一键部署

### 📁 分类目录

| 分类文件夹 | 说明 | 示例作品 |
|-----------|------|----------|
| `mecha` | 机甲设计 | 高达、EVA |
| `concept` | 概念艺术 | 场景概念、角色概念 |
| `illustration` | 插画作品 | 海报、封面 |
| `3d` | 3D作品 | 建模、渲染 |
| `character` | 角色设计 | 人物、生物 |
| `environment` | 场景设计 | 建筑、景观 |
| 自定义 | 可创建新分类 | 任意名称 |

## 🌐 部署到 Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/inspire-field)

### 手动部署

1. **Fork 本项目到你的 GitHub**

2. **导入到 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入 GitHub 仓库

3. **配置设置**
   - Framework Preset: `Vue.js`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 🚀 更新部署流程

```bash
# 步骤1：添加/修改作品
- 创建作品文件夹
- 放入图片（image_1.webp, image_2.webp...）
- 创建/编辑 .md 文件

# 步骤2：本地预览
npm run dev
# 访问 http://localhost:5173 查看效果

# 步骤3：提交到Git
git add .
git commit -m "更新作品"
git push

# 步骤4：自动部署
# Vercel 检测到更新后自动部署（约2-3分钟）
```

**Windows用户可直接双击 `deploy.bat` 完成步骤3-4**

## 🛠️ 技术架构

### 前端技术栈

- **框架**: Vue 3.5.18 + TypeScript 5.8
- **构建**: Vite 7.0.6
- **路由**: Vue Router 4.5.1
- **状态**: Pinia 3.0.3
- **动画**: GSAP 3.13.0

### 项目结构

```
inspire-field/
├── public/
│   └── artworks/           # 作品静态文件
│       ├── mecha/         # 机甲分类
│       ├── concept/       # 概念设计
│       └── illustration/  # 插画作品
├── src/
│   ├── components/        # Vue 组件
│   ├── views/            # 页面视图
│   ├── stores/           # Pinia 状态
│   ├── composables/      # 组合式函数
│   └── router/           # 路由配置
├── artwork-manager.js     # 作品管理工具
├── convert-to-webp.cjs   # 图片转换工具
└── package.json
```

## 📸 图片处理

### 图片要求
- **格式**：推荐 WebP（体积小、质量高）
- **命名**：`image_1.webp`, `image_2.webp`...（数字递增）
- **尺寸**：宽度 1920px 以内
- **作者头像**：`author.jpg`（正方形，200x200px以上）

### 批量转换工具
```bash
npm run convert-webp [输入目录] [输出目录]
```

## 🎯 使用场景

- 个人作品集网站
- 艺术家展示平台
- 设计工作室官网
- 摄影作品展示
- 概念设计展览

## 📚 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器

# 构建
npm run build        # 构建生产版本
npm run preview      # 预览构建结果

# 作品管理
node artwork-manager.js    # 作品管理工具

# 图片处理
node convert-to-webp.cjs   # 转换图片格式

# 类型检查
npm run type-check   # TypeScript 类型检查
```

## ⚙️ 配置说明

### 修改网站信息

编辑 `src/config/site.ts`:

```typescript
export const siteConfig = {
  title: 'InspireField',
  description: '艺术作品展示平台',
  author: '你的名字',
  keywords: ['艺术', '设计', '作品集']
}
```

### 自定义主题

编辑 `src/styles/variables.css`:

```css
:root {
  --primary-color: #007bff;
  --background-color: #0a0a0a;
  --text-color: #ffffff;
}
```

## ❓ 常见问题

### 作品不显示？
- ✅ 检查文件夹路径：`public/artworks/[分类]/[作品名]/`
- ✅ 确认有 `.md` 文件且格式正确
- ✅ 图片命名：`image_1.webp`, `image_2.webp`
- ✅ 重新运行 `npm run dev`

### 如何修改作品信息？
1. 编辑对应的 `.md` 文件
2. 保存后刷新页面即可看到更新
3. 推送到 Git 后自动部署

### 如何删除作品？
1. 删除整个作品文件夹
2. 提交并推送到 Git

### 如何设置精选推荐？

**方法1：在markdown文件中添加YAML front matter（推荐）**

```markdown
---
title: 作品标题
description: 作品描述  
featured: true          # 设置为精选作品
author:
  name: 作者名称
createdAt: 2024-08-20T10:00:00Z
---

作品详细介绍...
```

**方法2：创建 `.featured` 文件**

在作品文件夹中创建空的 `.featured` 文件：

```bash
# Linux/Mac
touch "public/artworks/mecha/作品001/.featured"

# Windows
echo. > "public/artworks/mecha/作品001/.featured"
```

**注意事项**：
- 精选作品会优先在首页精选推荐区域显示
- PC端和移动端都会同步显示相同的精选作品
- 如果没有精选作品，系统会自动显示最新的6个作品
- 精选作品数量不限，但首页精选区域只显示真正标记为精选的作品

### 如何调整作品顺序？
- 修改 `.md` 文件中的 `createdAt` 时间
- 设置 `featured: true` 可置顶到精选推荐



## 🐧 Linux服务器部署

### 前端静态部署（推荐）

如果只是展示作品，推荐直接部署为静态网站：

```bash
# 1. 构建静态文件
npm run build

# 2. 部署到任意静态服务器
# nginx/apache/docker 等都可以
```

### 开启后端API（可选）

如果需要动态功能或本地开发，可以启动后端服务：

**方法1：直接启动Node.js服务**

```bash
# 启动后端API服务器（端口3001）
node server/upload.cjs

# 另开终端启动前端开发服务器（端口5173）
npm run dev
```

**方法2：使用PM2守护进程**

```bash
# 安装PM2
npm install -g pm2

# 启动后端服务
pm2 start server/upload.cjs --name "inspire-field-api"

# 启动前端服务（生产环境）
pm2 serve dist 5173 --name "inspire-field-web"

# 查看状态
pm2 status

# 查看日志
pm2 logs inspire-field-api
```

**方法3：使用Docker**

```bash
# 创建Dockerfile（后端）
cat > Dockerfile.api << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server/ ./server/
COPY public/ ./public/
EXPOSE 3001
CMD ["node", "server/upload.cjs"]
EOF

# 构建并运行
docker build -f Dockerfile.api -t inspire-field-api .
docker run -d -p 3001:3001 -v $(pwd)/public:/app/public inspire-field-api
```

**方法4：使用nginx代理**

```nginx
# /etc/nginx/sites-available/inspire-field
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/inspire-field/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API代理（可选）
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 静态资源
    location /artworks {
        root /path/to/inspire-field/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Linux环境配置检查

```bash
# 检查Node.js版本（需要 >= 20.19.0）
node --version

# 检查npm版本
npm --version

# 安装项目依赖
npm install

# 验证构建是否正常
npm run build

# 验证后端API是否正常启动
node server/upload.cjs &
curl http://localhost:3001/api/artworks
```

### 生产环境建议

1. **仅静态部署**（推荐）
   - 构建后部署 `dist/` 目录到任意静态服务器
   - 不需要运行Node.js后端，性能更好，成本更低

2. **带后端部署**（可选）
   - 使用PM2或Docker管理Node.js进程
   - 配置nginx反向代理
   - 适合需要动态功能的场景

**注意**：大多数用户只需要静态部署即可，后端API主要用于本地开发。

## 💡 重要说明

**本系统采用静态内容管理**：
- ✅ 作品以文件形式存储，无需数据库
- ✅ 通过 Git 提交触发自动部署
- ✅ 适合作品更新不频繁的展示网站
- ✅ 优点：零成本、高性能、永久保存、版本控制

**工作原理**：
1. 作品 = 文件夹 + 图片 + MD文件
2. 更新 = 修改文件 → Git提交 → 自动部署
3. 就像写博客一样管理作品内容

**关于后端**：
- ✅ 生产环境推荐纯静态部署（无需后端）
- ✅ 后端API主要用于本地开发和管理
- ✅ Vercel等平台会自动处理API路由

---

📌 **记住**：所有作品都在 `public/artworks/` 目录下，通过文件和文件夹管理，不需要任何数据库或后台系统。