import { ref, onMounted, onUnmounted, computed } from 'vue'

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
  devicePixelRatio: number
  userAgent: string
}

export const useDevice = () => {
  const screenWidth = ref(window.innerWidth)
  const screenHeight = ref(window.innerHeight)
  const devicePixelRatio = ref(window.devicePixelRatio || 1)

  // 移动设备检测
  const checkMobile = (): boolean => {
    // 基于用户代理的检测
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 
      'blackberry', 'windows phone', 'mobile'
    ]
    const isMobileAgent = mobileKeywords.some(keyword => userAgent.includes(keyword))
    
    // 基于屏幕尺寸的检测
    const isMobileSize = screenWidth.value <= 768
    
    // 基于触摸支持的检测
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // 综合判断：任意两个条件满足即认为是移动设备
    const conditions = [isMobileAgent, isMobileSize, isTouchDevice]
    return conditions.filter(c => c).length >= 2
  }

  // 平板设备检测
  const checkTablet = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isIpad = userAgent.includes('ipad')
    const isAndroidTablet = userAgent.includes('android') && !userAgent.includes('mobile')
    const isTabletSize = screenWidth.value > 768 && screenWidth.value <= 1024
    
    return (isIpad || isAndroidTablet) || (isTabletSize && 'ontouchstart' in window)
  }

  const isMobile = ref(checkMobile())
  const isTablet = ref(checkTablet())
  const isDesktop = computed(() => !isMobile.value && !isTablet.value)

  // 处理窗口大小变化
  const handleResize = () => {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
    devicePixelRatio.value = window.devicePixelRatio || 1
    isMobile.value = checkMobile()
    isTablet.value = checkTablet()
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
  })

  const deviceInfo = computed<DeviceInfo>(() => ({
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: isDesktop.value,
    screenWidth: screenWidth.value,
    screenHeight: screenHeight.value,
    devicePixelRatio: devicePixelRatio.value,
    userAgent: navigator.userAgent
  }))

  // 强制设备类型（用于开发测试）
  const forceDeviceType = (type: 'mobile' | 'tablet' | 'desktop') => {
    switch (type) {
      case 'mobile':
        isMobile.value = true
        isTablet.value = false
        break
      case 'tablet':
        isMobile.value = false
        isTablet.value = true
        break
      case 'desktop':
        isMobile.value = false
        isTablet.value = false
        break
    }
  }

  return {
    deviceInfo,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    devicePixelRatio,
    forceDeviceType
  }
}