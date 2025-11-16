<template>
  <nav class="side-nav" :class="{ expanded: isExpanded }">
    <!-- 展开/收起按钮 -->
    <button class="toggle-btn" @click="toggleNav">
      <i :class="isExpanded ? 'fas fa-times' : 'fas fa-bars'"></i>
    </button>
    
    <!-- 导航菜单 -->
    <ul class="nav-menu">
      <li v-for="item in navItems" :key="item.id" class="nav-item">
        <a 
          :href="item.href"
          class="nav-link"
          :class="{ active: activeSection === item.id }"
          @click.prevent="scrollToSection(item.href)"
          :title="item.label"
        >
          <i :class="item.icon"></i>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </li>
    </ul>
    
    <!-- 底部操作 -->
    <div class="nav-footer">
      <button class="nav-action" title="回到顶部" @click="scrollToTop">
        <i class="fas fa-arrow-up"></i>
      </button>
      <button class="nav-action" title="分享">
        <i class="fas fa-share-alt"></i>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isExpanded = ref(false)
const activeSection = ref('hero')

const navItems = [
  { id: 'hero', label: '首页', icon: 'fas fa-home', href: '#hero' },
  { id: 'featured', label: '精选', icon: 'fas fa-star', href: '#featured' },
  { id: 'gallery', label: '画廊', icon: 'fas fa-images', href: '#gallery' },
  { id: 'trending', label: '热门', icon: 'fas fa-fire', href: '#trending' },
  { id: 'categories', label: '分类', icon: 'fas fa-th', href: '#categories' },
  { id: 'contact', label: '联系', icon: 'fas fa-envelope', href: '#contact' }
]

const toggleNav = () => {
  isExpanded.value = !isExpanded.value
  
  if (typeof window !== 'undefined' && window.anime) {
    window.anime({
      targets: '.side-nav',
      width: isExpanded.value ? '250px' : '80px',
      duration: 300,
      easing: 'easeOutExpo'
    })
    
    window.anime({
      targets: '.nav-label',
      opacity: isExpanded.value ? [0, 1] : [1, 0],
      translateX: isExpanded.value ? [20, 0] : [0, 20],
      duration: 300,
      delay: isExpanded.value ? 150 : 0,
      easing: 'easeOutExpo'
    })
  }
}

const scrollToSection = (href: string) => {
  const id = href.replace('#', '')
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    activeSection.value = id
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  activeSection.value = 'hero'
}

// 监听滚动更新激活状态
const updateActiveSection = () => {
  const sections = navItems.map(item => ({
    id: item.id,
    element: document.getElementById(item.id)
  })).filter(s => s.element)
  
  const scrollY = window.scrollY + 100
  
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]
    if (section.element && section.element.offsetTop <= scrollY) {
      activeSection.value = section.id
      break
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  
  // 初始动画
  if (typeof window !== 'undefined' && window.anime) {
    window.anime({
      targets: '.nav-item',
      translateX: [-50, 0],
      opacity: [0, 1],
      delay: window.anime.stagger(50, { start: 300 }),
      duration: 600,
      easing: 'easeOutExpo'
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
})
</script>

<style scoped>
.side-nav {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 80px;
  background: var(--color-bg-elevated);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-left: none;
  border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
  padding: var(--space-4) 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: width var(--duration-normal) var(--ease-out-expo);
  overflow: hidden;
}

.side-nav.expanded {
  width: 250px;
}

/* 切换按钮 */
.toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--color-accent);
  color: white;
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast);
  margin-bottom: var(--space-6);
}

.toggle-btn:hover {
  transform: scale(1.1);
  background: var(--color-accent-hover);
}

/* 导航菜单 */
.nav-menu {
  list-style: none;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0 var(--space-3);
}

.nav-item {
  opacity: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  transition: all var(--duration-fast);
  position: relative;
  overflow: hidden;
}

.nav-link:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-hover);
}

.nav-link.active {
  color: var(--color-accent);
  background: var(--color-surface);
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 70%;
  background: var(--color-accent);
  border-radius: var(--radius-full);
}

.nav-link i {
  width: 24px;
  font-size: var(--text-lg);
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
  opacity: 0;
}

.side-nav.expanded .nav-label {
  opacity: 1;
}

/* 底部操作 */
.nav-footer {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3) 0;
  border-top: 1px solid var(--color-border);
  margin-top: var(--space-4);
}

.nav-action {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-action:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  transform: translateY(-2px);
}

/* 响应式 */
@media (max-width: 1280px) {
  .side-nav {
    transform: translateX(-100%) translateY(-50%);
  }
  
  .side-nav.expanded {
    transform: translateX(0) translateY(-50%);
  }
}

@media (max-width: 768px) {
  .side-nav {
    display: none;
  }
}
</style>