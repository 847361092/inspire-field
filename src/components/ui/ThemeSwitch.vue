<template>
  <div class="theme-switch" ref="switchRef">
    <div class="theme-indicator" :style="indicatorStyle"></div>
    <button 
      v-for="(theme, index) in themes" 
      :key="theme.value"
      :class="['theme-btn', { active: currentTheme === theme.value }]"
      @click="setTheme(theme.value)"
      :title="theme.label"
      :data-index="index"
    >
      <i :class="theme.icon"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

const themes = [
  { value: 'light', label: '日间模式', icon: 'fas fa-sun' },
  { value: 'gray', label: '专注模式', icon: 'fas fa-star' },
  { value: 'dark', label: '暗夜模式', icon: 'fas fa-moon' }
]

const currentTheme = ref('dark')
const switchRef = ref<HTMLElement>()

// 计算指示器位置
const indicatorStyle = computed(() => {
  const index = themes.findIndex(t => t.value === currentTheme.value)
  // 确保找到有效索引，否则默认为2（dark主题）
  const validIndex = index >= 0 ? index : 2
  // 每个按钮38px宽度 + 4px间距，精确计算中心位置
  const buttonWidth = 38
  const gap = 4
  const offset = validIndex * (buttonWidth + gap)
  return {
    transform: `translateX(${offset}px) translateY(-50%)`,
    WebkitTransform: `translateX(${offset}px) translateY(-50%)`,
    msTransform: `translateX(${offset}px) translateY(-50%)`,
    opacity: 1
  }
})

// 设置主题
const setTheme = async (theme: string) => {
  currentTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
  
  // 添加切换动画
  document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease'
  
  // 触发指示器缩放动画
  await nextTick()
  const indicator = switchRef.value?.querySelector('.theme-indicator') as HTMLElement
  if (indicator) {
    indicator.style.transform = indicatorStyle.value.transform + ' scale(0.9)'
    setTimeout(() => {
      indicator.style.transform = indicatorStyle.value.transform
    }, 150)
  }
}

onMounted(() => {
  // 读取保存的主题
  const savedTheme = localStorage.getItem('theme') || 'dark'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  // 检测系统主题偏好
  if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const defaultTheme = prefersDark ? 'dark' : 'light'
    setTheme(defaultTheme)
  }
})
</script>

<style scoped>
.theme-switch {
  position: relative;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  gap: 4px;
  background: rgba(20, 20, 20, 0.8); /* 增加不透明度作为后备 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-full);
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  min-width: 140px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  -webkit-transform: translateZ(0); /* 触发硬件加速 */
  transform: translateZ(0);
}

/* 灰色主题样式 */
[data-theme="gray"] .theme-switch {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(30, 41, 59, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 1);
}

/* 白色主题样式 */
[data-theme="light"] .theme-switch {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 1);
}

.theme-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-full);
  cursor: pointer;
  -webkit-transition: all var(--duration-fast);
  -moz-transition: all var(--duration-fast);
  -ms-transition: all var(--duration-fast);
  transition: all var(--duration-fast);
  z-index: 1;
  position: relative;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  font-size: 15px;
}

[data-theme="gray"] .theme-btn {
  color: rgba(30, 41, 59, 0.6);
}

[data-theme="light"] .theme-btn {
  color: rgba(10, 10, 10, 0.5);
}

.theme-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  -webkit-transform: scale(1.05);
  -moz-transform: scale(1.05);
  -ms-transform: scale(1.05);
  transform: scale(1.05);
}

[data-theme="gray"] .theme-btn:hover {
  color: rgba(30, 41, 59, 0.8);
}

[data-theme="light"] .theme-btn:hover {
  color: rgba(10, 10, 10, 0.7);
}

.theme-btn.active {
  color: white;
}

.theme-btn i {
  font-size: 16px;
  line-height: 1;
}

.theme-indicator {
  position: absolute;
  width: 38px;
  height: 38px;
  background: -webkit-gradient(linear, left top, right bottom, from(#6366F1), to(#8B5CF6));
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  border-radius: var(--radius-full);
  -webkit-transition: -webkit-transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease;
  -moz-transition: -moz-transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease;
  -ms-transition: -ms-transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease;
  z-index: 0;
  top: 50%;
  left: 5px; /* 与容器padding一致 */
  -webkit-transform: translateY(-50%);
  -moz-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  pointer-events: none;
  box-shadow: 0 3px 12px rgba(99, 102, 241, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  opacity: 0;
  -webkit-animation: fadeIn 0.3s ease forwards;
  animation: fadeIn 0.3s ease forwards;
}

[data-theme="gray"] .theme-indicator {
  background: linear-gradient(135deg, #1E293B, #334155);
  box-shadow: 0 3px 12px rgba(30, 41, 59, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .theme-indicator {
  background: linear-gradient(135deg, #6366F1, #818CF8);
  box-shadow: 0 3px 12px rgba(99, 102, 241, 0.35),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* 主题切换时的全局过渡 */
:global(body) {
  transition: background-color var(--duration-slow) var(--ease-out-expo),
              color var(--duration-slow) var(--ease-out-expo);
}
</style>