import { ref, computed, onMounted, onUnmounted } from 'vue'

// 移动端检测和工具函数
export const useMobile = () => {
  const isTouchDevice = ref(false)
  const screenWidth = ref(window.innerWidth)
  const screenHeight = ref(window.innerHeight)
  const isPortrait = ref(window.matchMedia('(orientation: portrait)').matches)
  
  // 设备类型判断 - 考虑高分辨率手机（如1080x2408）
  const deviceType = computed(() => {
    const width = screenWidth.value
    const height = screenHeight.value
    const aspectRatio = height / width
    
    // 检查是否为移动设备 - 通过宽高比和触摸支持判断
    // 手机通常宽高比 > 1.5（竖屏）
    const isMobileByRatio = aspectRatio > 1.5 && width <= 1200
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // 如果是高宽高比且支持触摸，很可能是手机
    if (isMobileByRatio && hasTouchSupport) {
      return width < 480 ? 'mobile' : 'phablet'
    }
    
    // 传统断点判断
    if (width < 480) return 'mobile'
    if (width < 768) return 'phablet'
    if (width < 1024) return 'tablet'
    if (width < 1440) return 'desktop'
    return 'large-desktop'
  })
  
  const isMobile = computed(() => {
    // 更智能的移动端判断
    const width = screenWidth.value
    const height = screenHeight.value
    const aspectRatio = height / width
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // 1080x2408 这样的高分辨率手机也会被正确识别为移动端
    return (aspectRatio > 1.5 && width <= 1200 && hasTouchSupport) || 
           deviceType.value === 'mobile' || 
           deviceType.value === 'phablet'
  })
  
  const isTablet = computed(() => deviceType.value === 'tablet')
  const isDesktop = computed(() => !isMobile.value && !isTablet.value)
  
  // 触摸事件处理
  const addTouchClass = (element: HTMLElement) => {
    element.addEventListener('touchstart', () => {
      element.classList.add('touch-active')
    }, { passive: true })
    
    element.addEventListener('touchend', () => {
      setTimeout(() => {
        element.classList.remove('touch-active')
      }, 300)
    }, { passive: true })
  }
  
  // 防止双击缩放
  const preventDoubleTapZoom = () => {
    let lastTouchEnd = 0
    document.addEventListener('touchend', (event) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, { passive: false })
  }
  
  // 处理安全区域
  const getSafeAreaInsets = () => {
    const computedStyle = getComputedStyle(document.documentElement)
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0')
    }
  }
  
  // 振动反馈
  const vibrate = (duration: number = 10) => {
    if ('vibrate' in navigator && isTouchDevice.value) {
      navigator.vibrate(duration)
    }
  }
  
  // 长按检测
  const useLongPress = (callback: Function, delay: number = 500) => {
    let timeoutId: number | null = null
    let startX = 0
    let startY = 0
    
    const start = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      
      timeoutId = window.setTimeout(() => {
        vibrate(20)
        callback(e)
      }, delay)
    }
    
    const move = (e: TouchEvent) => {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - startX)
      const deltaY = Math.abs(touch.clientY - startY)
      
      // 如果移动超过10px，取消长按
      if (deltaX > 10 || deltaY > 10) {
        cancel()
      }
    }
    
    const cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
    
    return {
      onTouchStart: start,
      onTouchMove: move,
      onTouchEnd: cancel,
      onTouchCancel: cancel
    }
  }
  
  // 滑动手势检测
  const useSwipe = (options: {
    onSwipeLeft?: Function
    onSwipeRight?: Function
    onSwipeUp?: Function
    onSwipeDown?: Function
    threshold?: number
  } = {}) => {
    const threshold = options.threshold || 50
    let startX = 0
    let startY = 0
    let startTime = 0
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const deltaTime = Date.now() - startTime
      
      // 确保是快速滑动（500ms内）
      if (deltaTime > 500) return
      
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      // 水平滑动
      if (absX > threshold && absX > absY) {
        if (deltaX > 0) {
          options.onSwipeRight?.()
        } else {
          options.onSwipeLeft?.()
        }
      }
      
      // 垂直滑动
      if (absY > threshold && absY > absX) {
        if (deltaY > 0) {
          options.onSwipeDown?.()
        } else {
          options.onSwipeUp?.()
        }
      }
    }
    
    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd
    }
  }
  
  // 更新屏幕尺寸
  const updateScreenSize = () => {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
    isPortrait.value = window.matchMedia('(orientation: portrait)').matches
  }
  
  onMounted(() => {
    // 检测触摸设备
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // 监听尺寸变化
    window.addEventListener('resize', updateScreenSize)
    window.addEventListener('orientationchange', updateScreenSize)
    
    // 移动端优化
    if (isTouchDevice.value) {
      // 禁用双击缩放
      preventDoubleTapZoom()
      
      // 添加触摸设备类
      document.documentElement.classList.add('touch-device')
    } else {
      document.documentElement.classList.add('no-touch')
    }
    
    // 添加设备类型类
    document.documentElement.classList.add(`device-${deviceType.value}`)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenSize)
    window.removeEventListener('orientationchange', updateScreenSize)
  })
  
  return {
    isTouchDevice,
    screenWidth,
    screenHeight,
    isPortrait,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    addTouchClass,
    getSafeAreaInsets,
    vibrate,
    useLongPress,
    useSwipe
  }
}