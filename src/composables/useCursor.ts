import { onMounted, onUnmounted } from 'vue'

export const useCursor = () => {
  let cursor: HTMLElement
  let cursorDot: HTMLElement
  let animationId: number
  
  const initCursor = () => {
    // 创建光标元素
    cursor = document.createElement('div')
    cursor.className = 'custom-cursor'
    cursorDot = document.createElement('div')
    cursorDot.className = 'cursor-dot'
    
    document.body.appendChild(cursor)
    document.body.appendChild(cursorDot)
    
    // 添加样式
    const style = document.createElement('style')
    style.textContent = `
      .custom-cursor {
        width: 40px;
        height: 40px;
        border: 2px solid var(--color-accent);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: difference;
        transition: transform 0.2s ease-out, border-color 0.3s;
        transform: translate(-50%, -50%);
      }
      
      .cursor-dot {
        width: 6px;
        height: 6px;
        background: var(--color-accent);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
      }
      
      body { cursor: none; }
      a, button, input, textarea, select, .clickable { cursor: none; }
      
      .custom-cursor.hover {
        transform: translate(-50%, -50%) scale(1.5);
        border-color: var(--color-highlight);
      }
      
      .custom-cursor.click {
        transform: translate(-50%, -50%) scale(0.9);
      }
    `
    document.head.appendChild(style)
  }
  
  const moveCursor = (e: MouseEvent) => {
    // 使用 requestAnimationFrame 优化性能
    if (animationId) cancelAnimationFrame(animationId)
    
    animationId = requestAnimationFrame(() => {
      if (cursor && cursorDot) {
        // 大圆跟随（平滑）
        if (typeof window !== 'undefined' && window.anime) {
          window.anime({
            targets: cursor,
            left: e.clientX,
            top: e.clientY,
            duration: 300,
            easing: 'easeOutExpo'
          })
        } else {
          cursor.style.left = e.clientX + 'px'
          cursor.style.top = e.clientY + 'px'
        }
        
        // 中心点即时跟随
        cursorDot.style.left = e.clientX + 'px'
        cursorDot.style.top = e.clientY + 'px'
      }
    })
  }
  
  const handleMouseOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    
    if (target.matches('a, button, input, textarea, select, .clickable')) {
      cursor?.classList.add('hover')
      
      if (typeof window !== 'undefined' && window.anime) {
        window.anime({
          targets: cursor,
          scale: 1.5,
          duration: 300,
          easing: 'easeOutExpo'
        })
      }
    }
  }
  
  const handleMouseOut = () => {
    cursor?.classList.remove('hover')
    
    if (typeof window !== 'undefined' && window.anime) {
      window.anime({
        targets: cursor,
        scale: 1,
        duration: 300,
        easing: 'easeOutExpo'
      })
    }
  }
  
  const handleMouseDown = () => {
    cursor?.classList.add('click')
  }
  
  const handleMouseUp = () => {
    cursor?.classList.remove('click')
  }
  
  const handleMouseLeave = () => {
    // 隐藏光标
    if (cursor) cursor.style.opacity = '0'
    if (cursorDot) cursorDot.style.opacity = '0'
  }
  
  const handleMouseEnter = () => {
    // 显示光标
    if (cursor) cursor.style.opacity = '1'
    if (cursorDot) cursorDot.style.opacity = '1'
  }
  
  onMounted(() => {
    // 检测是否支持触摸（移动设备不显示自定义光标）
    if ('ontouchstart' in window) return
    
    initCursor()
    
    // 添加事件监听
    document.addEventListener('mousemove', moveCursor)
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)
  })
  
  onUnmounted(() => {
    // 清理
    if (animationId) cancelAnimationFrame(animationId)
    
    document.removeEventListener('mousemove', moveCursor)
    document.removeEventListener('mouseover', handleMouseOver)
    document.removeEventListener('mouseout', handleMouseOut)
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mouseleave', handleMouseLeave)
    document.removeEventListener('mouseenter', handleMouseEnter)
    
    cursor?.remove()
    cursorDot?.remove()
  })
  
  return {
    // 可以暴露一些方法供外部使用
    hideCursor: () => {
      if (cursor) cursor.style.display = 'none'
      if (cursorDot) cursorDot.style.display = 'none'
    },
    showCursor: () => {
      if (cursor) cursor.style.display = 'block'
      if (cursorDot) cursorDot.style.display = 'block'
    }
  }
}