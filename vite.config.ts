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

            // 生成所有18个作品的数据
            const generateArtworks = () => {
              const artworks = []

              // 分类分配规则（根据实际文件结构）
              const categoryMap: { [key: string]: string } = {
                '001': 'mecha', '004': 'mecha', '007': 'mecha',
                '010': 'mecha', '013': 'mecha', '016': 'mecha',
                '002': 'concept', '005': 'concept', '008': 'concept',
                '011': 'concept', '014': 'concept', '017': 'concept',
                '003': 'illustration', '006': 'illustration', '009': 'illustration',
                '012': 'illustration', '015': 'illustration', '018': 'illustration'
              }

              // 特殊作品（只有4张图片）
              const specialWorks = ['010', '018']

              for (let i = 1; i <= 18; i++) {
                const workNum = i.toString().padStart(3, '0')
                const category = categoryMap[workNum]
                const imageCount = specialWorks.includes(workNum) ? 4 : 5
                const images = []

                // 生成图片路径
                for (let j = 1; j <= imageCount; j++) {
                  images.push(`/artworks/${category}/作品${workNum}/image_${j}.webp`)
                }

                artworks.push({
                  id: i.toString(),
                  title: `作品${workNum}`,
                  category: category,
                  thumbnail: `/artworks/${category}/作品${workNum}/image_1.webp`,
                  images: images,
                  authorName: '数字艺术家',
                  description: `${category === 'mecha' ? '机甲设计' : category === 'concept' ? '概念艺术' : '插画'}作品`,
                  createdAt: new Date(2024, 0, i).toISOString(),
                  imageCount: imageCount
                })
              }

              return artworks
            }

            // 返回模拟的作品列表数据
            const mockData = {
              success: true,
              artworks: generateArtworks()
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
