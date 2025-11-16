<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import TransitionLoader from '@/components/ui/TransitionLoader.vue'
import { useTransitionStore } from '@/stores/transition'

const transitionStore = useTransitionStore()
const route = useRoute()

// 根据路由判断是否为移动端页面
const isMobilePage = computed(() => {
  return route.path.startsWith('/m')
})

// 监听路由变化，管理主题
watch(isMobilePage, (isMobile) => {
  if (isMobile) {
    // 移动端页面，移除全局主题设置
    document.documentElement.removeAttribute('data-theme')
  } else {
    // PC端页面，恢复主题设置
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
}, { immediate: true })

onMounted(() => {
  // 仅在非移动端页面设置主题
  if (!isMobilePage.value) {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
  
  // 计算并设置滚动条宽度差异
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
  
  // 监听窗口大小变化
  const updateScrollbarWidth = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
  }
  
  window.addEventListener('resize', updateScrollbarWidth)
})
</script>

<template>
  <div id="app">
    <!-- 顶部导航 - 仅PC端显示 -->
    <AppHeader v-if="!isMobilePage" />
    
    <!-- 路由视图 -->
    <main class="main-content" :class="{ 'mobile-main': isMobilePage }">
      <RouterView />
    </main>
    
    <!-- 全局过渡动画层 - PC端使用 -->
    <TransitionLoader 
      v-if="!isMobilePage"
      :show="transitionStore.showTransition" 
      :min-duration="2000"
      :direction="transitionStore.transitionDirection"
      @covered="transitionStore.onCovered"
      @complete="transitionStore.onComplete"
    />
  </div>
</template>

<style>
/* 导入全局样式 */
@import '@/assets/styles/global.css';
@import '@/assets/styles/mobile.css';

#app {
  min-height: 100vh;
  position: relative;
  width: 100%;
  margin: 0;
  padding: 0;
}

.main-content {
  padding-top: 0; /* 移除padding，让各页面自行控制 */
  min-height: 100vh;
  width: 100%;
  position: relative;
}

/* 移动端主内容区域 */
.main-content.mobile-main {
  padding-top: 0 !important;
  padding-bottom: env(safe-area-inset-bottom); /* 移除底部导航空间 */
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    padding-bottom: env(safe-area-inset-bottom); /* 移除底部导航空间 */
  }
}

/* 移动端隐藏顶部栏 - 仅针对真正的移动设备 */
@media (max-width: 768px) and (pointer: coarse) {
  .mobile-device .app-header {
    display: none !important;
  }
}

</style>
