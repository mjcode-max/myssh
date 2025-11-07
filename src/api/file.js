/**
 * 文件管理相关 API
 */

import { invoke } from '@tauri-apps/api/tauri'

/**
 * 获取远程目录文件列表
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string} params.path - 远程路径，如 "/home/user"
 * @returns {Promise<{files: Array<{name: string, type: 'file'|'directory', size: number, modified: string, path: string}>}>}
 */
export async function listRemoteDirectory(params) {
  try {
    const result = await invoke('list_remote_directory', {
      serverId: params.serverId,
      path: params.path
    })
    return result
  } catch (error) {
    console.error('获取远程目录列表失败:', error)
    throw new Error(error.message || '获取文件列表失败')
  }
}

/**
 * 上传文件到远程服务器
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string} params.localPath - 本地文件路径
 * @param {string} params.remotePath - 远程保存路径（目录）
 * @returns {Promise<{success: boolean}>}
 */
export async function uploadFile(params) {
  try {
    const result = await invoke('upload_file', {
      serverId: params.serverId,
      localPath: params.localPath,
      remotePath: params.remotePath
    })
    return result
  } catch (error) {
    console.error('上传文件失败:', error)
    throw new Error(error.message || '上传文件失败')
  }
}

/**
 * 批量上传文件到远程服务器
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string[]} params.localPaths - 本地文件路径数组
 * @param {string} params.remotePath - 远程保存路径（目录）
 * @returns {Promise<{success: boolean, count: number}>}
 */
export async function uploadFiles(params) {
  try {
    let successCount = 0
    let failCount = 0
    
    for (const localPath of params.localPaths) {
      try {
        await uploadFile({
          serverId: params.serverId,
          localPath: localPath,
          remotePath: params.remotePath
        })
        successCount++
      } catch (error) {
        console.error(`上传文件失败 ${localPath}:`, error)
        failCount++
      }
    }
    
    return {
      success: failCount === 0,
      count: successCount,
      failCount: failCount
    }
  } catch (error) {
    console.error('批量上传文件失败:', error)
    throw new Error(error.message || '批量上传文件失败')
  }
}

/**
 * 从远程服务器下载文件
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string} params.remotePath - 远程文件路径
 * @param {string} params.localPath - 本地保存路径（完整路径，包含文件名）
 * @returns {Promise<{success: boolean}>}
 */
export async function downloadFile(params) {
  try {
    const result = await invoke('download_file', {
      serverId: params.serverId,
      remotePath: params.remotePath,
      localPath: params.localPath
    })
    return result
  } catch (error) {
    console.error('下载文件失败:', error)
    throw new Error(error.message || '下载文件失败')
  }
}

/**
 * 创建远程目录
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string} params.path - 要创建的目录完整路径
 * @returns {Promise<{success: boolean}>}
 */
export async function createDirectory(params) {
  try {
    const result = await invoke('create_directory', {
      serverId: params.serverId,
      path: params.path
    })
    return result
  } catch (error) {
    console.error('创建目录失败:', error)
    throw new Error(error.message || '创建目录失败')
  }
}

/**
 * 删除远程文件/目录
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string[]} params.paths - 要删除的文件/目录路径数组
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteFiles(params) {
  try {
    const result = await invoke('delete_files', {
      serverId: params.serverId,
      paths: params.paths
    })
    return result
  } catch (error) {
    console.error('删除文件失败:', error)
    throw new Error(error.message || '删除文件失败')
  }
}

/**
 * 重命名远程文件/目录
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string} params.oldPath - 原路径
 * @param {string} params.newPath - 新路径
 * @returns {Promise<{success: boolean}>}
 */
export async function renameFile(params) {
  try {
    const result = await invoke('rename_file', {
      serverId: params.serverId,
      oldPath: params.oldPath,
      newPath: params.newPath
    })
    return result
  } catch (error) {
    console.error('重命名文件失败:', error)
    throw new Error(error.message || '重命名文件失败')
  }
}

/**
 * 修改文件权限
 * @param {Object} params - 参数
 * @param {string} params.serverId - 服务器ID
 * @param {string} params.path - 文件路径
 * @param {string} params.mode - 权限模式（如 "755", "644"）
 * @returns {Promise<{success: boolean}>}
 */
export async function changeFileMode(params) {
  try {
    const result = await invoke('change_file_mode', {
      serverId: params.serverId,
      path: params.path,
      mode: params.mode
    })
    return result
  } catch (error) {
    console.error('修改文件权限失败:', error)
    throw new Error(error.message || '修改文件权限失败')
  }
}

