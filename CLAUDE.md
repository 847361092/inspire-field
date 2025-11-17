# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目说明

这是一个基于 Vue 3 + TypeScript 的艺术作品展示平台，采用静态内容管理方式，类似于博客系统管理作品内容。项目支持响应式设计，自动适配PC/移动端，使用Vercel进行自动部署。

**生产环境**: https://inspire-field.vercel.app
**最新版本**: v1.0.0
**最后更新**: 2025-11-18

### 最新功能 (v1.0.0)
- ✅ 作品上传功能（Vercel Blob 存储）
- ✅ 作品删除功能（二次确认机制）
- ✅ Twikoo 评论系统集成
- ✅ PC/移动端响应式适配
- ✅ 图片瀑布流布局
- ✅ 分类筛选和搜索

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

需要在两个终端分别启动两个服务：

**终端 1 - 启动图片服务器**：
```bash
node server/upload.cjs
# 输出：✨ 图片服务器已启动: http://localhost:3001
```

**终端 2 - 启动前端开发服务器**：
```bash
npm run dev
# 输出：➜  Local: http://localhost:5173/
```

### Windows 快速启动（可选）

创建 `dev-start.bat` 文件：
```batch
@echo off
start "图片服务器" node server/upload.cjs
start "前端服务器" npm run dev
```
然后双击 `dev-start.bat` 同时启动两个服务。

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

1. **中文对话**: 请使用中文与用户交流
2. **静态内容**: 所有作品通过文件系统管理，无需数据库
3. **Git工作流**: 内容更新通过Git提交触发自动部署
4. **开发环境**: 本地开发只需 `npm run dev`（已废弃双服务器模式）
5. **图片管理**: 使用提供的工具批量转换和管理图片
6. **评论系统**: 完全托管于 Vercel + MongoDB Atlas，无需本地配置
7. **中文路径**: Vercel 支持 UTF-8 中文路径，不需要使用 `encodeURIComponent`
8. **TypeScript**: 构建前强制类型检查，确保所有类型正确

## 故障排查

### 图片不显示

1. **检查文件路径**：
   - 确认图片在正确的分类文件夹下
   - 文件名必须是 `image_1.webp`, `image_2.webp` 等

2. **检查 API 返回**：
   - 浏览器访问 `/api/artworks`
   - 验证返回的 `category` 和实际文件夹匹配

3. **检查分类分配**：
   - 参考上面的"实际的分类分配"
   - 修改 `api/artworks.js` 中的 `works` 数组

### Vercel 部署失败

1. **TypeScript 错误**：
   - 本地运行 `npm run type-check`
   - 修复所有类型错误后再推送

2. **Git 作者错误**：
   - 检查 `git config --global user.email`
   - 确保邮箱与 GitHub 账户关联

3. **环境变量缺失**：
   - 检查 Vercel Dashboard 中的环境变量
   - 确保所有必需的变量都已配置

## 相关文档

- [用户使用指南](./USER_GUIDE.md) - 完整的使用说明
- [更新日志 2025-11-18](./CHANGELOG_20251118.md) - 今日工作记录
- [部署指南](./DEPLOYMENT_GITHUB.md) - GitHub 部署详细步骤
- [故障排查](./PUSH_TROUBLESHOOTING.md) - 推送问题解决方案

---

**最后更新**: 2025-11-18 02:00 AM
**项目状态**: ✅ 生产环境稳定运行
**下一步计划**: 验证上传/删除功能、性能优化