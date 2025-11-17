import { fileURLToPath, URL } from 'node:url'
import type { ViteDevServer } from 'vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// 本地开发 API 中间件
const mockApiMiddleware = () => {
  return {
    name: 'mock-api',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use((req: any, res: any, next: any) => {
          // 处理 /api/artworks 请求
          if (req.url?.startsWith('/api/artworks') && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200

            // 返回模拟的作品列表数据
            const mockData = {
              success: true,
              artworks: [
                {
                  id: '1',
                  title: '作品001',
                  category: 'mecha',
                  thumbnail: '/artworks/mecha/作品001/image_1.webp',
                  images: [
                    '/artworks/mecha/作品001/image_1.webp',
                    '/artworks/mecha/作品001/image_2.webp',
                    '/artworks/mecha/作品001/image_3.webp',
                    '/artworks/mecha/作品001/image_4.webp',
                    '/artworks/mecha/作品001/image_5.webp'
                  ],
                  authorName: '数字艺术家',
                  description: '机甲设计作品',
                  createdAt: new Date().toISOString(),
                  imageCount: 5
                }
              ]
            }

            res.end(JSON.stringify(mockData))
            return
          }

          // 处理 /api/categories 请求
          if (req.url?.startsWith('/api/categories') && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200

            const mockData = {
              success: true,
              categories: [
                { id: 'all', name: '全部' },
                { id: 'mecha', name: '机甲设计', count: 5 },
                { id: 'concept', name: '概念艺术', count: 5 },
                { id: 'illustration', name: '插画作品', count: 5 }
              ]
            }

            res.end(JSON.stringify(mockData))
            return
          }

          next()
        })
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    // vueDevTools(), // 关闭Vue DevTools
    mockApiMiddleware(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    open: false,
    fs: {
      strict: false
    }
  },
  publicDir: 'public'
})
