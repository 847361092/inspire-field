<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isVisible" class="mobile-transition">
        <div class="transition-overlay"></div>
        <div class="transition-content">
          <div class="logo-container">
            <img 
              :src="currentLogoSrc" 
              alt="Voxel Union" 
              class="logo-image"
              :style="{ opacity: logoOpacity }"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import logoWhite from '@/assets/logo-white.png'
import logoDark from '@/assets/logo-dark.png'

const isVisible = ref(false)
const progress = ref(0)
const currentTheme = ref('dark')

// 根据主题选择Logo图片
const currentLogoSrc = computed(() => {
  // 深色主题用白logo，浅色主题用黑logo
  if (currentTheme.value === 'dark') {
    return logoWhite
  } else {
    return logoDark
  }
})

// 监听主题变化
onMounted(() => {
  const theme = document.documentElement.getAttribute('data-theme')
  currentTheme.value = theme || 'dark'
  
  const observer = new MutationObserver(() => {
    const theme = document.documentElement.getAttribute('data-theme')
    currentTheme.value = theme || 'dark'
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
})

// Logo透明度 - 从一开始就显示
const logoOpacity = computed(() => {
  return Math.min(progress.value / 50, 1) // 前50%进度内逐渐显示
})

// 文字透明度 - 不再需要
// const textOpacity = computed(() => {
//   return progress.value > 30 ? (progress.value - 30) / 70 : 0
// })

// 播放过场动画
const play = () => {
  return new Promise((resolve) => {
    // 播放前更新主题
    const theme = document.documentElement.getAttribute('data-theme')
    currentTheme.value = theme || 'dark'
    
    isVisible.value = true
    progress.value = 0
    
    // 动画时长1200ms
    const duration = 1200
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const percentage = Math.min((elapsed / duration) * 100, 100)
      
      progress.value = percentage
      
      if (percentage < 100) {
        requestAnimationFrame(animate)
      } else {
        // 动画完成后短暂停留
        setTimeout(() => {
          isVisible.value = false
          progress.value = 0
          resolve(true)
        }, 200)
      }
    }
    
    requestAnimationFrame(animate)
  })
}

// 暴露方法给父组件
defineExpose({
  play
})
</script>

<style scoped>
.mobile-transition {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: all;
}

.transition-overlay {
  position: absolute;
  inset: 0;
  background: #0a0a0a; /* 默认黑色背景 */
  opacity: 0.98;
}

/* 主题背景色 */
[data-theme="light"] .transition-overlay {
  background: white;
}

[data-theme="gray"] .transition-overlay {
  background: #9ca3af;
}

.transition-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 240px;
  height: 240px;
  object-fit: contain;
  transition: opacity 0.3s;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2));
}

/* 文字样式已删除 - 只保留Logo图片 */

/* 进度条已删除 - 只保留Logo */

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>