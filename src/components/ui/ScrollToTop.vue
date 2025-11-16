<template>
  <Transition name="scroll-to-top">
    <button
      v-show="showButton"
      class="scroll-to-top-btn"
      @click="scrollToTop"
      :title="'回到顶部'"
      :aria-label="'回到顶部'"
    >
      <div class="btn-icon">
        <i class="fas fa-chevron-up"></i>
      </div>
      <div class="progress-ring">
        <svg class="progress-svg" viewBox="0 0 36 36">
          <path
            class="progress-bg"
            d="M18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
          />
          <path
            class="progress-bar"
            :stroke-dasharray="`${scrollProgress}, 100`"
            d="M18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
          />
        </svg>
      </div>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 控制按钮显示的状态
const showButton = ref(false)
// 滚动进度百分比
const scrollProgress = ref(0)

// 显示按钮的触发距离（滚动超过这个距离后显示）
const SHOW_DISTANCE = 300

// 节流函数，用于优化滚动事件处理性能
let throttleTimer: number | null = null
const throttle = (func: Function, delay: number) => {
  return (...args: any[]) => {
    if (throttleTimer) return
    throttleTimer = window.setTimeout(() => {
      func.apply(null, args)
      throttleTimer = null
    }, delay)
  }
}

// 处理滚动事件
const handleScroll = throttle(() => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  )

  // 计算是否显示按钮
  showButton.value = scrollTop > SHOW_DISTANCE

  // 计算滚动进度（0-100）
  const maxScroll = documentHeight - windowHeight
  if (maxScroll > 0) {
    scrollProgress.value = Math.min((scrollTop / maxScroll) * 100, 100)
  } else {
    scrollProgress.value = 0
  }
}, 16) // 约60fps

// 平滑滚动到顶部
const scrollToTop = () => {
  // 添加点击反馈动画
  const button = document.querySelector('.scroll-to-top-btn') as HTMLElement
  if (button) {
    button.style.transform = 'scale(0.9)'
    setTimeout(() => {
      button.style.transform = ''
    }, 150)
  }

  // 平滑滚动到顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })

  // 移动端震动反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

// 组件挂载时添加滚动监听
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // 初始检查
  handleScroll()
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (throttleTimer) {
    clearTimeout(throttleTimer)
  }
})
</script>

<style scoped>
.scroll-to-top-btn {
  position: fixed;
  bottom: 30px;  /* 恢复原位置 */
  right: 30px;   /* 稍微增加右侧距离 */
  width: 62px;   /* 增大10%：56px * 1.1 ≈ 62px */
  height: 62px;  /* 增大10%：56px * 1.1 ≈ 62px */
  border-radius: 50%;
  border: none;
  background: var(--color-surface);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  z-index: 999;  /* 提高层级确保不被遮挡 */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-normal) var(--ease-out-expo);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.scroll-to-top-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-xl), 0 0 20px rgba(79, 70, 229, 0.3);
  background: var(--color-accent);
}

.scroll-to-top-btn:active {
  transform: translateY(-2px) scale(0.95);
}

.btn-icon {
  position: relative;
  z-index: 2;
  color: var(--color-text-primary);
  font-size: 18px;
  transition: all var(--duration-fast);
}

.scroll-to-top-btn:hover .btn-icon {
  color: white;
  transform: translateY(-1px);
}

/* 进度环 */
.progress-ring {
  position: absolute;
  top: -2px;
  left: -2px;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  pointer-events: none;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: transparent;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 2;
}

.progress-bar {
  fill: transparent;
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.scroll-to-top-btn:hover .progress-bar {
  stroke: white;
}

/* 进入/离开动画 */
.scroll-to-top-enter-active,
.scroll-to-top-leave-active {
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.scroll-to-top-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.scroll-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .scroll-to-top-btn {
    bottom: 20px; /* 移动端保持在底部 */
    right: 20px;
    width: 53px;  /* 增大10%：48px * 1.1 ≈ 53px */
    height: 53px; /* 增大10%：48px * 1.1 ≈ 53px */
  }

  .btn-icon {
    font-size: 16px;
  }

  /* 简化移动端动画，提升性能 */
  .scroll-to-top-btn:hover {
    transform: none;
    box-shadow: var(--shadow-lg);
  }
}

@media (max-width: 480px) {
  .scroll-to-top-btn {
    bottom: 16px;  /* 小屏幕也保持在右下角 */
    right: 16px;
    width: 48px;  /* 增大10%：44px * 1.1 ≈ 48px */
    height: 48px; /* 增大10%：44px * 1.1 ≈ 48px */
  }

  .btn-icon {
    font-size: 14px;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .scroll-to-top-btn {
    background: rgba(30, 30, 30, 0.9);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .progress-bg {
    stroke: rgba(255, 255, 255, 0.15);
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .scroll-to-top-btn {
    transition: opacity var(--duration-fast);
  }

  .scroll-to-top-btn:hover {
    transform: none;
  }

  .scroll-to-top-enter-active,
  .scroll-to-top-leave-active {
    transition: opacity var(--duration-fast);
  }

  .scroll-to-top-enter-from,
  .scroll-to-top-leave-to {
    transform: none;
  }

  .progress-bar {
    transition: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .scroll-to-top-btn {
    border: 3px solid var(--color-text-primary);
    background: var(--color-bg-primary);
  }

  .progress-bg,
  .progress-bar {
    stroke-width: 3;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .scroll-to-top-btn:hover {
    transform: none;
    background: var(--color-surface);
  }

  .scroll-to-top-btn:hover .btn-icon {
    color: var(--color-text-primary);
    transform: none;
  }

  .scroll-to-top-btn:hover .progress-bar {
    stroke: var(--color-accent);
  }

  /* 触摸激活态 */
  .scroll-to-top-btn:active {
    background: var(--color-accent);
    transform: scale(0.95);
  }

  .scroll-to-top-btn:active .btn-icon {
    color: white;
  }
}
</style>