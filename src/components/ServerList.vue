<template>
  <div class="server-list">
    <div class="server-list-header">
      <h3>服务器列表</h3>
      <button class="add-btn" @click="showAddDialog = true" title="添加服务器">
        <span class="icon">+</span>
      </button>
    </div>
    
    <div class="server-items">
      <div
        v-for="server in servers"
        :key="server.id"
        :class="['server-item', { active: activeServerId === server.id, connected: server.connected }]"
        @click="selectServer(server.id)"
      >
        <div class="server-info">
          <div class="server-status">
            <span :class="['status-dot', server.connected ? 'connected' : 'disconnected']"></span>
          </div>
          <div class="server-details">
            <div class="server-name">{{ server.name }}</div>
            <div class="server-address">{{ server.host }}:{{ server.port }}</div>
          </div>
        </div>
        <div class="server-actions">
          <button
            v-if="!server.connected"
            @click.stop="handleConnect(server.id)"
            class="action-btn"
            title="连接"
          >
            ▶
          </button>
          <button
            v-else
            @click.stop="handleDisconnect(server.id)"
            class="action-btn"
            title="断开"
          >
            ⏸
          </button>
          <button
            @click.stop="handleDelete(server.id)"
            class="action-btn delete"
            title="删除"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- 添加服务器对话框 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click.self="showAddDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>添加服务器</h3>
          <button @click="showAddDialog = false" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>服务器名称</label>
            <input v-model="newServer.name" type="text" placeholder="例如: 生产服务器" />
          </div>
          <div class="form-group">
            <label>主机地址</label>
            <input v-model="newServer.host" type="text" placeholder="192.168.1.100" />
          </div>
          <div class="form-group">
            <label>端口</label>
            <input v-model.number="newServer.port" type="number" placeholder="22" />
          </div>
          <div class="form-group">
            <label>用户名</label>
            <input v-model="newServer.username" type="text" placeholder="root" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="newServer.password" type="password" placeholder="密码或密钥路径" />
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="showAddDialog = false">取消</button>
          <button @click="handleAddServer" class="primary">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useServerStore } from '@/stores/serverStore'

const store = useServerStore()
const servers = computed(() => store.servers)
const activeServerId = computed(() => store.activeServerId)
const showAddDialog = ref(false)

const newServer = ref({
  name: '',
  host: '',
  port: 22,
  username: '',
  password: ''
})

function selectServer(serverId) {
  store.activeServerId = serverId
  const server = store.servers.find(s => s.id === serverId)
  // 如果服务器已连接，确保工作区切换到该服务器
  if (server && server.connected) {
    // 触发工作区切换（通过 store 的 activeServerId）
    // WorkspaceTabs 会监听这个变化
  }
}

async function handleConnect(serverId) {
  await store.connectServer(serverId)
  // 连接成功后，工作区会自动显示该服务器的工作区
  // 不需要手动创建标签页，因为工作区会显示所有连接的服务器
}

async function handleDisconnect(serverId) {
  await store.disconnectServer(serverId)
}

function handleDelete(serverId) {
  if (confirm('确定要删除这个服务器吗？')) {
    store.removeServer(serverId)
  }
}

function handleAddServer() {
  if (!newServer.value.host || !newServer.value.username) {
    alert('请填写主机地址和用户名')
    return
  }
  store.addServer(newServer.value)
  // 重置表单
  newServer.value = {
    name: '',
    host: '',
    port: 22,
    username: '',
    password: ''
  }
  showAddDialog.value = false
}
</script>

<style scoped>
.server-list {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.server-list-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-list-header h3 {
  font-size: 14px;
  font-weight: 600;
}

.add-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 18px;
  line-height: 1;
}

.server-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.server-item {
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-item:hover {
  background: var(--bg-hover);
}

.server-item.active {
  background: var(--bg-active);
}

.server-item.connected .server-name {
  color: var(--success-color);
}

.server-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.server-status {
  margin-right: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.connected {
  background: var(--success-color);
  box-shadow: 0 0 4px var(--success-color);
}

.status-dot.disconnected {
  background: var(--text-disabled);
}

.server-details {
  flex: 1;
  min-width: 0;
}

.server-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-address {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.server-item:hover .server-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.delete:hover {
  background: var(--error-color);
  color: white;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
}

.dialog-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
}

.dialog-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-footer button.primary {
  background: var(--accent-color);
  color: white;
}

.dialog-footer button.primary:hover {
  background: var(--accent-hover);
}
</style>

