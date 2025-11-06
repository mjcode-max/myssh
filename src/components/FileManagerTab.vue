<template>
  <div class="file-manager-tab">
    <div class="file-manager-header">
      <div class="path-bar">
        <button @click="handleGoHome" class="path-btn" title="首页">🏠</button>
        <button @click="handleGoUp" class="path-btn" title="上一级">↑</button>
        <input
          v-model="currentPath"
          @keydown.enter="handleNavigate"
          class="path-input"
          placeholder="/"
        />
        <button @click="handleRefresh" class="path-btn" title="刷新">🔄</button>
      </div>
      <div class="file-actions">
        <button @click="handleUpload" class="action-btn" title="上传文件">📤 上传</button>
        <button @click="handleDownload" class="action-btn" title="下载文件">📥 下载</button>
        <button @click="handleNewFolder" class="action-btn" title="新建文件夹">📁 新建</button>
        <button @click="handleDelete" class="action-btn delete" title="删除">🗑️ 删除</button>
      </div>
    </div>
    
    <div class="file-list-container">
      <div class="file-list-header">
        <div class="file-col name">名称</div>
        <div class="file-col size">大小</div>
        <div class="file-col type">类型</div>
        <div class="file-col date">修改时间</div>
      </div>
      <div class="file-list" v-if="files.length > 0">
        <div
          v-for="file in files"
          :key="file.path || file.name"
          :class="['file-item', { selected: isFileSelected(file) }]"
          @click="handleFileClick(file)"
          @dblclick="handleFileDoubleClick(file)"
        >
          <div class="file-col name">
            <span class="file-icon">{{ getFileIcon(file) }}</span>
            <span class="file-name">{{ file.name }}</span>
          </div>
          <div class="file-col size">{{ formatSize(file.size) }}</div>
          <div class="file-col type">{{ file.type }}</div>
          <div class="file-col date">{{ formatDate(file.modified) }}</div>
        </div>
      </div>
      <div v-else-if="loading" class="empty-files">
        <p>加载中...</p>
      </div>
      <div v-else-if="error" class="empty-files error">
        <p>❌ {{ error }}</p>
        <button @click="loadFiles" class="retry-btn">重试</button>
      </div>
      <div 
        v-else 
        class="empty-files upload-zone"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        :class="{ 'drag-over': isDragOver }"
        @dragenter="isDragOver = true"
        @dragleave="isDragOver = false"
      >
        <div class="upload-content">
          <div class="upload-icon">📤</div>
          <p class="upload-text">目录为空</p>
          <p class="upload-hint">点击"上传"按钮或拖拽文件到此处上传</p>
          <button @click="handleUpload" class="upload-btn">选择文件上传</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'
import { open, save as saveFile } from '@tauri-apps/api/dialog'

const props = defineProps({
  tab: Object,
  server: Object
})

const currentPath = ref('/')
const files = ref([])
const selectedFiles = ref([]) // 存储选中文件的完整路径
const loading = ref(false)
const error = ref(null)
const isDragOver = ref(false)

watch(() => props.server.connected, (connected) => {
  if (connected) {
    loadFiles()
  } else {
    files.value = []
    selectedFiles.value = []
  }
})

watch(() => currentPath.value, () => {
  if (props.server.connected) {
    loadFiles()
  }
})

onMounted(() => {
  if (props.server.connected) {
    loadFiles()
  }
})

async function loadFiles() {
  if (!props.server.connected) {
    return
  }

  loading.value = true
  error.value = null

  try {
    // TODO: 调用 Tauri 获取远程目录文件列表
    // 接口: invoke('list_remote_directory', { serverId: props.server.id, path: currentPath.value })
    // 返回格式: { files: [{ name, type, size, modified, path }] }
    
    // 临时模拟数据，实际应该调用 Tauri
    const mockFiles = [
      { name: '..', type: 'directory', size: 0, modified: new Date(), path: getParentPath() },
      { name: 'home', type: 'directory', size: 0, modified: new Date(), path: currentPath.value + '/home' },
      { name: 'etc', type: 'directory', size: 0, modified: new Date(), path: currentPath.value + '/etc' },
      { name: 'var', type: 'directory', size: 0, modified: new Date(), path: currentPath.value + '/var' },
      { name: 'readme.txt', type: 'file', size: 1024, modified: new Date(), path: currentPath.value + '/readme.txt' },
      { name: 'config.json', type: 'file', size: 2048, modified: new Date(), path: currentPath.value + '/config.json' }
    ]

    // 实际调用应该是：
    // const result = await invoke('list_remote_directory', {
    //   serverId: props.server.id,
    //   path: currentPath.value
    // })
    // files.value = result.files || []

    files.value = mockFiles
  } catch (err) {
    error.value = err.message || '获取文件列表失败'
    console.error('加载文件列表失败:', err)
  } finally {
    loading.value = false
  }
}

function getParentPath() {
  const parts = currentPath.value.split('/').filter(p => p)
  if (parts.length > 0) {
    parts.pop()
    return '/' + parts.join('/')
  }
  return '/'
}

function getFileIcon(file) {
  if (file.type === 'directory') {
    return '📁'
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  const iconMap = {
    'txt': '📄',
    'json': '📋',
    'js': '📜',
    'py': '🐍',
    'jpg': '🖼️',
    'png': '🖼️',
    'zip': '📦',
    'tar': '📦'
  }
  return iconMap[ext] || '📄'
}

function formatSize(size) {
  if (size === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let fileSize = size
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024
    unitIndex++
  }
  return `${fileSize.toFixed(2)} ${units[unitIndex]}`
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

function handleFileClick(file) {
  if (file.name === '..') return
  // 使用完整路径来标识文件，避免同名文件冲突
  const filePath = file.path || (currentPath.value.endsWith('/') ? currentPath.value + file.name : currentPath.value + '/' + file.name)
  const index = selectedFiles.value.indexOf(filePath)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(filePath)
  }
}

function isFileSelected(file) {
  const filePath = file.path || (currentPath.value.endsWith('/') ? currentPath.value + file.name : currentPath.value + '/' + file.name)
  return selectedFiles.value.includes(filePath)
}

function handleFileDoubleClick(file) {
  if (file.type === 'directory') {
    if (file.name === '..') {
      handleGoUp()
    } else {
      // 使用文件的完整路径
      currentPath.value = file.path || (currentPath.value.endsWith('/') ? currentPath.value + file.name : currentPath.value + '/' + file.name)
      // loadFiles 会在 watch currentPath 时自动调用
    }
  } else {
    // TODO: 打开文件（可以调用 Tauri 在终端中打开或下载预览）
    alert(`打开文件: ${file.name}`)
  }
}

function handleNavigate() {
  // loadFiles 会在 watch currentPath 时自动调用
}

function handleGoHome() {
  currentPath.value = '/'
  // loadFiles 会在 watch currentPath 时自动调用
}

function handleGoUp() {
  const parts = currentPath.value.split('/').filter(p => p)
  if (parts.length > 0) {
    parts.pop()
    currentPath.value = '/' + parts.join('/')
  } else {
    currentPath.value = '/'
  }
  // loadFiles 会在 watch currentPath 时自动调用
}

function handleRefresh() {
  loadFiles()
}

async function uploadFiles(filePaths) {
  if (!props.server.connected) {
    alert('请先连接服务器')
    return
  }

  if (!filePaths || filePaths.length === 0) {
    return
  }

  loading.value = true
  error.value = null

  try {
    // TODO: 调用 Tauri 上传文件
    // 接口: invoke('upload_files', { 
    //   serverId: props.server.id, 
    //   localPaths: filePaths,
    //   remotePath: currentPath.value 
    // })
    
    // 实际调用应该是：
    // for (const localPath of filePaths) {
    //   await invoke('upload_file', {
    //     serverId: props.server.id,
    //     localPath: localPath,
    //     remotePath: currentPath.value
    //   })
    // }

    // 临时提示，实际应该调用 Tauri
    console.log('上传文件:', filePaths, '到:', currentPath.value)
    alert(`准备上传 ${filePaths.length} 个文件到 ${currentPath.value}\n（将调用 Tauri 实现）`)

    // 上传成功后刷新文件列表
    await loadFiles()
  } catch (err) {
    error.value = err.message || '文件上传失败'
    alert('上传失败: ' + error.value)
    console.error('文件上传失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleUpload() {
  try {
    // 使用 Tauri 文件选择对话框
    const selected = await open({
      multiple: true,
      title: '选择要上传的文件'
    })

    if (!selected) {
      return // 用户取消选择
    }

    const filePaths = Array.isArray(selected) ? selected : [selected]
    await uploadFiles(filePaths)
  } catch (err) {
    console.error('选择文件失败:', err)
  }
}

async function handleDrop(event) {
  isDragOver.value = false
  
  if (!props.server.connected) {
    alert('请先连接服务器')
    return
  }

  // 从拖拽事件中获取文件路径
  // 注意：在浏览器环境中，需要使用 DataTransfer API
  // 但在 Tauri 中，可能需要使用不同的方式
  // 这里先实现基本逻辑，实际需要根据 Tauri 的拖拽 API 调整
  
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) {
    return
  }

  // TODO: 在 Tauri 中，需要将 File 对象转换为路径
  // 可能需要使用 Tauri 的文件系统 API 或拖拽 API
  // 这里先提示用户使用上传按钮
  alert('拖拽上传功能需要 Tauri 支持\n请使用"上传"按钮选择文件')
  
  // 实际实现应该是：
  // const filePaths = []
  // for (const file of files) {
  //   // 获取文件路径（需要 Tauri API）
  //   const path = await getFilePath(file)
  //   filePaths.push(path)
  // }
  // await uploadFiles(filePaths)
}

async function handleDownload() {
  if (selectedFiles.value.length === 0) {
    alert('请先选择要下载的文件')
    return
  }

  if (!props.server.connected) {
    alert('请先连接服务器')
    return
  }

  try {
    let savePath

    if (selectedFiles.value.length === 1) {
      // 单个文件：使用文件保存对话框
      const fileName = selectedFiles.value[0].split('/').pop()
      savePath = await saveFile({
        title: '选择保存位置',
        defaultPath: fileName
      })
    } else {
      // 多个文件：使用文件夹选择对话框
      savePath = await open({
        directory: true,
        multiple: false,
        title: '选择保存文件夹'
      })
    }

    if (!savePath) {
      return // 用户取消选择
    }

    loading.value = true
    error.value = null

    // TODO: 调用 Tauri 下载文件
    // 接口: invoke('download_files', {
    //   serverId: props.server.id,
    //   remotePaths: selectedFiles.value,
    //   localPath: savePath
    // })

    // 实际调用应该是：
    // if (selectedFiles.value.length === 1) {
    //   // 单个文件直接保存
    //   await invoke('download_file', {
    //     serverId: props.server.id,
    //     remotePath: selectedFiles.value[0],
    //     localPath: savePath
    //   })
    // } else {
    //   // 多个文件保存到文件夹
    //   for (const remotePath of selectedFiles.value) {
    //     const fileName = remotePath.split('/').pop()
    //     const localFilePath = savePath + '/' + fileName
    //     await invoke('download_file', {
    //       serverId: props.server.id,
    //       remotePath: remotePath,
    //       localPath: localFilePath
    //     })
    //   }
    // }

    // 临时提示，实际应该调用 Tauri
    console.log('下载文件:', selectedFiles.value, '到:', savePath)
    alert(`准备下载 ${selectedFiles.value.length} 个文件到 ${savePath}\n（将调用 Tauri 实现）`)

    // 下载成功后清空选择
    selectedFiles.value = []
  } catch (err) {
    error.value = err.message || '文件下载失败'
    alert('下载失败: ' + error.value)
    console.error('文件下载失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleNewFolder() {
  if (!props.server.connected) {
    alert('请先连接服务器')
    return
  }

  const name = prompt('请输入文件夹名称:')
  if (!name || !name.trim()) {
    return
  }

  try {
    loading.value = true
    error.value = null

    const folderPath = currentPath.value.endsWith('/') 
      ? currentPath.value + name.trim()
      : currentPath.value + '/' + name.trim()

    // TODO: 调用 Tauri 创建文件夹
    // 接口: invoke('create_directory', {
    //   serverId: props.server.id,
    //   path: folderPath
    // })

    // 实际调用应该是：
    // await invoke('create_directory', {
    //   serverId: props.server.id,
    //   path: folderPath
    // })

    // 临时提示，实际应该调用 Tauri
    console.log('创建文件夹:', folderPath)
    alert(`准备创建文件夹: ${folderPath}\n（将调用 Tauri 实现）`)

    // 创建成功后刷新文件列表
    await loadFiles()
  } catch (err) {
    error.value = err.message || '创建文件夹失败'
    alert('创建失败: ' + error.value)
    console.error('创建文件夹失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (selectedFiles.value.length === 0) {
    alert('请先选择要删除的文件')
    return
  }

  if (!props.server.connected) {
    alert('请先连接服务器')
    return
  }

  if (!confirm(`确定要删除选中的 ${selectedFiles.value.length} 个文件/文件夹吗？\n此操作不可恢复！`)) {
    return
  }

  try {
    loading.value = true
    error.value = null

    // TODO: 调用 Tauri 删除文件
    // 接口: invoke('delete_files', {
    //   serverId: props.server.id,
    //   paths: selectedFiles.value
    // })

    // 实际调用应该是：
    // await invoke('delete_files', {
    //   serverId: props.server.id,
    //   paths: selectedFiles.value
    // })

    // 临时提示，实际应该调用 Tauri
    console.log('删除文件:', selectedFiles.value)
    alert(`准备删除 ${selectedFiles.value.length} 个文件\n（将调用 Tauri 实现）`)

    // 删除成功后刷新文件列表
    selectedFiles.value = []
    await loadFiles()
  } catch (err) {
    error.value = err.message || '删除文件失败'
    alert('删除失败: ' + error.value)
    console.error('删除文件失败:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.file-manager-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  overflow: hidden;
}

.file-manager-header {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.path-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.path-btn {
  width: 32px;
  height: 28px;
  padding: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.path-input {
  flex: 1;
  font-size: 12px;
  font-family: 'Consolas', monospace;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  font-size: 12px;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn.delete:hover {
  background: var(--error-color);
  color: white;
}

.file-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-list-header {
  display: flex;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.file-col {
  padding: 0 8px;
}

.file-col.name {
  flex: 1;
  min-width: 200px;
}

.file-col.size {
  width: 100px;
  text-align: right;
}

.file-col.type {
  width: 80px;
}

.file-col.date {
  width: 180px;
}

.file-list {
  flex: 1;
  overflow-y: auto;
}

.file-item {
  display: flex;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
}

.file-item:hover {
  background: var(--bg-hover);
}

.file-item.selected {
  background: var(--bg-active);
}

.file-item .file-col.name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-files {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  gap: 12px;
}

.empty-files.error {
  color: var(--error-color);
}

.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  margin: 20px;
  transition: all 0.3s;
  cursor: pointer;
}

.upload-zone:hover {
  border-color: var(--accent-color);
  background: var(--bg-hover);
}

.upload-zone.drag-over {
  border-color: var(--accent-color);
  background: var(--bg-active);
  border-style: solid;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.upload-btn {
  padding: 8px 20px;
  background: var(--accent-color);
  color: white;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: var(--accent-hover);
}

.retry-btn {
  padding: 6px 16px;
  background: var(--accent-color);
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.retry-btn:hover {
  background: var(--accent-hover);
}
</style>

