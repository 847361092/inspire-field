<template>
  <div class="mobile-home" :class="isDarkTheme ? 'dark-theme' : 'light-theme'">
    <!-- 顶部搜索栏 -->
    <header class="mobile-header">
      <!-- Logo -->
      <img :src="currentLogoSrc" alt="Voxel Union" class="logo-image" />
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="搜索作品..."
          class="search-input"
          @input="handleSearch"
        />
        <svg class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </div>
      <!-- 主题切换按钮 -->
      <button class="theme-toggle-btn" @click="toggleTheme" :title="isDarkTheme ? '切换到亮色主题' : '切换到暗夜主题'">
        <img 
          :src="isDarkTheme ? eyeClosed : eyeOpen" 
          alt="主题切换" 
          class="theme-icon-img"
        />
      </button>
    </header>

    <!-- 精选推荐区域 -->
    <section class="featured-section">
      <h2 class="section-title">精选推荐</h2>
      <div class="featured-carousel">
        <button class="carousel-btn prev" @click.stop="prevSlide" :disabled="currentSlide === 0">
          <svg viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <div 
          class="carousel-container" 
          ref="carouselRef"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div 
            class="carousel-track" 
            :style="{ 
              transform: `translateX(calc(-${currentSlide * 100}% + ${touchOffset}px))`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }"
          >
            <div 
              v-for="(item, index) in featuredArtworks" 
              :key="item.id"
              class="featured-item"
              @click="openArtwork(item.id)"
            >
              <img 
                :src="item.thumbnail" 
                :alt="item.title"
                loading="lazy"
              />
              <div class="featured-info">
                <h3>{{ item.title }}</h3>
                <p>{{ item.author.name }}</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          class="carousel-btn next" 
          @click.stop="nextSlide"
          :disabled="currentSlide >= featuredArtworks.length - 1"
        >
          <svg viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- 精选作品网格 -->
    <section class="gallery-section">
      <h2 class="section-title">精选作品</h2>
      
      <!-- 分类筛选 -->
      <div class="category-filter">
        <button 
          v-for="cat in categories" 
          :key="cat.value"
          class="category-btn" 
          :class="{ active: selectedCategory === cat.value }"
          @click="selectCategory(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>
      
      <div class="gallery-grid">
        <div 
          v-for="item in displayedArtworks" 
          :key="item.id"
          class="gallery-item"
          @click="openArtwork(item.id)"
        >
          <img 
            :src="item.thumbnail" 
            :alt="item.title"
            loading="lazy"
          />
          <div class="gallery-info">
            <p class="gallery-title">{{ item.title }}</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 分页组件 - 移到section外面避免事件冲突 -->
    <div class="pagination-section" @click.stop>
      <Pagination 
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :max-visible-pages="3"
        @page-change="handlePageChange"
      />
    </div>

    <!-- 过场动画组件 -->
    <MobileTransition ref="transitionRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGalleryStore } from '@/stores/gallery'
import MobileTransition from '@/components/mobile/MobileTransition.vue'
import Pagination from '@/components/ui/Pagination.vue'
import logoWhite from '@/assets/logo-white.png'
import logoDark from '@/assets/logo-dark.png'
import eyeOpen from '@/assets/eye-open.png'
import eyeClosed from '@/assets/eye-closed.png'

const router = useRouter()
const galleryStore = useGalleryStore()
const transitionRef = ref()

// 搜索相关
const searchQuery = ref('')

// 主题相关
const isDarkTheme = ref(true) // 默认暗色主题

// 根据主题选择Logo图片
const currentLogoSrc = computed(() => {
  return isDarkTheme.value ? logoWhite : logoDark
})

// 分类相关
const selectedCategory = ref('all')
// 动态从作品数据中获取分类
const categories = computed(() => {
  const categorySet = new Set(galleryStore.artworks.map(item => item.category))
  const categoryMap: Record<string, string> = {
    'mecha': '机甲',
    'concept': '概念',
    'illustration': '插画',
    '77777': '77777',
    '新作品分类': '新作品分类'
  }
  
  const result = [{ label: '全部', value: 'all' }]
  
  // 添加所有发现的分类
  categorySet.forEach(cat => {
    if (cat) {
      result.push({
        label: categoryMap[cat] || cat,
        value: cat
      })
    }
  })
  
  return result
})

// 轮播相关
const currentSlide = ref(0)
const carouselRef = ref<HTMLElement>()

// 触摸滑动相关
const touchStartX = ref(0)
const touchOffset = ref(0)
const isDragging = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = 12 // 3行 x 4列的田字格

// 获取精选推荐（与PC端逻辑完全一致）
const featuredArtworks = computed(() => {
  // 筛选出标记为精选的作品
  const featured = galleryStore.artworks.filter(artwork => artwork.isFeatured)
  
  // 如果没有精选作品，返回前6个热门作品
  if (featured.length === 0) {
    // 按时间排序所有作品（最新的在前）
    const sortedArtworks = [...galleryStore.artworks].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return b.id.localeCompare(a.id)
    })
    return sortedArtworks.slice(0, 6)
  }
  
  // 如果有精选作品，只返回精选作品（与PC端一致）
  return featured
})

// 获取过滤后的作品列表
const filteredArtworks = computed(() => {
  let filtered = [...galleryStore.artworks]
  
  // 先按时间排序（最新的在前）
  filtered.sort((a, b) => {
    // 使用createdAt字段排序，如果没有则按ID倒序
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return b.id.localeCompare(a.id)
  })
  
  // 分类筛选
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(item => item.category === selectedCategory.value)
  }
  
  // 搜索筛选
  if (searchQuery.value) {
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.author.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return filtered
})

// 获取当前页显示的作品
const displayedArtworks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredArtworks.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredArtworks.value.length / pageSize)
})

// 总作品数
const totalItems = computed(() => {
  return filteredArtworks.value.length
})

// 分类选择
const selectCategory = (category: string) => {
  selectedCategory.value = category
  currentPage.value = 1 // 重置分页
}

// 主题切换
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  const theme = isDarkTheme.value ? 'dark' : 'light'
  localStorage.setItem('mobile-theme', theme)
  
  // 更新HTML根元素的data-theme属性，让过渡动画组件能正确识别主题
  document.documentElement.setAttribute('data-theme', theme)
  
  // 同时更新body背景色
  document.body.style.backgroundColor = isDarkTheme.value ? '#0a0a0a' : '#f5f5f5'
}

// 轮播控制
const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

const nextSlide = () => {
  if (currentSlide.value < featuredArtworks.value.length - 1) {
    currentSlide.value++
  }
}

// 触摸滑动处理
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  isDragging.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  const currentX = e.touches[0].clientX
  touchOffset.value = currentX - touchStartX.value
}

const handleTouchEnd = () => {
  isDragging.value = false
  const threshold = 50 // 滑动阈值
  
  if (touchOffset.value > threshold && currentSlide.value > 0) {
    // 向右滑动，显示上一张
    currentSlide.value--
  } else if (touchOffset.value < -threshold && currentSlide.value < featuredArtworks.value.length - 1) {
    // 向左滑动，显示下一张
    currentSlide.value++
  }
  
  // 重置偏移
  touchOffset.value = 0
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1 // 重置分页
}

// 处理页码变化
const handlePageChange = (page: number) => {
  // 防止事件冒泡
  event?.stopPropagation?.()
  
  currentPage.value = page
  // 滚动到顶部 - 滚动到精选作品区域
  const gallerySection = document.querySelector('.gallery-section')
  if (gallerySection) {
    gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 打开作品详情
const openArtwork = async (id: string) => {
  // 先播放过场动画
  await transitionRef.value?.play()
  // 动画播放到一半时切换路由
  setTimeout(() => {
    router.push(`/m/artwork/${id}`)
  }, 600)
}

// 初始化
onMounted(() => {
  // 初始化主题（默认暗色）
  const savedTheme = localStorage.getItem('mobile-theme') || 'dark'
  isDarkTheme.value = savedTheme === 'dark'
  
  // 初始化时也要设置HTML根元素的data-theme属性
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  // 设置body背景色和过渡效果
  document.body.style.transition = 'background-color 0.3s ease'
  document.body.style.backgroundColor = isDarkTheme.value ? '#0a0a0a' : '#f5f5f5'
  
  // 加载作品数据
  if (galleryStore.artworks.length === 0) {
    galleryStore.fetchArtworks()
  }
})
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --color-primary: #6366f1;
}

/* 基础样式 */
.mobile-home {
  min-height: 100vh;
  padding-bottom: 60px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 暗色主题 - 默认 */
.mobile-home.dark-theme {
  background-color: #0a0a0a !important;
  color: white !important;
}

.mobile-home.dark-theme .mobile-header {
  background: rgba(10, 10, 10, 0.95) !important;
  border-bottom-color: rgba(255, 255, 255, 0.1) !important;
}

.mobile-home.dark-theme .search-input {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: white !important;
}

.mobile-home.dark-theme .search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.mobile-home.dark-theme .search-icon {
  fill: rgba(255, 255, 255, 0.5);
}

.mobile-home.dark-theme .theme-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-home.dark-theme .section-title {
  color: white !important;
}

.mobile-home.dark-theme .featured-info h3 {
  color: white !important;
}

.mobile-home.dark-theme .featured-info p {
  color: rgba(255, 255, 255, 0.6) !important;
}

.mobile-home.dark-theme .category-btn {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.mobile-home.dark-theme .category-btn.active {
  background: rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: rgba(99, 102, 241, 0.4);
  color: #fff;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
}

.mobile-home.dark-theme .gallery-item {
  background: rgba(255, 255, 255, 0.05) !important;
}

.mobile-home.dark-theme .gallery-title {
  color: white !important;
}

.mobile-home.dark-theme .load-more-btn {
  background: var(--color-primary);
  color: white;
}

/* 亮色主题 */
.mobile-home.light-theme {
  background-color: #f5f5f5 !important;
  color: #333 !important;
}

.mobile-home.light-theme .mobile-header {
  background: rgba(255, 255, 255, 0.95) !important;
  border-bottom-color: rgba(0, 0, 0, 0.1) !important;
}

.mobile-home.light-theme .search-input {
  background: rgba(0, 0, 0, 0.05) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  color: #333 !important;
}

.mobile-home.light-theme .search-input::placeholder {
  color: #999;
}

.mobile-home.light-theme .search-icon {
  fill: #666;
}

.mobile-home.light-theme .theme-toggle-btn {
  background: rgba(0, 0, 0, 0.08);
}

.mobile-home.light-theme .section-title {
  color: #333 !important;
}

.mobile-home.light-theme .featured-info h3 {
  color: #333 !important;
}

.mobile-home.light-theme .featured-info p {
  color: #666 !important;
}

.mobile-home.light-theme .category-btn {
  background: rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-color: rgba(0, 0, 0, 0.08);
  color: #666;
}

.mobile-home.light-theme .category-btn::before {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
}

.mobile-home.light-theme .category-btn.active {
  background: rgba(99, 102, 241, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: rgba(99, 102, 241, 0.3);
  color: #4F46E5;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}

.mobile-home.light-theme .gallery-item {
  background: white !important;
}

.mobile-home.light-theme .gallery-title {
  color: #333 !important;
}

.mobile-home.light-theme .load-more-btn {
  background: var(--color-primary);
  color: white;
}

/* 头部搜索栏 */
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.3s, border-color 0.3s;
}

/* Logo */
.logo-image {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 500px;
}

/* 主题切换按钮 */
.theme-toggle-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 8px;
}

.theme-toggle-btn:active {
  transform: scale(0.9);
}

.theme-icon {
  font-size: 20px;
  line-height: 1;
}

.theme-icon-img {
  width: 20px;
  height: 20px;
  display: block;
}

/* PNG图标样式 - 不需要颜色反转 */
.mobile-home.dark-theme .theme-icon-img {
  filter: none;
}

.mobile-home.light-theme .theme-icon-img {
  filter: none;
}


.search-input {
  width: 100%;
  height: 44px;
  padding: 0 44px 0 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  color: white;
  font-size: 16px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--color-primary);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  fill: rgba(255, 255, 255, 0.5);
}

/* 精选推荐区域 */
.featured-section {
  padding: 24px 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0 16px 16px;
}

.featured-carousel {
  position: relative;
}

.carousel-container {
  overflow: hidden;
  padding: 0 16px;
  touch-action: pan-y;
  user-select: none;
}

.carousel-track {
  display: flex;
  will-change: transform;
}

.featured-item {
  flex: 0 0 100%;
  padding: 0 8px;
  cursor: pointer;
}

.featured-item img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: 12px;
  transition: transform 0.3s;
}

.featured-item:active img {
  transform: scale(0.98);
}

.featured-info {
  padding: 12px 0;
}

.featured-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.featured-info p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;
}

.carousel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-btn svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.carousel-btn.prev {
  left: 8px;
}

.carousel-btn.next {
  right: 8px;
}

/* 作品网格 */
.gallery-section {
  padding: 0 16px 24px;
}

/* 分类筛选 */
.category-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-filter::-webkit-scrollbar {
  display: none;
}

.category-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.category-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.category-btn:active::before {
  opacity: 1;
}

.category-btn.active {
  background: rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: rgba(99, 102, 241, 0.4);
  color: #fff;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
}

.category-btn:active {
  transform: scale(0.95);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.gallery-item:active img {
  transform: scale(0.95);
}

.gallery-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
}

.gallery-title {
  font-size: 12px;
  color: white;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

/* 分页区域 */
.pagination-section {
  padding: 0 16px 32px;
  background: inherit;
  position: relative;
  z-index: 100; /* 提高层级避免点击穿透 */
  pointer-events: auto; /* 确保可以接收点击事件 */
}

/* 分页组件样式覆盖（移动端） */
.pagination-section :deep(.pagination-container) {
  padding: 24px 0;
}

.pagination-section :deep(.pagination-wrapper) {
  gap: 4px;
}

.pagination-section :deep(.pagination-btn) {
  min-width: 38px;
  height: 38px;
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
  color: var(--color-primary);
  font-weight: 600;
}

.pagination-section :deep(.pagination-btn:hover:not(:disabled)) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.pagination-section :deep(.pagination-btn.active) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.dark-theme .pagination-section :deep(.pagination-btn) {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.light-theme .pagination-section :deep(.pagination-btn) {
  background: rgba(79, 70, 229, 0.1);
  border-color: rgba(79, 70, 229, 0.3);
  color: #4F46E5;
}

.pagination-section :deep(.pagination-info) {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.pagination-section :deep(.jump-input-wrapper) {
  display: none; /* 移动端隐藏快速跳转 */
}

/* 响应式适配 */
@media (min-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .featured-item img {
    height: 320px;
  }
}

/* 针对1080x2408分辨率优化 */
@media (width: 1080px) and (height: 2408px) {
  .mobile-header {
    padding: 16px 20px;
  }
  
  .search-input {
    height: 48px;
    font-size: 18px;
  }
  
  .featured-item img {
    height: 480px;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
</style>