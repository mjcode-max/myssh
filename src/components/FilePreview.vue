<template>
  <div class="file-preview" v-if="show">
    <div class="preview-header">
      <h3>{{ file.name }}</h3>
      <div class="preview-actions">
        <button @click="handleDownload" class="action-btn" title="下载">📥</button>
        <button @click="handleCompare" class="action-btn" title="对比">🔍</button>
        <button @click="close" class="close-btn">×</button>
      </div>
    </div>
    <div class="preview-content">
      <!-- 文本文件预览 -->
      <div v-if="fileType === 'text'" class="text-preview">
        <div class="text-toolbar">
          <button @click="toggleLineNumbers" class="toolbar-btn" :class="{ active: showLineNumbers }">
            行号
          </button>
          <button @click="toggleWordWrap" class="toolbar-btn" :class="{ active: wordWrap }">
            换行
          </button>
          <select v-model="encoding" class="encoding-select">
            <option value="utf-8">UTF-8</option>
            <option value="gbk">GBK</option>
            <option value="gb2312">GB2312</option>
          </select>
        </div>
        <pre 
          class="text-content"
          :class="{ 'line-numbers': showLineNumbers, 'word-wrap': wordWrap }"
        ><code>{{ fileContent }}</code></pre>
      </div>
      
      <!-- 图片预览 -->
      <div v-else-if="fileType === 'image'" class="image-preview">
        <img :src="imageUrl" :alt="file.name" class="preview-image" />
      </div>
      
      <!-- 不支持的文件类型 -->
      <div v-else class="unsupported-preview">
        <p>不支持预览此文件类型</p>
        <button @click="handleDownload" class="download-btn">下载文件</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

const props = defineProps({
  show: Boolean,
  file: Object,
  server: Object
})

const emit = defineEmits(['close', 'compare', 'download'])

const fileContent = ref('')
const imageUrl = ref('')
const showLineNumbers = ref(true)
const wordWrap = ref(false)
const encoding = ref('utf-8')
const loading = ref(false)

const fileType = computed(() => {
  if (!props.file) return 'unknown'
  const ext = props.file.name.split('.').pop()?.toLowerCase()
  const textExts = ['txt', 'json', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'html', 'css', 'xml', 'yaml', 'yml', 'md', 'log', 'conf', 'config']
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
  
  if (textExts.includes(ext)) return 'text'
  if (imageExts.includes(ext)) return 'image'
  return 'unknown'
})

watch(() => props.show, (show) => {
  if (show && props.file) {
    loadFileContent()
  }
})

async function loadFileContent() {
  if (!props.file || !props.server?.connected) {
    return
  }
  
  loading.value = true
  
  try {
    if (fileType.value === 'text') {
      // TODO: 调用 Tauri 读取文本文件
      // const result = await invoke('read_remote_file', {
      //   serverId: props.server.id,
      //   filePath: props.file.path,
      //   encoding: encoding.value
      // })
      // fileContent.value = result.content
      
      // 模拟文本内容
      fileContent.value = `这是文件 ${props.file.name} 的内容预览\n\n实际将调用 Tauri 读取远程文件内容`
    } else if (fileType.value === 'image') {
      // TODO: 调用 Tauri 下载图片并显示
      // const result = await invoke('download_image_preview', {
      //   serverId: props.server.id,
      //   filePath: props.file.path
      // })
      // imageUrl.value = result.url
      
      // 模拟图片URL
      imageUrl.value = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgUHJldmlldzwvdGV4dD48L3N2Zz4='
    }
  } catch (error) {
    console.error('加载文件内容失败:', error)
    fileContent.value = `加载失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

function toggleLineNumbers() {
  showLineNumbers.value = !showLineNumbers.value
}

function toggleWordWrap() {
  wordWrap.value = !wordWrap.value
}

function handleDownload() {
  emit('download', props.file)
  close()
}

function handleCompare() {
  emit('compare', props.file)
}

function close() {
  emit('close')
}

onMounted(() => {
  if (props.show && props.file) {
    loadFileContent()
  }
})
</script>

<style scoped>
.file-preview {
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

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.preview-header h3 {
  margin: 0;
  font-size: 14px;
}

.preview-actions {
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

.preview-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.text-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.text-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  cursor: pointer;
}

.toolbar-btn.active {
  background: var(--accent-color);
  color: white;
}

.encoding-select {
  padding: 4px 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  font-size: 12px;
}

.text-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  margin: 0;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
}

.text-content.line-numbers {
  counter-reset: line;
}

.text-content.line-numbers code::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 40px;
  margin-right: 16px;
  color: var(--text-secondary);
  text-align: right;
}

.text-content.word-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.image-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.unsupported-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.download-btn {
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;
}
</style>

