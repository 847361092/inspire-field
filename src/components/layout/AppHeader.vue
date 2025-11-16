<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- 移动端菜单按钮 -->
      <button class="menu-toggle mobile-only" @click="toggleMobileMenu" aria-label="菜单">
        <span class="menu-icon" :class="{ active: mobileMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      
      <!-- Logo区域 -->
      <div class="header-brand">
        <img :src="currentLogoSrc" alt="Voxel Union" class="logo-image" />
        <span class="logo-text">Voxel Union</span>
      </div>
      
      <!-- 桌面端搜索框 -->
      <div class="header-search desktop-only">
        <SearchBar />
      </div>
      
      <!-- 移动端搜索按钮 -->
      <button class="icon-btn search-toggle mobile-only" @click="toggleMobileSearch" title="搜索">
        <i class="fas fa-search"></i>
      </button>
      
      <!-- 功能区 -->
      <div class="header-actions">
        <!-- PC端显示主题切换 -->
        <ThemeSwitch class="desktop-only" />
        
        <!-- 移动端只显示主题切换 -->
        <button class="icon-btn theme-toggle mobile-only" @click="toggleMobileTheme" title="切换主题">
          <i :class="themeIcon"></i>
        </button>
      </div>
    </div>
    
    <!-- 移动端搜索栏 -->
    <Transition name="slide-down">
      <div v-if="mobileSearchOpen" class="mobile-search-bar">
        <SearchBar :autofocus="true" @close="mobileSearchOpen = false" />
      </div>
    </Transition>
    
    <!-- 移动端菜单 -->
    <Transition name="slide">
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-overlay" @click="mobileMenuOpen = false"></div>
        <div class="mobile-menu-content">
          <div class="mobile-menu-header">
            <h3>菜单</h3>
            <button class="close-btn" @click="mobileMenuOpen = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <nav class="mobile-nav">
            <a href="#" class="mobile-nav-item">
              <i class="fas fa-home"></i>
              <span>首页</span>
            </a>
            <a href="#" class="mobile-nav-item">
              <i class="fas fa-compass"></i>
              <span>发现</span>
            </a>
            <a href="#" class="mobile-nav-item">
              <i class="fas fa-heart"></i>
              <span>收藏</span>
            </a>
          </nav>
          <div class="mobile-menu-footer">
            <ThemeSwitch />
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import ThemeSwitch from '@/components/ui/ThemeSwitch.vue'
import logoWhite from '@/assets/logo-white.png'
import logoDark from '@/assets/logo-dark.png'

const mobileMenuOpen = ref(false)
const mobileSearchOpen = ref(false)
const currentTheme = ref(localStorage.getItem('theme') || 'dark')

// 根据主题选择Logo图片
const currentLogoSrc = computed(() => {
  // 深色主题用白logo，浅色主题用黑logo
  if (currentTheme.value === 'dark') {
    return logoWhite
  } else {
    return logoDark
  }
})

// 主题图标映射
const themeIcon = computed(() => {
  switch(currentTheme.value) {
    case 'light': return 'fas fa-sun'
    case 'gray': return 'fas fa-cloud'
    case 'dark': return 'fas fa-moon'
    default: return 'fas fa-moon'
  }
})

// 切换移动端菜单
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// 切换移动端搜索
const toggleMobileSearch = () => {
  mobileSearchOpen.value = !mobileSearchOpen.value
}

// 移动端主题切换 - 循环切换
const toggleMobileTheme = () => {
  const themes = ['dark', 'light', 'gray']
  const currentIndex = themes.indexOf(currentTheme.value)
  const nextIndex = (currentIndex + 1) % themes.length
  currentTheme.value = themes[nextIndex]
  
  // 应用主题
  document.documentElement.setAttribute('data-theme', currentTheme.value)
  localStorage.setItem('theme', currentTheme.value)
}

onMounted(() => {
  // 监听主题变化更新logo
  const observer = new MutationObserver(() => {
    const theme = document.documentElement.getAttribute('data-theme')
    currentTheme.value = theme || 'dark'
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
  
  // Header scroll effect
  let lastScrollY = 0
  const header = document.querySelector('.app-header') as HTMLElement
  let isScrolling = false
  
  const handleScroll = () => {
    const currentScrollY = window.scrollY
    
    // 检查是否在全屏模式下
    const isFullscreen = document.fullscreenElement || 
                         (document as any).webkitFullscreenElement || 
                         (document as any).mozFullScreenElement || 
                         (document as any).msFullscreenElement
    
    // 全屏模式下不隐藏顶栏
    if (!isFullscreen) {
      // 只在快速滚动且滚动距离超过200px时隐藏
      if (currentScrollY > lastScrollY && currentScrollY > 200 && !isScrolling) {
        // 向下滚动，隐藏头部
        header.style.transform = 'translateY(-100%)'
        isScrolling = true
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        // 向上滚动或到达顶部，显示头部
        header.style.transform = 'translateY(0)'
        isScrolling = false
      }
    } else {
      // 全屏模式下始终显示顶栏
      header.style.transform = 'translateY(0)'
    }
    
    if (currentScrollY > 50) {
      header.classList.add('scrolled')
    } else {
      header.classList.remove('scrolled')
    }
    
    lastScrollY = currentScrollY
  }
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleScroll)
  document.addEventListener('webkitfullscreenchange', handleScroll)
  document.addEventListener('mozfullscreenchange', handleScroll)
  document.addEventListener('MSFullscreenChange', handleScroll)
  
  window.addEventListener('scroll', handleScroll, { passive: true })
})
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: rgba(10, 10, 10, 0.95); /* 默认黑色背景 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  z-index: 1000;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-transition: all var(--duration-normal) var(--ease-out-expo);
  -moz-transition: all var(--duration-normal) var(--ease-out-expo);
  -ms-transition: all var(--duration-normal) var(--ease-out-expo);
  transition: all var(--duration-normal) var(--ease-out-expo);
  -webkit-transform: translateZ(0); /* 触发硬件加速 */
  transform: translateZ(0);
  will-change: transform; /* 优化动画性能 */
}

/* 白色主题顶部栏 */
[data-theme="light"] .app-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* 灰色主题顶部栏 */
[data-theme="gray"] .app-header {
  background: rgba(156, 163, 175, 0.95);
  border-bottom: 1px solid rgba(107, 114, 128, 0.3);
}

.header-inner {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0 var(--space-8);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.app-header.scrolled {
  background: rgba(10, 10, 10, 0.98); /* 滚动时黑色背景 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom-color: var(--color-border);
}

/* 白色主题滚动时 */
[data-theme="light"] .app-header.scrolled {
  background: rgba(255, 255, 255, 0.98);
  border-bottom-color: rgba(0, 0, 0, 0.15);
}

/* 灰色主题滚动时 */
[data-theme="gray"] .app-header.scrolled {
  background: rgba(156, 163, 175, 0.98);
  border-bottom-color: rgba(107, 114, 128, 0.4);
}

/* Logo设计 */
.header-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

.logo-image {
  width: 55px;
  height: 55px;
  object-fit: contain;
  transition: transform var(--duration-fast) var(--ease-spring);
}

.header-brand:hover .logo-image {
  transform: scale(1.05) rotate(-2deg);
}

.logo-text {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: var(--tracking-tight);
  transition: color var(--duration-fast);
  white-space: nowrap;
}

/* 白色主题下标题为黑色 */
[data-theme="light"] .logo-text {
  color: rgba(10, 10, 10, 0.9);
}

/* 灰色主题下标题为深色 */
[data-theme="gray"] .logo-text {
  color: rgba(30, 41, 59, 0.9);
}

/* 搜索框样式 */
.header-search {
  display: flex;
  justify-content: center;
  padding: 0 var(--space-8);
}

/* 功能区 */
.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}

.icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast);
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  transform: scale(1.05);
}

.icon-btn:active {
  transform: scale(0.95);
}

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
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

/* 移动端特有样式 */
.mobile-only {
  display: none;
}

.menu-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.menu-icon {
  width: 24px;
  height: 18px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.menu-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--color-text-primary);
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.menu-icon.active span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.menu-icon.active span:nth-child(2) {
  opacity: 0;
}

.menu-icon.active span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

.search-toggle {
  margin-left: auto;
}

/* 移动端搜索栏 */
.mobile-search-bar {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(10, 10, 10, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--space-3);
  z-index: 999;
}

/* 白色主题移动搜索栏 */
[data-theme="light"] .mobile-search-bar {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* 灰色主题移动搜索栏 */
[data-theme="gray"] .mobile-search-bar {
  background: rgba(156, 163, 175, 0.95);
  border-bottom: 1px solid rgba(107, 114, 128, 0.3);
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
}

.mobile-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}

.mobile-menu-content {
  position: relative;
  width: 80%;
  max-width: 320px;
  height: 100%;
  background: rgba(10, 10, 10, 0.98);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1;
}

/* 白色主题移动菜单 */
[data-theme="light"] .mobile-menu-content {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
}

/* 灰色主题移动菜单 */
[data-theme="gray"] .mobile-menu-content {
  background: rgba(156, 163, 175, 0.98);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.2);
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.mobile-menu-header h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.mobile-nav {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-2);
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  transition: all var(--duration-fast);
  position: relative;
}

.mobile-nav-item:hover {
  background: var(--color-surface-hover);
}

.mobile-nav-item i {
  width: 20px;
  text-align: center;
}

.mobile-nav-item .badge {
  position: static;
  margin-left: auto;
}

.mobile-menu-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from .mobile-menu-content {
  transform: translateX(-100%);
}

.slide-leave-to .mobile-menu-content {
  transform: translateX(-100%);
}

.slide-enter-from .mobile-menu-overlay,
.slide-leave-to .mobile-menu-overlay {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 响应式 - 优化FHD分辨率 */
@media (min-width: 1920px) {
  .header-inner {
    padding: 0 var(--space-8);
    grid-template-columns: auto 1fr auto;
  }
  
  .logo-text {
    white-space: nowrap;
  }
}

@media (max-width: 1920px) and (min-width: 1441px) {
  .header-inner {
    padding: 0 var(--space-6);
    grid-template-columns: auto 1fr auto;
  }
  
  .logo-text {
    white-space: nowrap;
  }
}

@media (max-width: 1440px) and (min-width: 1281px) {
  .header-inner {
    padding: 0 var(--space-6);
    grid-template-columns: auto 1fr auto;
  }
  
  .header-search {
    padding: 0 var(--space-4);
  }
  
  .logo-text {
    white-space: nowrap;
  }
}

@media (max-width: 1280px) and (min-width: 769px) {
  .header-inner {
    padding: 0 var(--space-4);
    grid-template-columns: auto 1fr auto;
  }
  
  .logo-text {
    font-size: var(--text-lg);
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .app-header {
    height: 60px;
  }
  
  .header-inner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
  }
  
  .mobile-only {
    display: flex;
  }
  
  .desktop-only {
    display: none !important;
  }
  
  .header-brand {
    flex: 0 0 auto;
    gap: var(--space-2);
  }
  
  .logo-image {
    width: 44px;
    height: 44px;
  }
  
  .logo-text {
    font-size: var(--text-lg);
    white-space: nowrap;
  }
  
  .header-actions {
    margin-left: auto;
  }
  
  .icon-btn {
    width: 36px;
    height: 36px;
  }
  
  /* 移动端主题切换按钮 */
  .theme-toggle {
    color: var(--color-accent);
  }
}

@media (max-width: 480px) {
  .app-header {
    height: 56px;
  }
  
  .header-inner {
    padding: 0 var(--space-2);
  }
  
  .logo-text {
    font-size: var(--text-base);
    white-space: nowrap;
  }
}
</style>