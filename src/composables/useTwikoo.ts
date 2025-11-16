import { ref, onMounted, onUnmounted } from 'vue'
import type { TwikooOptions } from '@/types/twikoo'

// 全局状态
const isScriptLoaded = ref(false)
const loadingPromise = ref<Promise<void> | null>(null)

/**
 * 加载 Twikoo 脚本
 */
export function loadTwikooScript(): Promise<void> {
  // 如果已经加载过，直接返回
  if (isScriptLoaded.value && window.twikoo) {
    return Promise.resolve()
  }

  // 如果正在加载，返回加载中的 Promise
  if (loadingPromise.value) {
    return loadingPromise.value
  }

  // 创建新的加载 Promise
  loadingPromise.value = new Promise((resolve, reject) => {
    // 检查是否已经存在 script 标签
    const existingScript = document.querySelector('script[src*="twikoo"]')
    if (existingScript) {
      isScriptLoaded.value = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.40/dist/twikoo.all.min.js'
    script.async = true

    script.onload = () => {
      isScriptLoaded.value = true
      loadingPromise.value = null
      resolve()
    }

    script.onerror = () => {
      loadingPromise.value = null
      reject(new Error('Failed to load Twikoo script'))
    }

    document.head.appendChild(script)
  })

  return loadingPromise.value
}

/**
 * 初始化 Twikoo 评论组件
 */
export async function initTwikoo(options: TwikooOptions): Promise<void> {
  try {
    // 确保脚本已加载
    await loadTwikooScript()

    // 确保 Twikoo 对象存在
    if (!window.twikoo) {
      throw new Error('Twikoo is not loaded')
    }

    // 初始化 Twikoo
    await window.twikoo.init(options)
  } catch (error) {
    console.error('Twikoo initialization failed:', error)
    throw error
  }
}

/**
 * 获取评论数量
 */
export async function getCommentCount(envId: string, urls: string[]): Promise<{ url: string; count: number }[]> {
  try {
    const response = await fetch(`${envId}/api/comment-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch comment count')
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get comment count:', error)
    return urls.map(url => ({ url, count: 0 }))
  }
}

/**
 * 获取最新评论
 */
export async function getRecentComments(envId: string, limit = 10): Promise<any[]> {
  try {
    const response = await fetch(`${envId}/api/recent-comment?limit=${limit}`)

    if (!response.ok) {
      throw new Error('Failed to fetch recent comments')
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get recent comments:', error)
    return []
  }
}

/**
 * Twikoo 配置
 */
export function useTwikoo() {
  // 从环境变量获取配置
  const envId = import.meta.env.VITE_TWIKOO_ENV_ID || 'https://your-twikoo-app.vercel.app'

  /**
   * 获取默认配置
   */
  const getDefaultOptions = (path: string): TwikooOptions => ({
    envId,
    el: '#twikoo-comments',
    lang: 'zh-CN',
    path,
    requiredMeta: ['nick', 'mail'], // 必填字段：昵称、邮箱

    // 添加初始化回调
    onInit: () => {
      console.log('✅ Twikoo 初始化成功')
      console.log('🔧 Twikoo envId:', envId)
      console.log('📍 Twikoo path:', path)

      // 检查管理面板图标是否存在
      setTimeout(() => {
        const adminIcon = document.querySelector('.tk-icon.__comments')
        if (adminIcon) {
          console.log('⚙️ 管理面板图标已显示，位于评论区右上角')
        } else {
          console.warn('⚠️ 管理面板图标未找到，可能被隐藏或加载失败')
        }
      }, 1000)
    },

    // 添加错误处理
    onError: (error: Error) => {
      console.error('❌ Twikoo 错误:', error)
    }
  })

  /**
   * 清理 Twikoo 实例
   */
  const cleanup = () => {
    // 清理 DOM 中的 Twikoo 元素
    const twikooElements = document.querySelectorAll('#twikoo-comments')
    twikooElements.forEach(element => {
      element.innerHTML = ''
    })
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    envId,
    loadTwikooScript,
    initTwikoo,
    getCommentCount,
    getRecentComments,
    getDefaultOptions,
    cleanup,
    isScriptLoaded,
  }
}

// 导出类型
export type { TwikooOptions } from '@/types/twikoo'