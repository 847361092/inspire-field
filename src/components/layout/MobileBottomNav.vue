<template>
  <nav class="mobile-bottom-nav" v-if="isMobile">
    <a 
      v-for="item in navItems" 
      :key="item.id"
      :href="item.href"
      :class="['nav-item', { active: activeItem === item.id, special: item.special }]"
      @click.prevent="handleNavClick(item)"
    >
      <i :class="item.icon"></i>
      <span class="nav-label">{{ item.label }}</span>
      <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
    </a>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMobile } from '@/composables/useMobile'

const { isMobile, vibrate } = useMobile()

const activeItem = ref('home')

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  special?: boolean
  badge?: number
}

// 导航项目 - 移除主题切换
const navItems = computed<NavItem[]>(() => [
  { id: 'home', label: '首页', icon: 'fas fa-home', href: '#' },
  { id: 'explore', label: '发现', icon: 'fas fa-compass', href: '#gallery' },
  { id: 'upload', label: '上传', icon: 'fas fa-plus-circle', href: '#', special: true },
  { id: 'favorite', label: '收藏', icon: 'fas fa-heart', href: '#' },
  { id: 'profile', label: '我的', icon: 'fas fa-user', href: '#' }
])

const handleNavClick = (item: NavItem) => {
  // 触觉反馈
  vibrate(10)
  
  if (item.id === 'upload') {
    // 触发上传功能
    const event = new CustomEvent('mobile-upload')
    window.dispatchEvent(event)
  } else {
    activeItem.value = item.id
    
    // 滚动到对应区域
    if (item.href && item.href !== '#') {
      const target = document.querySelector(item.href)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }
}

// 监听滚动更新激活状态
onMounted(() => {
  // 移动端固定为白色主题
  document.documentElement.setAttribute('data-theme', 'light')
  
  const updateActiveItem = () => {
    const scrollY = window.scrollY
    const windowHeight = window.innerHeight
    
    // 根据滚动位置更新激活项
    const sections = [
      { id: 'home', element: document.querySelector('#hero') },
      { id: 'explore', element: document.querySelector('#gallery') }
    ]
    
    for (const section of sections) {
      if (section.element) {
        const rect = section.element.getBoundingClientRect()
        if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
          activeItem.value = section.id
          break
        }
      }
    }
  }
  
  window.addEventListener('scroll', updateActiveItem, { passive: true })
})
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 0;
  color: #737373;
  text-decoration: none;
  position: relative;
  transition: all 0.2s;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  color: var(--color-accent);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 0 0 2px 2px;
}

.nav-item i {
  font-size: 20px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: 11px;
  font-weight: var(--font-medium);
  white-space: nowrap;
}

.nav-badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 16px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--color-highlight);
  color: white;
  font-size: 10px;
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 特殊按钮样式（上传） */
.nav-item.special i {
  font-size: 28px;
  color: #4F46E5;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 移动端固定白色背景 */
.mobile-bottom-nav {
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05) !important;
}

/* 只在移动端显示 */
@media (min-width: 769px) {
  .mobile-bottom-nav {
    display: none;
  }
}

/* 适配有底部导航的页面 */
@media (max-width: 768px) {
  body {
    padding-bottom: calc(56px + env(safe-area-inset-bottom));
  }
}
</style>