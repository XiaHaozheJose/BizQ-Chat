<template>
  <div class="layout">
    <sidebar class="sidebar" />
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
</script>

<style lang="scss" scoped>
.layout {
  height: 100vh;
  display: flex;
  
  .sidebar {
    width: 240px;
    flex-shrink: 0;
  }
  
  .main {
    flex: 1;
    overflow: hidden;
  }
}
</style> 