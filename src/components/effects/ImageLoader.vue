<template>
  <div class="image-loader" ref="containerRef">
    <!-- 加载占位 -->
    <div v-if="!loaded" class="image-placeholder">
      <div class="skeleton-pulse"></div>
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
    </div>
    
    <!-- 主图片 -->
    <img 
      :src="placeholder"
      :data-src="src"
      :alt="alt"
      class="image-main"
      :class="{ loaded, error }"
      ref="imageRef"
    />
    
    <!-- Reveal遮罩动画 -->
    <div class="image-reveal" ref="revealRef"></div>
    
    <!-- 错误状态 -->
    <div v-if="error" class="image-error">
      <i class="fas fa-image"></i>
      <span>加载失败</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  src: string
  alt?: string
  placeholder?: string
  webp?: boolean // 是否支持WebP
  lazy?: boolean // 是否懒加载
}>()

const containerRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()
const revealRef = ref<HTMLElement>()
const loaded = ref(false)
const error = ref(false)

let observer: IntersectionObserver | null = null

// 获取优化的图片URL
const getOptimizedSrc = (): string => {
  let optimizedSrc = props.src
  
  // 如果支持WebP且浏览器支持
  if (props.webp && supportsWebP()) {
    // 对于Unsplash等服务，添加格式参数
    if (optimizedSrc.includes('unsplash.com')) {
      optimizedSrc += optimizedSrc.includes('?') ? '&' : '?'
      optimizedSrc += 'fm=webp&q=85'
    }
  }
  
  return optimizedSrc
}

// 检测WebP支持
const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 0
}

// 加载图片
const loadImage = () => {
  const img = new Image()
  const optimizedSrc = getOptimizedSrc()
  
  img.onload = () => {
    if (imageRef.value) {
      imageRef.value.src = optimizedSrc
      loaded.value = true
      error.value = false
      animateReveal()
    }
  }
  
  img.onerror = () => {
    error.value = true
    loaded.value = false
    
    // 尝试加载备用图片
    if (props.placeholder && imageRef.value) {
      imageRef.value.src = props.placeholder
    }
  }
  
  img.src = optimizedSrc
}

// Reveal揭示动画
const animateReveal = () => {
  if (!revealRef.value || typeof window === 'undefined' || !window.anime) return
  
  // 动画序列
  window.anime.timeline()
    .add({
      targets: revealRef.value,
      scaleX: [0, 1],
      duration: 600,
      easing: 'easeInOutExpo',
      transformOrigin: 'left center'
    })
    .add({
      targets: imageRef.value,
      opacity: [0, 1],
      scale: [1.1, 1],
      duration: 800,
      easing: 'easeOutExpo'
    }, '-=400')
    .add({
      targets: revealRef.value,
      scaleX: [1, 0],
      duration: 600,
      easing: 'easeInOutExpo',
      transformOrigin: 'right center',
      complete: () => {
        if (revealRef.value) {
          revealRef.value.style.display = 'none'
        }
      }
    }, '-=600')
}

// 设置Intersection Observer
const setupObserver = () => {
  if (!props.lazy || !containerRef.value) {
    loadImage()
    return
  }
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage()
          observer?.unobserve(entry.target)
        }
      })
    },
    { 
      threshold: 0.1,
      rootMargin: '50px'
    }
  )
  
  observer.observe(containerRef.value)
}

onMounted(() => {
  // 使用placeholder作为初始图片
  if (props.placeholder && imageRef.value) {
    imageRef.value.src = props.placeholder
  }
  
  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.image-loader {
  position: relative;
  overflow: hidden;
  background: var(--color-bg-secondary);
  border-radius: inherit;
}

/* 占位符 */
.image-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.skeleton-pulse {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-surface) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.loading-spinner {
  position: relative;
  z-index: 2;
  color: var(--color-text-tertiary);
  font-size: var(--text-2xl);
}

/* 主图片 */
.image-main {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity var(--duration-slow) var(--ease-out-expo);
  transform: scale(1.1);
}

.image-main.loaded {
  opacity: 1;
  transform: scale(1);
}

.image-main.error {
  opacity: 0.3;
}

/* Reveal遮罩 */
.image-reveal {
  position: absolute;
  inset: 0;
  background: var(--gradient-brand);
  transform-origin: left center;
  transform: scaleX(0);
  z-index: 2;
  pointer-events: none;
}

/* 错误状态 */
.image-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
  z-index: 3;
}

.image-error i {
  font-size: var(--text-3xl);
}

.image-error span {
  font-size: var(--text-sm);
}

/* GPU加速 */
.image-loader {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}
</style>