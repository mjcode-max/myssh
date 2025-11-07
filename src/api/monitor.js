/**
 * 系统监控相关 API
 */

import { invoke } from '@tauri-apps/api/tauri'

/**
 * 获取系统监控数据
 * @param {string} serverId - 服务器ID
 * @returns {Promise<{
 *   cpu: {
 *     usage: number,
 *     cores: number,
 *     frequency: number,
 *     loadAverage: string,
 *     coresUsage: number[]
 *   },
 *   memory: {
 *     total: number,
 *     used: number,
 *     cached?: number,
 *     available: number
 *   },
 *   disk: Array<{
 *     mount: string,
 *     filesystem: string,
 *     total: number,
 *     used: number,
 *     available: number,
 *     usage: number
 *   }>,
 *   network: {
 *     download: number,
 *     upload: number,
 *     downloadTotal: number,
 *     uploadTotal: number
 *   }
 * }>}
 */
export async function getSystemMonitor(serverId) {
  try {
    const result = await invoke('get_system_monitor', {
      serverId: serverId
    })
    return result
  } catch (error) {
    console.error('获取系统监控数据失败:', error)
    throw new Error(error.message || '获取监控数据失败')
  }
}

