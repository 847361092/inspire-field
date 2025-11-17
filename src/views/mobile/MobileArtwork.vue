<template>
  <div class="mobile-artwork" :class="isDarkTheme ? 'dark-theme' : 'light-theme'">
    <!-- 顶部导航栏 -->
    <header class="artwork-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <h1 class="header-title">{{ artworkInfo.title || '作品详情' }}</h1>
    </header>

    <!-- 内容区域 - 垂直瀑布流 -->
    <div class="artwork-content" ref="contentRef" @scroll="handleScroll">
      <!-- 加载提示 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 内容容器 -->
      <div v-else>
        <!-- 所有作品图片 -->
        <div class="images-container">
          <div 
            v-for="(image, index) in artworkImages" 
            :key="index"
            class="image-item"
          >
            <img 
              :src="image" 
              :alt="`${artworkInfo.title} - Image ${index + 1}`"
              loading="lazy"
              @error="handleImageError($event, index)"
            />
            <div class="image-number">{{ index + 1 }}/{{ artworkImages.length }}</div>
          </div>
        </div>

        <!-- 作品信息 -->
        <div class="artwork-info">
          <h2 class="artwork-title">{{ artworkInfo.title }}</h2>
          
          <div class="author-section">
            <img 
              :src="authorAvatar || defaultAvatar" 
              :alt="artworkInfo.author"
              class="author-avatar"
              @error="handleAvatarError"
            />
            <div class="author-details">
              <p class="author-name">{{ artworkInfo.author }}</p>
              <p class="author-subtitle">创作者</p>
            </div>
            <button class="follow-btn">关注</button>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <svg viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span>{{ stats.views.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>{{ stats.likes.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Markdown内容 -->
          <div class="markdown-content" v-if="markdownContent">
            <div v-html="markdownContent"></div>
          </div>

          <!-- 如果没有MD内容，显示默认描述 -->
          <div v-else class="description-section">
            <h3>作品介绍</h3>
            <p>{{ artworkDescription }}</p>
          </div>

          <!-- 标签 -->
          <div class="tags-section">
            <span class="tag" v-for="tag in artworkTags" :key="tag">
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider">
          <span>更多作品</span>
        </div>

        <!-- 更多作品瀑布流 -->
        <div class="more-artworks">
          <div 
            v-for="item in moreArtworks" 
            :key="item.id"
            class="artwork-card"
            @click="switchArtwork(item.id)"
          >
            <img 
              :src="item.thumbnail" 
              :alt="item.title"
              loading="lazy"
            />
            <div class="card-info">
              <p class="card-title">{{ item.title }}</p>
              <p class="card-author">{{ item.author.name }}</p>
            </div>
          </div>
        </div>

        <!-- 底部留白 -->
        <div class="bottom-spacing"></div>
      </div>
    </div>

    <!-- 浮动操作栏 -->
    <div class="floating-actions" :class="{ 'hidden': scrollDirection === 'down' }">
      <button class="action-btn" @click="handleLike">
        <svg viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span>{{ liked ? '已喜欢' : '喜欢' }}</span>
      </button>
      <button class="action-btn" @click="handleCollection">
        <svg viewBox="0 0 24 24">
          <path d="M22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.37L12 4l-1.44 2.91L7.38 7.38l2.29 2.23-.54 3.16L12 11.17l2.88 1.51-.54-3.16 2.29-2.23-3.18-.47z"/>
        </svg>
        <span>{{ collected ? '已收藏' : '收藏' }}</span>
      </button>
      <button class="action-btn primary" @click="handleDownload">
        <svg viewBox="0 0 24 24">
          <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
        </svg>
        <span>下载</span>
      </button>
      <button class="action-btn" @click="openCommentModal">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <span>评论{{ commentCount > 0 ? `(${commentCount})` : '' }}</span>
      </button>
    </div>

    <!-- 评论弹窗 -->
    <CommentModal
      :is-open="showCommentModal"
      :artwork-id="artworkInfo.id"
      :artwork-title="artworkInfo.title"
      @close="closeCommentModal"
      @comment-count-change="handleCommentCountChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGalleryStore } from '@/stores/gallery'
import { marked } from 'marked'
import CommentModal from '@/components/comments/CommentModal.vue'

const route = useRoute()
const router = useRouter()
const galleryStore = useGalleryStore()

// 主题相关
const isDarkTheme = ref(true)

// 加载状态
const loading = ref(true)

// 滚动相关
const contentRef = ref<HTMLElement>()
const scrollDirection = ref('up')
let lastScrollTop = 0

// 作品信息
const artworkInfo = ref({
  id: '',
  title: '',
  category: '',
  author: '未知作者'
})

// 作者头像
const authorAvatar = ref<string>('')
const defaultAvatar = 'https://i.pravatar.cc/150?img=1'

// 作品图片（所有图片，不只是缩略图）
const artworkImages = ref<string[]>([])

// Markdown内容
const markdownContent = ref('')

// 统计数据
const stats = ref({
  views: Math.floor(Math.random() * 10000 + 1000),
  likes: Math.floor(Math.random() * 1000 + 100)
})

// 交互状态
const liked = ref(false)
const collected = ref(false)

// 评论相关
const showCommentModal = ref(false)
const commentCount = ref(0)

// 分类标签映射
const categoryLabels: Record<string, string> = {
  mecha: '机甲设计',
  concept: '概念设计',
  illustration: '插画艺术',
  '77777': '测试分类',
  '新作品分类': '新作品分类'
}

// 获取分类显示名称
const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
}

// 加载作品数据（复用PC端的逻辑）
const loadArtworkData = async () => {
  loading.value = true
  const artworkId = route.params.id as string
  
  // 解析ID获取分类和作品名
  const parts = artworkId.split('-')
  let category = 'mecha'
  let workName = '作品001'
  
  if (parts.length >= 2) {
    category = parts[0]
    workName = parts.slice(1).join('-')
  }
  
  // 设置初始作品信息
  artworkInfo.value = {
    id: artworkId,
    title: `${workName} - ${getCategoryLabel(category)}`,
    category,
    author: '未知作者'
  }
  
  try {
    // 尝试从API获取动态作品数据
    const apiUrl = '/api/artworks'

    const response = await fetch(apiUrl)
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        const artwork = data.artworks.find((a: any) => 
          a.id === artworkId || a.title === workName
        )
        
        if (artwork) {
          // 加载所有图片（不只是缩略图）
          artworkImages.value = artwork.images.map((img: string) => img)

          artworkInfo.value.title = artwork.title
          artworkInfo.value.category = artwork.category

          // 使用API返回的作者信息
          if (artwork.authorName) {
            artworkInfo.value.author = artwork.authorName
          }
          if (artwork.authorAvatar) {
            authorAvatar.value = artwork.authorAvatar
          }
          
          // 加载MD文件
          await loadMarkdownContent(artwork.category, workName)
          loading.value = false
          return
        }
      }
    }
  } catch (error) {
    console.log('API请求失败，使用静态映射:', error)
  }
  
  // 使用静态映射加载图片
  const encodedWorkName = encodeURIComponent(workName)
  const basePath = `/artworks/${category}/${encodedWorkName}/`
  const imageCount = getImageCount(workName)

  const images = []
  for (let i = 1; i <= imageCount; i++) {
    images.push(`${basePath}image_${i}.webp`)
  }

  artworkImages.value = images.length > 0 ? images : [
    `${basePath}image_1.webp`
  ]
  
  // 加载Markdown文档
  await loadMarkdownContent(category, workName)
  loading.value = false
}

// 获取图片数量
const getImageCount = (workName: string): number => {
  const imageCount: Record<string, number> = {
    '作品001': 5,
    '作品002': 5,
    '作品003': 5,
    '作品004': 5,
    '作品005': 5,
    '作品006': 5,
    '作品007': 5,
    '作品008': 5,
    '作品009': 5,
    '作品010': 5,
    '作品011': 5,
    '作品012': 5,
    '作品013': 5,
    '作品014': 5,
    '作品015': 5,
    '作品016': 5,
    '作品017': 5,
    '作品018': 4,
    '测试2': 1
  }
  return imageCount[workName] || 5
}

// 加载Markdown内容
const loadMarkdownContent = async (category: string, workName: string) => {
  const encodedWorkName = encodeURIComponent(workName)
  const basePath = `/artworks/${category}/${encodedWorkName}/`
  
  // 尝试不同的MD文件名
  const possibleMdFiles = [
    `${encodedWorkName}.md`,
    '作品002.md',
    'index.md',
  ]
  
  for (const mdFileName of possibleMdFiles) {
    const mdUrl = `${basePath}${mdFileName}`

    try {
      const response = await fetch(mdUrl + `?t=${Date.now()}`)
      if (response.ok) {
        const mdText = await response.text()
        extractAuthorFromMarkdown(mdText)
        markdownContent.value = marked.parse(mdText) as string
        return
      }
    } catch (err) {
      console.log(`加载 ${mdFileName} 失败，继续尝试...`)
    }
  }
  
  // 如果都失败了，生成默认内容
  markdownContent.value = generateDefaultContent()
}

// 从Markdown文本中提取作者信息
const extractAuthorFromMarkdown = (mdText: string) => {
  // 提取作者名
  const authorMatch = mdText.match(/[-*]\s*\*\*作者\*\*[：:]\s*(.+)/)
  if (authorMatch && authorMatch[1]) {
    artworkInfo.value.author = authorMatch[1].trim()
  }
  
  // 提取作者头像
  const avatarMatch = mdText.match(/[-*]\s*\*\*(作者头像|头像)\*\*[：:]\s*(.+)/)
  if (avatarMatch && avatarMatch[2]) {
    authorAvatar.value = avatarMatch[2].trim()
  }
}

// 生成默认内容
const generateDefaultContent = () => {
  return marked.parse(`# ${artworkInfo.value.title}

## 作品信息
- **类别**: ${getCategoryLabel(artworkInfo.value.category)}
- **作者**: ${artworkInfo.value.author}
- **创建时间**: ${new Date().toLocaleDateString('zh-CN')}

## 作品描述
这是一组精心设计的作品，展现了独特的艺术风格和创作理念。

## 技术特点
- 精密的设计构思
- 独特的视觉表现
- 创新的艺术手法
- 优秀的整体效果`) as string
}

// 当前作品（从store获取完整信息）
const currentArtwork = computed(() => {
  const id = route.params.id as string
  return galleryStore.artworks.find(item => item.id === id)
})

// 作品描述（备用）
const artworkDescription = computed(() => {
  if (!currentArtwork.value) return ''
  return currentArtwork.value.description || 
    `这是一幅充满创意和想象力的${getCategoryLabel(artworkInfo.value.category)}作品。
    通过独特的视觉语言和精湛的技术表现，展现了作者对艺术的深刻理解。`
})

// 作品标签
const artworkTags = computed(() => {
  const tags = [artworkInfo.value.category, '原创', '精选']
  if (artworkInfo.value.category === 'mecha') {
    tags.push('机甲', '科幻')
  } else if (artworkInfo.value.category === 'concept') {
    tags.push('概念设计', '创意')
  } else if (artworkInfo.value.category === 'illustration') {
    tags.push('插画', '艺术')
  }
  return tags
})

// 更多作品（同类别的其他作品）
const moreArtworks = computed(() => {
  if (!currentArtwork.value) return []
  return galleryStore.artworks
    .filter(item => 
      item.category === artworkInfo.value.category && 
      item.id !== artworkInfo.value.id
    )
    .slice(0, 20)
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 切换作品
const switchArtwork = (id: string) => {
  router.push(`/m/artwork/${id}`)
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
}

// 处理滚动
const handleScroll = () => {
  if (!contentRef.value) return
  
  const scrollTop = contentRef.value.scrollTop
  
  if (scrollTop > lastScrollTop && scrollTop > 100) {
    scrollDirection.value = 'down'
  } else {
    scrollDirection.value = 'up'
  }
  
  lastScrollTop = scrollTop
}

// 点赞
const handleLike = () => {
  liked.value = !liked.value
}

// 收藏
const handleCollection = () => {
  collected.value = !collected.value
}

// 下载
const handleDownload = () => {
  artworkImages.value.forEach((image, index) => {
    const link = document.createElement('a')
    link.href = image
    link.download = `${artworkInfo.value.title}_${index + 1}.webp`
    link.click()
  })
}

// 评论相关
const openCommentModal = () => {
  showCommentModal.value = true
}

const closeCommentModal = () => {
  showCommentModal.value = false
}

const handleCommentCountChange = (count: number) => {
  commentCount.value = count
}

// 处理图片加载错误
const handleImageError = (event: Event, index: number) => {
  console.error(`图片 ${index + 1} 加载失败`)
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 处理头像加载错误
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultAvatar
}

// 初始化
onMounted(() => {
  // 初始化主题
  const savedTheme = localStorage.getItem('mobile-theme') || 'dark'
  isDarkTheme.value = savedTheme === 'dark'
  
  document.body.style.transition = 'background-color 0.3s ease'
  document.body.style.backgroundColor = isDarkTheme.value ? '#0a0a0a' : '#f5f5f5'
  
  // 确保store有数据
  if (galleryStore.artworks.length === 0) {
    galleryStore.fetchArtworks()
  }
  
  // 加载作品数据
  loadArtworkData()
})

// 监听路由变化
watch(() => route.params.id, () => {
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
  loadArtworkData()
})
</script>

<style scoped>
/* 基础样式 */
.mobile-artwork {
  min-height: 100vh;
  transition: background 0.3s, color 0.3s;
}

/* 暗色主题 */
.mobile-artwork.dark-theme {
  background: #0a0a0a;
  color: white;
}

/* 亮色主题 */
.mobile-artwork.light-theme {
  background: #f5f5f5;
  color: #333;
}

/* 顶部导航 */
.artwork-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 100;
}

.dark-theme .artwork-header {
  background: rgba(10, 10, 10, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.light-theme .artwork-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s;
  border-radius: 50%;
}

.back-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.back-btn svg {
  width: 24px;
  height: 24px;
}

.dark-theme .back-btn svg {
  fill: white;
}

.light-theme .back-btn svg {
  fill: #333;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 16px;
}

/* 内容区域 */
.artwork-content {
  padding-top: 56px;
  padding-bottom: 80px;
  overflow-y: auto;
  height: 100vh;
  -webkit-overflow-scrolling: touch;
}

/* 加载提示 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 图片容器 */
.images-container {
  background: #000;
}

.image-item {
  position: relative;
  width: 100%;
}

.image-item img {
  width: 100%;
  height: auto;
  display: block;
}

.image-number {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

/* 作品信息 */
.artwork-info {
  padding: 20px 16px;
}

.artwork-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* 作者信息 */
.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 2px;
}

.author-subtitle {
  font-size: 14px;
}

.dark-theme .author-subtitle {
  color: rgba(255, 255, 255, 0.6);
}

.light-theme .author-subtitle {
  color: rgba(0, 0, 0, 0.6);
}

.follow-btn {
  padding: 8px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.3s;
}

.follow-btn:active {
  transform: scale(0.95);
}

/* 统计信息 */
.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item svg {
  width: 20px;
  height: 20px;
}

.stat-item span {
  font-size: 14px;
}

.dark-theme .stat-item svg {
  fill: rgba(255, 255, 255, 0.6);
}

.dark-theme .stat-item span {
  color: rgba(255, 255, 255, 0.8);
}

.light-theme .stat-item svg {
  fill: rgba(0, 0, 0, 0.6);
}

.light-theme .stat-item span {
  color: rgba(0, 0, 0, 0.8);
}

/* Markdown内容 */
.markdown-content {
  margin-bottom: 20px;
  font-size: 15px;
  line-height: 1.8;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
}

.markdown-content :deep(h1) {
  font-size: 24px;
}

.markdown-content :deep(h2) {
  font-size: 20px;
}

.markdown-content :deep(h3) {
  font-size: 18px;
}

.markdown-content :deep(p) {
  margin-bottom: 12px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 12px;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin-bottom: 6px;
}

.dark-theme .markdown-content {
  color: rgba(255, 255, 255, 0.9);
}

.light-theme .markdown-content {
  color: rgba(0, 0, 0, 0.9);
}

/* 描述区域 */
.description-section {
  margin-bottom: 20px;
}

.description-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.description-section p {
  font-size: 15px;
  line-height: 1.6;
}

.dark-theme .description-section p {
  color: rgba(255, 255, 255, 0.8);
}

.light-theme .description-section p {
  color: rgba(0, 0, 0, 0.8);
}

/* 标签 */
.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.dark-theme .tag {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.light-theme .tag {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.8);
}

/* 分隔线 */
.divider {
  position: relative;
  text-align: center;
  margin: 32px 16px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider span {
  position: relative;
  padding: 0 16px;
  font-size: 14px;
}

.dark-theme .divider span {
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.6);
}

.light-theme .divider span {
  background: #f5f5f5;
  color: rgba(0, 0, 0, 0.6);
}

/* 更多作品 */
.more-artworks {
  padding: 0 16px;
}

.artwork-card {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.dark-theme .artwork-card {
  background: rgba(255, 255, 255, 0.05);
}

.light-theme .artwork-card {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.artwork-card:active {
  transform: scale(0.98);
}

.artwork-card img {
  width: 100%;
  height: auto;
  display: block;
}

.card-info {
  padding: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.card-author {
  font-size: 14px;
}

.dark-theme .card-author {
  color: rgba(255, 255, 255, 0.6);
}

.light-theme .card-author {
  color: rgba(0, 0, 0, 0.6);
}

/* 底部留白 */
.bottom-spacing {
  height: 100px;
}

/* 浮动操作栏 */
.floating-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  backdrop-filter: blur(10px);
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  z-index: 100;
  transition: transform 0.3s;
}

.dark-theme .floating-actions {
  background: rgba(10, 10, 10, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.light-theme .floating-actions {
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.floating-actions.hidden {
  transform: translateY(100%);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.dark-theme .action-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: white;
}

.light-theme .action-btn {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #333;
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.action-btn svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* 针对1080x2408分辨率优化 */
@media (width: 1080px) and (height: 2408px) {
  .artwork-header {
    height: 64px;
    padding: 0 20px;
  }
  
  .header-title {
    font-size: 20px;
  }
  
  .artwork-content {
    padding-top: 64px;
  }
  
  .artwork-info {
    padding: 24px 20px;
  }
  
  .artwork-title {
    font-size: 28px;
  }
}
</style>