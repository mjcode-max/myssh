<template>
  <div class="transfer-manager">
    <div class="transfer-header">
      <h3>📤 传输管理</h3>
      <button @click="showHistory = !showHistory" class="header-btn" title="传输历史">
        📋 历史
      </button>
    </div>

    <!-- 传输队列 -->
    <div class="transfer-queue">
      <div v-if="activeTransfers.length === 0" class="empty-queue">
        <p>暂无传输任务</p>
      </div>
      <div 
        v-for="transfer in activeTransfers" 
        :key="transfer.id"
        class="transfer-item"
      >
        <div class="transfer-info">
          <div class="transfer-name">{{ transfer.name }}</div>
          <div class="transfer-path">{{ transfer.path }}</div>
        </div>
        <div class="transfer-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: transfer.progress + '%' }"
              :class="getProgressClass(transfer.status)"
            ></div>
          </div>
          <div class="progress-text">
            <span>{{ transfer.progress }}%</span>
            <span class="transfer-speed" v-if="transfer.speed">
              {{ formatSpeed(transfer.speed) }}
            </span>
          </div>
        </div>
        <div class="transfer-actions">
          <button 
            v-if="transfer.status === 'paused'"
            @click="resumeTransfer(transfer.id)"
            class="action-btn"
            title="继续"
          >
            ▶️
          </button>
          <button 
            v-else-if="transfer.status === 'uploading' || transfer.status === 'downloading'"
            @click="pauseTransfer(transfer.id)"
            class="action-btn"
            title="暂停"
          >
            ⏸️
          </button>
          <button 
            @click="cancelTransfer(transfer.id)"
            class="action-btn delete"
            title="取消"
          >
            ×
          </button>
        </div>
        <div class="transfer-status" :class="transfer.status">
          {{ getStatusText(transfer.status) }}
        </div>
      </div>
    </div>

    <!-- 传输历史 -->
    <div v-if="showHistory" class="transfer-history">
      <div class="history-header">
        <h4>传输历史</h4>
        <button @click="showHistory = false" class="close-btn">×</button>
      </div>
      <div class="history-list">
        <div 
          v-for="transfer in transferHistory" 
          :key="transfer.id"
          class="history-item"
          :class="transfer.status"
        >
          <div class="history-info">
            <div class="history-name">{{ transfer.name }}</div>
            <div class="history-path">{{ transfer.path }}</div>
            <div class="history-meta">
              {{ formatDate(transfer.startTime) }} - 
              {{ transfer.status === 'completed' ? '完成' : transfer.status === 'failed' ? '失败' : '取消' }}
            </div>
          </div>
          <div class="history-actions">
            <button 
              v-if="transfer.status === 'failed'"
              @click="retryTransfer(transfer)"
              class="retry-btn"
              title="重试"
            >
              重试
            </button>
            <button 
              @click="deleteHistory(transfer.id)"
              class="delete-btn"
              title="删除"
            >
              ×
            </button>
          </div>
        </div>
        <div v-if="transferHistory.length === 0" class="empty-history">
          暂无历史记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

const props = defineProps({
  server: Object
})

const activeTransfers = ref([])
const transferHistory = ref([])
const showHistory = ref(false)

// 加载传输历史
function loadHistory() {
  const saved = localStorage.getItem(`transfer-history-${props.server?.id}`)
  if (saved) {
    try {
      transferHistory.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load transfer history:', e)
    }
  }
}

// 保存传输历史
function saveHistory() {
  localStorage.setItem(`transfer-history-${props.server?.id}`, JSON.stringify(transferHistory.value))
}

// 添加传输任务
function addTransfer(transfer) {
  activeTransfers.value.push({
    id: Date.now().toString(),
    name: transfer.name,
    path: transfer.path,
    type: transfer.type, // 'upload' | 'download'
    status: transfer.type === 'upload' ? 'uploading' : 'downloading',
    progress: 0,
    speed: 0,
    startTime: Date.now(),
    ...transfer
  })
  
  // 开始传输
  startTransfer(activeTransfers.value[activeTransfers.value.length - 1])
}

// 开始传输
async function startTransfer(transfer) {
  try {
    // TODO: 调用 Tauri 开始传输
    // await invoke('start_file_transfer', {
    //   serverId: props.server.id,
    //   transferId: transfer.id,
    //   type: transfer.type,
    //   localPath: transfer.localPath,
    //   remotePath: transfer.remotePath
    // })
    
    // 模拟传输进度
    simulateTransfer(transfer)
  } catch (error) {
    transfer.status = 'failed'
    transfer.error = error.message
    moveToHistory(transfer)
  }
}

// 模拟传输（实际应该通过 Tauri 事件监听）
function simulateTransfer(transfer) {
  const interval = setInterval(() => {
    if (transfer.progress < 100 && transfer.status !== 'paused' && transfer.status !== 'cancelled') {
      transfer.progress += Math.random() * 10
      transfer.speed = Math.random() * 1024 * 1024 // 模拟速度
      
      if (transfer.progress >= 100) {
        transfer.progress = 100
        transfer.status = 'completed'
        clearInterval(interval)
        moveToHistory(transfer)
      }
    } else {
      clearInterval(interval)
    }
  }, 500)
}

// 暂停传输
async function pauseTransfer(transferId) {
  const transfer = activeTransfers.value.find(t => t.id === transferId)
  if (transfer) {
    transfer.status = 'paused'
    // TODO: 调用 Tauri 暂停传输
    // await invoke('pause_file_transfer', { serverId: props.server.id, transferId })
  }
}

// 继续传输
async function resumeTransfer(transferId) {
  const transfer = activeTransfers.value.find(t => t.id === transferId)
  if (transfer) {
    transfer.status = transfer.type === 'upload' ? 'uploading' : 'downloading'
    // TODO: 调用 Tauri 继续传输（支持断点续传）
    // await invoke('resume_file_transfer', { serverId: props.server.id, transferId })
    startTransfer(transfer)
  }
}

// 取消传输
async function cancelTransfer(transferId) {
  const transfer = activeTransfers.value.find(t => t.id === transferId)
  if (transfer) {
    transfer.status = 'cancelled'
    // TODO: 调用 Tauri 取消传输
    // await invoke('cancel_file_transfer', { serverId: props.server.id, transferId })
    moveToHistory(transfer)
  }
}

// 移动到历史记录
function moveToHistory(transfer) {
  const index = activeTransfers.value.findIndex(t => t.id === transfer.id)
  if (index > -1) {
    activeTransfers.value.splice(index, 1)
    transfer.endTime = Date.now()
    transferHistory.value.unshift(transfer)
    if (transferHistory.value.length > 100) {
      transferHistory.value = transferHistory.value.slice(0, 100)
    }
    saveHistory()
  }
}

// 重试传输
function retryTransfer(transfer) {
  const newTransfer = {
    ...transfer,
    id: Date.now().toString(),
    progress: 0,
    status: transfer.type === 'upload' ? 'uploading' : 'downloading',
    startTime: Date.now()
  }
  activeTransfers.value.push(newTransfer)
  startTransfer(newTransfer)
  
  // 从历史中删除
  transferHistory.value = transferHistory.value.filter(t => t.id !== transfer.id)
  saveHistory()
}

// 删除历史记录
function deleteHistory(transferId) {
  transferHistory.value = transferHistory.value.filter(t => t.id !== transferId)
  saveHistory()
}

function getStatusText(status) {
  const statusMap = {
    'uploading': '上传中',
    'downloading': '下载中',
    'paused': '已暂停',
    'completed': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

function getProgressClass(status) {
  if (status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  if (status === 'paused') return 'paused'
  return 'active'
}

function formatSpeed(bytes) {
  if (bytes === 0) return '0 B/s'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let unitIndex = 0
  let size = bytes
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 暴露方法供外部调用
defineExpose({
  addTransfer
})

onMounted(() => {
  loadHistory()
})

watch(() => props.server?.id, () => {
  loadHistory()
})
</script>

<style scoped>
.transfer-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  overflow: hidden;
}

.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.transfer-header h3 {
  margin: 0;
  font-size: 14px;
}

.header-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  cursor: pointer;
}

.transfer-queue {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-queue {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.transfer-item {
  padding: 12px;
  margin-bottom: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.transfer-info {
  margin-bottom: 8px;
}

.transfer-name {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.transfer-path {
  font-size: 11px;
  color: var(--text-secondary);
}

.transfer-progress {
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s;
  border-radius: 3px;
}

.progress-fill.active {
  background: var(--accent-color);
}

.progress-fill.completed {
  background: var(--success-color);
}

.progress-fill.failed {
  background: var(--error-color);
}

.progress-fill.paused {
  background: var(--warning-color);
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.transfer-speed {
  color: var(--accent-color);
}

.transfer-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.action-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  cursor: pointer;
}

.action-btn.delete:hover {
  background: var(--error-color);
  color: white;
}

.transfer-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.transfer-status.uploading,
.transfer-status.downloading {
  background: var(--accent-color);
  color: white;
}

.transfer-status.completed {
  background: var(--success-color);
  color: white;
}

.transfer-status.failed {
  background: var(--error-color);
  color: white;
}

.transfer-status.paused {
  background: var(--warning-color);
  color: white;
}

.transfer-history {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.history-header h4 {
  margin: 0;
  font-size: 14px;
}

.close-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 18px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  padding: 10px;
  margin-bottom: 6px;
  background: var(--bg-primary);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-info {
  flex: 1;
}

.history-name {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.history-path {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.history-meta {
  font-size: 10px;
  color: var(--text-disabled);
}

.history-actions {
  display: flex;
  gap: 6px;
}

.retry-btn {
  padding: 4px 8px;
  font-size: 11px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.delete-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--error-color);
  cursor: pointer;
  font-size: 16px;
}

.empty-history {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
</style>

