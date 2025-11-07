/**
 * AI 助手相关 API
 */

import { invoke } from '@tauri-apps/api/tauri'

/**
 * 与 AI 对话
 * @param {Object} params - 对话参数
 * @param {string} params.serverId - 服务器ID
 * @param {string} params.question - 用户问题
 * @param {Array<{role: 'user'|'assistant', content: string, timestamp?: number}>} [params.history] - 对话历史（可选）
 * @returns {Promise<{content: string, timestamp: number}>}
 */
export async function chatWithAi(params) {
  try {
    const result = await invoke('chat_with_ai', {
      serverId: params.serverId,
      question: params.question,
      history: params.history || []
    })
    return result
  } catch (error) {
    console.error('AI对话失败:', error)
    throw new Error(error.message || 'AI对话失败')
  }
}

/**
 * 获取 AI 快速操作建议
 * @param {string} serverId - 服务器ID
 * @returns {Promise<Array<{id: string, title: string, description: string, action: string}>>}
 */
export async function getAiQuickActions(serverId) {
  try {
    const result = await invoke('get_ai_quick_actions', {
      serverId: serverId
    })
    return result
  } catch (error) {
    console.error('获取AI快速操作失败:', error)
    throw new Error(error.message || '获取AI快速操作失败')
  }
}

