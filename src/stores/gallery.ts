import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Author {
  name: string
  avatar: string
}

export interface Artwork {
  id: string
  title: string
  thumbnail: string
  width: number
  height: number
  category: string
  author: Author
  views: number
  likes: number
  isFeatured?: boolean // 添加推荐标记
  description?: string // 作品描述
  authorAvatar?: string // 作者自定义头像路径
  createdAt?: string // 创建时间
}

export const useGalleryStore = defineStore('gallery', () => {
  const artworks = ref<Artwork[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 分页相关状态
  const currentPage = ref(1)
  const itemsPerPage = ref(12) // 减少每页作品数量，提升性能
  const totalPages = ref(0)
  
  // 搜索相关状态
  const searchQuery = ref('')
  const searchResults = ref<Artwork[]>([])
  const isSearching = ref(false)
  const searchMode = ref(false)
  const searchHistory = ref<string[]>(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
  
  // 滚动位置记忆状态
  const scrollPositions = ref<Record<number, number>>({})

  // 生成模拟数据
  const generateMockArtworks = (): Artwork[] => {
    const categories = ['mecha', 'concept', 'illustration']
    const mockArtworks: Artwork[] = []
    
    // 使用本地图片
    const localImages = [
      '/images/gallery/1.webp',
      '/images/gallery/2.webp',
      '/images/gallery/3.webp',
      '/images/gallery/4.webp',
      '/images/gallery/5.webp',
      '/images/gallery/6.webp',
      '/images/gallery/7.webp',
      '/images/gallery/8.webp',
      '/images/gallery/9.webp',
      '/images/gallery/10.webp',
      '/images/gallery/11.webp',
      '/images/gallery/12.webp',
      '/images/gallery/13.webp',
      '/images/gallery/14.webp',
      '/images/gallery/15.webp',
      '/images/gallery/16.webp',
      '/images/gallery/17.webp',
      '/images/gallery/18.webp',
      '/images/gallery/19.webp',
      '/images/gallery/20.webp',
    ]

    // 生成30个作品数据
    for (let i = 0; i < 30; i++) {
      const imageUrl = localImages[i % localImages.length]
      const category = categories[Math.floor(Math.random() * categories.length)]
      
      mockArtworks.push({
        id: `artwork-${i + 1}`,
        title: `${category === 'mecha' ? '机甲' : category === 'concept' ? '概念' : '插画'}作品 ${i + 1}`,
        thumbnail: imageUrl,
        width: 300 + Math.floor(Math.random() * 200),
        height: 400 + Math.floor(Math.random() * 200),
        category,
        author: {
          name: `创作者${Math.floor(Math.random() * 10) + 1}`,
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`
        },
        views: Math.floor(Math.random() * 10000) + 1000,
        likes: Math.floor(Math.random() * 5000) + 100,
        isFeatured: i < 6, // 让前6个作品成为精选作品
        createdAt: new Date(Date.now() - i * 86400000).toISOString() // 模拟不同时间创建
      })
    }
    
    return mockArtworks
  }

  // 获取作品列表
  const fetchArtworks = async () => {
    if (artworks.value.length > 0) {
      return // 如果已有数据，不重复加载
    }
    
    loading.value = true
    error.value = null
    
    try {
      // 统一使用相对路径，Vite 会根据配置自动代理
      const apiUrl = '/api/artworks'
      
      // 尝试从上传服务器获取数据
      try {
        const response = await fetch(apiUrl)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.artworks && data.artworks.length > 0) {
            // 转换服务器数据格式，确保正确使用作者信息
            const processedArtworks = data.artworks.map((item: any, index: number) => ({
              id: item.id || `artwork-${index + 1}`,
              title: item.title || `作品 ${index + 1}`,
              // 生产环境的URL已经是完整的，开发环境需要加主机
              thumbnail: item.thumbnail || '/images/gallery/1.webp',
              width: 300 + Math.floor(Math.random() * 200),
              height: 400 + Math.floor(Math.random() * 200),
              category: item.category || 'mecha',
              author: {
                // 使用API返回的authorName，确保作者名正确显示
                name: item.authorName || `创作者${Math.floor(Math.random() * 10) + 1}`,
                // 如果有自定义头像使用自定义头像，否则生成随机头像
                avatar: item.authorAvatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`
              },
              views: Math.floor(Math.random() * 10000) + 1000,
              likes: Math.floor(Math.random() * 5000) + 100,
              isFeatured: item.isFeatured || false, // 添加推荐标记
              description: item.description || null, // 作品描述
              authorAvatar: item.authorAvatar || null, // 作者自定义头像
              createdAt: item.createdAt || new Date().toISOString() // 添加创建时间
            }))
            
            // 按创建时间排序（最新的在前）
            artworks.value = processedArtworks.sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || 0)
              const dateB = new Date(b.createdAt || 0)
              return dateB.getTime() - dateA.getTime()
            })
          } else {
            // 服务器返回空数据，使用模拟数据
            artworks.value = generateMockArtworks()
          }
        } else {
          throw new Error('Server unavailable')
        }
      } catch {
        // 服务器不可用，使用模拟数据
        artworks.value = generateMockArtworks()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load artworks'
      // 即使出错也提供模拟数据
      artworks.value = generateMockArtworks()
    } finally {
      loading.value = false
    }
  }

  // 执行搜索
  const performSearch = (query: string) => {
    if (!query.trim()) {
      searchMode.value = false
      searchResults.value = []
      searchQuery.value = ''
      return
    }
    
    isSearching.value = true
    searchQuery.value = query
    searchMode.value = true
    
    // 模拟异步搜索（实际场景可能是API调用）
    setTimeout(() => {
      const lowercaseQuery = query.toLowerCase()
      searchResults.value = artworks.value.filter(artwork => 
        artwork.title.toLowerCase().includes(lowercaseQuery) ||
        artwork.author.name.toLowerCase().includes(lowercaseQuery) ||
        artwork.category.toLowerCase().includes(lowercaseQuery)
      )
      
      // 添加到搜索历史
      addToSearchHistory(query)
      isSearching.value = false
    }, 300)
  }
  
  // 清空搜索
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchMode.value = false
    isSearching.value = false
  }
  
  // 添加到搜索历史
  const addToSearchHistory = (query: string) => {
    if (!query.trim()) return
    
    // 移除重复项并限制历史记录数量
    const filtered = searchHistory.value.filter(item => item !== query)
    searchHistory.value = [query, ...filtered].slice(0, 10)
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  }
  
  // 清空搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = []
    localStorage.removeItem('searchHistory')
  }
  
  // 获取搜索建议（基于历史记录和热门搜索）
  const getSearchSuggestions = (query: string) => {
    if (!query.trim()) return searchHistory.value.slice(0, 5)
    
    const lowercaseQuery = query.toLowerCase()
    
    // 从历史记录中匹配
    const historyMatches = searchHistory.value
      .filter(item => item.toLowerCase().includes(lowercaseQuery))
      .slice(0, 3)
    
    // 从作品标题中匹配
    const titleMatches = [...new Set(artworks.value
      .filter(artwork => artwork.title.toLowerCase().includes(lowercaseQuery))
      .map(artwork => artwork.title))]
      .slice(0, 3)
    
    // 从作者名称中匹配
    const authorMatches = [...new Set(artworks.value
      .filter(artwork => artwork.author.name.toLowerCase().includes(lowercaseQuery))
      .map(artwork => artwork.author.name))]
      .slice(0, 2)
    
    return [...historyMatches, ...titleMatches, ...authorMatches].slice(0, 8)
  }
  
  // 旧的搜索方法保留以兼容
  const searchArtworks = (query: string) => {
    performSearch(query)
    return searchResults.value
  }

  // 按分类筛选
  const filterByCategory = (category: string) => {
    if (category === 'all') return artworks.value
    return artworks.value.filter(artwork => artwork.category === category)
  }

  // 获取单个作品
  const getArtworkById = (id: string) => {
    return artworks.value.find(artwork => artwork.id === id)
  }

  // 分页相关方法
  const updateTotalPages = (totalItems: number) => {
    const newTotalPages = Math.ceil(totalItems / itemsPerPage.value)
    totalPages.value = newTotalPages
    
    // 如果当前页超出新的总页数，自动跳转到最后一页
    if (currentPage.value > newTotalPages && newTotalPages > 0) {
      currentPage.value = newTotalPages
      localStorage.setItem('gallery_current_page', newTotalPages.toString())
      updateURL(newTotalPages)
    } else if (newTotalPages === 0) {
      // 如果没有内容，重置到第一页
      currentPage.value = 1
      localStorage.setItem('gallery_current_page', '1')
      updateURL(1)
    }
  }

  const setCurrentPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      // 保存到localStorage
      localStorage.setItem('gallery_current_page', page.toString())
    }
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      setCurrentPage(currentPage.value + 1)
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      setCurrentPage(currentPage.value - 1)
    }
  }

  const jumpToPage = (page: number) => {
    setCurrentPage(page)
  }

  // 获取当前页的作品
  const getCurrentPageArtworks = (artworksList: Artwork[]) => {
    // 安全检查：如果当前页超出总页数，重置为最后一页
    if (totalPages.value > 0 && currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
      localStorage.setItem('gallery_current_page', totalPages.value.toString())
      updateURL(totalPages.value)
    }
    
    // 确保至少在第一页
    if (currentPage.value < 1) {
      currentPage.value = 1
    }
    
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return artworksList.slice(start, end)
  }

  // 初始化页码（从localStorage或URL参数恢复）
  const initializePage = () => {
    // 首先检查URL参数
    const urlParams = new URLSearchParams(window.location.search)
    const urlPage = urlParams.get('page')
    
    if (urlPage) {
      const pageNum = parseInt(urlPage, 10)
      if (pageNum > 0) {
        currentPage.value = pageNum
        return
      }
    }
    
    // 如果URL没有页码，则从localStorage恢复
    const savedPage = localStorage.getItem('gallery_current_page')
    if (savedPage) {
      const pageNum = parseInt(savedPage, 10)
      if (pageNum > 0) {
        currentPage.value = pageNum
      }
    }
  }

  // 更新URL参数（不刷新页面）
  const updateURL = (page: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', page.toString())
    window.history.replaceState({}, '', url.toString())
  }

  // 滚动位置管理
  const saveScrollPosition = (page: number, position: number) => {
    scrollPositions.value[page] = position
    // 保存到 sessionStorage，仅在当前会话中有效
    sessionStorage.setItem('gallery_scroll_positions', JSON.stringify(scrollPositions.value))
  }

  const getScrollPosition = (page: number): number => {
    return scrollPositions.value[page] || 0
  }

  const loadScrollPositions = () => {
    try {
      const saved = sessionStorage.getItem('gallery_scroll_positions')
      if (saved) {
        scrollPositions.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load scroll positions:', error)
    }
  }

  const clearScrollPositions = () => {
    scrollPositions.value = {}
    sessionStorage.removeItem('gallery_scroll_positions')
  }

  const sanitizeWorkName = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return `work-${Date.now()}`
    return trimmed.replace(/[\\/]/g, '-').replace(/\s+/g, '_')
  }

  const getFileExtension = (file: File) => {
    const nameExt = file.name.split('.').pop()?.toLowerCase()
    if (nameExt) {
      if (nameExt === 'jpeg') return 'jpg'
      return nameExt
    }
    if (file.type === 'image/png') return 'png'
    if (file.type === 'image/jpeg') return 'jpg'
    if (file.type === 'image/webp') return 'webp'
    return 'webp'
  }

  // 上传作品
  const uploadArtwork = async (formData: {
    workName: string
    title: string
    category: string
    description: string
    authorName: string
    tags: string[]
    featured: boolean
    images: File[]
    markdownFile?: File
    authorAvatar?: File
  }) => {
    loading.value = true
    error.value = null

    try {
      const normalizedWorkName = sanitizeWorkName(formData.workName)
      const artworkId = `${formData.category}-${normalizedWorkName}`
      const basePath = `artworks/${formData.category}/${normalizedWorkName}`

      const preparedImages = formData.images.map((file, index) => {
        const ext = getFileExtension(file)
        const fileName = `image_${index + 1}.${ext}`
        return {
          file,
          fileName,
          blobPath: `${basePath}/${fileName}`
        }
      })

      const markdownFile =
        formData.markdownFile ||
        new File(
          [
            [
              '---',
              `title: ${formData.title}`,
              `category: ${formData.category}`,
              `featured: ${formData.featured}`,
              `author: ${formData.authorName || '未知作者'}`,
              `tags: [${formData.tags.join(', ')}]`,
              '---',
              '',
              formData.description || '暂无描述'
            ].join('\n')
          ],
          `${normalizedWorkName}.md`,
          { type: 'text/markdown' }
        )

      const uploads = [
        ...preparedImages,
        {
          file: markdownFile,
          fileName: markdownFile.name,
          blobPath: `${basePath}/${markdownFile.name}`
        }
      ]

      if (formData.authorAvatar) {
        uploads.push({
          file: formData.authorAvatar,
          fileName: 'author.jpg',
          blobPath: `${basePath}/author.jpg`
        })
      }

      const { upload } = await import('@vercel/blob/client')

      const uploadedAssets = await Promise.all(
        uploads.map(async target => {
          const result = await upload(target.blobPath, target.file, {
            access: 'public',
            handleUploadUrl: '/api/artworks/upload-handler'
          })
          return {
            ...target,
            url: result.url,
            pathname: result.pathname
          }
        })
      )

      if (formData.featured) {
        await upload(
          `${basePath}/.featured`,
          new Blob(['featured'], { type: 'text/plain' }),
          {
            access: 'public',
            handleUploadUrl: '/api/artworks/upload-handler'
          }
        )
      }

      const imageUploads = uploadedAssets.filter(asset =>
        asset.fileName.startsWith('image_')
      )
      const markdownUpload = uploadedAssets.find(asset =>
        asset.fileName.endsWith('.md')
      )
      const avatarUpload = uploadedAssets.find(
        asset => asset.fileName === 'author.jpg'
      )

      const now = new Date().toISOString()
      const metadataPayload = {
        id: artworkId,
        workName: normalizedWorkName,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        authorName: formData.authorName,
        tags: formData.tags,
        featured: formData.featured,
        isFeatured: formData.featured,
        images: imageUploads.map(asset => asset.url),
        imageCount: imageUploads.length,
        thumbnail: imageUploads[0]?.url || '',
        authorAvatar: avatarUpload?.url || null,
        markdownFile: markdownUpload?.url || null,
        createdAt: now,
        updatedAt: now,
        views: 0,
        likes: 0,
        source: 'blob'
      }

      await upload(
        `${basePath}/metadata.json`,
        new Blob([JSON.stringify(metadataPayload, null, 2)], {
          type: 'application/json'
        }),
        {
          access: 'public',
          handleUploadUrl: '/api/artworks/upload-handler'
        }
      )

      artworks.value = []
      await fetchArtworks()

      return { success: true, artworkId }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新作品
  const updateArtwork = async (id: string, updates: Partial<Artwork>) => {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(`/api/artworks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!res.ok) {
        throw new Error('Failed to update artwork')
      }

      const { artwork } = await res.json()

      // 更新本地状态
      const index = artworks.value.findIndex(a => a.id === id)
      if (index !== -1) {
        artworks.value[index] = {
          ...artworks.value[index],
          ...artwork
        }
      }

      return { success: true, artwork }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Update failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除作品
  const deleteArtwork = async (id: string, soft = false) => {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(`/api/artworks/${id}?soft=${soft}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete artwork')
      }

      // 从本地状态移除
      artworks.value = artworks.value.filter(a => a.id !== id)

      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Delete failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    artworks,
    loading,
    error,
    // 分页状态
    currentPage,
    itemsPerPage,
    totalPages,
    // 搜索状态
    searchQuery,
    searchResults,
    isSearching,
    searchMode,
    searchHistory,
    // 原有方法
    fetchArtworks,
    performSearch,
    clearSearch,
    searchArtworks,
    getSearchSuggestions,
    clearSearchHistory,
    filterByCategory,
    getArtworkById,
    // 分页方法
    updateTotalPages,
    setCurrentPage,
    nextPage,
    prevPage,
    jumpToPage,
    getCurrentPageArtworks,
    initializePage,
    updateURL,
    // 滚动位置方法
    saveScrollPosition,
    getScrollPosition,
    loadScrollPositions,
    clearScrollPositions,
    // 新增：上传、更新、删除方法
    uploadArtwork,
    updateArtwork,
    deleteArtwork
  }
})
