import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'
import { connectSshServer, disconnectSshServer } from '@/api/ssh'
import { saveServer, deleteServer, getServers } from '@/api/server'

export const useServerStore = defineStore('server', () => {
  const servers = ref([])
  const activeServerId = ref(null)
  const activeTabId = ref(null)

  // 初始化：从后端加载服务器列表
  async function loadServers() {
    try {
      const result = await getServers()
      // 将后端返回的服务器配置转换为前端格式
      servers.value = result.map(server => ({
        ...server,
        connected: false,
        tabs: []
      }))
    } catch (error) {
      console.error('加载服务器列表失败:', error)
    }
  }

  // 添加服务器
  async function addServer(server) {
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
    
    try {
      // 保存到后端
      await saveServer(newServer)
      servers.value.push(newServer)
      return newServer.id
    } catch (error) {
      console.error('保存服务器配置失败:', error)
      throw error
    }
  }

  // 删除服务器
  async function removeServer(serverId) {
    const index = servers.value.findIndex(s => s.id === serverId)
    if (index > -1) {
      try {
        // 如果已连接，先断开连接
        const server = servers.value[index]
        if (server.connected) {
          await disconnectServer(serverId)
        }
        
        // 从后端删除
        await deleteServer(serverId)
        
        // 从列表中删除
        servers.value.splice(index, 1)
        if (activeServerId.value === serverId) {
          activeServerId.value = null
        }
      } catch (error) {
        console.error('删除服务器失败:', error)
        throw error
      }
    }
  }

  // 连接服务器
  async function connectServer(serverId) {
    const server = servers.value.find(s => s.id === serverId)
    if (server) {
      try {
        // 调用 Tauri API 连接服务器
        await connectSshServer({
          serverId: server.id,
          host: server.host,
          port: server.port,
          username: server.username,
          password: server.password,
          keyPath: server.keyPath
        })
        
        server.connected = true
        activeServerId.value = serverId
      } catch (error) {
        console.error('连接服务器失败:', error)
        throw error
      }
    }
  }

  // 断开服务器
  async function disconnectServer(serverId) {
    const server = servers.value.find(s => s.id === serverId)
    if (server) {
      try {
        // 调用 Tauri API 断开连接
        await disconnectSshServer(serverId)
        
        server.connected = false
        // 清理所有标签页
        server.tabs = []
        if (activeServerId.value === serverId) {
          activeServerId.value = null
          activeTabId.value = null
        }
      } catch (error) {
        console.error('断开服务器失败:', error)
        throw error
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
    loadServers,
    addServer,
    removeServer,
    connectServer,
    disconnectServer,
    addTab,
    closeTab
  }
})

