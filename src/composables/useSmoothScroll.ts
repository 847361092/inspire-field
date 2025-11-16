import Lenis from 'lenis'
import { onMounted, onUnmounted, ref } from 'vue'

declare global {
  interface Window {
    gsap: any
    ScrollTrigger: any
  }
}

export const useSmoothScroll = () => {
  const lenis = ref<Lenis | null>(null)
  let rafId: number
  
  const initSmoothScroll = () => {
    // 初始化Lenis平滑滚动 - 优化性能配置
    lenis.value = new Lenis({
      duration: 0.8,  // 减少动画时长
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.2,  // 加快滚轮响应
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
      // lerp 参数已被移除，使用 duration 控制平滑度
    } as any)
    
    // 动画循环
    const raf = (time: number) => {
      lenis.value?.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    
    rafId = requestAnimationFrame(raf)
    
    // 如果有GSAP和ScrollTrigger，同步它们
    if (window.gsap && window.ScrollTrigger) {
      // 注册ScrollTrigger插件
      window.gsap.registerPlugin(window.ScrollTrigger)
      
      // 同步Lenis与ScrollTrigger
      lenis.value.on('scroll', window.ScrollTrigger.update)
      
      // 设置ScrollTrigger的滚动代理
      window.ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value?: number) {
          if (arguments.length && value !== undefined) {
            lenis.value?.scrollTo(value, { immediate: true })
          }
          return lenis.value?.scroll || 0
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
          }
        },
        pinType: 'transform'
      })
      
      setupScrollAnimations()
    }
  }
  
  const setupScrollAnimations = () => {
    if (!window.gsap || !window.ScrollTrigger) return
    
    // Hero区域视差
    window.gsap.to('.hero-bg', {
      yPercent: 50,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })
    
    // 作品卡片渐入
    window.gsap.utils.toArray('.artwork-card').forEach((card: any, i: number) => {
      window.gsap.from(card, {
        y: 100,
        opacity: 0,
        duration: 1,
        delay: i * 0.05,
        scrollTrigger: {
          trigger: card,
          start: 'top bottom-=100',
          toggleActions: 'play none none reverse'
        }
      })
    })
    
    // 标题动画
    window.gsap.utils.toArray('.animate-title').forEach((title: any) => {
      window.gsap.from(title, {
        y: 50,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: title,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })
    })
    
    // 视差层效果
    window.gsap.utils.toArray('.parallax-layer').forEach((layer: any) => {
      const speed = layer.dataset.speed || 0.5
      
      window.gsap.to(layer, {
        yPercent: parseFloat(speed) * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: layer,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
    })
    
    // 横向滚动区域 - 暂时禁用以避免冲突
    // const horizontalSections = window.gsap.utils.toArray('.horizontal-scroll')
    
    // horizontalSections.forEach((section: any) => {
    //   const wrapper = section.querySelector('.horizontal-wrapper')
    //   if (!wrapper) return
      
    //   const scrollWidth = wrapper.scrollWidth - section.offsetWidth
      
    //   window.gsap.to(wrapper, {
    //     x: -scrollWidth,
    //     ease: 'none',
    //     scrollTrigger: {
    //       trigger: section,
    //       start: 'top top',
    //       end: () => `+=${scrollWidth}`,
    //       scrub: 1,
    //       pin: true,
    //       anticipatePin: 1
    //     }
    //   })
    // })
  }
  
  // 滚动到指定位置
  const scrollTo = (target: string | number | HTMLElement, options?: any) => {
    lenis.value?.scrollTo(target, options)
  }
  
  // 停止滚动
  const stop = () => {
    lenis.value?.stop()
  }
  
  // 开始滚动
  const start = () => {
    lenis.value?.start()
  }
  
  // 销毁
  const destroy = () => {
    if (rafId) cancelAnimationFrame(rafId)
    lenis.value?.destroy()
    
    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill())
    }
  }
  
  onMounted(() => {
    // 延迟初始化，等待DOM准备完成
    setTimeout(() => {
      initSmoothScroll()
    }, 100)
  })
  
  onUnmounted(() => {
    destroy()
  })
  
  return {
    lenis,
    scrollTo,
    stop,
    start,
    destroy
  }
}