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
  overflow: hidden;
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}
</style>

