<template>
  <Teleport to="body">
    <div v-if="isVisible" class="transition-container">
      <!-- 纸张滑入层 -->
      <div 
        class="paper-layer" 
        :class="[`theme-${currentTheme}`, paperState, { reverse: isReverse }]"
        ref="paperRef"
      >
        <!-- 纸张纹理 -->
        <div class="paper-texture"></div>
        
        <!-- 内容层 -->
        <div class="transition-content" :class="{ 'content-visible': contentVisible }">
          <!-- Logo 容器 -->
          <div class="logo-container" ref="logoRef">
            <!-- 主 Logo -->
            <div class="logo-wrapper">
              <div class="logo-image-container">
                <img 
                  :src="currentLogoSrc" 
                  alt="Voxel Union" 
                  class="logo-image"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import logoWhite from '@/assets/logo-white.png'
import logoDark from '@/assets/logo-dark.png'

/**
 * 页面过渡动画组件 - 让页面切换像翻书一样优雅
 * 
 * 这个组件实现了一个类似"揭开帘幕"的效果：
 * 1. 一张纸从上方滑下来遮住当前页面
 * 2. 在纸张遮住的瞬间，悄悄切换页面（用户看不到切换过程）
 * 3. 播放一个炫酷的进度条动画
 * 4. 纸张向下滑走，露出新页面
 * 
 * 整个过程大约3.2秒，让用户感觉很流畅，没有突兀的跳转感
 */

// 从父组件接收的参数
const props = defineProps<{
  show: boolean               // 是否显示过渡动画
  minDuration?: number        // 最小显示时间（可选）
  direction?: 'forward' | 'reverse'  // 动画方向：forward向前翻页，reverse向后翻页
}>()

// 向父组件发送的事件
const emit = defineEmits<{
  complete: []    // 动画完全结束时触发
  covered: []     // 纸张遮住屏幕时触发（这时可以安全地切换路由）
}>()

// 控制动画各个阶段的状态变量
const isVisible = ref(false)          // 整个组件是否可见
const paperRef = ref<HTMLElement>()   // 纸张元素的引用
const logoRef = ref<HTMLElement>()    // Logo元素的引用
const paperState = ref<'entering' | 'visible' | 'leaving'>('entering')  // 纸张的动画状态
const contentVisible = ref(false)     // 内容是否可见
const isReverse = computed(() => props.direction === 'reverse')  // 判断是否是反向动画

// 检测是否为手机，手机上会简化动画效果
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
})

// 获取当前主题 - 使用响应式方式
const currentTheme = ref('dark')

// 更新主题的函数
const updateTheme = () => {
  const theme = document.documentElement.getAttribute('data-theme')
  currentTheme.value = theme || 'dark'
}

// 监听主题变化
onMounted(() => {
  updateTheme()
  // 监听属性变化
  const observer = new MutationObserver(() => {
    updateTheme()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
})

// 根据主题选择Logo图片
const currentLogoSrc = computed(() => {
  // 深色主题用白logo，浅色主题用黑logo
  if (currentTheme.value === 'dark') {
    return logoWhite
  } else {
    return logoDark
  }
})


/**
 * 开始播放过渡动画
 * 简化版：只显示Logo，无进度条
 */
const startAnimation = () => {
  // 确保主题颜色是最新的
  updateTheme()
  
  // 动画时间
  const animationDuration = isMobile.value ? 300 : 500
  const displayDuration = isMobile.value ? 800 : 1200
  
  // 纸张滑入动画
  paperState.value = 'entering'
  setTimeout(() => {
    paperState.value = 'visible'
    contentVisible.value = true
    // 移动端和PC端都显示Logo动画
    startLogoAnimation()
    // 纸张覆盖完成，通知路由切换
    emit('covered')
  }, animationDuration)
  
  // 延迟后自动滑出
  setTimeout(() => {
    paperState.value = 'leaving'
    contentVisible.value = false
    setTimeout(() => {
      emit('complete')
    }, 500)
  }, animationDuration + displayDuration)
}

const stopAnimation = () => {
  // 简化版：清理动画状态
  contentVisible.value = false
}

const startLogoAnimation = () => {
  if (typeof window !== 'undefined' && window.anime) {
    // 统一的Logo动画效果（PC和移动端相同）
    window.anime({
      targets: '.logo-image',
      scale: [0.8, 1],
      opacity: [0, 1],
      rotate: ['-10deg', '0deg'],
      duration: 800,
      easing: 'easeOutElastic(1, .6)'
    })
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    isVisible.value = true
    startAnimation()
  } else {
    setTimeout(() => {
      isVisible.value = false
      stopAnimation()
    }, 400)
  }
})

onMounted(() => {
  // 预加载动画
})
</script>

<style scoped>
.transition-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  overflow: hidden;
  pointer-events: all;
}

/* 纸张层 */
.paper-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center top;
  will-change: transform;
  transition: none;
}

/* 主题颜色 - 默认黑色 */
.paper-layer {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
}

.paper-layer.theme-dark {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
}

.paper-layer.theme-light {
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.paper-layer.theme-gray {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

/* 纸张动画状态 */
.paper-layer.entering {
  animation: paperSlideIn 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;
}

.paper-layer.entering.reverse {
  animation: paperSlideInReverse 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;
}

.paper-layer.visible {
  transform: translateY(0) scale(1);
}

.paper-layer.leaving {
  animation: paperSlideOut 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;
}

.paper-layer.leaving.reverse {
  animation: paperSlideOutReverse 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes paperSlideIn {
  0% {
    transform: translateY(-100%) scale(1);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes paperSlideOut {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(100%) scale(1);
  }
}

/* 反向动画 - 从底部进入，从顶部离开 */
@keyframes paperSlideInReverse {
  0% {
    transform: translateY(100%) scale(1);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes paperSlideOutReverse {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(-100%) scale(1);
  }
}

/* 纸张纹理 */
.paper-texture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.03;
  background-image: 
    repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px),
    repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(0,0,0,.03) 35px, rgba(0,0,0,.03) 70px);
  pointer-events: none;
}


/* 内容层 */
.transition-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 60px;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.transition-content.content-visible {
  opacity: 1;
  transform: scale(1);
}

/* Logo 容器 */
.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* Logo 图片容器 */
.logo-image-container {
  position: relative;
  width: min(750px, 80vw);
  height: min(750px, 80vw);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2));
  transition: all 0.3s ease;
}

.theme-light .logo-image {
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.1));
}

.theme-gray .logo-image {
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));
}


/* 响应式 - 移动端优化 */
@media (max-width: 768px) {
  /* 使用和PC端一样的大Logo */
  .logo-image-container {
    width: min(650px, 75vw);
    height: min(650px, 75vw);
  }
  
  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2));
  }
  
  .transition-content {
    gap: 60px;
  }
  
  /* 使用和PC端相同的动画 */
  .paper-layer.entering {
    animation: paperSlideIn 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
  
  .paper-layer.leaving {
    animation: paperSlideOut 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
}

@keyframes paperSlideInMobile {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes paperSlideOutMobile {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100%);
  }
}

/* 更小屏幕也保持大Logo */
@media (max-width: 480px) {
  .logo-image-container {
    width: min(500px, 70vw);
    height: min(500px, 70vw);
  }
}
</style>