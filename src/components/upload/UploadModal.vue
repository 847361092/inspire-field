<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h2>上传新作品</h2>
            <button class="close-btn" @click="$emit('close')" :disabled="uploading">
              <span class="icon">✕</span>
            </button>
          </div>

          <!-- 主体内容 -->
          <div class="modal-body">
            <!-- 基本信息 -->
            <section class="form-section">
              <h3>基本信息</h3>

              <div class="form-row">
                <div class="form-group">
                  <label>作品名称<span class="required">*</span></label>
                  <input
                    v-model="form.workName"
                    type="text"
                    placeholder="例如：作品019"
                    :class="{ error: errors.workName }"
                    :disabled="uploading"
                  />
                  <span v-if="errors.workName" class="error-text">{{ errors.workName }}</span>
                </div>

                <div class="form-group">
                  <label>分类<span class="required">*</span></label>
                  <select v-model="form.category" :class="{ error: errors.category }" :disabled="uploading">
                    <option value="">请选择</option>
                    <option value="mecha">机甲设计</option>
                    <option value="concept">概念设计</option>
                    <option value="illustration">插画艺术</option>
                    <option value="3d">3D作品</option>
                    <option value="character">角色设计</option>
                    <option value="environment">场景设计</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>作品标题<span class="required">*</span></label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="例如：作品019 - 机甲设计"
                  :class="{ error: errors.title }"
                  :disabled="uploading"
                />
              </div>

              <div class="form-group">
                <label>作品描述</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  placeholder="简要描述作品内容..."
                  :disabled="uploading"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>作者名称</label>
                  <input
                    v-model="form.authorName"
                    type="text"
                    placeholder="例如：设计师A"
                    :disabled="uploading"
                  />
                </div>

                <div class="form-group">
                  <label>标签（用逗号分隔）</label>
                  <input
                    v-model="form.tagsInput"
                    type="text"
                    placeholder="例如：机甲,科幻,原创"
                    :disabled="uploading"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="form.featured" :disabled="uploading" />
                  <span>设为精选作品</span>
                </label>
              </div>
            </section>

            <!-- 图片上传 -->
            <section class="form-section">
              <h3>作品图片<span class="required">*</span></h3>

              <div
                class="upload-zone"
                :class="{ 'drag-over': isDragging, 'has-images': form.images.length > 0 }"
                @drop.prevent="handleDrop"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @click="triggerFileInput"
              >
                <input
                  ref="imageInput"
                  type="file"
                  multiple
                  accept="image/*"
                  style="display: none"
                  @change="handleImageSelect"
                  :disabled="uploading"
                />

                <div v-if="form.images.length === 0" class="upload-placeholder">
                  <div class="upload-icon">📤</div>
                  <p class="upload-text">拖拽图片到此处，或点击选择</p>
                  <p class="upload-hint">支持 JPG、PNG、WebP 格式，建议每张图片小于 5MB</p>
                </div>

                <div v-else class="image-preview-grid">
                  <div
                    v-for="(image, index) in imagePreviewUrls"
                    :key="index"
                    class="image-preview-item"
                  >
                    <img :src="image" :alt="`Image ${index + 1}`" />
                    <button
                      class="remove-image-btn"
                      @click.stop="removeImage(index)"
                      :disabled="uploading"
                    >
                      ✕
                    </button>
                    <div class="image-number">{{ index + 1 }}</div>
                  </div>

                  <div class="add-more-btn" @click.stop="triggerFileInput" v-if="!uploading">
                    <span class="plus-icon">+</span>
                    <p>添加更多</p>
                  </div>
                </div>
              </div>

              <span v-if="errors.images" class="error-text">{{ errors.images }}</span>
            </section>
          </div>

          <!-- 底部操作栏 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="$emit('close')" :disabled="uploading">
              取消
            </button>
            <button
              class="btn btn-primary"
              :disabled="uploading || !isFormValid"
              @click="handleSubmit"
            >
              <span v-if="uploading" class="spinner"></span>
              <span>{{ uploading ? '上传中...' : '上传作品' }}</span>
            </button>
          </div>

          <!-- 上传进度 -->
          <div v-if="uploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
            </div>
            <p class="progress-text">{{ uploadStatus }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGalleryStore } from '@/stores/gallery'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  uploadSuccess: [artworkId: string]
}>()

const galleryStore = useGalleryStore()

// 表单数据
const form = ref({
  workName: '',
  title: '',
  category: '',
  description: '',
  authorName: '',
  tagsInput: '',
  featured: false,
  images: [] as File[]
})

// 错误提示
const errors = ref<Record<string, string>>({})

// 上传状态
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')

// 图片预览
const imagePreviewUrls = ref<string[]>([])

// 拖拽状态
const isDragging = ref(false)

// 表单验证
const isFormValid = computed(() => {
  return (
    form.value.workName.trim() &&
    form.value.title.trim() &&
    form.value.category &&
    form.value.images.length > 0
  )
})

// 选择图片
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addImages(files)
}

// 拖拽上传
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (uploading.value) return

  const files = Array.from(event.dataTransfer?.files || [])
  const imageFiles = files.filter((f) => f.type.startsWith('image/'))
  addImages(imageFiles)
}

// 添加图片
const addImages = (files: File[]) => {
  // 验证文件大小
  const oversized = files.filter((f) => f.size > 5 * 1024 * 1024)
  if (oversized.length > 0) {
    errors.value.images = `有 ${oversized.length} 张图片超过 5MB，请压缩后上传`
    return
  }

  form.value.images.push(...files)

  // 生成预览
  files.forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreviewUrls.value.push(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })

  errors.value.images = ''
}

// 移除图片
const removeImage = (index: number) => {
  if (uploading.value) return
  form.value.images.splice(index, 1)
  imagePreviewUrls.value.splice(index, 1)
}

// 触发文件选择
const imageInput = ref<HTMLInputElement>()
const triggerFileInput = () => {
  if (!uploading.value) {
    imageInput.value?.click()
  }
}

// 提交表单
const handleSubmit = async () => {
  // 验证
  errors.value = {}
  if (!form.value.workName.trim()) errors.value.workName = '请输入作品名称'
  if (!form.value.title.trim()) errors.value.title = '请输入作品标题'
  if (!form.value.category) errors.value.category = '请选择分类'
  if (form.value.images.length === 0) errors.value.images = '请至少上传一张图片'

  if (Object.keys(errors.value).length > 0) return

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = '准备上传...'

  try {
    // 调用 store 的上传方法
    const { artworkId } = await galleryStore.uploadArtwork({
      workName: form.value.workName.trim(),
      title: form.value.title.trim(),
      category: form.value.category,
      description: form.value.description.trim(),
      authorName: form.value.authorName.trim() || '未知作者',
      tags: form.value.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      featured: form.value.featured,
      images: form.value.images
    })

    uploadProgress.value = 100
    uploadStatus.value = '上传完成！'

    // 延迟关闭，让用户看到成功提示
    setTimeout(() => {
      emit('uploadSuccess', artworkId)
      emit('close')
      resetForm()
    }, 1000)
  } catch (error) {
    console.error('上传失败:', error)
    errors.value.submit = error instanceof Error ? error.message : '上传失败，请重试'
    uploadStatus.value = '上传失败'
  } finally {
    uploading.value = false
  }
}

// 重置表单
const resetForm = () => {
  form.value = {
    workName: '',
    title: '',
    category: '',
    description: '',
    authorName: '',
    tagsInput: '',
    featured: false,
    images: []
  }
  imagePreviewUrls.value = []
  errors.value = {}
  uploadProgress.value = 0
  uploadStatus.value = ''
}

// 点击遮罩关闭
const handleOverlayClick = () => {
  if (!uploading.value) {
    emit('close')
  }
}

// 监听弹窗关闭，重置表单
watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal && !uploading.value) {
      resetForm()
    }
  }
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: var(--color-bg-elevated);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn .icon {
  font-size: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-error);
  margin-left: 4px;
}

.form-group input[type='text'],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input.error,
.form-group select.error {
  border-color: var(--color-error);
}

.form-group input:disabled,
.form-group textarea:disabled,
.form-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  display: block;
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--color-error);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  color: var(--color-text-primary);
  font-size: var(--text-sm);
}

/* 上传区域 */
.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--color-surface);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover:not(.has-images) {
  border-color: var(--color-accent);
  background: var(--color-surface-hover);
}

.upload-zone.drag-over {
  border-color: var(--color-accent);
  background: rgba(79, 70, 229, 0.05);
}

.upload-placeholder {
  width: 100%;
}

.upload-placeholder .upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-placeholder .upload-text {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.upload-placeholder .upload-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* 图片预览网格 */
.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  width: 100%;
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--color-border);
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview-item:hover .remove-image-btn {
  opacity: 1;
}

.remove-image-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-number {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: 600;
}

.add-more-btn {
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-surface);
}

.add-more-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-surface-hover);
}

.add-more-btn .plus-icon {
  font-size: 32px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}

.add-more-btn p {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

/* 底部操作栏 */
.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: var(--color-accent-glow);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 上传进度 */
.upload-progress {
  padding: 16px 24px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-hover));
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  text-align: center;
}

/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: translateY(-20px) scale(0.95);
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .image-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
}
</style>
