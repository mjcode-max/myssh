<template>
  <div class="workspace-tabs">
    <!-- 服务器标签页 -->
    <div v-if="connectedServers.length > 0" class="server-tabs-container">
      <div class="server-tabs-header">
        <div
          v-for="server in connectedServers"
          :key="server.id"
          :class="['server-tab', { active: activeServerId === server.id }]"
          @click="selectServer(server.id)"
        >
          <span class="server-tab-icon">🖥️</span>
          <span class="server-tab-name">{{ server.name }}</span>
          <span class="server-tab-status" :class="{ connected: server.connected }">
            {{ server.connected ? '●' : '○' }}
          </span>
          <button
            @click.stop="closeServerTab(server.id)"
            class="server-tab-close"
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>

      <!-- 工作区内容 -->
      <div
        v-for="server in connectedServers"
        :key="server.id"
        v-show="activeServerId === server.id"
        class="workspace-container"
        :class="{ resizing: isResizing && activeServerId === server.id }"
      >
        <!-- 系统监控区域（顶部） -->
        <div class="monitor-section" :style="{ height: getServerHeight(server.id) + 'px' }">
          <div class="section-header">
            <h3>📊 系统监控 - {{ server.name }}</h3>
            <div class="section-actions">
              <button @click="toggleMonitorAutoRefresh(server.id)" class="action-btn" :class="{ active: getMonitorAutoRefresh(server.id) }" title="自动刷新">
                {{ getMonitorAutoRefresh(server.id) ? '⏸ 暂停' : '▶ 自动' }}
              </button>
              <button @click="refreshMonitor(server.id)" class="action-btn" title="刷新">🔄</button>
            </div>
          </div>
          <MonitorTab :server="server" :auto-refresh="getMonitorAutoRefresh(server.id)" :tab="null" />
        </div>

        <!-- 水平分割器 -->
        <div
          class="resizer horizontal-resizer"
          @mousedown="startResize('horizontal', $event, server.id)"
        ></div>

        <!-- 下方区域：文件管理、终端和AI对话 -->
        <div class="bottom-section" :style="{ height: `calc(100% - ${getServerHeight(server.id)}px - 4px)` }">
          <!-- 文件管理器（左侧） -->
          <div class="filemanager-section" :style="{ width: getServerWidth(server.id) + 'px' }">
            <div class="section-header">
              <h3>📁 文件管理</h3>
              <button @click="refreshFileManager(server.id)" class="action-btn" title="刷新">🔄</button>
            </div>
            <FileManagerTab :server="server" :tab="null" />
          </div>

          <!-- 垂直分割器1 -->
          <div
            class="resizer vertical-resizer"
            @mousedown="startResize('vertical', $event, server.id)"
          ></div>

          <!-- 中间区域：终端 -->
          <div class="middle-section" :style="{ width: getAIChatCollapsed(server.id) ? `calc(100% - ${getServerWidth(server.id)}px - 4px)` : `calc(100% - ${getServerWidth(server.id)}px - ${getAIChatWidth(server.id)}px - 8px)` }">
            <!-- 终端 -->
            <div class="terminal-section">
              <div class="section-header">
                <h3>💻 终端</h3>
                <div class="section-actions">
                  <button @click="clearTerminal(server.id)" class="action-btn" title="清屏">清屏</button>
                  <button @click="reconnectTerminal(server.id)" class="action-btn" title="重连">重连</button>
                </div>
              </div>
              <TerminalTab :server="server" :tab="null" :ref="el => setTerminalRef(server.id, el)" />
            </div>
          </div>

          <!-- 垂直分割器2（AI对话区域左侧） -->
          <div
            v-if="!getAIChatCollapsed(server.id)"
            class="resizer vertical-resizer"
            @mousedown="startResize('vertical2', $event, server.id)"
          ></div>

          <!-- AI对话（右侧） -->
          <div v-if="!getAIChatCollapsed(server.id)" class="ai-chat-section" :style="{ width: getAIChatWidth(server.id) + 'px' }">
            <div class="section-header">
              <h3>🤖 AI助手</h3>
              <button @click="toggleAIChat(server.id)" class="action-btn" title="折叠/展开">−</button>
            </div>
            <AIChatTab :server="server" :tab="null" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">🖥️</div>
        <h3>欢迎使用 MySSH</h3>
        <p>请从左侧添加并连接服务器以打开工作区</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import TerminalTab from './TerminalTab.vue'
import FileManagerTab from './FileManagerTab.vue'
import MonitorTab from './MonitorTab.vue'
import AIChatTab from './AIChatTab.vue'

const store = useServerStore()

// 当前活动的服务器ID - 与 store 同步
const activeServerId = computed({
  get: () => store.activeServerId,
  set: (value) => {
    store.activeServerId = value
  }
})

// 已连接的服务器列表
const connectedServers = computed(() => {
  return store.servers.filter(s => s.connected)
})

// 当前活动的服务器
const activeServer = computed(() => {
  if (!activeServerId.value) return null
  return store.servers.find(s => s.id === activeServerId.value)
})

// 每个服务器的尺寸配置
const serverSizes = ref({}) // { serverId: { height: number, width: number, aiChatWidth: number, aiChatCollapsed: boolean } }

// 每个服务器的监控自动刷新状态
const serverMonitorAutoRefresh = ref({}) // { serverId: boolean }

// 每个服务器的终端引用
const terminalRefs = ref({}) // { serverId: TerminalTab }

// 区域尺寸 - 根据窗口大小计算默认比例
const getDefaultMonitorHeight = () => {
  // 默认监控区域占窗口高度的 25%，最小 200px，最大 400px
  const windowHeight = window.innerHeight
  const defaultHeight = Math.max(200, Math.min(400, windowHeight * 0.25))
  return Math.round(defaultHeight)
}

const getDefaultFilemanagerWidth = () => {
  // 默认文件管理器占窗口宽度的 30%，最小 300px，最大 500px
  const windowWidth = window.innerWidth
  const defaultWidth = Math.max(300, Math.min(500, windowWidth * 0.3))
  return Math.round(defaultWidth)
}

// 获取服务器的监控区域高度
function getServerHeight(serverId) {
  if (!serverSizes.value[serverId]) {
    serverSizes.value[serverId] = {
      height: getDefaultMonitorHeight(),
      width: getDefaultFilemanagerWidth()
    }
  }
  return serverSizes.value[serverId].height
}

// 获取服务器的文件管理器宽度
function getServerWidth(serverId) {
  if (!serverSizes.value[serverId]) {
    serverSizes.value[serverId] = {
      height: getDefaultMonitorHeight(),
      width: getDefaultFilemanagerWidth(),
      aiChatWidth: 350,
      aiChatCollapsed: false
    }
  }
  return serverSizes.value[serverId].width
}

// 获取AI对话区域宽度
function getAIChatWidth(serverId) {
  if (!serverSizes.value[serverId]) {
    serverSizes.value[serverId] = {
      height: getDefaultMonitorHeight(),
      width: getDefaultFilemanagerWidth(),
      aiChatWidth: 350,
      aiChatCollapsed: false
    }
  }
  const config = serverSizes.value[serverId]
  return config.aiChatWidth || 350
}

// 获取AI对话区域折叠状态
function getAIChatCollapsed(serverId) {
  if (!serverSizes.value[serverId]) {
    serverSizes.value[serverId] = {
      height: getDefaultMonitorHeight(),
      width: getDefaultFilemanagerWidth(),
      aiChatWidth: 350,
      aiChatCollapsed: false
    }
  }
  return serverSizes.value[serverId].aiChatCollapsed || false
}

// 切换AI对话区域折叠状态
function toggleAIChat(serverId) {
  if (!serverSizes.value[serverId]) {
    serverSizes.value[serverId] = {
      height: getDefaultMonitorHeight(),
      width: getDefaultFilemanagerWidth(),
      aiChatWidth: 350,
      aiChatCollapsed: false
    }
  }
  const config = serverSizes.value[serverId]
  config.aiChatCollapsed = !config.aiChatCollapsed
  if (!config.aiChatCollapsed && !config.aiChatWidth) {
    config.aiChatWidth = 350
  }
  saveServerSizes()
}

// 获取服务器的监控自动刷新状态
function getMonitorAutoRefresh(serverId) {
  if (serverMonitorAutoRefresh.value[serverId] === undefined) {
    serverMonitorAutoRefresh.value[serverId] = true
  }
  return serverMonitorAutoRefresh.value[serverId]
}

// 设置终端引用
function setTerminalRef(serverId, el) {
  if (el) {
    terminalRefs.value[serverId] = el
  }
}

// 拖动状态
const isResizing = ref(false)
const resizeType = ref(null) // 'horizontal' | 'vertical'
const currentResizeServerId = ref(null)
const startX = ref(0)
const startY = ref(0)
const startMonitorHeight = ref(0)
const startFilemanagerWidth = ref(0)
const startAIChatWidth = ref(0)

// 监听服务器连接状态
watch(() => store.servers, (servers) => {
  const connected = servers.filter(s => s.connected)
  if (connected.length > 0) {
    // 如果有连接的服务器，且当前没有活动服务器或活动服务器未连接，自动选择第一个已连接的
    if (!activeServerId.value || !connected.find(s => s.id === activeServerId.value)) {
      const firstConnected = connected[0]
      if (firstConnected) {
        store.activeServerId = firstConnected.id
        // 初始化服务器尺寸
        if (!serverSizes.value[firstConnected.id]) {
          serverSizes.value[firstConnected.id] = {
            height: getDefaultMonitorHeight(),
            width: getDefaultFilemanagerWidth(),
            aiChatWidth: 350,
            aiChatCollapsed: false
          }
        }
        // 初始化监控自动刷新
        if (serverMonitorAutoRefresh.value[firstConnected.id] === undefined) {
          serverMonitorAutoRefresh.value[firstConnected.id] = true
        }
      }
    }
  } else {
    store.activeServerId = null
  }
}, { deep: true })

// 监听 store 的 activeServerId 变化，确保同步
watch(() => store.activeServerId, (newId) => {
  if (newId) {
    // 初始化服务器尺寸（如果还没有）
    if (!serverSizes.value[newId]) {
      serverSizes.value[newId] = {
        height: getDefaultMonitorHeight(),
        width: getDefaultFilemanagerWidth(),
        aiChatWidth: 350,
        aiChatCollapsed: false
      }
    }
    // 初始化监控自动刷新（如果还没有）
    if (serverMonitorAutoRefresh.value[newId] === undefined) {
      serverMonitorAutoRefresh.value[newId] = true
    }
  }
})

// 选择服务器（点击标签页时）
function selectServer(serverId) {
  store.activeServerId = serverId
  // 初始化服务器尺寸（如果还没有）
  if (!serverSizes.value[serverId]) {
    serverSizes.value[serverId] = {
      height: getDefaultMonitorHeight(),
      width: getDefaultFilemanagerWidth(),
      aiChatWidth: 350,
      aiChatCollapsed: false
    }
  }
  // 初始化监控自动刷新（如果还没有）
  if (serverMonitorAutoRefresh.value[serverId] === undefined) {
    serverMonitorAutoRefresh.value[serverId] = true
  }
}

// 关闭服务器标签页
function closeServerTab(serverId) {
  // 断开服务器连接
  store.disconnectServer(serverId)
  // 如果关闭的是当前活动的服务器，切换到其他服务器
  if (activeServerId.value === serverId) {
    const remaining = connectedServers.value.filter(s => s.id !== serverId)
    if (remaining.length > 0) {
      store.activeServerId = remaining[0].id
    } else {
      store.activeServerId = null
    }
  }
}

function startResize(type, event, serverId) {
  if (!serverId) return
  
  isResizing.value = true
  resizeType.value = type
  currentResizeServerId.value = serverId
  startX.value = event.clientX
  startY.value = event.clientY
  
  const sizes = serverSizes.value[serverId] || {
    height: getDefaultMonitorHeight(),
    width: getDefaultFilemanagerWidth(),
    aiChatWidth: 350,
    aiChatCollapsed: false
  }
  startMonitorHeight.value = sizes.height
  startFilemanagerWidth.value = sizes.width
  startAIChatWidth.value = sizes.aiChatWidth || 350
  
  event.preventDefault()
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(event) {
  if (!isResizing.value || !currentResizeServerId.value) return

  const serverId = currentResizeServerId.value
  
  if (!serverSizes.value[serverId]) {
    serverSizes.value[serverId] = {
      height: getDefaultMonitorHeight(),
      width: getDefaultFilemanagerWidth(),
      aiChatWidth: 350,
      aiChatCollapsed: false
    }
  }

  if (resizeType.value === 'horizontal') {
    // 调整监控区域高度
    const deltaY = event.clientY - startY.value
    const newHeight = startMonitorHeight.value + deltaY
    const minHeight = 200
    const maxHeight = window.innerHeight * 0.6
    serverSizes.value[serverId].height = Math.max(minHeight, Math.min(maxHeight, newHeight))
  } else if (resizeType.value === 'vertical') {
    // 调整文件管理器宽度
    const deltaX = event.clientX - startX.value
    const newWidth = startFilemanagerWidth.value + deltaX
    const minWidth = 250
    const maxWidth = window.innerWidth * 0.6
    serverSizes.value[serverId].width = Math.max(minWidth, Math.min(maxWidth, newWidth))
  } else if (resizeType.value === 'vertical2') {
    // 调整AI对话区域宽度（从左侧拖动，向右缩小，向左扩大）
    const deltaX = startX.value - event.clientX
    const newWidth = startAIChatWidth.value + deltaX
    const minWidth = 250
    const maxWidth = window.innerWidth * 0.5
    serverSizes.value[serverId].aiChatWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
  }
}

function stopResize() {
  isResizing.value = false
  resizeType.value = null
  currentResizeServerId.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  // 保存所有服务器的尺寸
  saveServerSizes()
}

// 保存服务器尺寸到 localStorage
function saveServerSizes() {
  localStorage.setItem('serverSizes', JSON.stringify(serverSizes.value))
  localStorage.setItem('serverMonitorAutoRefresh', JSON.stringify(serverMonitorAutoRefresh.value))
}

// 从 localStorage 加载服务器尺寸
function loadServerSizes() {
  const savedSizes = localStorage.getItem('serverSizes')
  const savedAutoRefresh = localStorage.getItem('serverMonitorAutoRefresh')
  
  if (savedSizes) {
    try {
      serverSizes.value = JSON.parse(savedSizes)
    } catch (e) {
      console.error('Failed to parse server sizes:', e)
    }
  }
  
  if (savedAutoRefresh) {
    try {
      serverMonitorAutoRefresh.value = JSON.parse(savedAutoRefresh)
    } catch (e) {
      console.error('Failed to parse monitor auto refresh:', e)
    }
  }
}

// 窗口大小变化处理函数
let resizeHandler = null

onMounted(() => {
  // 从 localStorage 恢复尺寸
  loadServerSizes()
  
  // 监听窗口大小变化
  resizeHandler = () => {
    // 窗口大小变化时，可以调整默认值（如果需要）
  }
  
  window.addEventListener('resize', resizeHandler)
  
  // 监听服务器连接，自动打开工作区
  watch(() => store.servers, (servers) => {
    const connected = servers.filter(s => s.connected)
    if (connected.length > 0 && !activeServerId.value) {
      activeServerId.value = connected[0].id
    }
  }, { immediate: true, deep: true })
})

onUnmounted(() => {
  // 保存所有配置
  saveServerSizes()
  
  // 移除窗口大小监听
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  
  stopResize()
})

function toggleMonitorAutoRefresh(serverId) {
  if (!serverId) return
  serverMonitorAutoRefresh.value[serverId] = !getMonitorAutoRefresh(serverId)
  saveServerSizes()
}

function refreshMonitor(serverId) {
  // MonitorTab 组件内部会处理刷新
}

function refreshFileManager(serverId) {
  // FileManagerTab 组件内部会处理刷新
}

function clearTerminal(serverId) {
  if (terminalRefs.value[serverId]) {
    terminalRefs.value[serverId].clearTerminal()
  }
}

function reconnectTerminal(serverId) {
  if (terminalRefs.value[serverId]) {
    terminalRefs.value[serverId].reconnect()
  }
}
</script>

<style scoped>
.workspace-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.workspace-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 系统监控区域（顶部，可调整高度） */
.monitor-section {
  min-height: 200px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  overflow: hidden;
  flex-shrink: 0;
}

/* 分割器 */
.resizer {
  background: var(--border-color);
  flex-shrink: 0;
  z-index: 10;
  transition: background 0.2s;
}

.resizer:hover {
  background: var(--accent-color);
}

.horizontal-resizer {
  height: 4px;
  width: 100%;
  cursor: row-resize;
  user-select: none;
}

.vertical-resizer {
  width: 4px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
}

/* 拖动时的样式 */
.workspace-container.resizing {
  user-select: none;
}

.workspace-container.resizing .resizer {
  background: var(--accent-color);
}

/* 下方区域（文件管理 + 终端） */
.bottom-section {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  margin-top: 0;
}

/* 文件管理器（左侧，可调整宽度） */
.filemanager-section {
  min-width: 250px;
  max-width: 60vw;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
  flex-shrink: 0;
}

/* 中间区域（终端） */
.middle-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 终端 */
.terminal-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
  min-width: 0;
}

/* AI对话（右侧） */
.ai-chat-section {
  min-width: 250px;
  max-width: 50vw;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
  flex-shrink: 0;
}

/* AI对话折叠状态 */
.ai-chat-collapsed {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  flex-shrink: 0;
}

.expand-btn {
  width: 100%;
  height: 100%;
  padding: 8px;
  font-size: 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background: var(--bg-hover);
}

/* 区域标题栏 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.section-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  font-size: 11px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.action-btn.active {
  background: var(--accent-color);
  color: white;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.empty-content {
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-content h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-content p {
  font-size: 14px;
}

/* 服务器标签页 */
.server-tabs-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.server-tabs-header {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 8px;
  overflow-x: auto;
  min-height: 36px;
  flex-shrink: 0;
}

.server-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: background 0.2s;
  min-width: 120px;
}

.server-tab:hover {
  background: var(--bg-hover);
}

.server-tab.active {
  background: var(--bg-primary);
  border-bottom: 2px solid var(--accent-color);
}

.server-tab-icon {
  font-size: 14px;
}

.server-tab-name {
  font-size: 12px;
  flex: 1;
}

.server-tab-status {
  font-size: 10px;
  color: var(--text-disabled);
}

.server-tab-status.connected {
  color: var(--success-color);
}

.server-tab-close {
  margin-left: 4px;
  width: 16px;
  height: 16px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
  border-radius: 3px;
}

.server-tab-close:hover {
  opacity: 1;
  background: var(--error-color);
  color: white;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .filemanager-section {
    min-width: 200px;
  }
}

@media (max-width: 900px) {
  .bottom-section {
    flex-direction: column;
  }
  
  .filemanager-section {
    width: 100% !important;
    height: 40%;
    min-width: unset;
    max-width: unset;
  }
  
  .terminal-section {
    width: 100% !important;
    height: 60%;
  }
  
  .vertical-resizer {
    display: none;
  }
  
  .monitor-section {
    min-height: 180px;
  }
}
</style>
