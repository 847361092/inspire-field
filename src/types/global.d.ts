// 全局类型声明

interface Window {
  anime: any
  gsap: any
  ScrollTrigger: any
}

declare module 'lenis' {
  export interface LenisOptions {
    duration?: number
    easing?: (t: number) => number
    orientation?: 'vertical' | 'horizontal'
    gestureOrientation?: 'vertical' | 'horizontal' | 'both'
    smoothWheel?: boolean
    wheelMultiplier?: number
    smoothTouch?: boolean
    touchMultiplier?: number
    infinite?: boolean
  }
  
  export default class Lenis {
    constructor(options?: LenisOptions)
    raf(time: number): void
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    scrollTo(target: string | number | HTMLElement, options?: any): void
    start(): void
    stop(): void
    destroy(): void
    get scroll(): number
  }
}