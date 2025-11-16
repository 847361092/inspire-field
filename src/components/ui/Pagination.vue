<template>
  <div class="pagination-container" v-if="totalPages > 1" ref="containerRef">
    <div class="pagination-wrapper">
      <!-- 上一页按钮 -->
      <button 
        class="pagination-btn prev-btn" 
        :disabled="currentPage <= 1"
        @click="handlePrevious"
        :title="'上一页'"
      >
        <i class="fas fa-chevron-left"></i>
        <span class="btn-text">上一页</span>
      </button>

      <!-- 页码按钮 -->
      <div class="pagination-pages">
        <!-- 第一页 -->
        <button 
          v-if="showFirstPage"
          class="pagination-btn page-btn"
          :class="{ active: currentPage === 1 }"
          @click="handlePageChange(1)"
        >
          1
        </button>

        <!-- 第一页后的省略号 -->
        <span v-if="showLeftEllipsis" class="pagination-ellipsis">...</span>

        <!-- 中间页码 -->
        <button 
          v-for="page in visiblePages" 
          :key="page"
          class="pagination-btn page-btn"
          :class="{ active: currentPage === page }"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>

        <!-- 最后一页前的省略号 -->
        <span v-if="showRightEllipsis" class="pagination-ellipsis">...</span>

        <!-- 最后一页 -->
        <button 
          v-if="showLastPage"
          class="pagination-btn page-btn"
          :class="{ active: currentPage === totalPages }"
          @click="handlePageChange(totalPages)"
        >
          {{ totalPages }}
        </button>
      </div>

      <!-- 下一页按钮 -->
      <button 
        class="pagination-btn next-btn" 
        :disabled="currentPage >= totalPages"
        @click="handleNext"
        :title="'下一页'"
      >
        <span class="btn-text">下一页</span>
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- 快速跳转和页面信息 -->
    <div class="pagination-footer">
      <div class="pagination-info">
        <span class="current-info">
          第 <strong>{{ currentPage }}</strong> 页，共 <strong>{{ totalPages }}</strong> 页
        </span>
        <span class="items-info">
          共 <strong>{{ totalItems }}</strong> 个作品
        </span>
      </div>

      <!-- 快速跳转 -->
      <div class="jump-to-page" v-if="totalPages > 5">
        <span class="jump-label">跳转到</span>
        <div class="jump-input-wrapper">
          <input 
            ref="jumpInput"
            v-model="jumpPageInput"
            type="number" 
            class="jump-input"
            :min="1" 
            :max="totalPages"
            :placeholder="'1-' + totalPages"
            @keyup.enter="handleJumpToPage"
            @blur="handleJumpToPage"
          />
          <button 
            class="jump-btn"
            @click="handleJumpToPage"
            :disabled="!isValidJumpPage"
            title="跳转到指定页面"
          >
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 5
})

const emit = defineEmits<{
  'page-change': [page: number]
  'previous': []
  'next': []
  'jump-to-page': [page: number]
}>()

// 快速跳转相关状态
const jumpPageInput = ref('')
const jumpInput = ref<HTMLInputElement>()

// 移动端手势支持相关状态
const containerRef = ref<HTMLElement>()
let touchStartX = 0
let touchStartY = 0
let isSwiping = false

// 计算可见页码
const visiblePages = computed(() => {
  const pages: number[] = []
  const { currentPage, totalPages, maxVisiblePages } = props
  const halfVisible = Math.floor(maxVisiblePages / 2)
  
  let start = Math.max(1, currentPage - halfVisible)
  let end = Math.min(totalPages, currentPage + halfVisible)
  
  // 调整起始和结束位置以保持显示数量
  if (end - start + 1 < maxVisiblePages) {
    if (start === 1) {
      end = Math.min(totalPages, start + maxVisiblePages - 1)
    } else if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }
  }
  
  // 排除第一页和最后一页（它们单独显示）
  for (let i = start; i <= end; i++) {
    if (i !== 1 && i !== totalPages) {
      pages.push(i)
    } else if (totalPages <= maxVisiblePages) {
      // 如果总页数很少，显示所有页码
      pages.push(i)
    }
  }
  
  return pages
})

// 是否显示第一页按钮
const showFirstPage = computed(() => {
  return props.totalPages > props.maxVisiblePages && !visiblePages.value.includes(1)
})

// 是否显示最后一页按钮
const showLastPage = computed(() => {
  return props.totalPages > props.maxVisiblePages && !visiblePages.value.includes(props.totalPages)
})

// 是否显示左侧省略号
const showLeftEllipsis = computed(() => {
  return showFirstPage.value && visiblePages.value.length > 0 && visiblePages.value[0] > 2
})

// 是否显示右侧省略号
const showRightEllipsis = computed(() => {
  return showLastPage.value && visiblePages.value.length > 0 && 
         visiblePages.value[visiblePages.value.length - 1] < props.totalPages - 1
})

// 处理页码变化
const handlePageChange = (page: number) => {
  if (page !== props.currentPage && page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}

// 处理上一页
const handlePrevious = () => {
  if (props.currentPage > 1) {
    emit('previous')
    emit('page-change', props.currentPage - 1)
  }
}

// 处理下一页
const handleNext = () => {
  if (props.currentPage < props.totalPages) {
    emit('next')
    emit('page-change', props.currentPage + 1)
  }
}

// 验证跳转页码是否有效
const isValidJumpPage = computed(() => {
  const page = parseInt(jumpPageInput.value, 10)
  return !isNaN(page) && page >= 1 && page <= props.totalPages && page !== props.currentPage
})

// 处理快速跳转
const handleJumpToPage = () => {
  if (!jumpPageInput.value.trim()) return
  
  const page = parseInt(jumpPageInput.value, 10)
  if (isValidJumpPage.value) {
    emit('jump-to-page', page)
    emit('page-change', page)
    jumpPageInput.value = '' // 清空输入框
    jumpInput.value?.blur() // 失去焦点
  } else {
    // 无效输入，清空或恢复
    jumpPageInput.value = ''
  }
}

// 移动端手势处理函数
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length !== 1) return
  
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  isSwiping = false
}

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length !== 1) return
  
  const touch = e.touches[0]
  const deltaX = Math.abs(touch.clientX - touchStartX)
  const deltaY = Math.abs(touch.clientY - touchStartY)
  
  // 如果横向滑动距离大于纵向滑动距离，认为是翻页手势
  if (deltaX > deltaY && deltaX > 10) {
    isSwiping = true
    // 阻止默认的滚动行为
    e.preventDefault()
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (!isSwiping || e.changedTouches.length !== 1) return
  
  const touch = e.changedTouches[0]
  const deltaX = touch.clientX - touchStartX
  const minSwipeDistance = 50 // 最小滑动距离
  
  // 判断滑动方向和距离
  if (Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      // 向右滑动 - 上一页
      if (props.currentPage > 1) {
        handlePrevious()
        // 触觉反馈
        if ('vibrate' in navigator) {
          navigator.vibrate(30)
        }
      }
    } else {
      // 向左滑动 - 下一页
      if (props.currentPage < props.totalPages) {
        handleNext()
        // 触觉反馈
        if ('vibrate' in navigator) {
          navigator.vibrate(30)
        }
      }
    }
  }
  
  isSwiping = false
}

// 组件挂载时添加手势监听
onMounted(() => {
  const container = containerRef.value
  if (container) {
    // 只在移动设备上添加手势支持
    if ('ontouchstart' in window) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true })
      container.addEventListener('touchmove', handleTouchMove, { passive: false })
      container.addEventListener('touchend', handleTouchEnd, { passive: true })
    }
  }
})

// 组件卸载时移除监听
onUnmounted(() => {
  const container = containerRef.value
  if (container && 'ontouchstart' in window) {
    container.removeEventListener('touchstart', handleTouchStart)
    container.removeEventListener('touchmove', handleTouchMove)
    container.removeEventListener('touchend', handleTouchEnd)
  }
})
</script>

<style scoped>
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) 0;
  margin-top: var(--space-8);
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
  user-select: none;
  text-decoration: none;
  gap: var(--space-2);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}

.pagination-btn.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  font-weight: var(--font-semibold);
}

.page-btn {
  min-width: 40px;
  padding: 0;
}

.prev-btn,
.next-btn {
  font-weight: var(--font-medium);
}

.btn-text {
  font-size: var(--text-sm);
}

.pagination-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  user-select: none;
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);
  flex-wrap: wrap;
  width: 100%;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.jump-to-page {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.jump-label {
  white-space: nowrap;
  font-weight: var(--font-medium);
}

.jump-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--duration-fast);
}

.jump-input-wrapper:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.jump-input {
  width: 60px;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  text-align: center;
  outline: none;
}

.jump-input::placeholder {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.jump-btn {
  padding: var(--space-2);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
}

.jump-btn:hover:not(:disabled) {
  background: var(--color-accent);
  color: white;
}

.jump-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.jump-btn i {
  font-size: 12px;
}

.current-info,
.items-info {
  line-height: 1.4;
}

.pagination-info strong {
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
}

/* 手势提示和移动端优化 */
.pagination-container {
  position: relative;
}

/* 移动端手势区域指示 */
@media (max-width: 768px) and (hover: none) {
  .pagination-container::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border: 2px dashed transparent;
    border-radius: var(--radius-lg);
    pointer-events: none;
    transition: border-color var(--duration-fast);
    z-index: -1;
  }
  
  /* 滑动时的视觉反馈 */
  .pagination-container.swiping::before {
    border-color: var(--color-accent);
    opacity: 0.3;
  }
  
  /* 为移动端添加更大的触摸区域 */
  .pagination-wrapper {
    padding: var(--space-3) var(--space-2);
    margin: -var(--space-3) -var(--space-2);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .pagination-container {
    padding: var(--space-6) var(--space-3);
    margin-top: var(--space-6);
  }

  .pagination-wrapper {
    gap: var(--space-1);
    padding: 0 var(--space-2);
  }

  .pagination-pages {
    gap: 2px;
  }

  .pagination-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 var(--space-2);
    font-size: 13px;
  }

  .page-btn {
    min-width: 36px;
    padding: 0;
  }

  .btn-text {
    display: none; /* 移动端隐藏文字，只显示图标 */
  }

  .prev-btn,
  .next-btn {
    min-width: 36px;
    padding: 0;
  }

  .pagination-footer {
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  .pagination-info {
    font-size: 13px;
    gap: 2px;
    align-items: center;
    text-align: center;
  }

  .jump-to-page {
    font-size: 13px;
  }

  .jump-input {
    width: 50px;
    font-size: 13px;
  }

  .pagination-ellipsis {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .pagination-wrapper {
    gap: 1px;
  }

  .pagination-pages {
    gap: 1px;
  }

  .pagination-btn {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .page-btn {
    min-width: 32px;
  }

  .pagination-ellipsis {
    width: 32px;
    height: 32px;
  }

  .pagination-footer {
    gap: var(--space-3);
  }

  .pagination-info {
    flex-direction: column;
    font-size: 12px;
  }

  .jump-to-page {
    font-size: 12px;
  }

  .jump-input {
    width: 45px;
    font-size: 12px;
  }

  .jump-label {
    font-size: 12px;
  }
}

/* 移动设备触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .pagination-btn {
    -webkit-tap-highlight-color: transparent;
    min-height: 44px; /* iOS 推荐的最小触摸目标大小 */
  }
  
  .pagination-btn:active {
    background: var(--color-accent);
    color: white;
    transform: scale(0.95);
  }
  
  .jump-input {
    min-height: 44px;
  }
  
  .jump-btn {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 动画效果 */
.pagination-btn {
  position: relative;
  overflow: hidden;
}

.pagination-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.pagination-btn:hover::before {
  width: 100%;
  height: 100%;
}

/* 键盘焦点样式 */
.pagination-btn:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* 高对比度模式适配 */
@media (prefers-contrast: high) {
  .pagination-btn {
    border-width: 2px;
  }
  
  .pagination-btn:hover:not(:disabled) {
    border-width: 2px;
  }

  .jump-input-wrapper {
    border-width: 2px;
  }

  .jump-input-wrapper:focus-within {
    border-width: 2px;
  }
}

/* 减动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .pagination-btn {
    transition: none;
  }
  
  .pagination-btn::before {
    transition: none;
  }
  
  .pagination-btn:hover {
    transform: none;
  }
  
  .pagination-container::before {
    transition: none;
  }
}
</style>