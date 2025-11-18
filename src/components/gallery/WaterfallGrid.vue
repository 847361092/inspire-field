<template>
  <div 
    class="waterfall-container" 
    ref="containerRef"
    :style="{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }"
  >
    <div 
      v-for="(column, index) in columns" 
      :key="index"
      class="waterfall-column"
    >
      <ArtworkCard 
        v-for="artwork in column" 
        :key="artwork.id"
        :artwork="artwork"
        :delay="artwork.animationDelay"
        @click="handleArtworkClick(artwork)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ArtworkCard from './ArtworkCard.vue'

/**
 * 瀑布流组件 - 就像真实的瀑布一样，让图片自然地流动排列
 * 这个组件负责把所有的作品卡片整理成多列布局
 * 每张图片会自动找到最矮的那一列去排队，这样整体看起来就很均匀
 */

// 每个作品的数据格式，包含了展示需要的所有信息
interface Artwork {
  id: string          // 作品的唯一标识，就像身份证
  title: string       // 作品名称
  thumbnail: string   // 缩略图地址
  width: number       // 图片原始宽度
  height: number      // 图片原始高度
  category: string    // 作品分类（机甲/概念/插画）
  author: {           // 作者信息
    name: string      // 作者名字
    avatar: string    // 作者头像
  }
  views: number       // 浏览次数
  likes: number       // 点赞数量
  description?: string // 作品描述
  authorAvatar?: string // 作者自定义头像
  animationDelay?: number  // 动画延迟，让卡片一个接一个地出现
}

// 从父组件接收作品数据
const props = defineProps<{
  artworks?: Artwork[]  // 可选的作品列表，如果没传就用模拟数据
}>()

// 向父组件发送点击事件
const emit = defineEmits<{
  'artwork-click': [artwork: Artwork]  // 当用户点击某个作品时通知父组件
}>()

// 这些变量用来管理瀑布流的布局
const containerRef = ref<HTMLElement>()     // 容器的引用，用来获取宽度
const columns = ref<Artwork[][]>([])        // 每一列存放的作品，就像几个竖着的队列
const columnHeights = ref<number[]>([])     // 记录每一列的当前高度
const columnCount = ref(4)                  // 默认显示4列，会根据屏幕宽度自动调整

// 给每列添加一点视差效果，让页面滚动时有层次感
// 其实就是让奇数列和偶数列有不同的偏移量
const columnOffsets = computed(() => {
  return Array(columnCount.value).fill(0).map((_, i) => {
    // 偶数列偏移多一点，奇数列偏移少一点
    return i % 2 === 0 ? -(i * 10) : -(i * 5)
  })
})

/**
 * 核心算法：把作品分配到各个列中
 * 原理很简单：每次都找最矮的那一列，把新图片放进去
 * 这样可以保证所有列的高度尽可能接近
 */
const distributeItems = (items: Artwork[]) => {
  if (!items || items.length === 0) return
  
  // 先清空之前的数据，重新开始
  columns.value = Array(columnCount.value).fill(null).map(() => [])
  columnHeights.value = Array(columnCount.value).fill(0)
  
  items.forEach((item, index) => {
    // 找出当前哪一列最矮
    const minHeight = Math.min(...columnHeights.value)
    const columnIndex = columnHeights.value.indexOf(minHeight)
    
    // 给每个作品设置动画延迟，这样它们会依次出现
    // 延迟时间 = 序号 × 50毫秒
    item.animationDelay = index * 50
    
    // 把作品放到最矮的列中
    columns.value[columnIndex].push(item)
    
    // 计算这个作品在页面上实际占的高度，并更新列高度
    const width = item.width || 400
    const height = item.height || (300 + Math.random() * 300)
    const aspectRatio = height / width  // 高宽比
    const columnWidth = containerRef.value ? containerRef.value.offsetWidth / columnCount.value : 350
    const itemHeight = columnWidth * aspectRatio  // 实际显示高度
    columnHeights.value[columnIndex] += itemHeight + 24  // 24是卡片之间的间距
  })
}

// 生成模拟数据
const generateMockData = (): Artwork[] => {
  const keywords = ['abstract', 'architecture', 'nature', 'portrait', 'minimal', 'geometric', 'landscape', 'urban', 'artistic', 'conceptual']
  const titles = [
    '抽象几何', '城市光影', '自然韵律', '极简美学', '建筑线条',
    '人物肖像', '概念艺术', '数字创作', '视觉实验', '色彩碰撞',
    '光与影', '空间探索', '时间痕迹', '情绪表达', '未来幻想'
  ]
  const authors = [
    { name: 'Alex Chen', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Sarah Liu', avatar: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Mike Wang', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'Emma Zhang', avatar: 'https://i.pravatar.cc/150?img=4' },
    { name: 'David Li', avatar: 'https://i.pravatar.cc/150?img=5' }
  ]
  
  const categories = ['mecha', 'concept', 'illustration']

  return Array.from({ length: 20 }, (_, i) => {
    const width = 400
    const height = 300 + Math.random() * 300 // 随机高度
    const keyword = keywords[Math.floor(Math.random() * keywords.length)]

    return {
      id: `artwork-${i + 1}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      thumbnail: `https://source.unsplash.com/random/${width}x${Math.floor(height)}/?${keyword}`,
      width,
      height: Math.floor(height),
      category: categories[i % categories.length],
      author: authors[Math.floor(Math.random() * authors.length)],
      views: Math.floor(Math.random() * 50000) + 1000,
      likes: Math.floor(Math.random() * 5000) + 100
    }
  })
}

const handleArtworkClick = (artwork: Artwork) => {
  emit('artwork-click', artwork)
}

// 响应式调整列数 - 优化为适合视口
const updateColumnCount = () => {
  const width = window.innerWidth
  const isMobileDevice = document.documentElement.classList.contains('mobile-device')
  
  // 手机端强制单列
  if (isMobileDevice || width < 768) {
    columnCount.value = 1  // 手机端单列显示
  } else if (width >= 2560) {
    columnCount.value = 7  // 4K显示器
  } else if (width >= 1920) {
    columnCount.value = 6  // Full HD
  } else if (width >= 1600) {
    columnCount.value = 5  // 大屏幕
  } else if (width >= 1440) {
    columnCount.value = 4  // 标准桌面
  } else if (width >= 1280) {
    columnCount.value = 4  // 小桌面
  } else if (width >= 1024) {
    columnCount.value = 3  // 平板
  } else {
    columnCount.value = 2  // 平板横屏
  }
}

onMounted(() => {
  // 设置列数
  updateColumnCount()
  window.addEventListener('resize', updateColumnCount)
  
  // 如果有传入的数据，使用传入的数据
  if (props.artworks && props.artworks.length > 0) {
    distributeItems(props.artworks)
  }
  
  // 动画已由CSS处理，无需额外的JavaScript动画
})

// 监听数据变化
watch(() => props.artworks, (newArtworks) => {
  if (newArtworks && newArtworks.length > 0) {
    distributeItems(newArtworks)
  }
}, { deep: true })

// 监听列数变化，重新分配
watch(columnCount, () => {
  if (props.artworks && props.artworks.length > 0) {
    distributeItems(props.artworks)
  }
})
</script>

<style scoped>
.waterfall-container {
  display: grid;
  gap: var(--space-2);  /* 减小间距 */
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  /* 动态列数通过style绑定处理 */
}

.waterfall-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);  /* 减小间距 */
}

/* 响应式适配 - 移动端优化 */
@media (max-width: 768px) {
  .waterfall-container {
    gap: var(--space-4) !important;  /* 手机单列更大间距 */
    padding: 0 var(--space-3);
  }
  
  .waterfall-column {
    gap: var(--space-4) !important;
  }
}

/* 手机端单列布局 */
.mobile-device .waterfall-container {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--space-4) !important;
  padding: 0 var(--space-3);
}

.mobile-device .waterfall-column {
  width: 100% !important;
}

@media (min-width: 481px) and (max-width: 768px) {
  .waterfall-container {
    gap: 10px;
    padding: 0 12px;
  }
  
  .waterfall-column {
    gap: 10px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .waterfall-container {
    gap: 12px;
    padding: 0 16px;
  }
  
  .waterfall-column {
    gap: 12px;
  }
}

@media (min-width: 1025px) {
  .waterfall-container {
    gap: var(--space-2);
    padding: 0;
  }
  
  .waterfall-column {
    gap: var(--space-2);
  }
}
</style>