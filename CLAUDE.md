# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目说明

这是一个基于 Vue 3 + TypeScript 的艺术作品展示平台，采用静态内容管理方式，类似于博客系统管理作品内容。项目支持响应式设计，自动适配PC/移动端，使用Vercel进行自动部署。

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
│   └── effects/        # 动画效果组件
├── views/              # 页面视图
│   └── mobile/         # 移动端页面
├── stores/             # Pinia状态管理
│   ├── gallery.ts      # 画廊状态
│   ├── transition.ts   # 页面过渡状态
│   └── counter.ts      # 示例计数器状态
├── router/             # Vue Router配置
├── composables/        # 组合式函数
├── types/              # TypeScript类型定义
├── assets/             # 静态资源
└── utils/              # 工具函数

public/artworks/        # 作品静态文件存储
├── mecha/             # 机甲分类
├── concept/           # 概念设计
├── illustration/      # 插画作品
├── 3d/                # 3D作品
├── character/         # 角色设计
└── environment/       # 场景设计
```

### 静态内容管理机制

项目采用"博客式"静态内容管理，无需数据库：

1. **作品存储结构**:
   - 每个作品 = 文件夹 + 图片 + Markdown元数据文件
   - 位置: `public/artworks/[分类]/[作品文件夹]/`
   - 图片命名: `image_1.webp`, `image_2.webp`...
   - 元数据: `作品名.md` (YAML front matter + 内容)

2. **自动路由**:
   - 根路径自动检测设备类型，PC端访问 `/`，移动端重定向到 `/m`
   - 作品详情页: `/artwork/:id` (PC端) 或 `/m/artwork/:id` (移动端)

3. **状态管理**:
   - `gallery.ts`: 管理作品数据、分类、筛选逻辑
   - `transition.ts`: 控制页面切换动画
   - 使用Pinia进行跨组件状态共享

### 开发服务器配置

Vite开发服务器配置了代理，用于本地开发时连接后端API：
- `/artworks/*` -> `http://localhost:3001`
- `/api/*` -> `http://localhost:3001`

后端API主要用于本地开发，生产环境推荐纯静态部署。

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

### 部署方式

1. **推荐：纯静态部署**
   - 构建后部署 `dist/` 目录
   - 无需Node.js运行时，性能最佳
   - Vercel、Netlify等平台自动检测

2. **可选：带后端部署**
   - 使用PM2或Docker管理Node.js进程
   - 提供API接口用于动态管理
   - 适合需要动态功能的场景

## 评论系统集成

项目已集成 [Twikoo](https://twikoo.js.org/) 评论系统：

### 部署方式

1. **本地测试（Docker）**：
```bash
# 启动 MongoDB + Twikoo
docker-compose up -d

# 访问地址：http://localhost:8080
# 管理面板：http://localhost:8080/admin
```

2. **Vercel 部署**：
- 使用 Vercel 模板一键部署
- 配置 MongoDB Atlas 数据库
- 获取 Twikoo 服务 URL

### 配置文件

- `.env` - 环境变量配置（参考 `.env.example`）
- `docker-compose.yml` - Docker 编排文件
- `init-mongo.js` - MongoDB 初始化脚本

### 评论组件

- `src/components/comments/CommentModal.vue` - 评论弹窗组件
- `src/components/comments/CommentButton.vue` - 评论按钮组件
- `src/composables/useTwikoo.ts` - Twikoo 集成逻辑

## 重要提醒

1. **中文对话**: 请使用中文与用户交流
2. **静态内容**: 所有作品通过文件系统管理，无需数据库
3. **Git工作流**: 内容更新通过Git提交触发自动部署
4. **开发环境**: 本地开发时可启动后端API（端口3001）
5. **图片管理**: 使用提供的工具批量转换和管理图片
6. **评论系统**: 需要 MongoDB 数据库支持，可使用本地 Docker 或 Vercel 部署