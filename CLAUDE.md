# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目说明

这是一个基于 Vue 3 + TypeScript 的艺术作品展示平台，采用静态内容管理方式，类似于博客系统管理作品内容。项目支持响应式设计，自动适配PC/移动端，使用Vercel进行自动部署。

**生产环境**: https://inspire-field.vercel.app
**最新版本**: v1.1.0
**最后更新**: 2025-11-21

### 最新功能 (v1.1.0)
- ✅ **混合存储架构**（文件系统 + Vercel Blob 双源读取）
- ✅ 作品上传功能（Vercel Blob 存储）
- ✅ 作品删除功能（二次确认机制）
- ✅ 作品迁移工具（本地 → Vercel Blob）
- ✅ Twikoo 评论系统集成
- ✅ PC/移动端响应式适配
- ✅ 图片瀑布流布局
- ✅ 分类筛选和搜索
- ✅ 内置 Vite Mock API（无需独立后端服务器）

## 常用开发命令

### 开发与构建
```bash
npm run dev          # 启动开发服务器 (http://localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run type-check   # TypeScript 类型检查
```

### 作品管理（使用 artwork-manager.cjs）
```bash
npm run artwork:create    # 创建新作品
npm run artwork:list      # 查看所有作品
npm run artwork:update    # 更新作品信息
npm run artwork:delete    # 删除作品
npm run artwork           # 进入交互式作品管理
npm run artwork:migrate   # 迁移作品到 Vercel Blob
npm run artwork:verify    # 验证迁移结果
```

### 图片处理
```bash
npm run convert-webp [输入目录] [输出目录]  # 批量转换图片为WebP格式
```

### Windows快捷操作
- 双击 `quick-create.bat` - 快速创建作品
- 双击 `deploy.bat` - 一键部署
- 双击 `install.bat` - 快速安装依赖
- 双击 `convert-images.bat` - 批量转换图片

## 项目架构

### 技术栈
- **前端框架**: Vue 3.5.18 + Composition API
- **开发语言**: TypeScript 5.8
- **构建工具**: Vite 7.0.6
- **路由管理**: Vue Router 4.5.1
- **状态管理**: Pinia 3.0.3
- **动画库**: GSAP 3.13.0, Anime.js 4.1.2
- **图片处理**: Sharp 0.34.3
- **UI组件**: 自定义组件系统

### 核心目录结构
```
src/
├── components/          # Vue组件
│   ├── gallery/        # 画廊相关组件
│   ├── layout/         # 布局组件
│   ├── mobile/         # 移动端专用组件
│   ├── ui/             # 基础UI组件
│   ├── upload/         # 上传功能组件
│   ├── comments/       # 评论系统组件
│   └── effects/        # 动画效果组件
├── views/              # 页面视图
│   └── mobile/         # 移动端页面
├── stores/             # Pinia状态管理
│   ├── gallery.ts      # 画廊状态（含上传/删除）
│   ├── transition.ts   # 页面过渡状态
│   └── counter.ts      # 示例计数器状态
├── router/             # Vue Router配置
├── composables/        # 组合式函数
│   ├── useTwikoo.ts   # Twikoo 评论系统
│   ├── useDevice.ts   # 设备检测
│   ├── useMobile.ts   # 移动端适配
│   └── useCursor.ts   # 自定义光标
├── types/              # TypeScript类型定义
├── assets/             # 静态资源
└── utils/              # 工具函数

api/                    # Vercel Serverless Functions
├── artworks.js         # 作品列表接口（混合读取）
├── categories.js       # 分类接口
└── artworks/
    ├── [id].js         # 单个作品操作（获取/更新/删除）
    ├── presign.js      # Blob 预签名上传
    └── upload-handler.js # Blob 上传处理器

public/artworks/        # 作品静态文件存储（文件系统源）
├── mecha/             # 机甲分类
├── concept/           # 概念设计
├── illustration/      # 插画作品
└── [其他分类]/        # 支持动态添加分类

scripts/                # 工具脚本
├── migrate-to-blob.js # 迁移到 Vercel Blob
└── verify-migration.js # 验证迁移结果
```

### 混合存储架构（重要！）

项目采用**双源混合读取**架构，同时支持文件系统和 Vercel Blob 存储：

#### 数据源说明

1. **文件系统源** (`public/artworks/`)
   - 原有作品存储位置
   - 构建时打包到静态资源
   - 适合预置的示例作品
   - 通过 `scanArtworksDirectory()` 扫描

2. **Vercel Blob 源** (云端对象存储)
   - 用户上传的作品存储位置
   - 支持动态增删改
   - 不占用 Git 仓库空间
   - 通过 `fetchBlobArtworks()` 读取

3. **混合读取逻辑** (`api/artworks.js`)
   ```javascript
   // 同时从两个源获取作品
   const [filesystemArtworks, blobArtworks] = await Promise.all([
     scanArtworksDirectory(),  // 文件系统
     fetchBlobArtworks()        // Vercel Blob
   ]);

   // 合并结果
   const artworks = [...filesystemArtworks, ...blobArtworks];
   ```

#### 作品存储结构

**文件系统格式**:
```
public/artworks/[分类]/[作品文件夹]/
├── image_1.webp      # 图片
├── image_2.webp
├── author.jpg        # 作者头像（可选）
└── 作品名.md         # 元数据（YAML front matter）
```

**Vercel Blob 格式**:
```
artworks/[分类]/[作品名]/
├── image_1.webp
├── image_2.webp
├── author.jpg
├── 作品名.md
├── metadata.json     # 结构化元数据（必需）
└── .featured         # 精选标记（可选）
```

#### 路由和状态管理

1. **自动路由**:
   - 根路径自动检测设备类型，PC端访问 `/`，移动端重定向到 `/m`
   - 作品详情页: `/artwork/:id` (PC端) 或 `/m/artwork/:id` (移动端)

2. **状态管理**:
   - `gallery.ts`: 管理作品数据、上传、删除、筛选
   - `transition.ts`: 控制页面切换动画
   - 使用 Pinia 进行跨组件状态共享

### 开发服务器配置

#### 内置 Mock API 中间件

Vite 开发服务器内置了 Mock API 中间件（`vite.config.ts`），**无需独立后端服务器**：

```typescript
const mockApiMiddleware = () => {
  return {
    name: 'mock-api',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      // 自动处理 /api/artworks 和 /api/categories 请求
      // 扫描 public/artworks 目录生成模拟数据
    }
  }
}
```

**本地开发优势**：
- ✅ 单一命令启动：`npm run dev`
- ✅ 自动扫描文件系统作品
- ✅ 支持热重载
- ✅ 无需配置额外服务

**生产环境**：
- Vercel Serverless Functions 处理 API 请求
- 混合读取文件系统 + Vercel Blob

### 作品管理系统

`artwork-manager.cjs` 提供完整的CLI工具管理作品：
- 交互式创建作品（引导输入标题、描述、分类等信息）
- 自动生成作品文件夹和元数据模板
- 支持批量列出、更新、删除作品
- 自动处理图片压缩和格式转换

### 响应式设计

项目实现了完整的响应式设计：
- 自动检测设备类型（UserAgent + 屏幕宽度）
- PC端和移动端使用不同的组件和布局
- 路由守卫自动重定向到对应版本
- 移动端优化的触摸交互和界面

### 图片优化

- 推荐使用WebP格式（体积小、质量高）
- 提供批量转换工具 (`convert-to-webp.cjs`)
- 支持懒加载和虚拟滚动
- 自动生成多种尺寸适配不同设备

### 部署架构

#### 生产环境架构图

```
用户请求
    ↓
Vercel CDN（全球边缘节点）
    ↓
    ├─→ 静态资源（HTML/CSS/JS/Images）─→ dist/
    │   来自 public/artworks/ 的图片
    │
    └─→ API 请求（/api/*）
        ↓
        Vercel Serverless Functions
        ├─→ /api/artworks.js（混合读取）
        │   ├─→ 扫描 public/artworks/（构建时打包）
        │   └─→ Vercel Blob 存储（动态上传）
        │
        ├─→ /api/artworks/[id].js（增删改查）
        └─→ /api/artworks/upload-handler.js（上传处理）
            ↓
        Vercel Blob 对象存储
        （用户上传的作品）

评论系统（独立部署）
    ↓
Twikoo Vercel 云函数
    ↓
MongoDB Atlas（评论数据库）
```

#### 部署方式

**当前架构：混合部署**
- ✅ **静态资源**: Vercel CDN（dist/ 目录）
- ✅ **动态 API**: Vercel Serverless Functions（api/ 目录）
- ✅ **文件存储**: Vercel Blob（用户上传的作品）
- ✅ **评论系统**: Twikoo Vercel 云函数 + MongoDB Atlas

**构建流程**:
1. `npm run build` - 构建 Vue 应用
2. `vite build` - 打包到 dist/ 目录
3. Vercel 自动部署静态资源和 Serverless Functions
4. public/artworks/ 内容被复制到 dist/artworks/

**优势**:
- 🚀 全球 CDN 加速
- 💰 按需付费，成本极低
- 🔄 自动扩缩容
- 🛡️ 内置 DDoS 防护

## 评论系统集成

项目已集成 [Twikoo](https://twikoo.js.org/) 评论系统，支持完整的评论功能和管理后台。

### 部署架构

```
前端（Vue 3）
    ↓
Twikoo 脚本（twikoo.all.min.js）
    ↓
Vercel 云函数（Twikoo 后端）
    ↓
MongoDB Atlas（评论数据库）
```

### 环境变量配置

**本地开发环境 (`.env`)**：
```env
VITE_TWIKOO_ENV_ID=https://twiko-rose.vercel.app
```

**生产环境 (`.env.production`)**：
```env
VITE_API_URL=/api
VITE_USE_STATIC_DATA=false
VITE_TWIKOO_ENV_ID=https://twiko-rose.vercel.app
```

### Vercel 环境变量配置

在 Vercel 项目 Settings → Environment Variables 中添加：

```
MONGODB_URI=mongodb+srv://用户名:密码@cluster.mongodb.net/twikoo
```

**注意**：`TWIKOO_SECRET` 不是官方标准变量，已删除。管理员密码通过管理面板设置，存储在 MongoDB。

### 访问管理面板

#### 方式一：内嵌管理面板（推荐）

管理面板**内嵌在评论组件中**，通过小齿轮图标访问：

1. **打开包含评论的页面**
   ```
   http://localhost:5173/artwork/[作品ID]
   ```

2. **点击评论按钮**打开评论弹窗

3. **查找小齿轮图标 ⚙️**
   - 位置：评论区标题栏右上角
   - 如果看不到，可能设置了暗号（见下文）

4. **点击小齿轮图标**进入管理面板

#### 如果小齿轮图标被隐藏

若设置了 `HIDE_ADMIN_CRYPT` 暗号，按以下方式显示图标：

1. **在昵称输入框输入暗号**（通常为管理员自设）
2. **小齿轮图标会出现**
3. **点击图标进入管理面板**

#### 调试技巧

在浏览器控制台运行以下代码查看配置：

```javascript
fetch('https://twiko-rose.vercel.app/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'GET_CONFIG' })
})
.then(r => r.json())
.then(d => {
  console.log('Twikoo 配置:', d.config)
  if (d.config.HIDE_ADMIN_CRYPT) {
    console.log('暗号:', d.config.HIDE_ADMIN_CRYPT)
  }
})
```

### 管理面板功能

登录后可进行以下操作：

- **📝 评论管理**：查看、编辑、删除评论
- **⚙️ 配置管理**：设置评论系统参数
  - 显示/隐藏表情包
  - 配置高亮主题
  - 设置管理员暗号
- **📥 导入数据**：导入评论数据
- **📤 导出数据**：导出评论数据

### 密码管理

- **首次访问**：输入密码进行初始化
- **忘记密码**：直接输入新密码（会覆盖旧密码）
- **密码存储**：MD5 加密存储在 MongoDB `config` 表的 `ADMIN_PASS` 字段

### 配置文件

- `.env` - 开发环境变量
- `.env.production` - 生产环境变量
- `docker-compose.yml` - Docker 编排（本地测试用）
- `init-mongo.js` - MongoDB 初始化脚本（本地测试用）

### 核心代码位置

- `src/components/comments/CommentModal.vue` - 评论弹窗（包含管理面板触发）
- `src/components/comments/CommentButton.vue` - 评论按钮
- `src/composables/useTwikoo.ts` - Twikoo 初始化和配置
- `src/types/twikoo.d.ts` - TypeScript 类型定义

## 本地开发快速开始

### 启动开发环境

**仅需一条命令**，内置 Mock API 自动处理所有请求：

```bash
npm run dev
# 输出：
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.x.x:5173/
```

访问 `http://localhost:5173` 即可开始开发。

**工作原理**：
- Vite 启动时自动加载 `mockApiMiddleware`
- 拦截 `/api/artworks` 和 `/api/categories` 请求
- 实时扫描 `public/artworks/` 目录
- 返回标准格式的 JSON 数据

### 开发流程

1. **修改代码** - 编辑 `.vue`、`.ts` 文件
2. **自动热重载** - Vite HMR 即时更新浏览器
3. **查看效果** - 无需手动刷新页面

### 添加新作品（开发环境）

**方式一：使用 CLI 工具**
```bash
npm run artwork:create
# 按提示输入作品信息
```

**方式二：手动创建**
```bash
# 1. 创建作品文件夹
mkdir -p public/artworks/mecha/新作品

# 2. 添加图片（自动识别）
cp image_1.webp public/artworks/mecha/新作品/

# 3. 创建元数据（可选）
echo "---
title: 新作品标题
category: mecha
---
作品描述" > public/artworks/mecha/新作品/新作品.md
```

**方式三：使用上传功能**
- 点击页面右下角 FAB 菜单 → "📤 上传"
- 上传到 Vercel Blob（需要配置 `BLOB_READ_WRITE_TOKEN`）

## 部署到 Vercel

### 自动部署流程

项目已配置 GitHub 集成，推送代码到 `main` 分支会自动触发 Vercel 部署：

1. **提交代码**：
   ```bash
   git add .
   git commit -m "Update: 描述你的更改"
   git push origin main
   ```

2. **Vercel 自动检测**并开始构建（通常 2-3 分钟）

3. **部署完成**后访问 https://inspire-field.vercel.app

### 环境变量配置

在 Vercel Dashboard 中配置以下环境变量：

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `VITE_TWIKOO_ENV_ID` | `https://twiko-rose.vercel.app` | Twikoo 评论系统 |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_xxxxx` | Vercel Blob 存储令牌 |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB 连接（Twikoo） |

**配置步骤**：
1. 访问 Vercel Dashboard → 选择项目
2. Settings → Environment Variables
3. 添加变量，选择 Production scope
4. 保存后重新部署

### Git 作者配置（重要！）

Vercel 要求提交作者邮箱必须关联到 GitHub 账户：

```bash
git config --global user.name "847361092"
git config --global user.email "bajiaojun@outlook.com"
```

**如果部署失败**显示作者邮箱错误：
```bash
git commit --amend --author="bajiaojun <bajiaojun@outlook.com>" --no-edit
git push origin main --force-with-lease
```

### 手动触发部署

如果 Vercel 没有自动部署：

1. 访问 Vercel Dashboard → 项目 → Deployments
2. 点击最新部署右侧的 "..." 菜单
3. 选择 "Redeploy"

## 作品文件结构说明

### 实际的分类分配（重要！）

`public/artworks/` 中的作品按以下规则分配到三个分类：

- **mecha**（机甲设计）: 作品001, 004, 007, 010, 013, 016
- **concept**（概念设计）: 作品002, 005, 008, 011, 014, 017
- **illustration**（插画艺术）: 作品003, 006, 009, 012, 015, 018

**注意**：`api/artworks.js` 中的 `generateMockArtworks` 函数必须与此结构保持一致，否则会导致图片 404。

### 作品文件夹结构

```
public/artworks/[分类]/[作品名]/
├── image_1.webp      # 第一张图片（必需）
├── image_2.webp      # 第二张图片
├── image_3.webp      # ...
├── image_4.webp
├── image_5.webp      # （部分作品只有4张）
├── author.jpg        # 作者头像（可选）
└── 作品名.md         # 元数据文件
```

**图片数量**：
- 大部分作品：5 张图片
- 作品010：4 张图片
- 作品018：4 张图片

## 重要提醒

### 核心原则

1. **中文对话**: 请使用中文与用户交流
2. **混合架构**: 同时支持文件系统和 Vercel Blob 两种存储方式
3. **Git 工作流**: 代码更新通过 Git 提交触发自动部署
4. **开发环境**: 本地开发只需 `npm run dev`（内置 Mock API）
5. **TypeScript 严格**: 构建前强制类型检查，所有类型必须正确

### 技术细节

6. **图片管理**: 使用提供的工具批量转换和管理图片
7. **评论系统**: 完全托管于 Vercel + MongoDB Atlas，无需本地配置
8. **中文路径**: Vercel 支持 UTF-8 中文路径，不需要 URL 编码
9. **API 路径**: 生产环境使用相对路径（`/api/*`），避免硬编码域名
10. **环境变量**: 必须配置 `BLOB_READ_WRITE_TOKEN` 才能使用上传功能

### 关键变更（v1.0 → v1.1）

- ✅ **已废弃**: 独立的 `server/upload.cjs` 后端服务器
- ✅ **新增**: Vite 内置 Mock API 中间件
- ✅ **新增**: 混合读取架构（文件系统 + Vercel Blob）
- ✅ **新增**: 作品迁移工具 (`npm run artwork:migrate`)
- ✅ **修复**: 循环依赖导致的 ReferenceError 崩溃
- ✅ **优化**: 作品排序性能（移除大量调试日志）

## 上传与删除功能

### 上传作品

**前端入口**：`HomePage.vue` → FAB 菜单 → "📤 上传"

**上传流程**：
1. 用户填写表单（标题、分类、描述等）
2. 选择图片文件（支持多选）
3. 前端调用 `gallery.uploadArtwork()`
4. 使用 `@vercel/blob/client` 上传到 Vercel Blob
5. 生成 `metadata.json` 存储作品信息
6. 刷新作品列表，新作品立即显示

**关键代码位置**：
- 上传组件：`src/components/upload/UploadModal.vue`
- 状态管理：`src/stores/gallery.ts` - `uploadArtwork()`
- API 处理器：`api/artworks/upload-handler.js`

### 删除作品

**前端入口**：`ArtworkDetail.vue` → 底部删除按钮

**删除流程**：
1. 用户点击删除按钮（第一次）
2. 按钮进入"确认删除"状态（红色脉冲动画）
3. 用户再次点击确认
4. 调用 `gallery.deleteArtwork(id)`
5. 删除 Blob 中的所有文件
6. 跳转回首页

**关键代码位置**：
- 删除按钮：`src/views/ArtworkDetail.vue`
- 状态管理：`src/stores/gallery.ts` - `deleteArtwork()`
- API 端点：`api/artworks/[id].js` - DELETE 方法

**注意事项**：
- ⚠️ 删除操作不可逆
- ⚠️ 仅删除 Blob 中的作品，文件系统作品需手动删除
- ✅ 二次确认机制防止误操作

## 作品迁移工具

将文件系统中的作品迁移到 Vercel Blob：

```bash
# 执行迁移
npm run artwork:migrate

# 验证迁移结果
npm run artwork:verify
```

**迁移说明**：
- 保留原文件系统中的作品（不删除）
- 复制到 Vercel Blob，生成 `metadata.json`
- 支持断点续传（跳过已迁移的作品）
- 自动处理图片、Markdown、作者头像

**迁移后效果**：
- 作品同时存在于两个源
- API 自动去重（优先使用 Blob 版本）
- 可以通过 UI 删除 Blob 版本

## 故障排查

### 图片不显示

**问题 1：本地开发环境图片 404**
- **原因**: `public/artworks/` 目录结构不正确
- **解决**: 确保图片路径为 `public/artworks/[分类]/[作品名]/image_X.webp`
- **验证**: 直接访问 `http://localhost:5173/artworks/mecha/作品001/image_1.webp`

**问题 2：生产环境 Blob 图片不显示**
- **原因**: `BLOB_READ_WRITE_TOKEN` 未配置或已过期
- **解决**:
  1. 访问 Vercel Dashboard → Settings → Environment Variables
  2. 添加或更新 `BLOB_READ_WRITE_TOKEN`
  3. 重新部署项目

**问题 3：API 返回空数组**
- **原因**: 文件系统扫描失败或 Blob 读取失败
- **解决**:
  1. 检查 Vercel Logs 查看错误信息
  2. 本地运行 `npm run dev`，访问 `/api/artworks`
  3. 确认 `public/artworks/` 中有作品文件夹

### 上传功能异常

**问题 1：上传按钮无响应**
- **原因**: 未配置 `BLOB_READ_WRITE_TOKEN`
- **解决**:
  ```bash
  # 创建 .env.local
  echo "VITE_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx" > .env.local
  npm run dev
  ```

**问题 2：上传卡在"上传中"**
- **原因**: Blob 上传超时或网络问题
- **解决**: 检查网络连接，重试上传

**问题 3：上传后作品不显示**
- **原因**: `metadata.json` 生成失败
- **解决**:
  1. 检查 Vercel Logs
  2. 手动验证 Blob 存储：访问 Vercel Dashboard → Storage → Blob
  3. 确认文件完整性

### Vercel 部署失败

**问题 1：TypeScript 类型错误**
- **解决**:
  ```bash
  npm run type-check  # 本地检查
  # 修复所有类型错误后再推送
  ```

**问题 2：Git 作者错误**
- **解决**:
  ```bash
  git config --global user.email "bajiaojun@outlook.com"
  git commit --amend --author="bajiaojun <bajiaojun@outlook.com>" --no-edit
  git push origin main --force-with-lease
  ```

**问题 3：环境变量缺失**
- **解决**: 在 Vercel Dashboard 中配置所有必需的环境变量：
  - `VITE_TWIKOO_ENV_ID`
  - `BLOB_READ_WRITE_TOKEN`
  - `MONGODB_URI`

### 循环依赖错误

**错误信息**: `ReferenceError: Cannot access 'X' before initialization`

**原因**: 模块之间存在循环引用

**解决方案**（已在 v1.1 中修复）:
- 重构代码，打破循环依赖
- 使用延迟导入（dynamic import）
- 提取共享类型到独立文件

## API 端点说明

### 作品接口

#### `GET /api/artworks`
获取作品列表（混合读取文件系统 + Blob）

**查询参数**:
- `category` - 分类筛选（mecha/concept/illustration/all）
- `page` - 页码（默认 1）
- `limit` - 每页数量（默认 12）
- `search` - 搜索关键词
- `featured` - 是否仅显示精选（true/false）
- `sort` - 排序方式（latest/popular/oldest）

**响应示例**:
```json
{
  "success": true,
  "artworks": [...],
  "total": 30,
  "page": 1,
  "pageSize": 12,
  "totalPages": 3,
  "source": "filesystem"
}
```

#### `GET /api/artworks/:id`
获取单个作品详情

#### `PUT /api/artworks/:id`
更新作品信息（需要 Blob 权限）

#### `DELETE /api/artworks/:id`
删除作品（需要 Blob 权限，仅删除 Blob 中的作品）

**查询参数**:
- `soft=true` - 软删除（标记为已删除，不实际删除文件）

#### `POST /api/artworks/upload-handler`
处理 Blob 上传请求（Vercel Blob 客户端调用）

#### `POST /api/artworks/presign`
生成预签名上传 URL（暂未使用）

### 分类接口

#### `GET /api/categories`
获取所有分类及作品数量

## 相关文档

- [用户使用指南](./USER_GUIDE.md) - 完整的使用说明
- [更新日志 2025-11-18](./CHANGELOG_20251118.md) - 今日工作记录
- [部署指南](./DEPLOYMENT_GITHUB.md) - GitHub 部署详细步骤
- [故障排查](./PUSH_TROUBLESHOOTING.md) - 推送问题解决方案
- [Vercel Blob 配置](./VERCEL_BLOB_SETUP.md) - Blob 存储配置指南
- [Twikoo 部署](./TWIKOO_DEPLOYMENT.md) - 评论系统部署指南

## 最近更新日志

### 2025-11-21 (v1.1.0)
- ✅ 实现混合架构（文件系统 + Vercel Blob 双源读取）
- ✅ 添加作品迁移工具
- ✅ 修复循环依赖崩溃问题
- ✅ 优化作品排序性能
- ✅ 更新 CLAUDE.md 文档

### 2025-11-18 (v1.0.0)
- ✅ 添加上传功能
- ✅ 添加删除功能（二次确认）
- ✅ 修复硬编码 URL 问题
- ✅ 修复 TypeScript 类型错误
- ✅ 部署到 Vercel 生产环境

---

**最后更新**: 2025-11-21
**当前版本**: v1.1.0
**项目状态**: ✅ 生产环境稳定运行
**下一步计划**:
- 优化 Blob 图片加载性能
- 添加作品编辑功能
- 实现作品标签系统
- 添加作品统计分析