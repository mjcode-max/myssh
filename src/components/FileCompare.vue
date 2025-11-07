<template>
  <div class="file-compare" v-if="show">
    <div class="compare-header">
      <h3>文件对比</h3>
      <div class="compare-actions">
        <button @click="toggleSyncScroll" class="action-btn" :class="{ active: syncScroll }">
          {{ syncScroll ? '🔗 同步滚动' : '🔓 独立滚动' }}
        </button>
        <button @click="close" class="close-btn">×</button>
      </div>
    </div>
    <div class="compare-content">
      <div class="compare-pane left-pane">
        <div class="pane-header">
          <span>{{ leftFile.name }}</span>
        </div>
        <div 
          class="pane-content"
          ref="leftPane"
          @scroll="handleLeftScroll"
        >
          <div 
            v-for="(line, index) in leftLines" 
            :key="index"
            :class="['compare-line', getLineClass(line, index, 'left')]"
          >
            <span class="line-number">{{ index + 1 }}</span>
            <span class="line-content">{{ line }}</span>
          </div>
        </div>
      </div>
      <div class="compare-pane right-pane">
        <div class="pane-header">
          <span>{{ rightFile.name }}</span>
        </div>
        <div 
          class="pane-content"
          ref="rightPane"
          @scroll="handleRightScroll"
        >
          <div 
            v-for="(line, index) in rightLines" 
            :key="index"
            :class="['compare-line', getLineClass(line, index, 'right')]"
          >
            <span class="line-number">{{ index + 1 }}</span>
            <span class="line-content">{{ line }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

const props = defineProps({
  show: Boolean,
  leftFile: Object,
  rightFile: Object,
  server: Object
})

const emit = defineEmits(['close'])

const leftLines = ref([])
const rightLines = ref([])
const syncScroll = ref(true)
const leftPane = ref(null)
const rightPane = ref(null)
const isScrolling = ref(false)

watch(() => props.show, (show) => {
  if (show && props.leftFile && props.rightFile) {
    loadFiles()
  }
})

async function loadFiles() {
  if (!props.leftFile || !props.rightFile || !props.server?.connected) {
    return
  }
  
  try {
    // TODO: 调用 Tauri 读取两个文件
    // const [leftResult, rightResult] = await Promise.all([
    //   invoke('read_remote_file', {
    //     serverId: props.server.id,
    //     filePath: props.leftFile.path
    //   }),
    //   invoke('read_remote_file', {
    //     serverId: props.server.id,
    //     filePath: props.rightFile.path
    //   })
    // ])
    // leftLines.value = leftResult.content.split('\n')
    // rightLines.value = rightResult.content.split('\n')
    
    // 模拟文件内容
    leftLines.value = [
      '这是第一个文件的内容',
      '第一行',
      '第二行',
      '第三行',
      '第四行',
      '第五行'
    ]
    rightLines.value = [
      '这是第二个文件的内容',
      '第一行',
      '第二行（已修改）',
      '第三行',
      '新增行',
      '第五行'
    ]
  } catch (error) {
    console.error('加载文件失败:', error)
  }
}

function getLineClass(line, index, side) {
  // 简单的差异检测（实际应该使用更复杂的diff算法）
  const otherLines = side === 'left' ? rightLines.value : leftLines.value
  const otherLine = otherLines[index]
  
  if (!otherLine) {
    return 'line-added'
  }
  
  if (line !== otherLine) {
    return 'line-modified'
  }
  
  return 'line-same'
}

function handleLeftScroll() {
  if (syncScroll.value && !isScrolling.value && rightPane.value) {
    isScrolling.value = true
    rightPane.value.scrollTop = leftPane.value.scrollTop
    nextTick(() => {
      isScrolling.value = false
    })
  }
}

function handleRightScroll() {
  if (syncScroll.value && !isScrolling.value && leftPane.value) {
    isScrolling.value = true
    leftPane.value.scrollTop = rightPane.value.scrollTop
    nextTick(() => {
      isScrolling.value = false
    })
  }
}

function toggleSyncScroll() {
  syncScroll.value = !syncScroll.value
}

function close() {
  emit('close')
}

onMounted(() => {
  if (props.show && props.leftFile && props.rightFile) {
    loadFiles()
  }
})
</script>

<style scoped>
.file-compare {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.compare-header h3 {
  margin: 0;
  font-size: 14px;
}

.compare-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
}

.action-btn.active {
  background: var(--accent-color);
  color: white;
}

.close-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 18px;
}

.compare-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.compare-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.compare-pane:last-child {
  border-right: none;
}

.pane-header {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
}

.pane-content {
  flex: 1;
  overflow: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.compare-line {
  display: flex;
  padding: 2px 8px;
  border-left: 3px solid transparent;
}

.compare-line.line-same {
  background: var(--bg-primary);
}

.compare-line.line-modified {
  background: rgba(255, 193, 7, 0.1);
  border-left-color: var(--warning-color);
}

.compare-line.line-added {
  background: rgba(76, 175, 80, 0.1);
  border-left-color: var(--success-color);
}

.compare-line.line-deleted {
  background: rgba(244, 67, 54, 0.1);
  border-left-color: var(--error-color);
}

.line-number {
  display: inline-block;
  width: 50px;
  text-align: right;
  padding-right: 12px;
  color: var(--text-secondary);
  user-select: none;
  flex-shrink: 0;
}

.line-content {
  flex: 1;
  color: var(--text-primary);
  white-space: pre;
}
</style>

