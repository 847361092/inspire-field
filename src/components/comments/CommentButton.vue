<template>
  <button
    class="comment-btn"
    @click="handleClick"
    :class="{ 'mobile': isMobile }"
  >
    <span class="comment-icon">💬</span>
    <span class="comment-text" v-if="!isMobile">评论</span>
    <span class="comment-count" v-if="commentCount > 0">{{ commentCount }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMobile } from '@/composables/useMobile'

// Props
interface Props {
  commentCount?: number
}

withDefaults(defineProps<Props>(), {
  commentCount: 0
})

// Emits
const emit = defineEmits<{
  click: []
}>()

// Composables
const { isMobile } = useMobile()

// 点击处理
const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.comment-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
  position: relative;
  overflow: hidden;
}

.comment-btn:hover {
  background: var(--color-surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comment-btn:active {
  transform: translateY(0);
}

.comment-icon {
  font-size: 20px;
  line-height: 1;
}

.comment-text {
  font-size: var(--text-base);
}

.comment-count {
  background: var(--color-accent);
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
  margin-left: var(--space-1);
}

/* 移动端样式 */
.comment-btn.mobile {
  flex: 1;
  height: 100%;
  border-radius: 0;
  border: none;
  border-left: 1px solid var(--color-border);
  background: transparent;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
}

.comment-btn.mobile:hover {
  background: var(--color-surface-hover);
  transform: none;
  box-shadow: none;
}

.comment-btn.mobile:active {
  transform: scale(0.95);
}

.comment-btn.mobile .comment-icon {
  font-size: 20px;
}

.comment-btn.mobile .comment-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff4757;
  padding: 2px 5px;
  font-size: 10px;
  min-width: 16px;
  border-radius: 8px;
}

/* 动画效果 */
@keyframes comment-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.comment-btn:active .comment-icon {
  animation: comment-bounce 0.3s ease;
}
</style>