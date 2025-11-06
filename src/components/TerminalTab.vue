<template>
  <div class="terminal-tab">
    <div class="terminal-container" ref="terminalContainer">
      <div class="terminal-output" ref="terminalOutput">
        <div
          v-for="(line, index) in outputLines"
          :key="index"
          class="terminal-line"
        >
          <span class="line-prompt" v-if="line.type === 'input'">{{ line.prompt }}</span>
          <span :class="['line-content', line.type]">{{ line.content }}</span>
        </div>
        <div v-if="server.connected" class="terminal-line">
          <span class="line-prompt">{{ currentPrompt }}</span>
          <input
            v-model="currentInput"
            @keydown.enter="handleCommand"
            @keydown.up="handleHistoryUp"
            @keydown.down="handleHistoryDown"
            class="terminal-input"
            ref="terminalInput"
            autofocus
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  tab: Object,
  server: Object
})

const terminalContainer = ref(null)
const terminalOutput = ref(null)
const terminalInput = ref(null)

const outputLines = ref([
  { type: 'output', content: '欢迎使用 MySSH 终端', prompt: '' }
])

const currentInput = ref('')
const currentPrompt = ref('$ ')
const commandHistory = ref([])
const historyIndex = ref(-1)

watch(() => props.server.connected, (connected) => {
  if (connected) {
    outputLines.value.push({
      type: 'output',
      content: `已连接到 ${props.server.host}:${props.server.port}`,
      prompt: ''
    })
    scrollToBottom()
  }
})

onMounted(() => {
  if (props.server.connected) {
    nextTick(() => {
      terminalInput.value?.focus()
    })
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (terminalOutput.value) {
      terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight
    }
  })
}

async function handleCommand() {
  const command = currentInput.value.trim()
  if (!command) {
    outputLines.value.push({
      type: 'input',
      prompt: currentPrompt.value,
      content: ''
    })
    currentInput.value = ''
    scrollToBottom()
    return
  }

  // 添加到历史记录
  commandHistory.value.push(command)
  historyIndex.value = commandHistory.value.length

  // 显示输入的命令
  outputLines.value.push({
    type: 'input',
    prompt: currentPrompt.value,
    content: command
  })

  currentInput.value = ''

  // TODO: 调用 Tauri 执行命令
  // 这里先模拟输出
  await executeCommand(command)
  
  scrollToBottom()
}

async function executeCommand(command) {
  // TODO: 调用 Tauri 执行 SSH 命令
  // 模拟命令执行
  const mockOutput = `执行命令: ${command}\n[这是模拟输出，实际将调用 Tauri 执行 SSH 命令]`
  
  outputLines.value.push({
    type: 'output',
    content: mockOutput,
    prompt: ''
  })
}

function handleHistoryUp() {
  if (commandHistory.value.length === 0) return
  if (historyIndex.value > 0) {
    historyIndex.value--
    currentInput.value = commandHistory.value[historyIndex.value]
  }
}

function handleHistoryDown() {
  if (historyIndex.value < commandHistory.value.length - 1) {
    historyIndex.value++
    currentInput.value = commandHistory.value[historyIndex.value]
  } else {
    historyIndex.value = commandHistory.value.length
    currentInput.value = ''
  }
}

function handleClear() {
  outputLines.value = []
}

async function handleReconnect() {
  // TODO: 调用 Tauri 重连逻辑
  alert('重连功能待实现')
}

// 暴露方法供父组件调用
defineExpose({
  clearTerminal: handleClear,
  reconnect: handleReconnect
})
</script>

<style scoped>
.terminal-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  overflow: hidden;
}

.terminal-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.terminal-output {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.terminal-line {
  display: flex;
  margin-bottom: 2px;
  word-break: break-all;
}

.line-prompt {
  color: var(--accent-color);
  margin-right: 4px;
  user-select: none;
}

.line-content {
  flex: 1;
}

.line-content.input {
  color: var(--text-primary);
}

.line-content.output {
  color: var(--text-primary);
}

.line-content.error {
  color: var(--error-color);
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  margin: 0;
}
</style>

