<template>
  <div class="terminal-pane" :style="paneStyles">
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
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

const props = defineProps({
  server: Object,
  theme: String,
  fontSize: Number,
  fontFamily: String,
  isRecording: Boolean
})

const emit = defineEmits(['record'])

const terminalOutput = ref(null)
const terminalInput = ref(null)

const outputLines = ref([
  { type: 'output', content: '欢迎使用 MySSH 终端', prompt: '' }
])

const currentInput = ref('')
const currentPrompt = ref('$ ')
const commandHistory = ref([])
const historyIndex = ref(-1)

const paneStyles = computed(() => ({
  '--terminal-font-size': `${props.fontSize}px`,
  '--terminal-font-family': props.fontFamily
}))

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

  // 录制输入
  if (props.isRecording) {
    emit('record', { type: 'input', content: command })
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

  // 调用 Tauri 执行命令
  await executeCommand(command)
  
  scrollToBottom()
}

async function executeCommand(command) {
  try {
    // 调用 Tauri API 执行 SSH 命令
    const { executeSshCommand } = await import('@/api/ssh')
    const result = await executeSshCommand({
      serverId: props.server.id,
      command: command
    })
    
    // 录制输出
    if (props.isRecording) {
      emit('record', { type: 'output', content: result.output })
    }

    // 显示命令输出
    outputLines.value.push({
      type: 'output',
      content: result.output,
      prompt: ''
    })
  } catch (error) {
    outputLines.value.push({
      type: 'error',
      content: `错误: ${error.message}`,
      prompt: ''
    })
  }
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

function clear() {
  outputLines.value = []
}

// 暴露方法供父组件调用
defineExpose({
  clear
})
</script>

<style scoped>
.terminal-pane {
  height: 100%;
  width: 100%;
  background: var(--terminal-bg, var(--bg-primary));
  overflow: hidden;
}

.terminal-output {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
  font-family: var(--terminal-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
  font-size: var(--terminal-font-size, 13px);
  line-height: 1.6;
  color: var(--terminal-text, var(--text-primary));
}

.terminal-line {
  display: flex;
  margin-bottom: 2px;
  word-break: break-all;
}

.line-prompt {
  color: var(--terminal-prompt, var(--accent-color));
  margin-right: 4px;
  user-select: none;
}

.line-content {
  flex: 1;
}

.line-content.input {
  color: var(--terminal-text, var(--text-primary));
}

.line-content.output {
  color: var(--terminal-text, var(--text-primary));
}

.line-content.error {
  color: var(--error-color);
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--terminal-text, var(--text-primary));
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  margin: 0;
}
</style>

