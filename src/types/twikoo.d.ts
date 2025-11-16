// Twikoo 全局类型声明

declare global {
  interface Window {
    twikoo?: {
      init: (options: TwikooOptions) => Promise<void>
    }
  }
}

export interface TwikooOptions {
  envId: string
  el: string | HTMLElement
  lang?: 'zh' | 'zh-CN' | 'zh-TW' | 'en' | 'en-US'
  path?: string
  region?: string
  version?: number
  accessToken?: string
  requiredMeta?: string[]

  // 回调函数
  onCommentLoaded?: () => void
  onCommentPosted?: () => void
  onInit?: () => void
  onError?: (error: Error) => void
}

// Twikoo 配置接口
export interface TwikooConfig {
  VERSION?: string
  IS_ADMIN?: boolean
  SHOW_IMAGE?: string | boolean
  LIGHTBOX?: string | boolean
  SHOW_EMOTION?: string | boolean
  HIGHLIGHT?: string | boolean
  HIDE_ADMIN_CRYPT?: string // 管理面板暗号
  BLOGGER_EMAIL?: string
  REQUIRED_FIELDS?: string[]
  DISPLAYED_FIELDS?: string[]
  [key: string]: any
}

export {}