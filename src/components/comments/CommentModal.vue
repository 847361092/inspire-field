<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="comment-modal-overlay" v-if="isOpen" @click="closeModal">
        <div class="comment-modal-container" @click.stop :class="{ 'mobile': isMobile }">
          <!-- 头部 -->
          <div class="comment-modal-header">
            <h3 class="comment-title">
              <span class="icon">💬</span>
              作品评论
            </h3>
            <button class="close-btn" @click="closeModal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="comment-modal-content" ref="contentRef">
            <!-- 加载状态 -->
            <div class="loading-container" v-if="loading">
              <div class="loading-spinner"></div>
              <p>正在加载评论...</p>
            </div>

            <!-- Twikoo 评论容器 -->
            <div id="twikoo-comments" ref="twikooRef" v-show="!loading"></div>
          </div>

          <!-- 底部统计信息 -->
          <div class="comment-modal-footer" v-if="!loading && commentCount > 0">
            <span class="comment-count">{{ commentCount }} 条评论</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useMobile } from '@/composables/useMobile'
import { useTwikoo } from '@/composables/useTwikoo'

// Props
interface Props {
  isOpen: boolean
  artworkId: string
  artworkTitle: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  commentCountChange: [count: number]
}>()

// Composables
const { isMobile } = useMobile()
const { initTwikoo, getDefaultOptions } = useTwikoo()

// Refs
const twikooRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const loading = ref(true)
const commentCount = ref(0)
let twikooInitialized = false

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 初始化 Twikoo
const initTwikooInstance = async () => {
  if (!twikooRef.value || twikooInitialized) return

  try {
    loading.value = true
    console.log('🚀 开始初始化 Twikoo，作品 ID:', props.artworkId)

    // 获取默认配置
    const options = getDefaultOptions(`/artwork/${props.artworkId}`)

    // 更新配置
    options.el = '#twikoo-comments'
    options.onCommentLoaded = () => {
      loading.value = false
      twikooInitialized = true
      console.log('📝 Twikoo 评论已加载')

      // 获取评论数量
      updateCommentCount()

      // 监听评论变化
      observeCommentChanges()

      // 检查管理面板图标
      setTimeout(() => {
        const adminIcon = document.querySelector('.tk-icon.__comments')
        const settingsIcon = document.querySelector('.tk-icon[title*="设置"]')
        const gearIcon = document.querySelector('.tk-admin-panel-icon, .tk-icon.icon-settings')

        if (adminIcon || settingsIcon || gearIcon) {
          console.log('✅ 找到管理面板图标！')
          console.log('   图标元素:', adminIcon || settingsIcon || gearIcon)
          console.log('   👉 请在评论区右上角寻找小齿轮图标 ⚙️')
        } else {
          console.warn('⚠️ 未找到管理面板图标')
          console.log('   这可能是因为：')
          console.log('   1. 设置了暗号（需要在昵称输入框输入暗号）')
          console.log('   2. CSS 样式隐藏了图标')
          console.log('   3. Twikoo 版本问题')
        }

        // 输出所有 Twikoo 图标用于调试
        const allIcons = document.querySelectorAll('.tk-icon')
        console.log(`   找到 ${allIcons.length} 个 Twikoo 图标:`, allIcons)
      }, 1500)
    }

    console.log('⚙️ Twikoo 配置:', options)

    // 初始化 Twikoo
    await initTwikoo(options)
  } catch (error) {
    console.error('❌ Twikoo 初始化失败:', error)
    loading.value = false
    showError()
  }
}

// 更新评论数量
const updateCommentCount = () => {
  // 尝试从DOM中获取评论数量
  const countElement = document.querySelector('#twikoo-comments .twikoo-count')
  if (countElement) {
    const count = parseInt(countElement.textContent || '0')
    commentCount.value = count
    emit('commentCountChange', count)
  }
}

// 监听评论变化
const observeCommentChanges = () => {
  if (!twikooRef.value) return

  const observer = new MutationObserver(() => {
    updateCommentCount()
  })

  observer.observe(twikooRef.value, {
    childList: true,
    subtree: true
  })
}

// 显示错误信息
const showError = () => {
  if (twikooRef.value) {
    twikooRef.value.innerHTML = `
      <div class="error-message">
        <p>评论加载失败，请稍后重试</p>
        <button onclick="location.reload()" class="retry-btn">重试</button>
      </div>
    `
  }
}

// 监听弹窗开关
watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.artworkId) {
    // 延迟初始化，确保动画完成
    setTimeout(() => {
      initTwikooInstance()
    }, 300)
  }
})

// ESC 键关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* 模态框遮罩层 */
.comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* 模态框容器 */
.comment-modal-container {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.comment-modal-container.mobile {
  max-width: 100%;
  max-height: 100vh;
  margin: 0;
  border-radius: 0;
}

/* 头部 */
.comment-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.comment-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.comment-title .icon {
  font-size: 24px;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.close-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

/* 内容区域 */
.comment-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  min-height: 400px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: var(--space-4);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 底部 */
.comment-modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.comment-count {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* Twikoo 样式覆盖 */
:deep(#twikoo-comments) {
  --tk-input-bg: var(--color-bg-secondary);
  --tk-input-border: var(--color-border);
  --tk-input-text: var(--color-text-primary);
  --tk-meta-text: var(--color-text-secondary);
  --tk-link: var(--color-accent);
  --tk-btn-bg: var(--color-accent);
  --tk-btn-text: white;
}

/* 错误消息 */
:deep(.error-message) {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-secondary);
}

:deep(.retry-btn) {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast);
}

:deep(.retry-btn:hover) {
  background: var(--color-accent-hover);
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .comment-modal-container {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .comment-modal-container {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

.modal-enter-active .comment-modal-container,
.modal-leave-active .comment-modal-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .comment-modal-overlay {
    padding: 0;
  }

  .comment-modal-header {
    padding: var(--space-4);
  }

  .comment-title {
    font-size: var(--text-lg);
  }

  .comment-modal-content {
    padding: var(--space-4);
  }
}
</style>