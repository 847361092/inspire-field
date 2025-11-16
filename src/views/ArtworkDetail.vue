<template>
  <div class="artwork-detail-page">
    <!-- 主容器 -->
    <div class="detail-container">
      <!-- 左侧图片展示区 (65%宽度) -->
      <div class="artwork-images-section">
        <!-- 显示模式控制按钮 -->
        <div class="view-mode-controls">
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'width' }"
            @click="setViewMode('width')"
            title="适应宽度"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="8" width="18" height="8" rx="1"/>
              <path d="M7 12h10M7 12l-2 2m2-2l-2-2M17 12l2 2m-2-2l2-2"/>
            </svg>
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'height' }"
            @click="setViewMode('height')"
            title="适应高度"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="8" y="3" width="8" height="18" rx="1"/>
              <path d="M12 7v10M12 7l-2-2m2 2l2-2M12 17l-2 2m2-2l2 2"/>
            </svg>
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'fit' }"
            @click="setViewMode('fit')"
            title="适应窗口"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M4 9h16M9 4v16"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        
        <!-- 单列瀑布流图片展示 -->
        <div class="waterfall-scroll-container" ref="imagesContainer">
          <div class="waterfall-images" :class="`view-mode-${viewMode}`">
            <div 
              v-for="(image, index) in artworkImages" 
              :key="index"
              class="waterfall-image-item"
              :class="{ active: currentImageIndex === index }"
              @click="currentImageIndex = index"
            >
              <img 
                :src="image" 
                :alt="`${artworkInfo.title} - Image ${index + 1}`"
                @load="handleImageLoad(index)"
              />
              <div class="image-number">{{ index + 1 }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧信息区 (35%宽度) -->
      <div class="artwork-info-section">
        <!-- 顶部操作栏 -->
        <div class="info-header">
          <button class="back-button" @click="goBack">
            <span class="icon">←</span>
            <span>返回</span>
          </button>
        </div>

        <!-- 折叠面板 -->
        <div class="info-panel">
          <!-- 面板标题栏（可点击展开/收起） -->
          <div class="panel-header" @click="toggleInfoPanel">
            <h1 class="panel-title">{{ artworkInfo.title }}</h1>
            <span class="toggle-icon" :class="{ 'rotated': isInfoExpanded }">↓</span>
          </div>

          <!-- 可折叠的内容区 -->
          <Transition name="collapse">
            <div v-if="isInfoExpanded" class="panel-content-wrapper">
              <!-- 作品信息内容 -->
              <div class="info-scroll-container">
                <div class="info-content" v-html="markdownContent"></div>

                <!-- 统计信息 -->
                <div class="stats-section">
                  <div class="stat-item">
                    <span class="stat-icon">👁</span>
                    <span>{{ Math.floor(Math.random() * 10000 + 1000) }} 浏览</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">❤️</span>
                    <span>{{ Math.floor(Math.random() * 1000 + 100) }} 喜欢</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">⭐</span>
                    <span>{{ Math.floor(Math.random() * 500 + 50) }} 收藏</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 底部操作按钮 -->
        <div class="action-buttons">
          <button class="action-btn primary" @click="handleLike">
            <span class="icon">{{ liked ? '❤️' : '🤍' }}</span>
            <span>{{ liked ? '已喜欢' : '喜欢' }}</span>
          </button>
          <button class="action-btn" @click="handleDownload">
            <span class="icon">⬇️</span>
            <span>下载</span>
          </button>
          <CommentButton
            :comment-count="commentCount"
            @click="openCommentModal"
          />
        </div>
      </div>
    </div>

    <!-- 移动端布局 -->
    <div class="mobile-container" v-if="isMobile">
      <!-- 移动端头部 -->
      <div class="mobile-header">
        <button class="mobile-back-btn" @click="goBack">←</button>
        <div class="mobile-title">{{ artworkInfo.title }}</div>
      </div>

      <!-- 移动端图片列表 -->
      <div class="mobile-images" ref="mobileImagesContainer">
        <img 
          v-for="(image, index) in artworkImages" 
          :key="index"
          :src="image" 
          :alt="`${artworkInfo.title} - Image ${index + 1}`"
          class="mobile-image"
          loading="lazy"
        />
        <!-- 底部提示 -->
        <div class="scroll-hint" v-if="!drawerOpen">
          <div class="hint-arrow">↑</div>
          <div class="hint-text">继续滑动查看作品说明</div>
        </div>
      </div>

      <!-- 抽屉式详情 -->
      <div
        class="mobile-drawer"
        :class="{ open: drawerOpen }"
        :style="{
          transform: drawerOpen ? 'translateY(0)' : `translateY(calc(100% - 60px))`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }"
      >
        <!-- 抽屉标题栏（可点击展开/收起） -->
        <div
          class="drawer-header"
          @click="toggleDrawer"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div class="drawer-handle"></div>
          <div class="drawer-title-row">
            <h2 class="drawer-title">{{ artworkInfo.title }}</h2>
            <span class="drawer-toggle-icon">{{ drawerOpen ? '↓' : '↑' }}</span>
          </div>
        </div>

        <!-- 抽屉内容（折叠） -->
        <Transition name="mobile-collapse">
          <div v-show="drawerOpen" class="drawer-content" ref="drawerContent">
            <div class="mobile-info" v-html="markdownContent"></div>
            <div class="mobile-stats">
              <div class="stat">
                <span>👁</span>
                <span>{{ Math.floor(Math.random() * 10000 + 1000) }}</span>
              </div>
              <div class="stat">
                <span :class="{ active: liked }">{{ liked ? '❤️' : '🤍' }}</span>
                <span>{{ Math.floor(Math.random() * 1000 + 100) }}</span>
              </div>
              <div class="stat">
                <span :class="{ active: collected }">{{ collected ? '⭐' : '☆' }}</span>
                <span>{{ Math.floor(Math.random() * 500 + 50) }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 移动端底部操作栏 -->
      <div class="mobile-actions">
        <button class="mobile-action-btn" @click="handleLike">
          {{ liked ? '❤️' : '🤍' }}
        </button>
        <button class="mobile-action-btn" @click="handleCollection">
          {{ collected ? '⭐' : '☆' }}
        </button>
        <button class="mobile-action-btn" @click="handleDownload">
          ⬇️
        </button>
        <CommentButton
          :comment-count="commentCount"
          @click="openCommentModal"
        />
      </div>
    </div>

    <!-- 评论弹窗 -->
    <CommentModal
      :is-open="showCommentModal"
      :artwork-id="artworkInfo.id"
      :artwork-title="artworkInfo.title"
      @close="closeCommentModal"
      @comment-count-change="handleCommentCountChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { useTransitionStore } from '@/stores/transition'
import { useMobile } from '@/composables/useMobile'
import CommentModal from '@/components/comments/CommentModal.vue'
import CommentButton from '@/components/comments/CommentButton.vue'

const route = useRoute()
const router = useRouter()
const transitionStore = useTransitionStore()

// 使用统一的移动端检测
const { isMobile: isMobileDevice, vibrate } = useMobile()

// 响应式数据
const artworkInfo = ref({
  id: '',
  title: '',
  category: '',
  author: '机甲设计师'
})

// 新增：作者头像
const authorAvatar = ref<string>('')

const artworkImages = ref<string[]>([])
const markdownContent = ref('')
const currentImageIndex = ref(0)
const liked = ref(false)
const collected = ref(false)
const imagesContainer = ref<HTMLElement>()
const viewMode = ref<'width' | 'height' | 'fit'>('width')
const isMobile = isMobileDevice // 使用composable的判断
const drawerOpen = ref(false)
const drawerY = ref(0)
const isDragging = ref(false)
const startY = ref(0)
const currentY = ref(0)
const drawerHeight = ref(60) // 默认高度60px，展开后70vh
const drawerContent = ref<HTMLElement>()

// 评论相关状态
const showCommentModal = ref(false)
const commentCount = ref(0)

// 折叠面板状态
const isInfoExpanded = ref(false) // 默认收起

// 分类标签映射
const categoryLabels: Record<string, string> = {
  mecha: '机甲设计',
  concept: '概念设计',
  illustration: '插画艺术'
}

// 获取分类显示名称，如果没有映射就使用文件夹名
const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
}

// 获取作品数据
const loadArtworkData = async () => {
  const artworkId = route.params.id as string
  
  // 解析ID获取分类和作品名
  // ID格式：category-workName，例如 "mecha-作品001" 或 "concept-作品002"
  const parts = artworkId.split('-')
  let category = 'mecha'
  let workName = '作品001'
  
  if (parts.length >= 2) {
    category = parts[0] // 获取分类：mecha, concept, illustration
    workName = parts.slice(1).join('-') // 获取作品名，处理可能包含的连字符
  }
  
  // 设置作品信息
  artworkInfo.value = {
    id: artworkId,
    title: `${workName} - ${getCategoryLabel(category)}`,
    category,
    author: '未知作者' // 默认作者，稍后从MD文件中更新
  }
  
  // 先尝试从API获取动态作品数据
  try {
    console.log('尝试从API获取作品:', artworkId, workName)
    // 判断环境并使用正确的API地址
    const apiUrl = import.meta.env.PROD 
      ? '/api/artworks'  // 生产环境
      : 'http://localhost:3001/api/artworks'  // 开发环境
    const response = await fetch(apiUrl)
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        const artwork = data.artworks.find((a: any) => 
          a.id === artworkId || a.title === workName
        )
        
        if (artwork) {
          console.log('找到API作品:', artwork)
          // 使用服务器返回的图片路径，开发环境需要添加完整URL
          artworkImages.value = artwork.images.map((img: string) => 
            import.meta.env.PROD ? img : `http://localhost:3001${img}`
          )
          artworkInfo.value.title = artwork.title
          artworkInfo.value.category = artwork.category
          
          // 使用API返回的作者信息
          if (artwork.authorName) {
            artworkInfo.value.author = artwork.authorName
          }
          if (artwork.authorAvatar) {
            authorAvatar.value = import.meta.env.PROD ? artwork.authorAvatar : `http://localhost:3001${artwork.authorAvatar}`
          }
          
          // 加载MD文件 - 支持多种文件名格式
          try {
            // 尝试不同的MD文件名
            const possibleMdFiles = [
              `${encodeURIComponent(workName)}.md`,  // 作品文件夹名.md
              '作品002.md',  // 固定名称（新分类中常见）
              'index.md',  // 默认索引文件
            ]
            
            let mdLoaded = false
            for (const mdFileName of possibleMdFiles) {
              const mdUrl = import.meta.env.PROD 
                ? `/artworks/${artwork.category}/${encodeURIComponent(workName)}/${mdFileName}`
                : `http://localhost:3001/artworks/${artwork.category}/${encodeURIComponent(workName)}/${mdFileName}`
              
              console.log('尝试加载MD文件:', mdUrl)
              
              try {
                // 添加缓存破坏参数，确保获取最新内容
                const cacheBuster = `?t=${Date.now()}`
                const mdResponse = await fetch(mdUrl + cacheBuster)
                if (mdResponse.ok) {
                  const mdText = await mdResponse.text()
                  console.log('✅ 成功加载MD文件:', mdFileName)
                  // 从MD文件中提取作者信息（作为备选）
                  extractAuthorFromMarkdown(mdText)
                  markdownContent.value = marked.parse(mdText) as string
                  mdLoaded = true
                  break  // 找到就不再尝试其他文件名
                }
              } catch (err) {
                console.log(`❌ 加载 ${mdFileName} 失败，继续尝试...`)
              }
            }
            
            if (!mdLoaded) {
              console.warn('所有MD文件尝试均失败，使用默认内容')
              markdownContent.value = generateDefaultContent()
            }
          } catch (error) {
            console.error('MD文件加载失败:', error)
            markdownContent.value = generateDefaultContent()
          }
          return // 找到API作品，直接返回
        }
      }
    }
  } catch (error) {
    console.log('API请求失败，使用静态映射:', error)
  }

  // 如果API没有找到作品，使用静态映射
  console.log('使用静态映射处理作品:', workName)
  
  // 加载图片 - 对中文路径进行URL编码
  const encodedWorkName = encodeURIComponent(workName)
  const basePath = `/artworks/${category}/${encodedWorkName}/`
  const images = []
  
  // 所有图片现在都是 webp 格式，简化处理逻辑
  const imageCount: Record<string, number> = {
    '作品001': 5,
    '作品002': 5,
    '作品003': 5,
    '作品004': 5,
    '作品005': 5,
    '作品006': 5,
    '作品007': 5,
    '作品008': 5,
    '作品009': 5,
    '作品010': 5,
    '作品011': 5,
    '作品012': 5,
    '作品013': 5,
    '作品014': 5,
    '作品015': 5,
    '作品016': 5,
    '作品017': 5,
    '作品018': 4, // 作品018只有4张图
    '测试2': 1
  }
  
  const maxImages = imageCount[workName] || 5
  
  // 开发环境需要添加完整的后端URL
  const imagePrefix = import.meta.env.PROD ? '' : 'http://localhost:3001'
  
  for (let i = 1; i <= maxImages; i++) {
    images.push(`${imagePrefix}${basePath}image_${i}.webp`)
  }
  
  artworkImages.value = images.length > 0 ? images : [
    `${imagePrefix}${basePath}image_1.webp`
  ]
  
  // 加载Markdown文档 - 支持多种文件名格式
  try {
    // 尝试不同的MD文件名（适配不同的命名习惯）
    const possibleMdFiles = [
      `${encodeURIComponent(workName)}.md`,  // 作品文件夹名.md
      '作品002.md',  // 固定名称（新分类中常见）
      'index.md',  // 默认索引文件
    ]
    
    let mdLoaded = false
    for (const mdFileName of possibleMdFiles) {
      const mdUrl = import.meta.env.PROD 
        ? `${basePath}${mdFileName}`
        : `http://localhost:3001${basePath}${mdFileName}`
      
      console.log('尝试加载MD文件(静态):', mdUrl)
      
      try {
        // 添加缓存破坏参数，确保获取最新内容
        const cacheBuster = `?t=${Date.now()}`
        const response = await fetch(mdUrl + cacheBuster)
        if (response.ok) {
          const mdText = await response.text()
          console.log('✅ 成功加载MD文件(静态):', mdFileName)
          // 从MD文件中提取作者信息
          extractAuthorFromMarkdown(mdText)
          markdownContent.value = marked.parse(mdText) as string
          mdLoaded = true
          break  // 找到就不再尝试其他文件名
        }
      } catch (err) {
        console.log(`❌ 加载 ${mdFileName} 失败(静态)，继续尝试...`)
      }
    }
    
    if (!mdLoaded) {
      console.warn('所有MD文件尝试均失败(静态)，使用默认内容')
      markdownContent.value = generateDefaultContent()
    }
  } catch (e) {
    console.error('MD文件加载失败(静态):', e)
    markdownContent.value = generateDefaultContent()
  }
}

// 从Markdown文本中提取作者信息
const extractAuthorFromMarkdown = (mdText: string) => {
  // 使用正则表达式匹配作者信息
  // 匹配格式：- **作者**: xxx 或 - **作者**：xxx
  const authorMatch = mdText.match(/[-*]\s*\*\*作者\*\*[：:]\s*(.+)/)
  if (authorMatch && authorMatch[1]) {
    artworkInfo.value.author = authorMatch[1].trim()
    console.log('从MD文件中提取到作者:', artworkInfo.value.author)
  }
  
  // 提取作者头像（新增）
  // 匹配格式：- **作者头像**: xxx 或 - **头像**: xxx
  const avatarMatch = mdText.match(/[-*]\s*\*\*(作者头像|头像)\*\*[：:]\s*(.+)/)
  if (avatarMatch && avatarMatch[2]) {
    const avatarUrl = avatarMatch[2].trim()
    // 保存头像URL到组件数据中
    authorAvatar.value = avatarUrl
    console.log('从MD文件中提取到头像:', avatarUrl)
  }
}

// 生成默认内容
const generateDefaultContent = () => {
  return marked.parse(`# ${artworkInfo.value.title}

## 作品信息
- **类别**: ${getCategoryLabel(artworkInfo.value.category)}
- **作者**: ${artworkInfo.value.author}
- **创建时间**: ${new Date().toLocaleDateString('zh-CN')}

## 作品描述
这是一组精心设计的作品，展现了独特的机械美学和未来科技感。

## 技术特点
- 精密的机械结构设计
- 独特的装甲配置
- 创新的武器系统
- 优秀的动力系统设计`) as string
}

// 切换到上一张图片
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    scrollToImage(currentImageIndex.value)
  }
}

// 切换到下一张图片
const nextImage = () => {
  if (currentImageIndex.value < artworkImages.value.length - 1) {
    currentImageIndex.value++
    scrollToImage(currentImageIndex.value)
  }
}

// 设置显示模式
const setViewMode = (mode: 'width' | 'height' | 'fit') => {
  viewMode.value = mode
}

// 滚动到指定图片
const scrollToImage = (index: number) => {
  if (!imagesContainer.value) return
  const images = imagesContainer.value.querySelectorAll('.waterfall-image-item')
  if (images[index]) {
    images[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 键盘控制
const handleKeyboard = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    prevImage()
  } else if (e.key === 'ArrowDown') {
    nextImage()
  } else if (e.key === 'Escape') {
    goBack()
  } else if (e.key === '1') {
    setViewMode('width')
  } else if (e.key === '2') {
    setViewMode('height')
  } else if (e.key === '3') {
    setViewMode('fit')
  }
}

// 处理图片加载
const handleImageLoad = (index: number) => {
  console.log(`图片 ${index + 1} 加载完成`)
  // 如果是当前图片，自动滚动到视图中
  if (index === currentImageIndex.value) {
    scrollToImage(index)
  }
}

// 返回上一页
const goBack = () => {
  // 使用全局过渡动画，反向
  transitionStore.startTransition('back', 'reverse')
}

// 点赞
const handleLike = () => {
  liked.value = !liked.value
  if (isMobile.value) vibrate(10)
}

// 收藏
const handleCollection = () => {
  collected.value = !collected.value
  if (isMobile.value) vibrate(10)
}

// 下载
const handleDownload = () => {
  artworkImages.value.forEach((image, index) => {
    const link = document.createElement('a')
    link.href = image
    link.download = `${artworkInfo.value.title}_${index + 1}`
    link.click()
  })
}

// 打开评论弹窗
const openCommentModal = () => {
  showCommentModal.value = true
}

// 关闭评论弹窗
const closeCommentModal = () => {
  showCommentModal.value = false
}

// 处理评论数量变化
const handleCommentCountChange = (count: number) => {
  commentCount.value = count
}

// 切换折叠面板（PC端）
const toggleInfoPanel = () => {
  isInfoExpanded.value = !isInfoExpanded.value
}

// 切换抽屉（移动端）
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

// 移动端图片容器引用
const mobileImagesContainer = ref<HTMLElement>()

// 处理触摸开始
const handleTouchStart = (e: TouchEvent) => {
  isDragging.value = true
  startY.value = e.touches[0].clientY
  currentY.value = drawerY.value
}

// 处理触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  
  const deltaY = e.touches[0].clientY - startY.value
  
  // 更新抽屉位置
  if (drawerOpen.value) {
    // 展开状态：可以向下拖动关闭
    if (deltaY > 0) {
      drawerY.value = deltaY
    }
  } else {
    // 关闭状态：可以向上拖动打开
    if (deltaY < 0) {
      drawerY.value = deltaY
    }
  }
}

// 处理触摸结束
const handleTouchEnd = () => {
  isDragging.value = false
  
  // 根据拖动距离决定打开或关闭
  const threshold = 50 // 降低阈值，更容易触发
  
  if (drawerOpen.value) {
    // 如果向下拖动超过阈值，关闭抽屉
    if (drawerY.value > threshold) {
      drawerOpen.value = false
    }
  } else {
    // 如果向上拖动超过阈值，打开抽屉
    if (Math.abs(drawerY.value) > threshold) {
      drawerOpen.value = true
    }
  }
  
  // 重置drawerY
  drawerY.value = 0
}

onMounted(async () => {
  // 先加载数据
  await loadArtworkData()
  
  // 数据加载完成后，结束过渡动画
  setTimeout(() => {
    transitionStore.endTransition()
  }, 300)
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyboard)
  
  // 移动端优化：防止页面滚动影响和自动打开抽屉
  if (isMobile.value && mobileImagesContainer.value) {
    let touchStartY = 0
    let isScrolling = false
    
    // 监听滚动事件，检测是否滚动到底部
    mobileImagesContainer.value.addEventListener('scroll', () => {
      const scrollTop = mobileImagesContainer.value!.scrollTop
      const scrollHeight = mobileImagesContainer.value!.scrollHeight
      const clientHeight = mobileImagesContainer.value!.clientHeight
      
      // 判断是否滚动到底部（留 50px 缓冲）
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        // 如果抽屉未打开，自动打开
        if (!drawerOpen.value && !isScrolling) {
          isScrolling = true
          setTimeout(() => {
            drawerOpen.value = true
            isScrolling = false
            // 抽屉打开后，将内容滚动到顶部
            if (drawerContent.value) {
              drawerContent.value.scrollTop = 0
            }
          }, 300) // 延迟一点避免误触
        }
      }
    })
    
    mobileImagesContainer.value.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY
    }, { passive: true })
    
    mobileImagesContainer.value.addEventListener('touchmove', (e) => {
      // 如果在顶部并向上滑动，或在底部并向下滑动，阻止默认行为
      const scrollTop = mobileImagesContainer.value!.scrollTop
      const scrollHeight = mobileImagesContainer.value!.scrollHeight
      const clientHeight = mobileImagesContainer.value!.clientHeight
      
      if ((scrollTop === 0 && e.touches[0].clientY > touchStartY) ||
          (scrollTop + clientHeight >= scrollHeight && e.touches[0].clientY < touchStartY)) {
        e.preventDefault()
      }
    }, { passive: false })
  }
})

onUnmounted(() => {
  // 清理键盘事件监听
  window.removeEventListener('keydown', handleKeyboard)
})
</script>

<style scoped>
.artwork-detail-page {
  position: fixed;
  top: 72px; /* Header高度 */
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: calc(100vh - 72px);
  background: var(--color-bg-primary);
  overflow: hidden;
  /* 禁用任何可能的动画 */
  animation: none !important;
  transition: none !important;
}

.detail-container {
  display: flex;
  width: 100vw;
  height: 100%;
  margin: 0;
  padding: 0;
  /* 禁用任何可能的动画 */
  animation: none !important;
  transition: none !important;
}

/* 左侧图片区域 - 65%宽度 */
.artwork-images-section {
  width: 65vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

/* 不同主题下的背景色 */
[data-theme="light"] .artwork-images-section {
  background: #f5f5f5;
}

[data-theme="gray"] .artwork-images-section {
  background: #e5e5e5;
}

/* 显示模式控制按钮 */
.view-mode-controls {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 100;
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2);
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* 灰色主题下的按钮样式 */
[data-theme="gray"] .view-mode-controls {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* 白色主题下的按钮样式 */
[data-theme="light"] .view-mode-controls {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 1);
}

.mode-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast);
  position: relative;
}

.mode-text {
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-primary);
  transition: transform var(--duration-fast);
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.mode-btn:hover .mode-text {
  transform: scale(1.1);
}

.mode-btn.active {
  background: var(--color-accent);
  color: white;
  box-shadow: 0 0 12px rgba(79, 70, 229, 0.4);
}

.mode-btn.active .mode-text {
  transform: scale(1.05);
}

/* 灰色主题下的按钮颜色 */
[data-theme="gray"] .mode-btn {
  color: rgba(30, 41, 59, 0.7);
}

[data-theme="gray"] .mode-btn:hover {
  background: rgba(30, 41, 59, 0.08);
  color: rgba(30, 41, 59, 1);
}

[data-theme="gray"] .mode-btn.active {
  background: #1E293B;
  color: white;
  box-shadow: 0 0 12px rgba(30, 41, 59, 0.3);
}

/* 白色主题下的按钮颜色 */
[data-theme="light"] .mode-btn {
  color: rgba(10, 10, 10, 0.6);
}

[data-theme="light"] .mode-btn:hover {
  background: rgba(10, 10, 10, 0.06);
  color: rgba(10, 10, 10, 0.9);
}

[data-theme="light"] .mode-btn.active {
  background: #6366F1;
  color: white;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

/* 瀑布流滚动容器 */
.waterfall-scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-6);
  padding-top: calc(var(--space-4) + 56px);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.waterfall-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.waterfall-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.waterfall-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.waterfall-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 瀑布流图片列表 */
.waterfall-images {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
  width: 100%;
}

/* 适应宽度模式 */
.waterfall-images.view-mode-width .waterfall-image-item {
  width: 100%;
  max-width: 100%;
}

.waterfall-images.view-mode-width img {
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* 适应高度模式 */
.waterfall-images.view-mode-height .waterfall-image-item {
  width: auto;
  max-width: 100%;
  height: calc(100vh - 200px);
}

.waterfall-images.view-mode-height img {
  width: auto;
  height: 100%;
  max-width: 100%;
  object-fit: contain;
}

/* 适应窗口模式 */
.waterfall-images.view-mode-fit .waterfall-image-item {
  width: 90%;
  max-width: 1200px;
}

.waterfall-images.view-mode-fit img {
  width: 100%;
  height: auto;
  max-height: calc(100vh - 200px);
  object-fit: contain;
}

/* 瀑布流图片项 */
.waterfall-image-item {
  position: relative;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out-expo);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.waterfall-image-item img {
  display: block;
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: transform var(--duration-normal) var(--ease-out-expo);
}

.waterfall-image-item:hover img {
  transform: scale(1.02);
}

.waterfall-image-item.active {
  box-shadow: 0 0 0 3px var(--color-accent);
}

/* 图片编号 */
.image-number {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  color: white;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  opacity: 0;
  transition: opacity var(--duration-fast);
}

.waterfall-image-item:hover .image-number,
.waterfall-image-item.active .image-number {
  opacity: 1;
}

/* 右侧信息区域 - 35%宽度 */
.artwork-info-section {
  width: 35vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  overflow: hidden;
}

/* 信息头部 */
.info-header {
  padding: var(--space-6) var(--space-8) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.back-button:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  transform: translateX(-4px);
}

/* 折叠面板 */
.info-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面板标题栏 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  user-select: none;
  transition: all var(--duration-fast);
}

.panel-header:hover {
  background: var(--color-surface-hover);
}

.panel-header:active {
  transform: scale(0.99);
}

.panel-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-icon {
  font-size: 24px;
  color: var(--color-accent);
  transition: transform var(--duration-fast);
  flex-shrink: 0;
  margin-left: var(--space-3);
  display: inline-block;
  transform: rotate(0deg);
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* 可折叠内容包装器 */
.panel-content-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 100vh;
  opacity: 1;
}

/* 信息内容滚动区 */
.info-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) var(--space-8);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.info-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.info-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.info-scroll-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

/* Markdown内容样式 */
.info-content {
  color: var(--color-text-primary);
  line-height: 1.8;
  margin-bottom: var(--space-6);
}

.info-content :deep(h1) {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-4);
  color: var(--color-text-primary);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--color-border);
}

.info-content :deep(h2) {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
  color: var(--color-text-primary);
}

.info-content :deep(p) {
  margin-bottom: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

.info-content :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin-bottom: var(--space-4);
}

.info-content :deep(li) {
  padding: var(--space-2) 0;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  display: flex;
  align-items: flex-start;
}

.info-content :deep(li:before) {
  content: "▸";
  color: var(--color-accent);
  margin-right: var(--space-2);
  flex-shrink: 0;
}

/* 统计信息 */
.stats-section {
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

.stat-icon {
  font-size: 20px;
  width: 24px;
  display: inline-block;
}

/* 操作按钮 */
.action-buttons {
  padding: var(--space-6) var(--space-8);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.action-btn .icon {
  font-size: 20px;
  display: inline-block;
}

.back-button .icon {
  font-size: 18px;
  font-weight: bold;
}

.action-btn:hover {
  background: var(--color-surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn.primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.action-btn.primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

/* 响应式 */
@media (max-width: 1440px) {
  .artwork-info-section {
    width: 40vw;
  }
  
  .artwork-images-section {
    width: 60vw;
  }
}

@media (max-width: 1024px) {
  .detail-container {
    flex-direction: column;
  }
  
  .artwork-images-section {
    width: 100vw;
    height: 60vh;
  }
  
  .artwork-info-section {
    width: 100vw;
    height: 40vh;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
  
  .thumbnail-navigation {
    height: 80px;
  }
  
  .thumbnail-item {
    width: 60px;
    height: 50px;
  }
}

/* 移动端布局 */
@media (max-width: 768px) {
  .artwork-detail-page {
    padding: 0;
    height: 100vh;
    overflow: hidden;
    top: 0;  /* 移动端从顶部开始 */
  }
  
  .detail-container {
    display: none; /* 隐藏PC布局 */
  }
  
  /* 移动端容器 */
  .mobile-container {
    display: flex !important;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    position: relative;
  }
  
  /* 移动端头部 */
  .mobile-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--color-bg-primary);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-3);
    z-index: 100;
    border-bottom: 1px solid var(--color-border);
  }
  
  .mobile-back-btn,
  .mobile-share-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 18px;
    cursor: pointer;
  }
  
  .mobile-title {
    flex: 1;
    text-align: center;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 var(--space-2);
  }
  
  /* 移动端图片列表 */
  .mobile-images {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: 56px;
    padding-bottom: 80px; /* 为抽屉留出空间 */
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    /* 优化滚动性能 */
    will-change: scroll-position;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
  
  .mobile-image {
    width: 100%;
    height: auto;
    display: block;
    /* 添加间距 */
    margin-bottom: 2px;
    /* 优化图片加载 */
    background: var(--color-bg-secondary);
    min-height: 200px;
  }
  
  /* 抽屉手柄 */
  .drawer-handle {
    width: 40px;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    margin: 0 auto;
    margin-top: 8px;
    margin-bottom: 4px;
  }
  
  .drawer-hint {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    text-align: center;
    user-select: none;
  }
  
  /* 抽屉式详情 */
  .mobile-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70vh;
    background: var(--color-bg-secondary);
    border-top-left-radius: var(--radius-xl);
    border-top-right-radius: var(--radius-xl);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    z-index: 99;
    touch-action: pan-y;
    transform: translateY(calc(100% - 60px));
  }
  
  .mobile-drawer.open {
    transform: translateY(0) !important;
  }
  
  .drawer-header {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    background: var(--color-bg-secondary);
    position: relative;
    padding: var(--space-3) var(--space-4);
  }

  .drawer-header:active {
    background: var(--color-surface-hover);
  }

  .drawer-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: var(--space-2);
  }

  .drawer-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--color-text-primary);
    margin: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: var(--space-3);
  }

  .drawer-toggle-icon {
    font-size: 20px;
    color: var(--color-accent);
    flex-shrink: 0;
  }
  
  .drawer-content {
    padding: 0 var(--space-4) var(--space-4);
    overflow-y: auto;
    height: calc(70vh - 60px);
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  
  .mobile-info {
    color: var(--color-text-primary);
    line-height: 1.6;
  }
  
  .mobile-stats {
    display: flex;
    justify-content: space-around;
    padding: var(--space-4) 0;
    border-top: 1px solid var(--color-border);
    margin-top: var(--space-4);
  }
  
  .mobile-stats .stat {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-secondary);
  }
  
  .mobile-stats .stat i.active {
    color: var(--color-accent);
  }
  
  /* 移动端底部操作栏 */
  .mobile-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: var(--color-bg-primary);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 98; /* 在抽屉下方 */
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .mobile-action-btn {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: 20px;
    cursor: pointer;
    transition: all var(--duration-fast);
  }
  
  .mobile-action-btn:active {
    transform: scale(0.9);
  }
  
  /* 底部滑动提示 */
  .scroll-hint {
    padding: 40px 20px;
    text-align: center;
    animation: fadeInUp 0.8s ease;
  }
  
  .hint-arrow {
    font-size: 24px;
    color: var(--color-accent);
    animation: bounce 2s infinite;
    margin-bottom: 10px;
  }
  
  .hint-text {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    opacity: 0.8;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  /* 移动端折叠动画 */
  .mobile-collapse-enter-active,
  .mobile-collapse-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-collapse-enter-from,
  .mobile-collapse-leave-to {
    max-height: 0;
    opacity: 0;
  }

  .mobile-collapse-enter-to,
  .mobile-collapse-leave-from {
    max-height: 70vh;
    opacity: 1;
  }
}

/* 默认隐藏移动端元素 */
.mobile-container {
  display: none;
}
</style>