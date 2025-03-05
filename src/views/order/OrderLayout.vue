<template>
  <div class="order-layout">
    <div class="order-container">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
// 这是一个简单的布局容器，用于渲染子路由
</script>

<style lang="scss" scoped>
.order-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  overflow: hidden;

  .order-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
