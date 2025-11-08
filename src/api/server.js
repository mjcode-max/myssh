/**
 * 服务器配置 CRUD 相关 API
 */

import { invoke } from '@tauri-apps/api/tauri'

/**
 * 获取所有服务器配置
 * @returns {Promise<Array<{id: string, name: string, host: string, port: number, username: string, password?: string, keyPath?: string}>>}
 */
export async function getServers() {
  try {
    const result = await invoke('get_servers')
    // 后端返回格式: { servers: [...] }
    // 将后端的 key_path 转换为前端的 keyPath
    if (result && result.servers && Array.isArray(result.servers)) {
      return result.servers.map(server => ({
        ...server,
        keyPath: server.key_path,
        key_path: undefined
      }))
    }
    return []
  } catch (error) {
    console.error('获取服务器列表失败:', error)
    throw new Error(error.message || '获取服务器列表失败')
  }
}

/**
 * 保存服务器配置
 * @param {Object} server - 服务器配置
 * @param {string} server.id - 服务器ID
 * @param {string} server.name - 服务器名称
 * @param {string} server.host - 主机地址
 * @param {number} server.port - 端口
 * @param {string} server.username - 用户名
 * @param {string} [server.password] - 密码（可选）
 * @param {string} [server.keyPath] - 密钥路径（可选）
 * @returns {Promise<{success: boolean, id: string}>}
 */
export async function saveServer(server) {
  console.log("add server:", server)
  try {
    const result = await invoke('save_server', {
      params:{
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password || null,
        key_path: server.keyPath || null
      }
    })
    return result
  } catch (error) {
    console.error('保存服务器配置失败:', error)
    throw new Error(error.message || '保存服务器配置失败')
  }
}

/**
 * 更新服务器配置
 * @param {Object} server - 服务器配置
 * @param {string} server.id - 服务器ID
 * @param {string} [server.name] - 服务器名称
 * @param {string} [server.host] - 主机地址
 * @param {number} [server.port] - 端口
 * @param {string} [server.username] - 用户名
 * @param {string} [server.password] - 密码（可选）
 * @param {string} [server.keyPath] - 密钥路径（可选）
 * @returns {Promise<{success: boolean}>}
 */
export async function updateServer(server) {
  try {
    const result = await invoke('update_server', {
      params: {
        id: server.id,
        name: server.name || null,
        host: server.host || null,
        port: server.port || null,
        username: server.username || null,
        password: server.password || null,
        key_path: server.keyPath || null
      }
    })
    return result
  } catch (error) {
    console.error('更新服务器配置失败:', error)
    throw new Error(error.message || '更新服务器配置失败')
  }
}

/**
 * 删除服务器配置
 * @param {string} serverId - 服务器ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteServer(serverId) {
  try {
    const result = await invoke('delete_server', {
      params: {
        server_id: serverId
      }
    })
    return result
  } catch (error) {
    console.error('删除服务器配置失败:', error)
    throw new Error(error.message || '删除服务器配置失败')
  }
}

/**
 * 获取单个服务器配置
 * @param {string} serverId - 服务器ID
 * @returns {Promise<{id: string, name: string, host: string, port: number, username: string, password?: string, keyPath?: string}>}
 */
export async function getServer(serverId) {
  try {
    const result = await invoke('get_server', {
      params: {
        server_id: serverId
      }
    })
    // 后端返回格式: { server: {...} }
    if (result && result.server) {
      return {
        ...result.server,
        keyPath: result.server.key_path,
        key_path: undefined
      }
    }
    return null
  } catch (error) {
    console.error('获取服务器配置失败:', error)
    throw new Error(error.message || '获取服务器配置失败')
  }
}

