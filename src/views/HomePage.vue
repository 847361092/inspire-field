<template>
  <div class="home-page" :class="{ fullscreen: isFullscreen }">
    <!-- Hero区域 -->
    <HeroSection id="hero" />
    
    <!-- 横向滚动精选 -->
    <HorizontalScroll id="featured" />
    
    <!-- 画廊区域 -->
    <section class="gallery-section" id="gallery">
      <!-- 搜索状态显示 -->
      <div v-if="galleryStore.searchMode" class="search-status">
        <div class="search-info">
          <h3 class="search-title">
            <i class="fas fa-search"></i>
            搜索结果：<span class="search-keyword">{{ galleryStore.searchQuery }}</span>
          </h3>
          <div class="search-meta">
            <span class="result-count">找到 {{ filteredArtworks.length }} 个相关作品</span>
            <button class="clear-search-btn" @click="clearSearchMode">
              <i class="fas fa-times"></i> 清除搜索
            </button>
          </div>
        </div>
      </div>
      
      <div class="section-header" v-if="!galleryStore.searchMode">
        <h2 class="section-title animate-title">
          <span class="split-text">发现精选作品</span>
        </h2>
        
        <div class="filter-tabs-wrapper">
          <div class="filter-tabs" ref="filterTabsRef">
            <button 
              v-for="tab in filterTabs" 
              :key="tab.value"
              :class="['filter-tab', { active: activeTab === tab.value }]"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
          <!-- 滚动指示器 -->
          <div class="scroll-indicators" v-if="showScrollIndicators">
            <div 
              :class="['scroll-indicator left', { visible: canScrollLeft }]"
              @click="scrollTabs('left')"
            >
              <i class="fas fa-chevron-left"></i>
            </div>
            <div 
              :class="['scroll-indicator right', { visible: canScrollRight }]"
              @click="scrollTabs('right')"
            >
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 排序选项（搜索模式下隐藏） -->
      <div class="sort-options" v-if="!galleryStore.searchMode">
        <button 
          v-for="sort in sortOptions" 
          :key="sort.value"
          :class="['sort-btn', { active: activeSort === sort.value }]"
          @click="activeSort = sort.value"
        >
          <span class="sort-icon">{{ sort.emoji }}</span>
          {{ sort.label }}
        </button>
      </div>
      
      <!-- 搜索加载状态 -->
      <div v-if="galleryStore.isSearching" class="search-loading">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>正在搜索...</p>
      </div>
      
      <!-- 无搜索结果提示 -->
      <div v-else-if="galleryStore.searchMode && filteredArtworks.length === 0" class="no-results">
        <div class="no-results-icon">
          <i class="fas fa-search"></i>
        </div>
        <h3>未找到相关作品</h3>
        <p>尝试使用其他关键词或者清除搜索条件</p>
        <button class="retry-btn" @click="clearSearchMode">
          <i class="fas fa-redo"></i> 返回全部作品
        </button>
      </div>
      
      <!-- 瀑布流画廊 -->
      <SkeletonLoader 
        v-if="isLoading && viewMode === 'waterfall'"
        type="waterfall"
        :columns="isMobile ? 2 : 4"
        :items="3"
      />
      <Transition 
        v-else
        name="waterfall-transition"
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <WaterfallGrid 
          v-if="viewMode === 'waterfall' && !galleryStore.isSearching && !isLoading"
          :key="`page-${galleryStore.currentPage}`"
          :artworks="currentPageArtworks" 
          @artwork-click="handleArtworkClick"
        />
      </Transition>
      
      <!-- 分页导航 -->
      <Pagination
        v-if="viewMode === 'waterfall' && !galleryStore.isSearching && galleryStore.totalPages > 1"
        :current-page="galleryStore.currentPage"
        :total-pages="galleryStore.totalPages"
        :total-items="filteredArtworks.length"
        @page-change="handlePageChange"
        @previous="handlePrevPage"
        @next="handleNextPage"
      />
      
      <!-- 不规则网格 -->
      <div v-else-if="viewMode === 'grid'" class="irregular-grid">
        <div 
          v-for="(artwork, index) in filteredArtworks.slice(0, 12)" 
          :key="artwork.id"
          :class="['grid-item', `item-${index % 6}`]"
          @click="handleArtworkClick(artwork)"
        >
          <ImageLoader 
            :src="artwork.thumbnail" 
            :alt="artwork.title"
            :lazy="true"
            :webp="true"
          />
          <div class="grid-overlay">
            <h3>{{ artwork.title }}</h3>
            <p>{{ artwork.author.name }}</p>
          </div>
        </div>
      </div>
      
    </section>
    
    <!-- 侧边导航 (暂时隐藏) -->
    <!-- <SideNav /> -->
    
    <!-- 悬浮操作按钮（仅PC端显示） -->
    <div class="fab-container" v-if="!isMobile">
      <button class="fab-btn main" @click="toggleFab" :class="{ active: fabExpanded }">
        <span class="fab-icon" :style="{ transform: fabExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.3s' }">⚙️</span>
      </button>
      <transition-group name="fab">
        <button v-if="fabExpanded" class="fab-btn sub" key="upload" @click="handleUpload" title="上传作品">
          <span class="fab-icon">📤</span>
        </button>
        <button v-if="fabExpanded" class="fab-btn sub" key="filter" @click="handleFilter" title="高级筛选">
          <span class="fab-icon">🔍</span>
        </button>
        <button v-if="fabExpanded" class="fab-btn sub" key="fullscreen" @click="toggleFullscreen" title="全屏模式">
          <span class="fab-icon">{{ isFullscreen ? '✖' : '🔳' }}</span>
        </button>
        <button v-if="fabExpanded" class="fab-btn sub" key="debug" @click="handleDebug" title="调试信息">
          <span class="fab-icon">🐛</span>
        </button>
      </transition-group>
    </div>
    
    <!-- 回到顶部按钮 -->
    <ScrollToTop />

    <!-- 上传弹窗 -->
    <UploadModal
      :is-open="showUploadModal"
      @close="showUploadModal = false"
      @upload-success="handleUploadSuccess"
    />

    <!-- 全局噪点纹理叠加 -->
    <div class="noise-overlay"></div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import HeroSection from '@/components/layout/HeroSection.vue'
import HorizontalScroll from '@/components/gallery/HorizontalScroll.vue'
import WaterfallGrid from '@/components/gallery/WaterfallGrid.vue'
import MagneticButton from '@/components/ui/MagneticButton.vue'
import SideNav from '@/components/layout/SideNav.vue'
import ImageLoader from '@/components/effects/ImageLoader.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import ScrollToTop from '@/components/ui/ScrollToTop.vue'
import { useTransitionStore } from '@/stores/transition'
import { useGalleryStore } from '@/stores/gallery'
import { useSmoothScroll } from '@/composables/useSmoothScroll'
import { useCursor } from '@/composables/useCursor'
import { useMobile } from '@/composables/useMobile'
import { showDebugInfo, copyDebugInfo } from '@/utils/debugInfo'
import UploadModal from '@/components/upload/UploadModal.vue'

const router = useRouter()
const transitionStore = useTransitionStore()
const galleryStore = useGalleryStore()
const { isMobile, useSwipe } = useMobile()

// 使用自定义光标（暂时禁用，避免干扰交互）
// useCursor()

// 使用平滑滚动（如果滚动卡顿，可以注释掉这行）
// const { scrollTo } = useSmoothScroll()
const scrollTo = (target: string) => {
  const element = document.querySelector(target)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// 视图模式
const viewModes = [
  { label: '瀑布流', value: 'waterfall', icon: 'fas fa-layer-group' },
  { label: '网格', value: 'grid', icon: 'fas fa-th' },
  { label: '列表', value: 'list', icon: 'fas fa-list' }
]

const viewMode = ref('waterfall')

// 筛选标签 - 动态获取
const filterTabs = ref([
  { label: '全部', value: 'all' },
  { label: '机甲', value: 'mecha' },
  { label: '概念', value: 'concept' },
  { label: '插画', value: 'illustration' }
])

// 排序选项
const sortOptions = [
  { label: '精选', value: 'community', icon: 'fas fa-star', emoji: '⭐' },
  { label: '热门', value: 'trending', icon: 'fas fa-fire', emoji: '🔥' },
  { label: '最新', value: 'latest', icon: 'fas fa-clock', emoji: '🕐' }
]

const activeTab = ref('all')
const activeSort = ref('community')
const isLoading = ref(false)
const isFullscreen = ref(false)
const fabExpanded = ref(false)
const artworks = ref<any[]>([])
const showUploadModal = ref(false)

// 滚动相关
const filterTabsRef = ref<HTMLElement>()
const showScrollIndicators = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// 从文件系统生成作品数据（作为API失败时的备选）
const generateArtworksFromFileSystem = async () => {
  try {
    // 动态获取所有分类下的作品
    const response = await fetch('/artworks')
    const text = await response.text()
    
    // 解析目录结构...这里简化处理，直接返回已知的静态作品
    return generateArtworks()
  } catch (error) {
    console.error('从文件系统读取失败:', error)
    return generateArtworks()
  }
}

// 基于文件夹结构生成作品数据
const generateArtworks = () => {
  const works: any[] = []
  
  // 精确的作品映射，基于实际的文件夹结构
  const artworkMappings = [
    // mecha 类别
    { category: 'mecha', workName: '作品001', ext: 'png' },
    { category: 'mecha', workName: '作品004', ext: 'jpg' },
    { category: 'mecha', workName: '作品007', ext: 'jpg' },
    { category: 'mecha', workName: '作品010', ext: 'jpg' },
    { category: 'mecha', workName: '作品013', ext: 'png' },
    { category: 'mecha', workName: '作品016', ext: 'png' },
    
    // concept 类别
    { category: 'concept', workName: '作品002', ext: 'png' },
    { category: 'concept', workName: '作品005', ext: 'jpg' },
    { category: 'concept', workName: '作品008', ext: 'jpg' },
    { category: 'concept', workName: '作品011', ext: 'jpg' },
    { category: 'concept', workName: '作品014', ext: 'png' },
    { category: 'concept', workName: '作品017', ext: 'png' },
    
    // illustration 类别
    { category: 'illustration', workName: '作品003', ext: 'jpg' },
    { category: 'illustration', workName: '作品006', ext: 'jpg' },
    { category: 'illustration', workName: '作品009', ext: 'jpg' },
    { category: 'illustration', workName: '作品012', ext: 'png' },
    { category: 'illustration', workName: '作品015', ext: 'png' },
    { category: 'illustration', workName: '作品018', ext: 'png' }
  ]
  
  const categoryLabels: Record<string, string> = {
    mecha: '机甲设计',
    concept: '概念设计', 
    illustration: '插画艺术'
  }
  
  // 获取分类显示名称，如果没有映射就使用文件夹名
  const getCategoryLabel = (category: string): string => {
    return categoryLabels[category] || category
  }
  
  artworkMappings.forEach(mapping => {
    works.push({
      id: `${mapping.category}-${mapping.workName}`,
      title: `${mapping.workName} - ${getCategoryLabel(mapping.category)}`,
      thumbnail: `/artworks/${mapping.category}/${encodeURIComponent(mapping.workName)}/image_1.${mapping.ext}`,
      category: mapping.category,
      workGroup: mapping.workName,
      author: {
        name: ['机甲设计师', '概念艺术家', 'Mecha Designer', '工业设计师'][Math.floor(Math.random() * 4)],
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`
      },
      views: Math.floor(Math.random() * 50000) + 1000,
      likes: Math.floor(Math.random() * 5000) + 100,
      width: 400,
      height: Math.floor(400 + Math.random() * 300)
    })
  })
  
  return works
}

// 原始图库数据（备用）
const generateArtworksLegacy = () => {
  // 机甲作品图片列表
  const galleryImages = [
    '01_aoz_reboot_new.webp', '02_Special_issue_1_BLACK_HARES_.webp', 
    '03_Special_issue_2_ARZ_124WD_GUNDAM_TR_6_WONDWART_Variations_l.webp',
    '04_Special_issue_3_ARZ_124HS_II_M_TR_6II.webp', '05_Special_issue_4_ARZ_124HB_II_MII.webp',
    '06_Vol.20_RX_123TR_S.webp', '07_Vol.21_A_AMX_011G_ZAKU_IIIAMX_009G_DOM_III.webp',
    '08_Vol.21_B_.webp', '09_Vol.22_AMX_101S_S.webp', '10_Vol.23_RMS_154_.webp',
    '11_Vol.24_RMS_154_.webp', '12_Vol.25_ARZ_154BZ_.webp', '13_Vol.26_.webp',
    '14_Vol.27_AMX_008M_.webp', '15_Vol.28_.webp', '16_Vol.29_.webp', '17_Vol.30_.webp',
    '18_Vol.31A.webp', '19_Vol.32ORX_005_TR_5.webp', '20_Vol.33AMX_011EW_.webp',
    '21_Vol.34RX_124_TR_6.webp', '22_Vol.35RX_124_TR_6_.webp', '23_Vol.36RX_124_TR_6.webp',
    '24_Vol.37ARZ_124_TR_6.webp', '25_Vol.38RX_154MARZ_154M_l.webp', '26_Vol.39ARZ_124HBM_.webp',
    '27_Vol.40ARZ_121_1_TR_1.webp', '28_Vol.41RMS_106_ARZ_106HZ_.webp', '29_Vol.42RX_106_l.webp',
    '30_Vol.43RMS_106M_2_.webp', '31_Vol.44.webp', '32_Vol.45TRYRMS_106_TR_2.webp',
    '33_Vol.46TRARZ_124INL_.webp', '34_Vol.47TRNRX_044R_TR_3.webp', '35_Vol.48ARZ_124FV_.webp',
    '36_Vol.49ARZ_124QN_.webp', '37_Vol.50ARZ_124QN_.webp', '38_Vol.51ARZ_124WDM_TR_6.webp',
    '39_Vol.52RX_124_TR_6.webp', '40_Vol.53TRANCER.webp', '41_Vol.54FF_X29A_Gl.webp',
    '42_Vol.55TR_1TR_6.webp', '43_Vol.56.webp', '44_Vol.57AMA_01S_.webp',
    '45_Vol.58AMX_014R_l.webp', '46_Vol.59AMX_014Rs_.webp', '47_Vol.60ARZ_124_TR_6.webp',
    '48_Vol.61.webp', '49_Vol.62TR_6II.webp', '50_Vol.63RX_124_TR_6IIl.webp',
    '51_Vol.64RX_124_TR_6II.webp', '52_Vol.65RX_124_TR_6_.webp', '53_Vol.66RX_124_TR_6_.webp',
    '54_Vol.67.webp', '55_Vol.68l.webp', '56_Vol.69AMA_01S_.webp',
    '57_Vol.70MAN_08S_MAN_08_M_.webp', '58_Vol.71_ORX_005_TR_5.webp', '59_Vol.72_ORX_005_TR_5_II.webp',
    '60_Vol.73_RX_124HRAD_TR_6II_.webp', '61_Vol.74_RGM_79Q_GM_QUEL_Variations_.webp',
    '62_Vol.75_RGM_79Q_ERARY_HAZEL_Variations_.webp', '63_Vol.76_RX_124_TR_6_.webp',
    '64_Vol.77_RX_124HS_TR_6II.webp', '65_Vol.78_.webp', '66_Vol.79_RMS_154HMC_.webp',
    '67_Vol.80_RMS_154HMC_II.webp', '68_Vol.81_RMS_106_.webp', '69_Vol.82_ARZ_106E_RX_106E_.webp',
    '70_Vol.83_.webp', '71_Vol.84_I.webp', '72_Vol.85_II.webp', '73_Vol.86_TR.webp',
    '74_Vol.87_TRII.webp', '75_Vol.88_.webp', '76_Vol.89_.webp', '77_Vol.90_.webp',
    '78_Vol.91_.webp', '79_Vol.92_1.webp', '80_Vol.93_2.webp', '81_Vol.94_.webp',
    '82_Vol.95_3.webp', '83_Vol.96_MA.webp', '84_Vol.97_.webp', 
    '85_A.O.Z_Re_boot_Special_issue_5_TR1.webp', '86_A.O.Z_Re_boot_Special_issue_6_TR2.webp',
    '87_Vol.98_II.webp', '88_Vol.99_II.webp', '89_Vol.100_RX_122_.webp'
  ]
  
  const categories = ['3d', 'concept', 'illustration']
  const titles = [
    'AOZ重启新型机体', '特别篇黑色野兔', 'GUNDAM TR-6 变体设计', 
    'TR-6II 新型装备', 'HB-II 机体改装', 'RX-123 TR-S 突击型',
    'ZAKU III 联合开发', '新型机甲设计', 'AMX系列机体', 'RMS-154 标准型',
    '机甲工程设计', 'ARZ变体机型', '战术机甲概念', '重装机甲设计', 
    '未来机甲战士', '宇宙机甲设计', '装甲核心概念', '机械美学设计',
    '钢铁战士', '装甲机甲', '战斗机器人', '重型机甲', '机甲军团',
    '未来战士', '装甲骑兵', '机械战士', '钢铁雄心', '战争机器'
  ]
  const artists = [
    '机甲设计师A', '概念艺术家B', 'Mecha Designer', '工业设计师C', '机械美学家',
    'Robot Artist', '未来设计师', 'Gundam Designer', '机甲工程师', 'Concept Artist'
  ]
  
  return galleryImages.map((image, i) => {
    const category = categories[i % categories.length]
    const width = 400
    const height = Math.floor(400 + Math.random() * 300) // 机甲图片通常偏高
    
    return {
      id: `mecha-${i + 1}`,
      title: titles[i % titles.length],
      thumbnail: `/images/gallery/${image}`,
      category: category,
      author: {
        name: artists[i % artists.length],
        avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`
      },
      views: Math.floor(Math.random() * 50000) + 1000,
      likes: Math.floor(Math.random() * 5000) + 100,
      width: width,
      height: height
    }
  })
}

// 筛选后的作品
const filteredArtworks = computed(() => {
  // 如果在搜索模式，优先显示搜索结果
  let result = galleryStore.searchMode ? galleryStore.searchResults : artworks.value
  
  // 如果不在搜索模式，应用分类筛选
  if (!galleryStore.searchMode && activeTab.value !== 'all') {
    result = result.filter(a => a.category === activeTab.value)
  }
  
  // 排序
  if (activeSort.value === 'latest') {
    console.log('🔄 执行最新发布排序，原数据量:', result.length)
    result = [...result].sort((a, b) => {
      // 都有createdAt时，直接按时间排序
      if (a.createdAt && b.createdAt) {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()
        
        // 检查时间是否有效
        if (!isNaN(timeA) && !isNaN(timeB)) {
          const diff = timeB - timeA
          if (diff !== 0) {
            console.log(`⏰ 时间排序: ${a.title}(${new Date(timeA).toLocaleString()}) vs ${b.title}(${new Date(timeB).toLocaleString()}) = ${diff > 0 ? 'b在前' : 'a在前'}`)
            return diff  // 新的在前
          }
        }
      }
      
      // 只有一个有时间的情况
      if (a.createdAt && !b.createdAt) {
        console.log(`✅ ${a.title} 有时间戳，排在 ${b.title} 前面`)
        return -1
      }
      if (!a.createdAt && b.createdAt) {
        console.log(`✅ ${b.title} 有时间戳，排在 ${a.title} 前面`)
        return 1
      }
      
      // 都没有时间时，保持原始顺序（API返回的顺序）
      return 0
    })
    
    // 显示排序结果
    console.log('📋 排序后前5个作品:', result.slice(0, 5).map(a => {
      const date = a.createdAt ? new Date(a.createdAt) : null
      return `${a.title} (${date ? date.toLocaleString('zh-CN') : '无时间'})`
    }))
  } else if (activeSort.value === 'trending') {
    // 热门趋势 - 完全随机排序
    console.log('🎲 热门趋势：随机排序')
    result = [...result].sort(() => Math.random() - 0.5)
  } else if (activeSort.value === 'community') {
    // 社区精选 - 按图片数量排序（数量多的在前）
    console.log('⭐ 社区精选：按图片数量排序')
    result = [...result].sort((a, b) => {
      // 获取图片数量（API作品有imageCount，静态作品没有）
      const countA = a.imageCount || (a.images ? a.images.length : 1)
      const countB = b.imageCount || (b.images ? b.images.length : 1)
      console.log(`比较: ${a.title}(${countA}张) vs ${b.title}(${countB}张)`)
      return countB - countA // 数量多的排在前面
    })
    console.log('📊 排序后前5个作品:', result.slice(0, 5).map(a => `${a.title}(${a.imageCount || 1}张)`))
  }
  
  return result
})

// 当前页的作品
const currentPageArtworks = computed(() => {
  const filtered = filteredArtworks.value
  // 更新总页数
  galleryStore.updateTotalPages(filtered.length)
  // 返回当前页的作品
  return galleryStore.getCurrentPageArtworks(filtered)
})

// 处理作品点击
const handleArtworkClick = (artwork: any) => {
  // 使用全局过渡动画
  transitionStore.startTransition(`/artwork/${artwork.id}`, 'forward')
}

// 过渡动画相关
const isTransitioning = ref(false)

// Vue Transition 驷子函数
const onBeforeEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.opacity = '0'
  element.style.transform = 'translateY(20px)'
  isTransitioning.value = true
}

const onEnter = (el: Element, done: () => void) => {
  const element = el as HTMLElement
  
  // 强制重绘
  element.offsetHeight
  
  // 启动动画
  element.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
  element.style.opacity = '1'
  element.style.transform = 'translateY(0)'
  
  setTimeout(() => {
    done()
    isTransitioning.value = false
  }, 400)
}

const onLeave = (el: Element, done: () => void) => {
  const element = el as HTMLElement
  element.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
  element.style.opacity = '0'
  element.style.transform = 'translateY(-10px)'
  
  setTimeout(() => {
    done()
  }, 300)
}

// 分页处理方法
const handlePageChange = async (page: number) => {
  // 防止快速点击
  if (isTransitioning.value || isLoading.value) return
  
  // 显示加载状态
  isLoading.value = true
  isTransitioning.value = true
  
  try {
    // 先滚动到顶部
    scrollToGalleryTop()
    
    // 等待动画
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 更新页码
    galleryStore.setCurrentPage(page)
    galleryStore.updateURL(page)
    
    // 等待DOM更新
    await nextTick()
    
    // 延迟关闭加载状态
    setTimeout(() => {
      isLoading.value = false
      isTransitioning.value = false
    }, 300)
  } catch (error) {
    console.error('切换页面失败:', error)
    isLoading.value = false
    isTransitioning.value = false
  }
}

const handlePrevPage = () => {
  if (isTransitioning.value) return
  
  galleryStore.prevPage()
  galleryStore.updateURL(galleryStore.currentPage)
  scrollToGalleryTop()
}

const handleNextPage = () => {
  if (isTransitioning.value) return
  
  galleryStore.nextPage()
  galleryStore.updateURL(galleryStore.currentPage)
  scrollToGalleryTop()
}

// 平滑滚动到画廊区域顶部
const scrollToGalleryTop = () => {
  const gallerySection = document.querySelector('.gallery-section')
  if (gallerySection) {
    gallerySection.scrollIntoView({ behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 触发卡片动画
const triggerCardAnimation = () => {
  // 检查是否为移动设备
  const isMobileDevice = document.documentElement.classList.contains('mobile-device') || isMobile.value
  
  setTimeout(() => {
    const cards = document.querySelectorAll('.artwork-card:not(.animated)')
    if (cards.length > 0) {
      if (isMobileDevice) {
        // 移动端简单显示
        cards.forEach(card => {
          ;(card as HTMLElement).style.opacity = '1'
          card.classList.add('animated')
        })
      } else if (typeof window !== 'undefined' && window.anime) {
        // PC端使用动画
        window.anime({
          targets: cards,
          opacity: [0, 1],
          translateY: [40, 0],
          scale: [0.95, 1],
          duration: 800,
          delay: window.anime.stagger(60, { start: 0 }),
          easing: 'easeOutExpo',
          complete: (anim: any) => {
            anim.animatables.forEach((a: any) => {
              a.target.classList.add('animated')
            })
          }
        })
      }
    }
  }, 100)
}


// 监听搜索状态变化
watch(() => galleryStore.searchMode, (newValue) => {
  if (newValue) {
    // 进入搜索模式，重置页面
    galleryStore.setCurrentPage(1)
  }
})

// 监听搜索结果变化
watch(() => galleryStore.searchResults, () => {
  if (galleryStore.searchMode) {
    galleryStore.setCurrentPage(1)
  }
})

// 监听筛选条件变化
watch([activeTab, activeSort], () => {
  // 如果在搜索模式，不响应筛选条件变化
  if (galleryStore.searchMode) return
  
  // 先移除所有animated类
  const cards = document.querySelectorAll('.artwork-card')
  cards.forEach(card => card.classList.remove('animated'))
  
  // 清空滚动位置记忆（切换筛选条件时）
  galleryStore.clearScrollPositions()
  
  // 重置到第一页
  galleryStore.setCurrentPage(1)
  galleryStore.updateURL(1)
  
  // 触发新的动画
  setTimeout(() => {
    triggerCardAnimation()
  }, 100)
})

// 清除搜索模式
const clearSearchMode = () => {
  galleryStore.clearSearch()
  // 清除搜索模式时也清空滚动位置
  galleryStore.clearScrollPositions()
  galleryStore.setCurrentPage(1)
}

// 悬浮按钮控制
const toggleFab = () => {
  fabExpanded.value = !fabExpanded.value
  
  // 移动端震动反馈
  if ('vibrate' in navigator && isMobile.value) {
    navigator.vibrate(10)
  }
}


const handleFilter = () => {
  console.log('高级筛选')
  fabExpanded.value = false
}

const handleUpload = () => {
  showUploadModal.value = true
  fabExpanded.value = false
}

const handleUploadSuccess = async (artworkId: string) => {
  console.log('上传成功:', artworkId)
  showUploadModal.value = false

  // 刷新作品列表
  await loadArtworksFromAPI()

  // 可选：跳转到新作品详情页
  // router.push(`/artwork/${artworkId}`)
}

const handleDebug = () => {
  showDebugInfo()
  copyDebugInfo().then(() => {
    alert('调试信息已显示在控制台并复制到剪贴板\n请将信息发送给开发者进行问题排查')
  })
  fabExpanded.value = false
}

// 全屏模式
const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement && 
        !(document as any).mozFullScreenElement && 
        !(document as any).webkitFullscreenElement && 
        !(document as any).msFullscreenElement) {
      // 进入全屏
      const elem = document.documentElement as any
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen()
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen()
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen()
      }
      isFullscreen.value = true
    } else {
      // 退出全屏
      const doc = document as any
      if (doc.exitFullscreen) {
        await doc.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen()
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen()
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen()
      }
      isFullscreen.value = false
    }
    fabExpanded.value = false
  } catch (error) {
    console.error('全屏模式切换失败:', error)
  }
}

// 滚动位置保存相关
let scrollSaveTimer: ReturnType<typeof setTimeout> | null = null

// 保存当前滚动位置
const saveCurrentScrollPosition = () => {
  const scrollPosition = window.scrollY || document.documentElement.scrollTop
  sessionStorage.setItem('galleryScrollPosition', scrollPosition.toString())
}

// 节流的滚动保存函数
const throttledSaveScroll = () => {
  if (scrollSaveTimer) {
    clearTimeout(scrollSaveTimer)
  }
  scrollSaveTimer = setTimeout(() => {
    saveCurrentScrollPosition()
  }, 200)
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // 忽略输入框中的按键
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }
  
  // Ctrl/Cmd + D - 显示调试信息
  if (e.key.toLowerCase() === 'd' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    showDebugInfo()
    copyDebugInfo().then(() => {
      alert('调试信息已显示在控制台并复制到剪贴板，请发送给开发者')
    })
  }
  
  // F - 全屏
  if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault()
    toggleFullscreen()
  }
  // G - 切换视图模式（循环切换）
  if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault()
    const modes = viewModes.map(m => m.value)
    const currentIndex = modes.indexOf(viewMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    viewMode.value = modes[nextIndex]
    
    // 显示提示
    console.log(`切换到${viewModes[nextIndex].label}视图`)
  }
  // ESC - 退出全屏
  if (e.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
  // 数字键 1-6 快速切换分类
  if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
    const tabIndex = parseInt(e.key) - 1
    if (tabIndex < filterTabs.value.length) {
      activeTab.value = filterTabs.value[tabIndex].value
    }
  }
}

// 文字分割动画
const initSplitText = () => {
  const splitTexts = document.querySelectorAll('.split-text')
  splitTexts.forEach((text: any) => {
    const chars = text.innerText.split('')
    text.innerHTML = chars.map((char: string) => 
      `<span class="char">${char}</span>`
    ).join('')
    
    if (typeof window !== 'undefined' && window.anime) {
      window.anime({
        targets: text.querySelectorAll('.char'),
        opacity: [0, 1],
        translateY: [20, 0],
        rotateZ: [10, 0],
        delay: window.anime.stagger(30),
        duration: 800,
        easing: 'easeOutExpo'
      })
    }
  })
}

// 添加手势支持
const setupSwipeGestures = () => {
  if (!isMobile.value) return
  
  const gallerySection = document.querySelector('.gallery-section')
  if (!gallerySection) return
  
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      // 切换到下一个标签
      const currentIndex = filterTabs.value.findIndex(tab => tab.value === activeTab.value)
      const nextIndex = (currentIndex + 1) % filterTabs.value.length
      activeTab.value = filterTabs.value[nextIndex].value
    },
    onSwipeRight: () => {
      // 切换到上一个标签
      const currentIndex = filterTabs.value.findIndex(tab => tab.value === activeTab.value)
      const prevIndex = currentIndex === 0 ? filterTabs.value.length - 1 : currentIndex - 1
      activeTab.value = filterTabs.value[prevIndex].value
    }
  })
  
  gallerySection.addEventListener('touchstart', swipeHandlers.onTouchStart as EventListener, { passive: true })
  gallerySection.addEventListener('touchend', swipeHandlers.onTouchEnd as EventListener, { passive: true })
}

// 检查滚动状态
const checkScrollStatus = () => {
  if (!filterTabsRef.value) return
  
  const el = filterTabsRef.value
  const scrollLeft = el.scrollLeft
  const scrollWidth = el.scrollWidth
  const clientWidth = el.clientWidth
  
  // 显示指示器（当内容超出容器时）
  showScrollIndicators.value = scrollWidth > clientWidth
  
  // 更新滚动状态
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
}

// 处理鼠标滚轮横向滚动
const handleWheelScroll = (event: WheelEvent) => {
  if (!filterTabsRef.value) return
  
  // 阻止默认的纵向滚动
  event.preventDefault()
  
  // 横向滚动
  const scrollAmount = event.deltaY * 2 // 增加滚动速度
  filterTabsRef.value.scrollLeft += scrollAmount
  
  // 更新滚动状态
  checkScrollStatus()
}

// 设置横向滚动监听
const setupHorizontalScroll = () => {
  const tabsElement = filterTabsRef.value
  if (!tabsElement) return
  
  // 鼠标进入时监听滚轮事件
  tabsElement.addEventListener('wheel', handleWheelScroll, { passive: false })
  
  // 监听滚动事件更新指示器
  tabsElement.addEventListener('scroll', checkScrollStatus)
  
  // 初始检查
  checkScrollStatus()
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkScrollStatus)
}

// 清理滚动监听
const cleanupHorizontalScroll = () => {
  const tabsElement = filterTabsRef.value
  if (tabsElement) {
    tabsElement.removeEventListener('wheel', handleWheelScroll)
    tabsElement.removeEventListener('scroll', checkScrollStatus)
  }
  window.removeEventListener('resize', checkScrollStatus)
}

// 点击指示器滚动
const scrollTabs = (direction: 'left' | 'right') => {
  if (!filterTabsRef.value) return
  
  const scrollAmount = 200 // 每次滚动的距离
  const currentScroll = filterTabsRef.value.scrollLeft
  
  if (direction === 'left') {
    filterTabsRef.value.scrollLeft = Math.max(0, currentScroll - scrollAmount)
  } else {
    filterTabsRef.value.scrollLeft = currentScroll + scrollAmount
  }
}

// 获取动态分类列表
const fetchCategories = async () => {
  try {
    // 使用相对路径，Vite会自动代理到生产API
    const apiUrl = '/api/categories'

    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.success && data.categories) {
      const dynamicTabs = data.categories
        .map((cat: any) => {
          const value = cat.value ?? cat.id ?? cat.slug
          const label = cat.label ?? cat.name ?? cat.title
          
          if (!value || !label) return null
          
          const countSuffix = cat.count ? ` (${cat.count})` : ''
          return {
            label: `${label}${countSuffix}`,
            value
          }
        })
        .filter(Boolean) as Array<{ label: string; value: string }>

      // 保证至少包含默认分类
      filterTabs.value = [
        { label: '全部', value: 'all' },
        ...(
          dynamicTabs.length > 0
            ? dynamicTabs
            : [
                { label: '机甲设计', value: 'mecha' },
                { label: '概念艺术', value: 'concept' },
                { label: '插画作品', value: 'illustration' }
              ]
        )
      ]
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    // 如果失败，使用默认分类
    filterTabs.value = [
      { label: '全部', value: 'all' },
      { label: '机甲设计', value: 'mecha' },
      { label: '概念艺术', value: 'concept' },
      { label: '插画作品', value: 'illustration' }
    ]
  }
}

onMounted(async () => {
  // 显示调试信息（开发模式）
  if (import.meta.env.DEV) {
    console.log('🔧 按 Ctrl/Cmd + D 查看调试信息')
    showDebugInfo()
  }
  
  // 初始化分页状态
  galleryStore.initializePage()
  
  // 加载保存的滚动位置
  galleryStore.loadScrollPositions()
  
  // 先获取分类列表
  await fetchCategories()
  
  // 只从API加载数据一次，避免重复
  await loadArtworksFromAPI()
  
  // 添加键盘监听
  document.addEventListener('keydown', handleKeydown)
  
  // 添加滚动监听（用于保存滚动位置）
  window.addEventListener('scroll', throttledSaveScroll, { passive: true })
  
  // 设置手势支持
  setupSwipeGestures()
  
  // 设置横向滚动
  await nextTick() // 等待DOM更新
  setupHorizontalScroll()
  
  // 移除页面加载动画，避免与过场动画冲突
  // 只保留简单的显示
  const filterTabs = document.querySelectorAll('.filter-tab')
  const sortBtns = document.querySelectorAll('.sort-btn')
  filterTabs.forEach(tab => {
    ;(tab as HTMLElement).style.opacity = '1'
  })
  sortBtns.forEach(btn => {
    ;(btn as HTMLElement).style.opacity = '1'
  })
  
  // 如果当前页有保存的滚动位置，恢复它
  const currentPagePosition = galleryStore.getScrollPosition(galleryStore.currentPage)
  if (currentPagePosition > 0) {
    setTimeout(() => {
      window.scrollTo({
        top: currentPagePosition,
        behavior: 'smooth'
      })
    }, 500) // 等待页面完全加载
  }
})

// 从API加载作品数据
const loadArtworksFromAPI = async () => {
  isLoading.value = true
  try {
    // 使用相对路径，Vite会自动代理到生产API
    const apiUrl = '/api/artworks'

    console.log('正在从API加载作品...')
    
    // 模拟最小加载时间，让骨架屏显示
    const [response] = await Promise.all([
      fetch(apiUrl),
      new Promise(resolve => setTimeout(resolve, 800))
    ])
    
    const data = await response.json()
    
    if (data.success && data.artworks) {
      console.log('API返回的作品:', data.artworks)
      
      // 转换API数据为组件需要的格式，确保正确读取作者信息
      const apiArtworks = data.artworks.map((artwork: any) => ({
        id: artwork.id,
        title: artwork.title,
        thumbnail: artwork.thumbnail,
        category: artwork.category,
        author: {
          name: artwork.authorName || '数字艺术家',  // 使用API返回的authorName
          avatar: artwork.authorAvatar ? artwork.authorAvatar : `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`  // 如果有自定义头像则使用，否则生成随机头像
        },
        description: artwork.description || null, // 保留作品描述
        authorAvatar: artwork.authorAvatar ? artwork.authorAvatar : null, // 保留作者头像
        views: Math.floor(Math.random() * 50000) + 1000,
        likes: Math.floor(Math.random() * 5000) + 100,
        width: 400,
        height: Math.floor(400 + Math.random() * 300),
        createdAt: artwork.createdAt, // 保留API返回的创建时间
        imageCount: artwork.imageCount, // 保留图片数量
        images: artwork.images ? artwork.images.map((img: string) => img) : [], // 保留图片数组
        isFromAPI: true // 标记为来自API的作品
      }))
      
      console.log('转换后的作品数据:', apiArtworks)
      
      // 只使用API作品，不再合并静态作品避免重复
      artworks.value = apiArtworks
      console.log(`✅ 加载了 ${apiArtworks.length} 个作品`)
    } else {
      console.log('API响应失败，使用静态数据')
      // 如果API失败，从本地文件系统生成作品
      artworks.value = await generateArtworksFromFileSystem()
    }
  } catch (error) {
    console.error('加载作品失败:', error)
    console.log('使用静态数据作为备选')
    artworks.value = generateArtworks()
  } finally {
    isLoading.value = false
  }
  
  // 加载完成后触发动画
  setTimeout(() => {
    triggerCardAnimation()
  }, 200)
}

onUnmounted(() => {
  // 保存最后的滚动位置
  saveCurrentScrollPosition()
  
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', throttledSaveScroll)
  cleanupHorizontalScroll()
  
  // 清理定时器
  if (scrollSaveTimer) {
    clearTimeout(scrollSaveTimer)
  }
})
</script>

<style scoped>
/* 搜索状态样式 */
.search-status {
  padding: var(--space-10) var(--space-12) var(--space-8);
  background: var(--color-bg-secondary);
  border: 3px solid var(--color-border);
  border-radius: 20px;
  margin: var(--space-6) var(--space-8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08),
              0 2px 10px rgba(0, 0, 0, 0.05);
}

.search-info {
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.search-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.search-title i {
  color: var(--color-accent);
  font-size: var(--text-xl);
}

.search-keyword {
  color: var(--color-accent);
  font-weight: var(--font-bold);
  padding: 0 var(--space-2);
  background: rgba(79, 70, 229, 0.1);
  border-radius: var(--radius-md);
}

.search-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

.result-count {
  font-weight: var(--font-medium);
}

.clear-search-btn {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.clear-search-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: var(--color-accent);
}

.clear-search-btn i {
  font-size: var(--text-xs);
}

/* 搜索加载状态 */
.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-4);
  color: var(--color-text-secondary);
}

.loading-spinner {
  font-size: var(--text-4xl);
  color: var(--color-accent);
  margin-bottom: var(--space-4);
}

.search-loading p {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
}

/* 无搜索结果 */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-4);
  text-align: center;
}

.no-results-icon {
  width: 120px;
  height: 120px;
  background: var(--color-surface);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.no-results-icon i {
  font-size: var(--text-5xl);
  color: var(--color-text-tertiary);
}

.no-results h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.no-results p {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

.retry-btn {
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.retry-btn:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
}

.retry-btn i {
  font-size: var(--text-sm);
}

.home-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  position: relative;
  width: calc(100vw - var(--scrollbar-width, 0px));
  overflow-x: hidden;
  padding-top: 72px; /* Header高度 */
}

.home-page.fullscreen {
  overflow: hidden;
}

/* 全屏模式下确保header可见 */
.home-page.fullscreen :deep(.app-header) {
  position: fixed !important;
  z-index: 9999 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
}

/* 画廊区域 */
.gallery-section {
  padding-top: var(--space-20);
  padding-bottom: var(--space-20);
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: calc(100vw - var(--scrollbar-width, 0px));
  overflow-x: hidden;
  padding-left: var(--space-8);
  padding-right: var(--space-8);
}

.section-header {
  margin-bottom: var(--space-12);
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-6);
  width: 100%;
  max-width: 100%;
}

.section-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-black);
  color: var(--color-text-primary) !important; /* 确保使用CSS变量 */
  position: relative;
  overflow: hidden;
}

.section-title .char {
  display: inline-block;
  opacity: 0;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 60px;
  height: 4px;
  background: var(--gradient-brand);
  border-radius: var(--radius-full);
}

/* 视图控制 */
.view-controls {
  display: flex;
  gap: var(--space-2);
}

.view-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.view-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.view-btn.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

/* 筛选标签容器 */
.filter-tabs-wrapper {
  position: relative;
  max-width: 100%;
  margin: 0 auto;
}

.filter-tabs {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  padding: var(--space-2) var(--space-1);
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  
  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

/* 悬停时显示自定义滚动条 */
.filter-tabs-wrapper:hover .filter-tabs {
  padding-bottom: var(--space-4);
}

.filter-tabs-wrapper:hover .filter-tabs::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--space-4);
  right: var(--space-4);
  height: 4px;
  background: linear-gradient(90deg, 
    transparent,
    var(--color-border) 10%,
    var(--color-border) 90%,
    transparent
  );
  border-radius: 2px;
  opacity: 0;
  animation: fadeIn var(--duration-fast) ease;
  animation-fill-mode: forwards;
}

@keyframes fadeIn {
  to {
    opacity: 0.3;
  }
}

/* 滚动指示器 */
.scroll-indicators {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}

.scroll-indicator {
  position: absolute;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity var(--duration-fast);
  pointer-events: auto;
  cursor: pointer;
}

.scroll-indicator.left {
  left: -16px;
}

.scroll-indicator.right {
  right: -16px;
}

.scroll-indicator.visible {
  opacity: 1;
}

.scroll-indicator:hover {
  background: var(--color-primary);
  color: white;
  transform: scale(1.1);
}

.scroll-indicator i {
  font-size: 12px;
}

.filter-tab {
  flex: 0 0 auto;
  white-space: nowrap;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  transition: all var(--duration-fast);
  cursor: pointer;
}

.filter-tab:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-2px);
}

.filter-tab.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

/* 排序选项 */
.sort-options {
  margin-bottom: var(--space-8);
  padding: 0;
  display: flex;
  gap: var(--space-3);
  width: 100%;
  max-width: 100%;
}

.sort-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sort-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  transform: translateX(4px);
}

.sort-btn.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.sort-icon {
  font-size: 14px;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 2px;
}

/* 不规则网格布局 */
.irregular-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 200px;
  gap: var(--space-3);
  padding: 0 var(--space-6);
  width: 100%;
}

.grid-item {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-out-expo);
}

.grid-item:hover {
  transform: scale(1.03);
  z-index: 10;
}

/* 不规则布局模式 */
.grid-item.item-0 {
  grid-column: span 2;
  grid-row: span 2;
}

.grid-item.item-1 {
  grid-column: span 1;
  grid-row: span 2;
}

.grid-item.item-2 {
  grid-column: span 1;
  grid-row: span 1;
}

.grid-item.item-3 {
  grid-column: span 2;
  grid-row: span 1;
}

.grid-item.item-4 {
  grid-column: span 1;
  grid-row: span 2;
}

.grid-item.item-5 {
  grid-column: span 1;
  grid-row: span 1;
}

.grid-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-4);
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
  color: white;
  transform: translateY(100%);
  transition: transform var(--duration-normal) var(--ease-out-expo);
}

.grid-item:hover .grid-overlay {
  transform: translateY(0);
}

.grid-overlay h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-1);
}

.grid-overlay p {
  font-size: var(--text-sm);
  opacity: 0.8;
}

/* 悬浮操作按钮 FAB */
.fab-container {
  position: fixed;
  bottom: var(--space-8);
  right: var(--space-8);
  z-index: 100;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: var(--space-3);
}

.fab-btn {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-normal) var(--ease-spring);
  box-shadow: var(--shadow-xl);
  position: relative;
  overflow: hidden;
}

/* 确保图标正确显示 */
.fab-btn i {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

/* 为图标添加备用文字 */
.fab-btn i:before {
  display: inline-block;
}

.fab-btn i.fa-times:empty:after {
  content: "✕";
}

.fab-btn i.fa-plus:empty:after {
  content: "+";
}

.fab-btn i.fa-upload:empty:after {
  content: "↑";
}

.fab-btn i.fa-filter:empty:after {
  content: "☰";
}

.fab-btn i.fa-expand:empty:after {
  content: "⛶";
}

.fab-btn i.fa-compress:empty:after {
  content: "⛶";
}

.fab-btn.main {
  background: var(--gradient-brand);
  color: white;
  font-size: var(--text-xl);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.fab-btn.main:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-2xl), 0 0 30px rgba(79, 70, 229, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Emoji图标样式 */
.fab-icon {
  font-size: 28px;
  line-height: 1;
  display: inline-block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.fab-btn.main.active {
  transform: rotate(45deg);
}

.fab-btn.sub {
  width: 48px;
  height: 48px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: var(--text-base);
}

.fab-btn.sub:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  transform: scale(1.1);
}

/* FAB动画 */
.fab-enter-active,
.fab-leave-active {
  transition: all var(--duration-normal) var(--ease-spring);
}

.fab-enter-from {
  opacity: 0;
  transform: scale(0) translateY(20px);
}

.fab-leave-to {
  opacity: 0;
  transform: scale(0) translateY(20px);
}

/* 移动端FAB优化 */
@media (max-width: 768px) {
  .fab-container {
    bottom: calc(56px + var(--space-4) + env(safe-area-inset-bottom)); /* 避开底部导航 */
    right: var(--space-3);
    flex-direction: column-reverse;
    gap: var(--space-2);
  }
  
  .fab-btn {
    box-shadow: var(--shadow-lg);
    -webkit-tap-highlight-color: transparent;
  }
  
  .fab-btn.main {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
  
  .fab-btn.main:active {
    transform: scale(0.95);
  }
  
  .fab-btn.sub {
    width: 48px;
    height: 48px;
    font-size: 18px;
  }
  
  .fab-btn.sub:active {
    transform: scale(0.95);
  }
  
  /* 向上展开动画 */
  .fab-enter-from {
    opacity: 0;
    transform: scale(0) translateY(10px);
  }
  
  .fab-leave-to {
    opacity: 0;
    transform: scale(0) translateY(10px);
  }
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  margin-top: var(--space-16);
  padding: var(--space-8);
}

.loading-spinner {
  font-size: var(--text-2xl);
  color: var(--color-accent);
  animation: pulse 1.5s ease-in-out infinite;
}

/* 全局噪点纹理 */
.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.03;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* 加载更多按钮 */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: var(--space-12) 0;
}

.load-more-btn {
  padding: var(--space-4) var(--space-8);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 200px;
  justify-content: center;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.3);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(79, 70, 229, 0.3);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 已经到底了样式 */
.no-more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6);
  color: var(--color-text-tertiary);
  user-select: none;
}

.no-more-icon {
  font-size: 32px;
  opacity: 0.5;
  animation: pulse 2s ease-in-out infinite;
}

.no-more-text {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* 瀑布流过渡动画 */
.waterfall-transition-enter-active,
.waterfall-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.waterfall-transition-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.waterfall-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(1.02);
}

/* 瀑布流容器过渡效果 */
.waterfall-transition-enter-active .waterfall-container {
  animation: waterfallFadeIn 0.6s ease-out;
}

.waterfall-transition-leave-active .waterfall-container {
  animation: waterfallFadeOut 0.3s ease-in;
}

@keyframes waterfallFadeIn {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  60% {
    opacity: 0.8;
    transform: translateY(5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes waterfallFadeOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-15px);
  }
}

/* 减动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  /* 禁用过渡动画 */
  .waterfall-transition-enter-active,
  .waterfall-transition-leave-active {
    transition: none !important;
  }
  
  .waterfall-transition-enter-from,
  .waterfall-transition-leave-to {
    transform: none !important;
  }
  
  .waterfall-transition-enter-active .waterfall-container,
  .waterfall-transition-leave-active .waterfall-container {
    animation: none !important;
  }
}

/* 响应式 */
@media (min-width: 1920px) {
  .irregular-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media (max-width: 1440px) {
  .irregular-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1280px) {
  .irregular-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .irregular-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .home-page {
    padding-top: var(--space-4); /* 移动端不需要顶部栏空间 */
  }
  
  .gallery-section {
    padding-top: var(--space-8);
    padding-bottom: var(--space-8);
    padding-left: var(--space-3);
    padding-right: var(--space-3);
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    padding: 0;
    margin-bottom: var(--space-6);
  }
  
  .section-title {
    font-size: var(--text-2xl);
    color: var(--color-text-primary) !important;
  }
  
  .filter-tabs {
    width: 100%;
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  
  .filter-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .filter-tab {
    flex: 0 0 auto;
    white-space: nowrap;
  }
  
  .sort-options {
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0;
  }
  
  .sort-options::-webkit-scrollbar {
    display: none;
  }
  
  .sort-btn {
    flex: 0 0 auto;
    white-space: nowrap;
    font-size: 13px;
  }
  
  .irregular-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
    padding: 0;
  }
  
  .fab-container {
    bottom: var(--space-4);
    right: var(--space-3);
  }
  
  .load-more-btn {
    min-width: 150px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .home-page {
    padding-top: var(--space-2); /* 移动端不需要顶部栏空间 */
  }
  
  .gallery-section {
    padding-left: var(--space-2);
    padding-right: var(--space-2);
  }
  
  .section-title {
    font-size: var(--text-xl);
  }
}
</style>
