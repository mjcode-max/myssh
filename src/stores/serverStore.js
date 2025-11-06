import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useServerStore = defineStore('server', () => {
  const servers = ref([])
  const activeServerId = ref(null)
  const activeTabId = ref(null)

  // 添加服务器
  function addServer(server) {
    const newServer = {
      id: Date.now().toString(),
      name: server.name || `${server.host}:${server.port}`,
      host: server.host,
      port: server.port || 22,
      username: server.username,
      password: server.password,
      keyPath: server.keyPath,
      connected: false,
      tabs: []
    }
    servers.value.push(newServer)
    return newServer.id
  }

  // 删除服务器
  function removeServer(serverId) {
    const index = servers.value.findIndex(s => s.id === serverId)
    if (index > -1) {
      servers.value.splice(index, 1)
      if (activeServerId.value === serverId) {
        activeServerId.value = null
      }
    }
  }

  // 连接服务器
  async function connectServer(serverId) {
    const server = servers.value.find(s => s.id === serverId)
    if (server) {
      // TODO: 调用 Tauri 连接逻辑
      server.connected = true
      activeServerId.value = serverId
    }
  }

  // 断开服务器
  async function disconnectServer(serverId) {
    const server = servers.value.find(s => s.id === serverId)
    if (server) {
      // TODO: 调用 Tauri 断开逻辑
      server.connected = false
      // 清理所有标签页
      server.tabs = []
      if (activeServerId.value === serverId) {
        activeServerId.value = null
        activeTabId.value = null
      }
    }
  }

  // 添加标签页
  function addTab(serverId, tabType = 'terminal', tabData = {}) {
    const server = servers.value.find(s => s.id === serverId)
    if (server) {
      const tabTitles = {
        'terminal': '终端',
        'filemanager': '文件管理',
        'monitor': '系统监控'
      }
      const tab = {
        id: `${serverId}-${Date.now()}`,
        type: tabType, // 'terminal' | 'filemanager' | 'monitor'
        title: tabTitles[tabType] || '未知',
        data: tabData
      }
      server.tabs.push(tab)
      activeTabId.value = tab.id
      return tab.id
    }
  }

  // 关闭标签页
  function closeTab(serverId, tabId) {
    const server = servers.value.find(s => s.id === serverId)
    if (server) {
      const index = server.tabs.findIndex(t => t.id === tabId)
      if (index > -1) {
        server.tabs.splice(index, 1)
        if (activeTabId.value === tabId) {
          activeTabId.value = server.tabs.length > 0 ? server.tabs[server.tabs.length - 1].id : null
        }
      }
    }
  }

  return {
    servers,
    activeServerId,
    activeTabId,
    addServer,
    removeServer,
    connectServer,
    disconnectServer,
    addTab,
    closeTab
  }
})

