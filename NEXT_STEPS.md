# 下一步操作指南

**当前进度**: 50% 完成
**最后更新**: 2025-11-17

---

## ✅ 已完成的工作总结

### 1. 环境准备 ✅
- 创建了环境变量配置模板
- 更新了 package.json 脚本
- 你已成功配置 Vercel Blob

### 2. 后端 API 完整实现 ✅
所有 Serverless Functions 已就绪：
- `GET /api/artworks` - 作品列表（支持分页、筛选、搜索）
- `POST /api/artworks/presign` - 获取上传配置
- `POST /api/artworks/upload-handler` - 上传回调
- `GET /api/artworks/:id` - 获取单个作品
- `PUT /api/artworks/:id` - 更新作品
- `DELETE /api/artworks/:id` - 删除作品

### 3. 前端数据层改造 ✅
- `stores/gallery.ts` 已添加上传/更新/删除方法
- 移除了硬编码的 `localhost:3001`

### 4. 上传组件创建 ✅
- `src/components/upload/UploadModal.vue` 已创建
- 支持拖拽上传、图片预览、进度条

---

## ⏳ 剩余工作（需要继续完成）

### Phase 3: 前端改造（剩余50%）

#### 任务 3.1: 在 HomePage.vue 添加上传入口

**文件**: `src/views/HomePage.vue`

**需要做的事情**：
1. 导入 UploadModal 组件
2. 添加一个状态控制弹窗显示
3. 在 FAB 按钮组中添加上传按钮
4. 处理上传成功后的回调

**示例代码**：
```vue
<script setup>
import UploadModal from '@/components/upload/UploadModal.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const showUploadModal = ref(false)
const router = useRouter()

const handleUpload = () => {
  showUploadModal.value = true
}

const handleUploadSuccess = async (artworkId: string) => {
  // 跳转到新作品详情页
  router.push(`/artwork/${artworkId}`)
}
</script>

<template>
  <!-- 在 FAB 按钮组中添加 -->
  <button
    v-if="fabExpanded"
    class="fab-btn sub upload-btn"
    @click="handleUpload"
    title="上传作品"
  >
    <span class="fab-icon">📤</span>
  </button>

  <!-- 添加上传弹窗 -->
  <UploadModal
    :is-open="showUploadModal"
    @close="showUploadModal = false"
    @upload-success="handleUploadSuccess"
  />
</template>
```

#### 任务 3.2: 在 ArtworkDetail.vue 添加编辑/删除功能

**文件**: `src/views/ArtworkDetail.vue`

**需要做的事情**：
1. 添加编辑按钮（可选，如果需要在线编辑）
2. 添加删除按钮
3. 实现删除确认对话框
4. 调用 `galleryStore.deleteArtwork()`

**示例代码**：
```vue
<script setup>
import { useGalleryStore } from '@/stores/gallery'
import { useRouter } from 'vue-router'

const galleryStore = useGalleryStore()
const router = useRouter()
const showDeleteConfirm = ref(false)

const handleDelete = async () => {
  if (!showDeleteConfirm.value) {
    showDeleteConfirm.value = true
    return
  }

  try {
    await galleryStore.deleteArtwork(artwork.value.id, false)
    router.push('/')
  } catch (error) {
    alert('删除失败：' + error.message)
  }
}
</script>

<template>
  <!-- 添加删除按钮 -->
  <button class="delete-btn" @click="handleDelete">
    {{ showDeleteConfirm ? '确认删除？' : '删除作品' }}
  </button>
</template>
```

---

### Phase 4: CLI 工具改造

#### 任务 4.1: 创建迁移脚本

**文件**: `scripts/migrate-to-blob.js`

**功能**:
- 扫描 `public/artworks/` 下的所有作品
- 读取图片、MD 文件
- 上传到 Vercel Blob
- 生成 metadata.json

**关键代码**：
```javascript
import { put } from '@vercel/blob';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const ARTWORKS_DIR = './public/artworks';

// ... 实现迁移逻辑
```

#### 任务 4.2: 创建验证脚本

**文件**: `scripts/verify-migration.js`

**功能**:
- 对比本地和 Blob 的作品列表
- 输出差异报告

---

## 🚀 立即可以测试的功能

### 1. 启动开发服务器

```bash
npm run dev
```

这会启动 `vercel dev`，同时运行：
- 前端（Vue + Vite）
- Serverless Functions

### 2. 测试 API 是否工作

打开浏览器访问：
```
http://localhost:3000/api/artworks
```

应该返回作品列表的 JSON 数据。

### 3. 手动测试上传功能

虽然 HomePage 还没添加上传按钮，但你可以：

1. 创建一个临时测试页面：
```vue
<!-- src/views/TestUpload.vue -->
<template>
  <div style="padding: 50px">
    <button @click="showModal = true">测试上传</button>
    <UploadModal
      :is-open="showModal"
      @close="showModal = false"
      @upload-success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UploadModal from '@/components/upload/UploadModal.vue'

const showModal = ref(false)

const handleSuccess = (id) => {
  alert('上传成功: ' + id)
  showModal.value = false
}
</script>
```

2. 在 `router/index.ts` 添加路由：
```typescript
{
  path: '/test-upload',
  component: () => import('@/views/TestUpload.vue')
}
```

3. 访问 `http://localhost:3000/test-upload` 测试上传

---

## 📝 完整的任务清单

### 立即需要完成（前端 UI）

- [ ] **任务 1**: 在 `HomePage.vue` 添加上传按钮和弹窗
- [ ] **任务 2**: 在 `ArtworkDetail.vue` 添加删除按钮
- [ ] **任务 3**: 测试上传功能是否正常

### 可选任务（CLI 工具）

- [ ] **任务 4**: 创建 `scripts/migrate-to-blob.js`
- [ ] **任务 5**: 创建 `scripts/verify-migration.js`
- [ ] **任务 6**: 修改 `artwork-manager.cjs` 支持 Blob

### 数据迁移

- [ ] **任务 7**: 备份 `public/artworks/`
- [ ] **任务 8**: 运行 `npm run artwork:migrate`
- [ ] **任务 9**: 运行 `npm run artwork:verify`

### 测试和部署

- [ ] **任务 10**: 功能测试
- [ ] **任务 11**: 更新 README.md
- [ ] **任务 12**: 部署到 Vercel

---

## 💡 快速开始建议

### 方案 A: 最小化测试（推荐先做这个）

1. **先测试后端 API**:
   ```bash
   npm run dev
   # 访问 http://localhost:3000/api/artworks
   ```

2. **创建测试页面测试上传**（见上文）

3. **如果上传成功**，说明核心功能已完成 ✅

### 方案 B: 完整开发流程

1. 完成 HomePage 和 ArtworkDetail 的修改
2. 创建迁移脚本
3. 迁移现有数据
4. 全面测试
5. 部署上线

---

## ⚠️ 可能遇到的问题

### 问题 1: Vercel Dev 启动失败

**症状**: 运行 `npm run dev` 报错

**解决**:
```bash
# 检查 .env.local 是否存在
ls -la .env.local

# 检查 BLOB_READ_WRITE_TOKEN 是否配置
cat .env.local | grep BLOB

# 重新拉取环境变量
vercel env pull .env.local
```

### 问题 2: 上传时报错 "Failed to prepare upload"

**原因**: API 路由配置问题

**解决**: 检查 `vercel.json` 的 rewrites 配置是否正确

### 问题 3: 图片上传后无法显示

**原因**: Blob URL 可能未正确返回

**解决**:
1. 检查 Blob 控制台是否有文件
2. 检查 API 返回的 URL 格式
3. 确认 metadata.json 中的 images 字段正确

---

## 📞 获取帮助

如果遇到问题：

1. **查看控制台日志**
   - 浏览器 Console
   - Vercel Dev 终端输出

2. **查看 Vercel Dashboard**
   - Functions 日志
   - Blob 存储文件列表

3. **查看文档**
   - `VERCEL_BLOB_SETUP.md` - Blob 配置
   - `MIGRATION_PROGRESS.md` - 详细进度

---

## 🎯 预期时间表

- **完成前端 UI 修改**: 2-3 小时
- **测试上传功能**: 1 小时
- **创建迁移脚本**: 3-4 小时
- **执行数据迁移**: 1-2 小时
- **测试和部署**: 2-3 小时

**总计**: 9-13 小时可完成所有剩余工作

---

**祝开发顺利！如有问题随时查阅文档或寻求帮助。**
