import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
      beforeEnter: (to, from, next) => {
        // 在路由守卫中检测设备类型
        const userAgent = navigator.userAgent.toLowerCase()
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone|mobile/.test(userAgent) ||
                        window.innerWidth <= 768
        
        if (isMobile && !to.path.startsWith('/m')) {
          next('/m')
        } else {
          next()
        }
      }
    },
    {
      path: '/artwork/:id',
      name: 'artwork-detail',
      component: () => import('../views/ArtworkDetail.vue'),
      beforeEnter: (to, from, next) => {
        const userAgent = navigator.userAgent.toLowerCase()
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone|mobile/.test(userAgent) ||
                        window.innerWidth <= 768
        
        if (isMobile) {
          next(`/m/artwork/${to.params.id}`)
        } else {
          next()
        }
      }
    },
    // 移动端专用路由
    {
      path: '/m',
      name: 'mobile-home',
      component: () => import('../views/mobile/MobileHome.vue'),
    },
    {
      path: '/m/artwork/:id',
      name: 'mobile-artwork',
      component: () => import('../views/mobile/MobileArtwork.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
