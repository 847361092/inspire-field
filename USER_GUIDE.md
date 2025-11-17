# Inspire Field 使用指南

## 📖 项目简介

Inspire Field 是一个基于 Vue 3 + TypeScript 的艺术作品展示平台，支持 PC 和移动端响应式展示，使用 Vercel 进行自动部署。

**技术栈**：
- 前端：Vue 3.5 + TypeScript 5.8 + Vite 7
- 状态管理：Pinia 3.0
- 路由：Vue Router 4.5
- 动画：GSAP 3.13 + Anime.js 4.1
- 评论系统：Twikoo (MongoDB + Vercel)
- 存储：Vercel Blob（用户上传）+ Static Files（初始作品）
- 部署：Vercel (自动部署)

**在线地址**：https://inspire-field.vercel.app

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/847361092/inspire-field.git
cd inspire-field
```

### 2. 安装依赖

```bash
npm install
```

或在 Windows 中双击 `install.bat`

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，填写：

```env
# Twikoo 评论系统
VITE_TWIKOO_ENV_ID=https://twiko-rose.vercel.app

# Vercel Blob 存储（可选，用于用户上传）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### 4. 启动开发服务器

```bash
npm run dev
```

或双击 `start.bat`（Windows）

访问 http://localhost:5173

---

## 📂 项目结构

```
inspire-field/
├── public/
│   └── artworks/              # 静态作品文件
│       ├── mecha/             # 机甲设计
│       ├── concept/           # 概念设计
│       └── illustration/      # 插画作品
├── src/
│   ├── components/            # Vue 组件
│   ├── views/                 # 页面视图
│   ├── stores/                # Pinia 状态管理
│   ├── router/                # 路由配置
│   └── composables/           # 组合式函数
├── api/                       # Vercel Serverless Functions
│   ├── artworks.js           # 获取作品列表
│   └── categories.js         # 获取分类
└── server/                    # 本地开发服务器（已废弃）
```

---

## 🎨 作品管理

### 方式 1：直接编辑文件（推荐）

#### 添加新作品

1. 在 `public/artworks/[分类]/` 下创建新文件夹（如 `作品019`）
2. 添加图片：`image_1.webp`, `image_2.webp`, ...
3. 添加作者头像：`author.jpg`（可选）
4. 创建 Markdown 文件：`作品019.md`

**Markdown 格式示例**：

```markdown
---
title: 作品019 - 科幻机甲
category: mecha
author: 设计师名字
email: designer@example.com
date: 2025-11-18
featured: true
---

# 作品描述

这是一个精心设计的科幻机甲作品...

## 设计理念

...
```

#### 提交到 GitHub

```bash
git add .
git commit -m "Add: 添加新作品 - 作品019"
git push origin main
```

Vercel 会自动检测更新并部署。

### 方式 2：使用 CLI 工具

```bash
npm run artwork          # 交互式菜单
npm run artwork:create   # 创建新作品
npm run artwork:list     # 查看所有作品
npm run artwork:update   # 更新作品
npm run artwork:delete   # 删除作品
```

或在 Windows 中双击 `quick-create.bat` 快速创建作品。

### 方式 3：网站上传功能

1. 访问已部署的网站
2. 点击右下角 FAB 菜单
3. 点击 **📤 上传** 按钮
4. 填写作品信息并上传图片
5. 作品会保存到 Vercel Blob 存储

**注意**：上传功能需要配置 `BLOB_READ_WRITE_TOKEN` 环境变量。

---

## 🖼️ 图片处理

### 批量转换为 WebP

```bash
npm run convert-webp [输入目录] [输出目录]
```

或双击 `convert-images.bat`（Windows）

### 推荐规格

- 格式：WebP
- 命名：`image_1.webp`, `image_2.webp`, ...
- 尺寸：宽度 1200-2000px
- 质量：80-90%

---

## 🚢 部署到 Vercel

### 自动部署（推荐）

项目已连接 GitHub，任何推送到 `main` 分支的提交都会自动触发部署。

1. 提交代码：
   ```bash
   git add .
   git commit -m "Update: 更新内容"
   git push origin main
   ```

2. Vercel 自动构建和部署（2-3分钟）

3. 访问你的域名查看更新

### 环境变量配置

在 Vercel Dashboard 中配置以下环境变量：

1. 访问 https://vercel.com/dashboard
2. 选择项目 → Settings → Environment Variables
3. 添加变量：

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `VITE_TWIKOO_ENV_ID` | `https://twiko-rose.vercel.app` | Twikoo 评论系统地址 |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_xxxxx` | Vercel Blob 存储令牌 |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB 连接字符串（Twikoo） |

4. 保存后重新部署

---

## 💬 评论系统（Twikoo）

### 访问管理面板

1. 访问任意作品详情页
2. 点击评论按钮打开评论弹窗
3. 点击右上角小齿轮图标 ⚙️
4. 输入管理员密码

### 修改管理员密码

直接在管理面板中输入新密码，会自动覆盖旧密码。

### 配置选项

- 显示/隐藏表情包
- 配置代码高亮主题
- 设置管理员暗号
- 导入/导出评论数据

---

## 🛠️ 开发指南

### 本地开发

```bash
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览构建结果
npm run type-check       # TypeScript 类型检查
```

### 代码结构

- `src/views/HomePage.vue` - 首页（作品网格）
- `src/views/ArtworkDetail.vue` - 作品详情页
- `src/stores/gallery.ts` - 作品数据管理
- `api/artworks.js` - 后端 API（获取作品列表）

### 添加新功能

1. 在 `src/components/` 创建新组件
2. 在 `src/views/` 创建新页面（如需要）
3. 在 `src/router/index.ts` 添加路由
4. 在 `src/stores/` 添加状态管理（如需要）

---

## 📊 文件大小限制

- Vercel Blob 免费额度：1 GB
- 单个文件大小：最大 500 MB
- 推荐单张图片：< 2 MB（WebP 压缩后）

---

## 🔧 常见问题

### Q: 图片不显示？

A: 检查以下几点：
1. 图片文件是否在 `public/artworks/` 正确的分类文件夹下
2. 文件名是否为 `image_1.webp`, `image_2.webp` 等
3. API 返回的分类是否与实际文件夹匹配
4. Vercel 环境变量 `BLOB_READ_WRITE_TOKEN` 是否配置

### Q: 如何修改网站标题和 Logo？

A: 编辑以下文件：
- 标题：`index.html` 中的 `<title>` 标签
- Logo：替换 `public/logo/` 下的图片文件
- 组件中的 Logo：`src/components/layout/AppHeader.vue`

### Q: 推送到 GitHub 后 Vercel 没有自动部署？

A: 可能的原因：
1. Git 提交作者邮箱未关联 GitHub 账户
   - 解决：`git config --global user.email "你的GitHub邮箱"`
2. Vercel 项目未正确连接 GitHub 仓库
   - 解决：在 Vercel Dashboard 重新连接

### Q: 评论功能不工作？

A: 检查：
1. `VITE_TWIKOO_ENV_ID` 环境变量是否正确
2. `MONGODB_URI` 是否有效
3. 浏览器控制台是否有错误信息

---

## 📝 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本更新历史。

---

## 📧 联系方式

- GitHub: https://github.com/847361092/inspire-field
- Issues: https://github.com/847361092/inspire-field/issues

---

**最后更新**: 2025-11-18
