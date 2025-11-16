<template>
  <div class="search-container">
    <div class="search-bar" :class="{ focused: isFocused }">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索作品、创作者或标签..."
        @focus="handleFocus"
        @blur="handleBlur"
        @keypress.enter="handleSearch"
      />
      <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
        <i class="fas fa-times"></i>
      </button>
      <div class="search-shortcut">
        <kbd>⌘</kbd><kbd>K</kbd>
      </div>
    </div>
    
    <!-- 搜索建议 -->
    <transition name="suggestions">
      <div v-if="isFocused && (suggestions.length > 0 || searchQuery)" class="search-suggestions">
        <div class="suggestions-header">
          <span>{{ searchQuery ? '搜索建议' : '搜索历史' }}</span>
          <span class="suggestions-count">{{ suggestions.length }}</span>
          <button 
            v-if="!searchQuery && galleryStore.searchHistory.length > 0" 
            class="clear-history-btn"
            @click="clearHistory"
            title="清空历史"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <ul class="suggestions-list">
          <li 
            v-for="(suggestion, index) in suggestions" 
            :key="index"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)"
          >
            <i :class="suggestion.icon"></i>
            <span class="suggestion-text">{{ suggestion.text }}</span>
            <span class="suggestion-type">{{ suggestion.type }}</span>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGalleryStore } from '@/stores/gallery'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

interface Suggestion {
  text: string
  type: string
  icon: string
}

const props = defineProps<{
  autofocus?: boolean
}>()

const emit = defineEmits<{
  close: []
  search: [query: string]
}>()

const galleryStore = useGalleryStore()
const router = useRouter()

const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const isFocused = ref(false)
const showHistory = ref(false)

// 获取实时搜索建议
const suggestions = computed((): Suggestion[] => {
  if (!searchQuery.value) {
    // 没有输入时显示搜索历史
    return galleryStore.searchHistory.slice(0, 5).map(item => ({
      text: item,
      type: '历史',
      icon: 'fas fa-history'
    }))
  }
  
  // 获取基于实际数据的建议
  const suggestions = galleryStore.getSearchSuggestions(searchQuery.value)
  return suggestions.map(text => {
    // 判断建议类型
    let type = '相关'
    let icon = 'fas fa-search'
    
    if (galleryStore.searchHistory.includes(text)) {
      type = '历史'
      icon = 'fas fa-history'
    } else if (galleryStore.artworks.some(a => a.title === text)) {
      type = '作品'
      icon = 'fas fa-image'
    } else if (galleryStore.artworks.some(a => a.author.name === text)) {
      type = '创作者'
      icon = 'fas fa-user-circle'
    }
    
    return { text, type, icon }
  })
})

const handleFocus = () => {
  isFocused.value = true
  
  if (typeof window !== 'undefined' && window.anime) {
    window.anime({
      targets: '.search-bar',
      scale: [1, 1.02],
      duration: 200,
      easing: 'easeOutQuad'
    })
  }
}

const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false
  }, 200)
  
  if (typeof window !== 'undefined' && window.anime) {
    window.anime({
      targets: '.search-bar',
      scale: [1.02, 1],
      duration: 200,
      easing: 'easeOutQuad'
    })
  }
}

// 执行搜索
const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (query) {
    galleryStore.performSearch(query)
    emit('search', query)
    searchInput.value?.blur()
    
    // 如果不在首页，导航到首页
    if (router.currentRoute.value.path !== '/') {
      router.push('/')
    }
    
    // 滚动到画廊区域
    setTimeout(() => {
      const gallerySection = document.getElementById('gallery')
      if (gallerySection) {
        gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }
}

// 防抖搜索
const debouncedSearch = useDebounceFn(() => {
  const query = searchQuery.value.trim()
  if (query) {
    galleryStore.performSearch(query)
    emit('search', query)
  }
}, 500)

const clearSearch = () => {
  searchQuery.value = ''
  galleryStore.clearSearch()
  searchInput.value?.focus()
}

const selectSuggestion = (suggestion: Suggestion) => {
  searchQuery.value = suggestion.text
  handleSearch()
}

// 清除搜索历史
const clearHistory = () => {
  galleryStore.clearSearchHistory()
}

// 监听搜索词变化，实现实时搜索
watch(searchQuery, (newValue) => {
  if (newValue && props.autofocus) {
    debouncedSearch()
  }
})

// 初始化时同步store中的搜索词
onMounted(() => {
  if (galleryStore.searchQuery) {
    searchQuery.value = galleryStore.searchQuery
  }
})

// 快捷键支持
const handleKeydown = (e: KeyboardEvent) => {
  // Cmd/Ctrl + K 聚焦搜索框
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
  
  // ESC 清空并失焦
  if (e.key === 'Escape' && isFocused.value) {
    clearSearch()
    searchInput.value?.blur()
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // 自动聚焦
  if (props.autofocus) {
    setTimeout(() => {
      searchInput.value?.focus()
    }, 100)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-bg-secondary);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0 var(--space-4);
  height: 48px;
  transition: all var(--duration-fast);
}

.search-bar:hover {
  border-color: var(--color-border-light);
}

.search-bar.focused {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 5px rgba(79, 70, 229, 0.15),
              0 4px 20px rgba(79, 70, 229, 0.1);
}

.search-icon {
  color: var(--color-text-secondary);
  margin-right: var(--space-3);
  transition: color var(--duration-fast);
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.search-bar.focused .search-icon {
  color: var(--color-accent);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: var(--text-base);
  font-family: var(--font-primary);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.clear-btn {
  padding: var(--space-2);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color var(--duration-fast);
  margin-right: var(--space-2);
}

.clear-btn:hover {
  color: var(--color-text-primary);
}

.search-shortcut {
  display: flex;
  gap: 4px;
  align-items: center;
}

.search-shortcut kbd {
  padding: 2px 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

/* 搜索建议 */
.search-suggestions {
  position: absolute;
  top: calc(100% + var(--space-2));
  left: 0;
  right: 0;
  background: var(--color-bg-elevated);
  border: 3px solid var(--color-border);
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 
              0 0 0 1px rgba(0, 0, 0, 0.05),
              0 8px 32px rgba(0, 0, 0, 0.08),
              inset 0 1px 3px rgba(255, 255, 255, 0.05);
  z-index: 100;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
}

.suggestions-count {
  background: var(--color-accent);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.clear-history-btn {
  margin-left: auto;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast);
  font-size: var(--text-xs);
}

.clear-history-btn:hover {
  color: var(--color-highlight);
}

.suggestions-list {
  list-style: none;
  padding: var(--space-2);
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--duration-fast);
  margin: 2px 0;
}

.suggestion-item:hover {
  background: var(--color-surface-hover);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.suggestion-item i {
  color: var(--color-text-secondary);
  width: 16px;
}

.suggestion-text {
  flex: 1;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.suggestion-type {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  background: var(--color-surface);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

/* 过渡动画 */
.suggestions-enter-active,
.suggestions-leave-active {
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.suggestions-enter-from,
.suggestions-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式 */
@media (max-width: 768px) {
  .search-shortcut {
    display: none;
  }
  
  .search-bar {
    height: 44px;
    padding: 0 var(--space-3);
  }
  
  .search-input {
    font-size: 16px; /* 防止iOS自动缩放 */
  }
  
  .search-suggestions {
    top: calc(100% + 4px);
    left: var(--space-2);
    right: var(--space-2);
    max-height: 50vh;
    overflow-y: auto;
    border-radius: 20px !important;
  }
  
  .clear-btn {
    padding: var(--space-2);
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .search-bar {
    height: 40px;
  }
  
  .search-input::placeholder {
    font-size: 14px;
  }
}
</style>