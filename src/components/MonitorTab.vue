<template>
  <div class="monitor-tab">
    <div class="monitor-content" v-if="server.connected">
      <!-- 监控工具栏 -->
      <div class="monitor-toolbar">
        <button @click="showSettings = !showSettings" class="toolbar-btn" title="告警设置">⚙️ 告警</button>
        <button @click="showHistory = !showHistory" class="toolbar-btn" :class="{ active: showHistory }" title="历史图表">
          📊 历史
        </button>
        <button @click="showProcesses = !showProcesses" class="toolbar-btn" :class="{ active: showProcesses }" title="进程">
          🔍 进程
        </button>
        <button @click="showNetwork = !showNetwork" class="toolbar-btn" :class="{ active: showNetwork }" title="网络">
          🌐 网络
        </button>
        <button @click="showDisk = !showDisk" class="toolbar-btn" :class="{ active: showDisk }" title="磁盘">
          💾 磁盘
        </button>
      </div>

      <!-- 告警设置面板 -->
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-header">
          <h4>告警阈值设置</h4>
          <button @click="showSettings = false" class="close-btn">×</button>
        </div>
        <div class="settings-content">
          <div class="setting-item">
            <label>CPU 告警阈值: {{ alertThresholds.cpu }}%</label>
            <input type="range" v-model.number="alertThresholds.cpu" min="50" max="100" class="threshold-slider" />
          </div>
          <div class="setting-item">
            <label>内存告警阈值: {{ alertThresholds.memory }}%</label>
            <input type="range" v-model.number="alertThresholds.memory" min="50" max="100" class="threshold-slider" />
          </div>
          <div class="setting-item">
            <label>磁盘告警阈值: {{ alertThresholds.disk }}%</label>
            <input type="range" v-model.number="alertThresholds.disk" min="50" max="100" class="threshold-slider" />
          </div>
          <button @click="saveAlertSettings" class="save-btn">保存设置</button>
        </div>
      </div>

      <!-- 监控指标网格 -->
      <div class="monitor-grid">
        <!-- CPU 监控 -->
        <div class="monitor-card cpu-card" @click="showHistory = true" :class="{ 'alert': cpuUsage >= alertThresholds.cpu }">
          <div class="card-icon">💻</div>
          <div class="card-content">
            <div class="card-title">CPU</div>
            <div class="card-value" :class="getUsageClass(cpuUsage)">
              {{ cpuUsage.toFixed(1) }}%
            </div>
            <div class="card-progress">
              <div
                class="progress-bar"
                :style="{ width: cpuUsage + '%' }"
                :class="getUsageClass(cpuUsage)"
              ></div>
            </div>
            <div class="card-info" v-if="cpuInfo.cores">
              核心数: {{ cpuInfo.cores }} | 负载: {{ cpuInfo.loadAverage }}
            </div>
          </div>
        </div>

        <!-- 内存监控 -->
        <div class="monitor-card memory-card" @click="showHistory = true" :class="{ 'alert': memoryUsage >= alertThresholds.memory }">
          <div class="card-icon">🧠</div>
          <div class="card-content">
            <div class="card-title">内存</div>
            <div class="card-value" :class="getUsageClass(memoryUsage)">
              {{ memoryUsage.toFixed(1) }}%
            </div>
            <div class="card-progress">
              <div
                class="progress-bar"
                :style="{ width: memoryUsage + '%' }"
                :class="getUsageClass(memoryUsage)"
              ></div>
            </div>
            <div class="card-info">
              {{ formatSize(memoryInfo.used) }} / {{ formatSize(memoryInfo.total) }}
            </div>
          </div>
        </div>

        <!-- 磁盘监控（总体占用） -->
        <div class="monitor-card disk-card" @click="showDisk = true" :class="{ 'alert': totalDiskUsage >= alertThresholds.disk }">
          <div class="card-icon">💾</div>
          <div class="card-content">
            <div class="card-title">磁盘</div>
            <div class="card-value" :class="getUsageClass(totalDiskUsage)">
              {{ totalDiskUsage.toFixed(1) }}%
            </div>
            <div class="card-progress">
              <div
                class="progress-bar"
                :style="{ width: totalDiskUsage + '%' }"
                :class="getUsageClass(totalDiskUsage)"
              ></div>
            </div>
            <div class="card-info">
              {{ formatSize(totalDiskUsed) }} / {{ formatSize(totalDiskTotal) }}
            </div>
          </div>
        </div>

        <!-- 网络监控 -->
        <div class="monitor-card network-card" @click="showNetwork = true">
          <div class="card-icon">🌐</div>
          <div class="card-content">
            <div class="card-title">网络</div>
            <div class="network-stats">
              <div class="network-stat">
                <div class="network-label">⬇️ 下载</div>
                <div class="network-value">{{ formatSize(networkInfo.download) }}/s</div>
              </div>
              <div class="network-stat">
                <div class="network-label">⬆️ 上传</div>
                <div class="network-value">{{ formatSize(networkInfo.upload) }}/s</div>
              </div>
            </div>
            <div class="card-info">
              总下载: {{ formatSize(networkInfo.downloadTotal) }} | 总上传: {{ formatSize(networkInfo.uploadTotal) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 历史图表 -->
      <div v-if="showHistory" class="history-panel">
        <div class="history-header">
          <h4>历史数据图表</h4>
          <button @click="showHistory = false" class="close-btn">×</button>
        </div>
        <div class="history-content">
          <div class="chart-container">
            <div class="chart-title">CPU 使用率趋势</div>
            <div class="chart" ref="cpuChart">
              <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                <polyline
                  :points="getChartPoints(cpuHistory)"
                  fill="none"
                  stroke="var(--accent-color)"
                  stroke-width="2"
                />
              </svg>
            </div>
          </div>
          <div class="chart-container">
            <div class="chart-title">内存使用率趋势</div>
            <div class="chart" ref="memoryChart">
              <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                <polyline
                  :points="getChartPoints(memoryHistory)"
                  fill="none"
                  stroke="var(--success-color)"
                  stroke-width="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 进程详情 -->
      <div v-if="showProcesses" class="detail-panel">
        <div class="detail-header">
          <h4>进程列表</h4>
          <button @click="showProcesses = false" class="close-btn">×</button>
        </div>
        <div class="detail-content">
          <div class="process-list">
            <div class="process-header">
              <div class="process-col pid">PID</div>
              <div class="process-col name">进程名</div>
              <div class="process-col cpu">CPU%</div>
              <div class="process-col memory">内存%</div>
              <div class="process-col user">用户</div>
            </div>
            <div 
              v-for="process in processList" 
              :key="process.pid"
              class="process-item"
            >
              <div class="process-col pid">{{ process.pid }}</div>
              <div class="process-col name">{{ process.name }}</div>
              <div class="process-col cpu">{{ process.cpu.toFixed(1) }}%</div>
              <div class="process-col memory">{{ process.memory.toFixed(1) }}%</div>
              <div class="process-col user">{{ process.user }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 网络详情 -->
      <div v-if="showNetwork" class="detail-panel">
        <div class="detail-header">
          <h4>网络连接详情</h4>
          <button @click="showNetwork = false" class="close-btn">×</button>
        </div>
        <div class="detail-content">
          <div class="network-list">
            <div class="network-header">
              <div class="network-col protocol">协议</div>
              <div class="network-col local">本地地址</div>
              <div class="network-col remote">远程地址</div>
              <div class="network-col state">状态</div>
            </div>
            <div 
              v-for="conn in networkConnections" 
              :key="conn.id"
              class="network-item"
            >
              <div class="network-col protocol">{{ conn.protocol }}</div>
              <div class="network-col local">{{ conn.local }}</div>
              <div class="network-col remote">{{ conn.remote }}</div>
              <div class="network-col state">{{ conn.state }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 磁盘详情 -->
      <div v-if="showDisk" class="detail-panel">
        <div class="detail-header">
          <h4>磁盘分区详情</h4>
          <button @click="showDisk = false" class="close-btn">×</button>
        </div>
        <div class="detail-content">
          <div class="disk-list">
            <div class="disk-header">
              <div class="disk-col mount">挂载点</div>
              <div class="disk-col filesystem">文件系统</div>
              <div class="disk-col total">总容量</div>
              <div class="disk-col used">已使用</div>
              <div class="disk-col available">可用</div>
              <div class="disk-col usage">使用率</div>
            </div>
            <div 
              v-for="disk in diskInfo" 
              :key="disk.mount"
              class="disk-item"
            >
              <div class="disk-col mount">{{ disk.mount }}</div>
              <div class="disk-col filesystem">{{ disk.filesystem }}</div>
              <div class="disk-col total">{{ formatSize(disk.total) }}</div>
              <div class="disk-col used">{{ formatSize(disk.used) }}</div>
              <div class="disk-col available">{{ formatSize(disk.available) }}</div>
              <div class="disk-col usage">
                <div class="usage-bar">
                  <div 
                    class="usage-fill" 
                    :style="{ width: disk.usage + '%' }"
                    :class="getUsageClass(disk.usage)"
                  ></div>
                </div>
                <span>{{ disk.usage.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="monitor-disconnected">
      <div class="disconnected-content">
        <div class="disconnected-icon">📊</div>
        <h3>未连接服务器</h3>
        <p>请先连接服务器以查看监控信息</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

const props = defineProps({
  tab: Object,
  server: Object,
  autoRefresh: {
    type: Boolean,
    default: true
  }
})

const autoRefresh = computed(() => props.autoRefresh)
const refreshInterval = ref(null)
const lastUpdateTime = ref('--')

// UI 状态
const showSettings = ref(false)
const showHistory = ref(false)
const showProcesses = ref(false)
const showNetwork = ref(false)
const showDisk = ref(false)
// 详情面板状态（已通过工具栏按钮控制）

// 告警阈值
const alertThresholds = ref({
  cpu: 90,
  memory: 90,
  disk: 90
})

// 历史数据
const cpuHistory = ref([])
const memoryHistory = ref([])
const maxHistoryLength = 60 // 保留60个数据点

// 进程列表
const processList = ref([])

// 网络连接
const networkConnections = ref([])

// 图表尺寸
const chartWidth = 600
const chartHeight = 200

// CPU 数据
const cpuUsage = ref(0)
const cpuInfo = ref({
  cores: 4,
  frequency: 2400,
  loadAverage: '0.5, 0.3, 0.2'
})
const cpuCores = ref([])

// 内存数据
const memoryUsage = ref(0)
const memoryInfo = ref({
  total: 8192 * 1024 * 1024, // 8GB
  used: 4096 * 1024 * 1024,  // 4GB
  available: 4096 * 1024 * 1024, // 4GB
  cached: 1024 * 1024 * 1024 // 1GB
})

// 磁盘数据
const diskInfo = ref([
  {
    mount: '/',
    filesystem: 'ext4',
    total: 100 * 1024 * 1024 * 1024, // 100GB
    used: 50 * 1024 * 1024 * 1024,   // 50GB
    available: 50 * 1024 * 1024 * 1024, // 50GB
    usage: 50
  }
])

// 计算总体磁盘占用
const totalDiskUsed = computed(() => {
  return diskInfo.value.reduce((sum, disk) => sum + disk.used, 0)
})

const totalDiskTotal = computed(() => {
  return diskInfo.value.reduce((sum, disk) => sum + disk.total, 0)
})

const totalDiskUsage = computed(() => {
  if (totalDiskTotal.value === 0) return 0
  return (totalDiskUsed.value / totalDiskTotal.value) * 100
})

// 网络数据
const networkInfo = ref({
  download: 0,
  upload: 0,
  downloadTotal: 0,
  uploadTotal: 0
})

const circumferenceSmall = 2 * Math.PI * 32 // 201.06

const cpuOffsetSmall = computed(() => {
  return circumferenceSmall - (cpuUsage.value / 100) * circumferenceSmall
})

const memoryOffsetSmall = computed(() => {
  return circumferenceSmall - (memoryUsage.value / 100) * circumferenceSmall
})

watch(() => props.server.connected, (connected) => {
  if (connected) {
    loadMonitorData()
    if (autoRefresh.value) {
      startAutoRefresh()
    }
  } else {
    stopAutoRefresh()
  }
})

watch(() => autoRefresh.value, (enabled) => {
  if (enabled && props.server.connected) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

onMounted(() => {
  loadAlertSettings()
  if (props.server.connected) {
    loadMonitorData()
    if (autoRefresh.value) {
      startAutoRefresh()
    }
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

async function loadMonitorData() {
  if (!props.server.connected) {
    return
  }

  try {
    // 调用 Tauri API 获取监控数据
    const { getSystemMonitor } = await import('@/api/monitor')
    const data = await getSystemMonitor(props.server.id)
    updateMonitorData(data)
    
    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN')
  } catch (err) {
    console.error('获取监控数据失败:', err)
  }
}

function getMockData() {
  // 模拟数据，实际应该从 Tauri 获取
  return {
    cpu: {
      usage: Math.random() * 100,
      cores: 8,
      frequency: 2400,
      loadAverage: `${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}`,
      coresUsage: Array.from({ length: 8 }, () => Math.random() * 100)
    },
    memory: {
      total: 16 * 1024 * 1024 * 1024, // 16GB
      used: (8 + Math.random() * 4) * 1024 * 1024 * 1024,
      cached: (1 + Math.random() * 2) * 1024 * 1024 * 1024
    },
    disk: [
      {
        mount: '/',
        filesystem: 'ext4',
        total: 100 * 1024 * 1024 * 1024,
        used: (40 + Math.random() * 20) * 1024 * 1024 * 1024
      },
      {
        mount: '/home',
        filesystem: 'ext4',
        total: 200 * 1024 * 1024 * 1024,
        used: (80 + Math.random() * 40) * 1024 * 1024 * 1024
      }
    ],
    network: {
      download: Math.random() * 10 * 1024 * 1024, // 0-10MB/s
      upload: Math.random() * 5 * 1024 * 1024,    // 0-5MB/s
      downloadTotal: 100 * 1024 * 1024 * 1024,
      uploadTotal: 50 * 1024 * 1024 * 1024
    },
    processes: Array.from({ length: 20 }, (_, i) => ({
      pid: 1000 + i,
      name: `process-${i}`,
      cpu: Math.random() * 50,
      memory: Math.random() * 20,
      user: i % 2 === 0 ? 'root' : 'user'
    })),
    networkConnections: Array.from({ length: 10 }, (_, i) => ({
      id: i,
      protocol: i % 2 === 0 ? 'TCP' : 'UDP',
      local: `127.0.0.1:${8000 + i}`,
      remote: `192.168.1.${100 + i}:443`,
      state: ['ESTABLISHED', 'LISTEN', 'TIME_WAIT'][i % 3]
    }))
  }
}

function updateMonitorData(data) {
  // 更新 CPU 数据
  cpuUsage.value = data.cpu.usage
  cpuInfo.value = {
    cores: data.cpu.cores,
    frequency: data.cpu.frequency,
    loadAverage: data.cpu.loadAverage
  }
  cpuCores.value = data.cpu.coresUsage || []
  
  // 添加到历史记录
  cpuHistory.value.push(data.cpu.usage)
  if (cpuHistory.value.length > maxHistoryLength) {
    cpuHistory.value.shift()
  }

  // 更新内存数据
  memoryInfo.value.total = data.memory.total
  memoryInfo.value.used = data.memory.used
  memoryInfo.value.cached = data.memory.cached || 0
  memoryInfo.value.available = data.memory.total - data.memory.used
  memoryUsage.value = (data.memory.used / data.memory.total) * 100
  
  // 添加到历史记录
  memoryHistory.value.push(memoryUsage.value)
  if (memoryHistory.value.length > maxHistoryLength) {
    memoryHistory.value.shift()
  }

  // 更新磁盘数据
  diskInfo.value = data.disk.map(disk => ({
    ...disk,
    available: disk.total - disk.used,
    usage: (disk.used / disk.total) * 100
  }))

  // 更新网络数据
  networkInfo.value = data.network
  
  // 更新进程列表
  if (data.processes) {
    processList.value = data.processes.slice(0, 50) // 只显示前50个进程
  }
  
  // 更新网络连接
  if (data.networkConnections) {
    networkConnections.value = data.networkConnections
  }
  
  // 检查告警
  checkAlerts()
}

// 检查告警
function checkAlerts() {
  if (cpuUsage.value >= alertThresholds.value.cpu) {
    console.warn(`CPU 使用率告警: ${cpuUsage.value.toFixed(1)}% >= ${alertThresholds.value.cpu}%`)
  }
  if (memoryUsage.value >= alertThresholds.value.memory) {
    console.warn(`内存使用率告警: ${memoryUsage.value.toFixed(1)}% >= ${alertThresholds.value.memory}%`)
  }
  if (totalDiskUsage.value >= alertThresholds.value.disk) {
    console.warn(`磁盘使用率告警: ${totalDiskUsage.value.toFixed(1)}% >= ${alertThresholds.value.disk}%`)
  }
}

// 获取图表点
function getChartPoints(history) {
  if (history.length === 0) return ''
  const points = history.map((value, index) => {
    const x = (index / (maxHistoryLength - 1)) * chartWidth
    const y = chartHeight - (value / 100) * chartHeight
    return `${x},${y}`
  })
  return points.join(' ')
}

// 保存告警设置
function saveAlertSettings() {
  localStorage.setItem(`alert-thresholds-${props.server?.id}`, JSON.stringify(alertThresholds.value))
  showSettings.value = false
}

// 加载告警设置
function loadAlertSettings() {
  const saved = localStorage.getItem(`alert-thresholds-${props.server?.id}`)
  if (saved) {
    try {
      alertThresholds.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load alert settings:', e)
    }
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshInterval.value = setInterval(() => {
    loadMonitorData()
  }, 2000) // 每2秒刷新一次
}

function stopAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

function toggleAutoRefresh() {
  // 由父组件控制自动刷新
  // 这里保留方法以防需要
}

function handleRefresh() {
  loadMonitorData()
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let size = bytes
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

function getUsageClass(usage) {
  if (usage >= 90) return 'usage-critical'
  if (usage >= 70) return 'usage-warning'
  return 'usage-normal'
}
</script>

<style scoped>
.monitor-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  overflow: hidden;
}

.monitor-content {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* 监控网格布局 - 垂直排列 */
.monitor-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

/* 监控卡片 */
.monitor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.2s;
  min-width: 0;
  flex-shrink: 0;
  box-sizing: border-box;
}

.monitor-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  line-height: 1.3;
}

.card-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.card-value.usage-normal {
  color: var(--success-color);
}

.card-value.usage-warning {
  color: var(--warning-color);
}

.card-value.usage-critical {
  color: var(--error-color);
}

.card-progress {
  height: 5px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 2px;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s;
  border-radius: 3px;
}

.progress-bar.usage-normal {
  background: var(--success-color);
}

.progress-bar.usage-warning {
  background: var(--warning-color);
}

.progress-bar.usage-critical {
  background: var(--error-color);
}

.card-info {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
  line-height: 1.3;
}

/* 网络统计 */
.network-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.network-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.network-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.network-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-color);
}

/* 未连接状态 */
.monitor-disconnected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.disconnected-content {
  text-align: center;
}

.disconnected-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.disconnected-content h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.disconnected-content p {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 工具栏 */
.monitor-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.toolbar-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
}

.toolbar-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* 告警样式 */
.monitor-card.alert {
  border: 2px solid var(--error-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 设置面板 */
.settings-panel {
  position: absolute;
  top: 50px;
  right: 12px;
  z-index: 100;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.settings-header h4 {
  margin: 0;
  font-size: 14px;
}

.settings-content {
  padding: 12px;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.threshold-slider {
  width: 100%;
}

.save-btn {
  width: 100%;
  padding: 8px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

/* 历史图表面板 */
.history-panel {
  position: absolute;
  top: 50px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 100;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-container {
  background: var(--bg-primary);
  border-radius: 4px;
  padding: 16px;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.chart {
  width: 100%;
  height: 200px;
}

.chart-svg {
  width: 100%;
  height: 100%;
}

/* 详情面板 */
.detail-panel {
  position: absolute;
  top: 50px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 100;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.detail-header h4 {
  margin: 0;
  font-size: 14px;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* 进程列表 */
.process-list {
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.process-header {
  display: flex;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.process-item {
  display: flex;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  transition: background 0.2s;
}

.process-item:hover {
  background: var(--bg-hover);
}

.process-col {
  padding: 0 8px;
}

.process-col.pid {
  width: 80px;
}

.process-col.name {
  flex: 1;
  min-width: 200px;
}

.process-col.cpu {
  width: 80px;
  text-align: right;
}

.process-col.memory {
  width: 80px;
  text-align: right;
}

.process-col.user {
  width: 100px;
}

/* 网络连接列表 */
.network-list {
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.network-header {
  display: flex;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.network-item {
  display: flex;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  transition: background 0.2s;
}

.network-item:hover {
  background: var(--bg-hover);
}

.network-col {
  padding: 0 8px;
}

.network-col.protocol {
  width: 80px;
}

.network-col.local {
  flex: 1;
  min-width: 150px;
  font-family: 'Consolas', monospace;
}

.network-col.remote {
  flex: 1;
  min-width: 150px;
  font-family: 'Consolas', monospace;
}

.network-col.state {
  width: 120px;
}

/* 磁盘列表 */
.disk-list {
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.disk-header {
  display: flex;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.disk-item {
  display: flex;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  transition: background 0.2s;
  align-items: center;
}

.disk-item:hover {
  background: var(--bg-hover);
}

.disk-col {
  padding: 0 8px;
}

.disk-col.mount {
  width: 120px;
  font-family: 'Consolas', monospace;
}

.disk-col.filesystem {
  width: 100px;
}

.disk-col.total,
.disk-col.used,
.disk-col.available {
  width: 100px;
  text-align: right;
}

.disk-col.usage {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  transition: width 0.3s;
  border-radius: 4px;
}

.usage-fill.usage-normal {
  background: var(--success-color);
}

.usage-fill.usage-warning {
  background: var(--warning-color);
}

.usage-fill.usage-critical {
  background: var(--error-color);
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
  line-height: 1;
}
</style>

