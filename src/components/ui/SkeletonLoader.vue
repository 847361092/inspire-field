<template>
  <div class="skeleton-loader">
    <!-- 瀑布流骨架屏 -->
    <div v-if="type === 'waterfall'" class="skeleton-waterfall">
      <div v-for="col in columns" :key="col" class="skeleton-column">
        <div 
          v-for="item in getColumnItems(col)" 
          :key="item"
          class="skeleton-card"
          :style="{ height: getRandomHeight() + 'px' }"
        >
          <div class="skeleton-image shimmer"></div>
          <div class="skeleton-info">
            <div class="skeleton-title shimmer"></div>
            <div class="skeleton-author shimmer"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 横向滚动骨架屏 -->
    <div v-else-if="type === 'horizontal'" class="skeleton-horizontal">
      <div class="skeleton-scroll">
        <div v-for="i in 5" :key="i" class="skeleton-scroll-item">
          <div class="skeleton-image shimmer"></div>
          <div class="skeleton-info">
            <div class="skeleton-title shimmer"></div>
            <div class="skeleton-author shimmer"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 详情页骨架屏 -->
    <div v-else-if="type === 'detail'" class="skeleton-detail">
      <div class="skeleton-detail-header">
        <div class="skeleton-back shimmer"></div>
        <div class="skeleton-actions">
          <div class="skeleton-action shimmer"></div>
          <div class="skeleton-action shimmer"></div>
        </div>
      </div>
      <div class="skeleton-detail-image shimmer"></div>
      <div class="skeleton-detail-info">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-meta">
          <div class="skeleton-author-avatar shimmer"></div>
          <div class="skeleton-author-name shimmer"></div>
        </div>
        <div class="skeleton-description">
          <div class="skeleton-line shimmer"></div>
          <div class="skeleton-line shimmer"></div>
          <div class="skeleton-line shimmer"></div>
        </div>
      </div>
    </div>
    
    <!-- 卡片骨架屏 -->
    <div v-else class="skeleton-card-single">
      <div class="skeleton-image shimmer"></div>
      <div class="skeleton-info">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-author shimmer"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  type?: 'waterfall' | 'horizontal' | 'detail' | 'card'
  columns?: number
  items?: number
}>()

const isMobile = ref(false)

const columns = computed(() => {
  if (props.columns) return props.columns
  if (isMobile.value) return 2
  return 4
})

const getColumnItems = (col: number) => {
  const baseItems = props.items || 3
  // 每列显示不同数量的骨架，创造自然的瀑布流效果
  return Array.from({ length: baseItems + (col % 2) }, (_, i) => `${col}-${i}`)
}

const getRandomHeight = () => {
  // 生成随机高度，模拟真实的瀑布流
  const heights = [280, 320, 360, 400, 440]
  return heights[Math.floor(Math.random() * heights.length)]
}

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
})
</script>

<style scoped>
/* 骨架屏基础样式 */
.skeleton-loader {
  width: 100%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 闪烁动画 */
.shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-surface) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 瀑布流骨架屏 */
.skeleton-waterfall {
  display: grid;
  grid-template-columns: repeat(var(--columns, 4), 1fr);
  gap: var(--space-2);
  padding: 0;
  width: 100%;
}

.skeleton-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 3/4;
  background: var(--color-bg-secondary);
}

.skeleton-info {
  padding: var(--space-3);
}

.skeleton-title {
  height: 20px;
  width: 80%;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.skeleton-author {
  height: 16px;
  width: 60%;
  border-radius: var(--radius-sm);
}

/* 横向滚动骨架屏 */
.skeleton-horizontal {
  overflow: hidden;
  padding: var(--space-4) 0;
}

.skeleton-scroll {
  display: flex;
  gap: var(--space-3);
  padding: 0 var(--space-4);
}

.skeleton-scroll-item {
  flex: 0 0 280px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.skeleton-scroll-item .skeleton-image {
  height: 350px;
}

/* 详情页骨架屏 */
.skeleton-detail {
  padding: var(--space-4);
}

.skeleton-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.skeleton-back {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
}

.skeleton-actions {
  display: flex;
  gap: var(--space-2);
}

.skeleton-action {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
}

.skeleton-detail-image {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-4);
}

.skeleton-detail-info {
  padding: var(--space-4);
}

.skeleton-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-4) 0;
}

.skeleton-author-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
}

.skeleton-author-name {
  width: 120px;
  height: 20px;
  border-radius: var(--radius-sm);
}

.skeleton-description {
  margin-top: var(--space-4);
}

.skeleton-line {
  height: 16px;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.skeleton-line:nth-child(1) { width: 100%; }
.skeleton-line:nth-child(2) { width: 90%; }
.skeleton-line:nth-child(3) { width: 75%; }

/* 单卡片骨架屏 */
.skeleton-card-single {
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .skeleton-waterfall {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-1);
  }
  
  .skeleton-column {
    gap: var(--space-1);
  }
  
  .skeleton-scroll-item {
    flex: 0 0 240px;
  }
  
  .skeleton-scroll-item .skeleton-image {
    height: 280px;
  }
  
  .skeleton-detail-image {
    aspect-ratio: 4/3;
  }
}

@media (max-width: 480px) {
  .skeleton-waterfall {
    padding: 0 var(--space-2);
  }
  
  .skeleton-scroll-item {
    flex: 0 0 200px;
  }
  
  .skeleton-scroll-item .skeleton-image {
    height: 240px;
  }
}
</style>