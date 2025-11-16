import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router'

/**
 * 全局页面过渡动画状态管理
 * 
 * 负责协调页面切换时的过渡动画效果
 * 核心原理：确保路由切换发生在动画遮罩完全覆盖屏幕的瞬间，实现无缝过渡
 * 
 * 动画流程：
 * 1. 调用 startTransition() 启动动画
 * 2. 纸张滑入覆盖屏幕（0.5秒）
 * 3. onCovered() 被触发，执行路由切换（此时用户看不到切换过程）
 * 4. 进度条和Logo动画播放（2秒）
 * 5. 纸张滑出，显示新页面
 * 6. onComplete() 清理状态
 */
export const useTransitionStore = defineStore('transition', () => {
  const showTransition = ref(false)  // 是否显示过渡动画
  const transitionDirection = ref<'forward' | 'reverse'>('forward')  // 动画方向
  const pendingNavigation = ref<string | null>(null)  // 待导航的目标路由
  
  /**
   * 开始过渡动画
   * @param target - 目标路由路径或 'back' 表示返回
   * @param direction - 动画方向：forward(向前) reverse(返回)
   */
  const startTransition = (target: string, direction: 'forward' | 'reverse' = 'forward') => {
    showTransition.value = true
    transitionDirection.value = direction
    pendingNavigation.value = target
  }
  
  /**
   * 当动画覆盖完成时执行路由切换
   * 这个方法在纸张完全覆盖屏幕时被 TransitionLoader 组件调用
   * 确保用户看不到路由切换的过程
   */
  const onCovered = () => {
    if (pendingNavigation.value) {
      if (pendingNavigation.value === 'back') {
        router.back()
      } else {
        router.push(pendingNavigation.value)
      }
      pendingNavigation.value = null
    }
  }
  
  /**
   * 动画完成后清理状态
   * 在纸张滑出动画结束后调用
   */
  const onComplete = () => {
    showTransition.value = false
  }
  
  /**
   * 立即结束过渡动画
   * 用于页面加载完成后手动结束过渡
   */
  const endTransition = () => {
    showTransition.value = false
    pendingNavigation.value = null
  }
  
  return {
    showTransition,
    transitionDirection,
    startTransition,
    onCovered,
    onComplete,
    endTransition
  }
})