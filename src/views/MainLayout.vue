<template>
  <div class="main-layout" :class="{ 'narrow-layout': isNarrow }">
    <!-- 左侧/上方服务器列表 -->
    <ServerList :class="{ 'bottom-position': isNarrow }" />
    
    <!-- 主工作区 -->
    <div class="workspace">
      <WorkspaceTabs />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ServerList from '@/components/ServerList.vue'
import WorkspaceTabs from '@/components/WorkspaceTabs.vue'

const isNarrow = ref(false)
const narrowThreshold = 700 // 窗口过窄的阈值

function checkWindowWidth() {
  isNarrow.value = window.innerWidth < narrowThreshold
}

onMounted(() => {
  checkWindowWidth()
  window.addEventListener('resize', checkWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkWindowWidth)
})
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  min-width: 340px; /* 确保至少能容纳收起状态的服务器列表(40px) + 工作区(300px) */
  min-height: 200px;
  overflow: hidden;
  position: relative;
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 超窄屏幕响应式 - 服务器列表移到下方 */
.main-layout.narrow-layout {
  flex-direction: column;
}

.main-layout.narrow-layout .workspace {
  order: 1;
  flex: 1;
  min-height: 0;
}

.main-layout.narrow-layout .server-list {
  order: 2;
  width: 100% !important;
  max-width: 100% !important;
  height: auto;
  max-height: 50vh;
  border-right: none;
  border-top: 1px solid var(--border-color);
  border-bottom: none;
}

.main-layout.narrow-layout .server-list.collapsed {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  height: 50px;
  max-height: 50px;
}

/* 小屏幕响应式 */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  
  .workspace {
    min-height: 0;
    height: auto;
    flex: 1;
  }
}
</style>

