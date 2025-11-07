<template>
  <div class="main-layout">
    <!-- 左侧服务器列表 -->
    <ServerList />
    
    <!-- 主工作区 -->
    <div class="workspace">
      <WorkspaceTabs />
    </div>
  </div>
</template>

<script setup>
import ServerList from '@/components/ServerList.vue'
import WorkspaceTabs from '@/components/WorkspaceTabs.vue'
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  min-width: 320px;
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

