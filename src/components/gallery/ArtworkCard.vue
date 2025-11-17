<template>
  <article 
    class="artwork-card"
    ref="cardRef"
    @click="navigateToDetail"
  >
    <!-- 图片容器 -->
    <div class="artwork-image-wrapper">
      <img 
        :src="artwork.thumbnail"
        :alt="artwork.title"
        class="artwork-image"
        loading="lazy"
        @load="onImageLoad"
        @error="onImageError"
      />
      
      <!-- 加载状态 -->
      <div v-if="!imageLoaded" class="image-skeleton skeleton"></div>
      
      <!-- 悬停遮罩层 -->
      <div class="artwork-overlay">
        <!-- 作品描述 -->
        <div class="overlay-info">
          <p class="overlay-description">{{ artwork.description || '暂无描述' }}</p>
        </div>
      </div>
      
      <!-- 噪点纹理 -->
      <div class="noise-layer"></div>
    </div>
    
    <!-- 信息区 -->
    <div class="artwork-info">
      <h3 class="artwork-title">{{ artwork.title }}</h3>
      <div class="artwork-meta">
        <img
          :src="authorAvatarSrc"
          class="author-avatar"
          :alt="artwork.author.name"
          loading="lazy"
          @error="handleAuthorAvatarError"
        />
        <span class="author-name">{{ artwork.author.name }}</span>
        <span class="stats">
          <i class="far fa-eye"></i> {{ formatNumber(artwork.views) }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const defaultAuthorAvatar = '/images/default-author.svg'
const authorAvatarSrc = ref(defaultAuthorAvatar)
const avatarErrorCount = ref(0)

const pickAuthorAvatar = () => {
  avatarErrorCount.value = 0
  authorAvatarSrc.value =
    props.artwork.authorAvatar ||
    props.artwork.author?.avatar ||
    defaultAuthorAvatar
}

watch(() => props.artwork.id, pickAuthorAvatar, { immediate: true })

const handleAuthorAvatarError = () => {
  avatarErrorCount.value += 1
  if (avatarErrorCount.value === 1 && props.artwork.author?.avatar && authorAvatarSrc.value !== props.artwork.author.avatar) {
    authorAvatarSrc.value = props.artwork.author.avatar
    return
  }
  authorAvatarSrc.value = defaultAuthorAvatar
}

interface Artwork {
  id: string
  title: string
  thumbnail: string
  width: number
  height: number
  author: {
    name: string
    avatar: string
  }
  views: number
  likes: number
  description?: string
  authorAvatar?: string
}

const props = defineProps<{
  artwork: Artwork
  delay?: number
}>()

const emit = defineEmits<{
  click: []
}>()

const cardRef = ref<HTMLElement>()
const liked = ref(false)
const saved = ref(false)
const imageLoaded = ref(false)
const imageErrorCount = ref(0)

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 图片加载完成
const onImageLoad = () => {
  imageLoaded.value = true
}

// 图片加载失败处理
const onImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  imageErrorCount.value++
  
  // 防止无限循环
  if (imageErrorCount.value > 2) {
    // 使用纯色占位图
    img.style.display = 'none'
    imageLoaded.value = false
    return
  }
  
  // 尝试备用图片路径
  if (imageErrorCount.value === 1) {
    // 尝试使用默认图片
    img.src = '/images/default-avatar.jpg'
  } else {
    // 最后使用占位图
    img.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=`
  }
}

// 鼠标悬停动画 - 暂时简化，避免动画冲突
const handleMouseEnter = (e: MouseEvent) => {
  // 暂时禁用复杂动画，只使用CSS过渡
}

const handleMouseLeave = (e: MouseEvent) => {
  // 暂时禁用复杂动画，只使用CSS过渡
}

// 点赞动画
const handleLike = () => {
  liked.value = !liked.value
  
  // 检查是否为移动设备
  const isMobileDevice = document.documentElement.classList.contains('mobile-device')
  
  if (liked.value && !isMobileDevice && typeof window !== 'undefined' && window.anime) {
    // 仅PC端执行动画
    window.anime({
      targets: '.action-btn:first-child i',
      scale: [1, 1.5, 1],
      duration: 300,
      easing: 'easeInOutQuad'
    })
    
    // 创建粒子效果
    createHeartParticles()
  }
}

// 创建心形粒子 - 仅PC端
const createHeartParticles = () => {
  if (!cardRef.value || document.documentElement.classList.contains('mobile-device')) return
  
  const particles = 8
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement('div')
    particle.className = 'heart-particle'
    particle.innerHTML = '❤️'
    particle.style.left = '50%'
    particle.style.top = '50%'
    cardRef.value.appendChild(particle)
    
    if (typeof window !== 'undefined' && window.anime) {
      const angle = (360 / particles) * i
      const distance = 50 + Math.random() * 50
      
      window.anime({
        targets: particle,
        translateX: Math.cos(angle * Math.PI / 180) * distance,
        translateY: Math.sin(angle * Math.PI / 180) * distance,
        scale: [1, 0],
        opacity: [1, 0],
        duration: 1000,
        easing: 'easeOutExpo',
        complete: () => particle.remove()
      })
    }
  }
}

// 收藏
const handleSave = () => {
  saved.value = !saved.value
  
  // 仅PC端执行动画
  if (saved.value && !document.documentElement.classList.contains('mobile-device') && typeof window !== 'undefined' && window.anime) {
    window.anime({
      targets: '.action-btn:nth-child(2) i',
      rotateY: [0, 360],
      duration: 500,
      easing: 'easeInOutQuad'
    })
  }
}

// 分享
const handleShare = () => {
  // 复制链接到剪贴板
  const url = `${window.location.origin}/artwork/${props.artwork.id}`
  navigator.clipboard.writeText(url).then(() => {
    console.log('链接已复制')
  })
}

// 导航到详情页
const navigateToDetail = () => {
  emit('click')
}
</script>

<style scoped>
.artwork-card {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-lg);  /* 减小圆角 */
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--color-border);
}

.artwork-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);  /* 减小悬浮效果 */
}

[data-theme="dark"] .artwork-card:hover {
  box-shadow: 0 20px 60px rgba(79, 70, 229, 0.2);
}

/* 图片容器 */
.artwork-image-wrapper {
  position: relative;
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.artwork-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.artwork-card:hover .artwork-image {
  transform: scale(1.05);
}

.image-skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* 悬停遮罩 */
.artwork-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.9) 100%
  );
  opacity: 0;
  transition: opacity var(--duration-normal);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-4);
}

.artwork-card:hover .artwork-overlay {
  opacity: 1;
}

/* 遮罩层信息 */
.overlay-info {
  color: white;
}

.overlay-description {
  font-size: var(--text-sm);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 噪点纹理 */
.noise-layer {
  position: absolute;
  inset: 0;
  opacity: 0.02;
  mix-blend-mode: overlay;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E");
}

/* 信息区域 */
.artwork-info {
  padding: var(--space-4);
}

.artwork-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artwork-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
}

.author-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* 心形粒子 */
.heart-particle {
  position: absolute;
  font-size: 16px;
  pointer-events: none;
  z-index: 100;
}
</style>