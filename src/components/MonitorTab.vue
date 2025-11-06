<template>
  <div class="monitor-tab">
    <div class="monitor-content" v-if="server.connected">
      <!-- 监控指标网格 -->
      <div class="monitor-grid">
        <!-- CPU 监控 -->
        <div class="monitor-card cpu-card">
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
          </div>
        </div>

        <!-- 内存监控 -->
        <div class="monitor-card memory-card">
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
        <div class="monitor-card disk-card">
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
        <div class="monitor-card network-card">
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
    // TODO: 调用 Tauri 获取监控数据
    // 接口: invoke('get_system_monitor', { serverId: props.server.id })
    // 返回格式: { cpu, memory, disk, network }

    // 实际调用应该是：
    // const data = await invoke('get_system_monitor', {
    //   serverId: props.server.id
    // })
    // updateMonitorData(data)

    // 临时模拟数据
    updateMonitorData(getMockData())
    
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
    }
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

  // 更新内存数据
  memoryInfo.value.total = data.memory.total
  memoryInfo.value.used = data.memory.used
  memoryInfo.value.cached = data.memory.cached || 0
  memoryInfo.value.available = data.memory.total - data.memory.used
  memoryUsage.value = (data.memory.used / data.memory.total) * 100

  // 更新磁盘数据
  diskInfo.value = data.disk.map(disk => ({
    ...disk,
    available: disk.total - disk.used,
    usage: (disk.used / disk.total) * 100
  }))

  // 更新网络数据
  networkInfo.value = data.network
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

/* 监控网格布局 */
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  height: 100%;
  align-content: stretch;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .monitor-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 900px) {
  .monitor-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .monitor-card {
    padding: 12px;
    gap: 10px;
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
  
  .card-value {
    font-size: 20px;
  }
}

@media (max-width: 600px) {
  .monitor-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .monitor-card {
    padding: 10px;
  }
  
  .card-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  .card-value {
    font-size: 18px;
  }
  
  .card-title {
    font-size: 12px;
  }
  
  .card-info {
    font-size: 10px;
  }
}

/* 监控卡片 */
.monitor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
}

.monitor-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-icon {
  font-size: 32px;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
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
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
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
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 网络统计 */
.network-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.network-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.network-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.network-value {
  font-size: 14px;
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
</style>

