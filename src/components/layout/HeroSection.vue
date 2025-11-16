<template>
  <section class="hero-section">
    <div class="hero-bg">
      <div class="gradient-mesh"></div>
      <div class="noise-overlay"></div>
    </div>
    
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-line">Voxel Union's</span>
        <span class="title-line gradient-text">Gallery</span>
      </h1>
      
      <p class="hero-subtitle">
        Artwork Collection
      </p>
      
      <div class="hero-actions">
        <MagneticButton @click="scrollToGallery">
          View
        </MagneticButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import MagneticButton from '@/components/ui/MagneticButton.vue'

// 滚动到画廊
const scrollToGallery = () => {
  const gallery = document.querySelector('.gallery-section')
  if (gallery) {
    gallery.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  // 标题动画
  const titleLines = document.querySelectorAll('.title-line')
  titleLines.forEach((line, index) => {
    ;(line as HTMLElement).style.animationDelay = `${index * 200}ms`
  })
})
</script>

<style scoped>
.hero-section {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  margin-top: -72px;
  padding-top: 72px;
}

/* 背景效果 */
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.gradient-mesh {
  position: absolute;
  inset: 0;
  background: var(--gradient-mesh);
  opacity: 0.5;
  animation: gradientShift 10s ease infinite;
  background-size: 200% 200%;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 内容区 */
.hero-content {
  text-align: center;
  max-width: var(--container-max);
  padding: var(--space-8);
  z-index: 2;
  width: 100%;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(2.5rem, 7vw, var(--text-6xl));
  font-weight: var(--font-black);
  line-height: 1.1;
  margin-bottom: var(--space-6);
}

.title-line {
  display: block;
  opacity: 0;
  animation: fadeInUp var(--duration-slow) var(--ease-out-expo) forwards;
}

.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
  opacity: 0;
  animation: fadeInUp var(--duration-slow) var(--ease-out-expo) 0.4s forwards;
}

/* 按钮组 */
.hero-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  margin-bottom: var(--space-12);
  opacity: 0;
  animation: fadeInUp var(--duration-slow) var(--ease-out-expo) 0.6s forwards;
}

/* View按钮样式调整 */
.hero-actions :deep(.magnetic-button) {
  font-size: var(--text-lg);
  letter-spacing: 0.2em;
  padding: var(--space-4) var(--space-8);
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-section {
    padding: var(--space-4);
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  /* 移动端View按钮样式 */
  .hero-actions :deep(.magnetic-button) {
    font-size: var(--text-base);
    padding: var(--space-3) var(--space-6);
  }
}
</style>