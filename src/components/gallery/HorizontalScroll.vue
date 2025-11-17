<template>
  <section class="horizontal-scroll-section">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-text">精选推荐</span>
        <span class="title-badge">New</span>
      </h2>
    </div>
    
    <div class="scroll-container-wrapper">
      <!-- 左侧液态玻璃按钮 -->
      <button 
        class="glass-nav-btn left" 
        @click="scrollPrev" 
        :class="{ visible: canScrollPrev }"
      >
        <span class="nav-icon">‹</span>
      </button>
      
      <!-- 右侧液态玻璃按钮 -->
      <button 
        class="glass-nav-btn right" 
        @click="scrollNext" 
        :class="{ visible: canScrollNext }"
      >
        <span class="nav-icon">›</span>
      </button>
      
      <div class="horizontal-scroll" ref="scrollContainer">
        <div class="horizontal-wrapper" ref="scrollWrapper">
        <div 
          v-for="(item, index) in featuredItems" 
          :key="item.id"
          class="scroll-item"
          :data-index="index"
          @click="handleItemClick(item)"
        >
          <div class="item-image">
            <img :src="item.image" :alt="item.title" />
            <div class="item-overlay">
              <span class="item-category">{{ item.category }}</span>
            </div>
            <div class="item-hover-info">
              <h4 class="hover-title">{{ item.title }}</h4>
              <p class="hover-description">{{ item.realDescription || item.description || '暂无描述' }}</p>
              <div class="hover-meta">
                <span class="hover-author">
                  <i class="fas fa-user"></i>
                  {{ item.author }}
                </span>
              </div>
            </div>
          </div>
          <div class="item-info">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-author">{{ item.author }}</p>
          </div>
        </div>
        </div>
      </div>
    </div>
    
    <!-- 进度指示器 -->
    <div class="scroll-progress">
      <div class="progress-dots">
        <span 
          v-for="(item, index) in Math.ceil(featuredItems.length / 3)" 
          :key="index"
          class="progress-dot"
          :class="{ active: Math.floor(scrollProgress / (100 / Math.ceil(featuredItems.length / 3))) === index }"
        ></span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransitionStore } from '@/stores/transition'
import { useGalleryStore } from '@/stores/gallery'
import { useMobile } from '@/composables/useMobile'

const router = useRouter()
const transitionStore = useTransitionStore()
const galleryStore = useGalleryStore()
const { isMobile } = useMobile()
const scrollContainer = ref<HTMLElement>()
const scrollWrapper = ref<HTMLElement>()
const scrollPosition = ref(0)
const maxScroll = ref(0)

// 定义类型
interface FeaturedItem {
  id: string
  title: string
  category: string
  author: string
  image: string
  description: string
  realDescription?: string
}

// 从API数据中获取精选作品
const featuredItems = computed(() => {
  // 筛选出标记为精选的作品
  const featured = galleryStore.artworks.filter(artwork => artwork.isFeatured)
  
  // 转换为组件需要的格式
  const convertedFeatured = featured.map(artwork => ({
    id: artwork.id,
    title: artwork.title,
    category: getCategoryLabel(artwork.category),
    author: artwork.author.name,
    image: artwork.thumbnail,
    description: artwork.description || getDefaultDescription(artwork.category),
    realDescription: artwork.description
  }))
  
  // 如果没有精选作品，返回前6个热门作品
  if (convertedFeatured.length === 0) {
    return galleryStore.artworks.slice(0, 6).map(artwork => ({
      id: artwork.id,
      title: artwork.title,
      category: getCategoryLabel(artwork.category),
      author: artwork.author.name,
      image: artwork.thumbnail,
      description: artwork.description || getDefaultDescription(artwork.category),
      realDescription: artwork.description
    }))
  }
  
  return convertedFeatured
})

// 获取分类显示名称
const getCategoryLabel = (category: string) => {
  const categoryLabels: Record<string, string> = {
    mecha: '机甲设计',
    concept: '概念设计', 
    illustration: '插画艺术'
  }
  return categoryLabels[category] || category
}

// 获取默认描述
const getDefaultDescription = (category: string) => {
  const descriptions: Record<string, string> = {
    mecha: '精心设计的机甲作品，展现了独特的机械美学和未来科技感。',
    concept: '充满创意的概念设计，将想象力与技术完美结合。',
    illustration: '细腻的数字插画作品，展现了光与影的完美平衡。'
  }
  return descriptions[category] || '精美的数字艺术作品，体现了创作者的独特视角。'
}

// 计算滚动进度
const scrollProgress = computed(() => {
  if (maxScroll.value === 0) return 0
  return (scrollPosition.value / maxScroll.value) * 100
})

// 是否可以向前/后滚动
const canScrollPrev = computed(() => scrollPosition.value > 10)
const canScrollNext = computed(() => scrollPosition.value < maxScroll.value - 10)

// 滚动控制
const scrollPrev = () => {
  if (!scrollContainer.value) return
  const scrollAmount = scrollContainer.value.offsetWidth * 0.8
  scrollContainer.value.scrollBy({
    left: -scrollAmount,
    behavior: 'smooth'
  })
}

const scrollNext = () => {
  if (!scrollContainer.value) return
  const scrollAmount = scrollContainer.value.offsetWidth * 0.8
  scrollContainer.value.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  })
}

// 处理点击
const handleItemClick = (item: any) => {
  // 使用全局过渡动画
  transitionStore.startTransition(`/artwork/${item.id}`, 'forward')
}

// 更新滚动位置
const updateScrollPosition = () => {
  if (!scrollContainer.value) return
  scrollPosition.value = scrollContainer.value.scrollLeft
  maxScroll.value = scrollContainer.value.scrollWidth - scrollContainer.value.offsetWidth
}

// 鼠标拖拽滚动
let isDown = false
let startX = 0
let scrollLeft = 0

const handleMouseDown = (e: MouseEvent) => {
  if (!scrollContainer.value) return
  isDown = true
  scrollContainer.value.classList.add('active')
  startX = e.pageX - scrollContainer.value.offsetLeft
  scrollLeft = scrollContainer.value.scrollLeft
}

const handleMouseLeave = () => {
  isDown = false
  scrollContainer.value?.classList.remove('active')
}

const handleMouseUp = () => {
  isDown = false
  scrollContainer.value?.classList.remove('active')
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDown || !scrollContainer.value) return
  e.preventDefault()
  const x = e.pageX - scrollContainer.value.offsetLeft
  const walk = (x - startX) * 2
  scrollContainer.value.scrollLeft = scrollLeft - walk
}

// 鼠标滚轮横向滚动 - 优化流畅度
const handleWheel = (e: WheelEvent) => {
  if (!scrollContainer.value) return
  e.preventDefault()
  e.stopPropagation()
  
  // 使用更平滑的滚动，减少滚动速度
  const scrollAmount = e.deltaY * 0.5  // 减少滚动速度使其更流畅
  
  // 直接设置scrollLeft，避免动画冲突
  scrollContainer.value.scrollLeft += scrollAmount
}

onMounted(async () => {
  // 获取真实的作品数据
  await galleryStore.fetchArtworks()
  
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', updateScrollPosition)
    
    // 只在PC端添加鼠标拖拽和滚轮事件
    if (!isMobile.value) {
      scrollContainer.value.addEventListener('mousedown', handleMouseDown)
      scrollContainer.value.addEventListener('mouseleave', handleMouseLeave)
      scrollContainer.value.addEventListener('mouseup', handleMouseUp)
      scrollContainer.value.addEventListener('mousemove', handleMouseMove)
      scrollContainer.value.addEventListener('wheel', handleWheel, { passive: false })
    }
    
    // 初始化滚动位置
    updateScrollPosition()
  }
  
  // 入场动画 - 仅PC端
  const isMobileDevice = document.documentElement.classList.contains('mobile-device') || isMobile.value
  if (!isMobileDevice && typeof window !== 'undefined' && window.anime) {
    window.anime({
      targets: '.scroll-item',
      opacity: [0, 1],
      translateY: [30, 0],
      delay: window.anime.stagger(100),
      duration: 800,
      easing: 'easeOutExpo'
    })
  } else if (isMobileDevice) {
    // 移动端直接显示
    setTimeout(() => {
      const items = document.querySelectorAll('.scroll-item')
      items.forEach(item => {
        ;(item as HTMLElement).style.opacity = '1'
      })
    }, 100)
  }
})

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', updateScrollPosition)
    
    // 只在PC端移除鼠标事件
    if (!isMobile.value) {
      scrollContainer.value.removeEventListener('mousedown', handleMouseDown)
      scrollContainer.value.removeEventListener('mouseleave', handleMouseLeave)
      scrollContainer.value.removeEventListener('mouseup', handleMouseUp)
      scrollContainer.value.removeEventListener('mousemove', handleMouseMove)
      scrollContainer.value.removeEventListener('wheel', handleWheel)
    }
  }
})
</script>

<style scoped>
.horizontal-scroll-section {
  padding: var(--space-16) 0;
  position: relative;
  overflow: visible;
  width: calc(100vw - var(--scrollbar-width, 0px));
  margin-left: calc(50% - (100vw - var(--scrollbar-width, 0px)) / 2);
}

.section-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 var(--space-8);
  margin-bottom: var(--space-6);
  text-align: left;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
  color: var(--color-text-primary) !important;
}

.title-text {
  color: var(--color-text-primary) !important;
}

.title-badge {
  padding: var(--space-1) var(--space-3);
  background: var(--gradient-brand);
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

/* 滚动容器包装器 */
.scroll-container-wrapper {
  position: relative;
  width: 100%;
}

/* Apple风格液态玻璃按钮 - 椭圆形 */
.glass-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 80px;
  height: 100px;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 12px 48px 0 rgba(31, 38, 135, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 80px rgba(79, 70, 229, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-nav-btn.visible {
  opacity: 1;
  visibility: visible;
}

.glass-nav-btn.left {
  left: var(--space-6);
}

.glass-nav-btn.right {
  right: var(--space-6);
}

.glass-nav-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-50%) scale(1.08);
  box-shadow: 
    0 16px 56px 0 rgba(31, 38, 135, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    0 0 120px rgba(79, 70, 229, 0.25);
  border-color: rgba(255, 255, 255, 0.25);
}

.glass-nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.nav-icon {
  font-size: 36px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 200;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 横向滚动容器 */
.horizontal-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  padding: 0 calc(var(--space-4) + 70px); /* 减少左右padding */
  cursor: grab;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  width: 100%;
  will-change: scroll-position;
  /* 防止iOS弹性滚动影响 */
  overscroll-behavior-x: contain;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.horizontal-scroll.active {
  cursor: grabbing;
}

.horizontal-wrapper {
  display: flex;
  gap: calc(var(--space-1) * 0.5); /* 大幅减少间距 */
  padding: var(--space-2) 0;
  width: max-content;
}

/* 滚动项目 */
.scroll-item {
  flex: 0 0 clamp(300px, 22vw, 420px);  /* 大幅增加宽度 */
  cursor: pointer;
  opacity: 0;
  transition: transform var(--duration-normal) var(--ease-out-expo);
}

.scroll-item:hover {
  transform: translateY(-8px);
}

.item-image {
  position: relative;
  aspect-ratio: 3/5;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-secondary);
  margin-bottom: var(--space-3);
  height: 500px;  /* 增加高度 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out-expo);
}

.scroll-item:hover .item-image img {
  transform: scale(1.1);
}

.item-overlay {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  padding: var(--space-2) var(--space-3);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  color: white;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-lg);
  z-index: 2;
}

/* 悬停信息卡片 */
.item-hover-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-6) var(--space-4) var(--space-4);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%);
  color: white;
  transform: translateY(100%);
  transition: transform var(--duration-normal) var(--ease-out-expo);
  z-index: 3;
}

.scroll-item:hover .item-hover-info {
  transform: translateY(0);
}

.hover-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-2);
  color: white;
}

.hover-description {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hover-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.hover-author {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.8);
}

.hover-author i {
  font-size: 12px;
}

.item-info {
  padding: 0 var(--space-2);
}

.item-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.item-author {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* 进度指示器 */
.scroll-progress {
  max-width: var(--container-max);
  margin: var(--space-6) auto 0;
  padding: 0 var(--space-8);
  display: flex;
  justify-content: center;
}

.progress-dots {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all var(--duration-normal) var(--ease-out-expo);
  cursor: pointer;
}

.progress-dot.active {
  width: 24px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
}

/* 不同主题下的点颜色 */
[data-theme="light"] .progress-dot {
  background: rgba(10, 10, 10, 0.2);
}

[data-theme="light"] .progress-dot.active {
  background: rgba(10, 10, 10, 0.8);
}

[data-theme="gray"] .progress-dot {
  background: rgba(30, 41, 59, 0.2);
}

[data-theme="gray"] .progress-dot.active {
  background: rgba(30, 41, 59, 0.8);
}

/* 响应式 */
@media (min-width: 3200px) {
  .scroll-item {
    flex: 0 0 clamp(380px, 16vw, 500px);  /* 4K屏幕更大尺寸 */
  }
  
  .horizontal-wrapper {
    gap: var(--space-1);
  }
  
  .item-image {
    height: 600px;
  }
}

@media (max-width: 1440px) {
  .scroll-item {
    flex: 0 0 clamp(280px, 20vw, 380px);
  }
  
  .item-image {
    height: 450px;
  }
}

@media (max-width: 1024px) {
  .scroll-item {
    flex: 0 0 clamp(160px, 15vw, 220px);
  }
  
  .item-image {
    height: 300px;
  }
}

@media (max-width: 768px), (max-width: 1200px) and (max-height: 2500px) and (orientation: portrait) {
  .horizontal-scroll-section {
    padding: var(--space-6) 0;
    position: relative;
    width: 100%;
  }
  
  /* 移动端显示导航按钮 */
  .glass-nav-btn {
    display: flex !important;
    opacity: 1 !important;
    visibility: visible !important;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  
  .glass-nav-btn.left {
    left: 5px;
  }
  
  .glass-nav-btn.right {
    right: 5px;
  }
  
  .nav-icon {
    font-size: 18px;
    color: #333;
    font-weight: 600;
    text-shadow: none;
  }
  
  .horizontal-scroll {
    padding: 0 50px; /* 为按钮留出固定空间 */
    overflow-x: auto !important; /* 启用触摸滚动 */
    overflow-y: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
    scroll-snap-type: x mandatory; /* 吸附滚动 */
    touch-action: pan-x; /* 只允许横向滑动 */
  }
  
  /* 移动端显示简单的滚动条 */
  .horizontal-scroll::-webkit-scrollbar {
    display: block;
    height: 4px;
  }
  
  .horizontal-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  .horizontal-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  .horizontal-wrapper {
    gap: 10px;
    padding: 10px 0;
    display: flex;
    width: max-content;
  }
  
  .scroll-item {
    flex: 0 0 calc(100vw - var(--scrollbar-width, 0px) - 90px); /* 单个项目占满宽度，留出按钮空间 */
    max-width: calc(100vw - var(--scrollbar-width, 0px) - 90px);
    min-width: calc(100vw - var(--scrollbar-width, 0px) - 90px);
    scroll-snap-align: start; /* 吸附对齐到开始位置 */
    opacity: 1 !important; /* 确保移动端直接显示 */
  }
  
  .item-image {
    height: 280px;
    aspect-ratio: 3/4;
    border-radius: 12px;
  }
  
  /* 移动端不显示悬停信息 */
  .item-hover-info {
    display: none;
  }
  
  .item-title {
    font-size: var(--text-base);
  }
  
  .item-author {
    font-size: var(--text-xs);
  }
  
  .section-title {
    font-size: var(--text-xl);
    padding: 0 var(--space-3);
    color: var(--color-text-primary) !important;
  }
  
  .title-text {
    color: var(--color-text-primary) !important;
  }
  
  .section-header {
    margin-bottom: var(--space-4);
  }
  
  /* 进度指示器更显眼 */
  .progress-dot {
    width: 6px;
    height: 6px;
  }
  
  .progress-dot.active {
    width: 16px;
  }
}

@media (max-width: 480px) {
  .scroll-item {
    flex: 0 0 calc(100vw - var(--scrollbar-width, 0px) - 80px);
    max-width: calc(100vw - var(--scrollbar-width, 0px) - 80px);
    min-width: calc(100vw - var(--scrollbar-width, 0px) - 80px);
  }
  
  .item-image {
    height: 260px;
  }
  
  .section-title {
    font-size: var(--text-lg);
  }
  
  .glass-nav-btn {
    width: 32px;
    height: 32px;
  }
  
  .nav-icon {
    font-size: 16px;
  }
}
</style>
