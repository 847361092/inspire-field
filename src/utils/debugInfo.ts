// 调试信息收集工具
export interface DebugInfo {
  browser: string
  browserVersion: string
  os: string
  screenResolution: string
  windowSize: string
  pixelRatio: number
  userAgent: string
  supportBackdropFilter: boolean
  supportFullscreen: boolean
  timestamp: string
}

export function collectDebugInfo(): DebugInfo {
  const ua = navigator.userAgent
  
  // 检测浏览器
  const getBrowser = () => {
    if (ua.indexOf('Firefox') > -1) {
      const match = ua.match(/Firefox\/(\d+\.\d+)/)
      return {
        name: 'Firefox',
        version: match ? match[1] : 'unknown'
      }
    } else if (ua.indexOf('Chrome') > -1) {
      const match = ua.match(/Chrome\/(\d+\.\d+)/)
      return {
        name: 'Chrome',
        version: match ? match[1] : 'unknown'
      }
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      const match = ua.match(/Version\/(\d+\.\d+)/)
      return {
        name: 'Safari',
        version: match ? match[1] : 'unknown'
      }
    } else if (ua.indexOf('Edge') > -1) {
      const match = ua.match(/Edge\/(\d+\.\d+)/)
      return {
        name: 'Edge',
        version: match ? match[1] : 'unknown'
      }
    } else if (ua.indexOf('Trident') > -1) {
      return {
        name: 'Internet Explorer',
        version: '11'
      }
    }
    return { name: 'Unknown', version: 'unknown' }
  }
  
  // 检测操作系统
  const getOS = () => {
    if (ua.indexOf('Windows NT 10.0') > -1) return 'Windows 10'
    if (ua.indexOf('Windows NT 11.0') > -1) return 'Windows 11'
    if (ua.indexOf('Windows') > -1) return 'Windows'
    if (ua.indexOf('Mac') > -1) return 'macOS'
    if (ua.indexOf('Linux') > -1) return 'Linux'
    if (ua.indexOf('Android') > -1) return 'Android'
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS'
    return 'Unknown'
  }
  
  // 检测backdrop-filter支持
  const checkBackdropFilter = () => {
    const testElem = document.createElement('div')
    testElem.style.cssText = 'backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);'
    return testElem.style.backdropFilter !== undefined || 
           (testElem.style as any).webkitBackdropFilter !== undefined
  }
  
  // 检测全屏API支持
  const checkFullscreen = () => {
    const doc = document as any
    return !!(
      doc.fullscreenEnabled || 
      doc.webkitFullscreenEnabled || 
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    )
  }
  
  const browser = getBrowser()
  
  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: getOS(),
    screenResolution: `${screen.width}x${screen.height}`,
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio || 1,
    userAgent: ua,
    supportBackdropFilter: checkBackdropFilter(),
    supportFullscreen: checkFullscreen(),
    timestamp: new Date().toISOString()
  }
}

// 生成调试报告
export function generateDebugReport(): string {
  const info = collectDebugInfo()
  const report = `
=== 系统环境调试信息 ===
时间: ${info.timestamp}
浏览器: ${info.browser} ${info.browserVersion}
操作系统: ${info.os}
屏幕分辨率: ${info.screenResolution}
窗口大小: ${info.windowSize}
设备像素比: ${info.pixelRatio}
Backdrop Filter支持: ${info.supportBackdropFilter ? '✅ 支持' : '❌ 不支持'}
全屏API支持: ${info.supportFullscreen ? '✅ 支持' : '❌ 不支持'}
User Agent: ${info.userAgent}
=======================
  `.trim()
  
  return report
}

// 在控制台显示调试信息
export function showDebugInfo() {
  const report = generateDebugReport()
  console.log('%c' + report, 'color: #4F46E5; font-family: monospace;')
  return collectDebugInfo()
}

// 复制调试信息到剪贴板
export async function copyDebugInfo() {
  const report = generateDebugReport()
  try {
    await navigator.clipboard.writeText(report)
    console.log('✅ 调试信息已复制到剪贴板')
    return true
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}