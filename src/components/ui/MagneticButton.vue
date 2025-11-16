<template>
  <button 
    ref="buttonRef"
    class="magnetic-button"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <span class="button-text">
      <slot>Explore</slot>
    </span>
    <span class="button-bg"></span>
    <span class="button-ripple" ref="rippleRef"></span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonRef = ref<HTMLElement>()
const rippleRef = ref<HTMLElement>()
const magnetStrength = 0.3
const isHovering = ref(false)

// 鼠标进入
const handleMouseEnter = () => {
  isHovering.value = true
  
  if (typeof window !== 'undefined' && window.anime) {
    // 背景展开
    window.anime({
      targets: '.button-bg',
      scale: [0, 1],
      opacity: [0, 1],
      duration: 400,
      easing: 'easeOutExpo'
    })
  }
}

// 鼠标移动 - 磁性效果
const handleMouseMove = (e: MouseEvent) => {
  if (!buttonRef.value || !isHovering.value) return
  
  const rect = buttonRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left - rect.width / 2
  const y = e.clientY - rect.top - rect.height / 2
  
  if (typeof window !== 'undefined' && window.anime) {
    // 按钮磁性吸附
    window.anime({
      targets: buttonRef.value,
      translateX: x * magnetStrength,
      translateY: y * magnetStrength,
      duration: 0,
    })
    
    // 背景跟随
    window.anime({
      targets: '.button-bg',
      translateX: x * 0.5,
      translateY: y * 0.5,
      duration: 0,
    })
    
    // 文字反向移动（视差效果）
    window.anime({
      targets: '.button-text',
      translateX: x * -0.1,
      translateY: y * -0.1,
      duration: 0,
    })
  }
}

// 鼠标离开
const handleMouseLeave = () => {
  isHovering.value = false
  
  if (typeof window !== 'undefined' && window.anime) {
    // 恢复原位
    window.anime({
      targets: [buttonRef.value, '.button-bg', '.button-text'],
      translateX: 0,
      translateY: 0,
      duration: 600,
      easing: 'easeOutElastic(1, 0.5)'
    })
    
    // 背景收缩
    window.anime({
      targets: '.button-bg',
      scale: 0,
      opacity: 0,
      duration: 400,
      easing: 'easeOutExpo'
    })
  }
}

// 点击效果
const handleClick = (e: MouseEvent) => {
  emit('click', e)
  
  if (!buttonRef.value || !rippleRef.value) return
  
  // 创建涟漪效果
  const rect = buttonRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (rippleRef.value) {
    rippleRef.value.style.left = `${x}px`
    rippleRef.value.style.top = `${y}px`
    
    if (typeof window !== 'undefined' && window.anime) {
      window.anime({
        targets: rippleRef.value,
        scale: [0, 2],
        opacity: [1, 0],
        duration: 600,
        easing: 'easeOutExpo'
      })
    }
  }
}
</script>

<style scoped>
.magnetic-button {
  position: relative;
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: white;
  background: var(--color-accent);
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-full);
  cursor: pointer;
  overflow: hidden;
  transition: color var(--duration-normal);
  transform-style: preserve-3d;
  will-change: transform;
}

.magnetic-button:hover {
  color: white;
}

.magnetic-button:active {
  transform: scale(0.98);
}

/* 按钮背景 */
.button-bg {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--color-accent-hover), var(--color-highlight));
  border-radius: inherit;
  opacity: 0;
  transform: scale(0);
  transform-origin: center;
  z-index: 0;
}

/* 按钮文字 */
.button-text {
  position: relative;
  z-index: 2;
  display: inline-block;
  pointer-events: none;
}

/* 涟漪效果 */
.button-ripple {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%) scale(0);
  pointer-events: none;
  z-index: 1;
}

/* 发光效果 */
.magnetic-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, var(--color-accent), var(--color-highlight));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity var(--duration-normal);
}

.magnetic-button:hover::before {
  opacity: 0.5;
}

/* 阴影动画 */
@keyframes shadowPulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
  }
  50% {
    box-shadow: 0 4px 30px rgba(79, 70, 229, 0.5);
  }
}

.magnetic-button:hover {
  animation: shadowPulse 2s ease-in-out infinite;
}

/* 禁用状态 */
.magnetic-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* 尺寸变体 */
.magnetic-button.small {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

.magnetic-button.large {
  padding: var(--space-5) var(--space-10);
  font-size: var(--text-lg);
}
</style>