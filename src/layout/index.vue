<template>
  <div class="app-layout">
    <div class="app-content">
      <side-nav />
      <div class="main-content">
        <chat-view v-show="currentRoute === '/chat'" />
        <contacts-view v-show="currentRoute === '/contacts'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SideNav from "@/components/layout/SideNav.vue";
import ChatView from "@/views/chat/index.vue";
import ContactsView from "@/views/contacts/index.vue";

const route = useRoute();
const currentRoute = computed(() => {
  // 处理嵌套路由,只返回主路径
  const path = route.path;
  if (path.startsWith("/chat")) return "/chat";
  if (path.startsWith("/contacts")) return "/contacts";
  return path;
});
</script>

<style lang="scss" scoped>
.app-layout {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  background-color: var(--el-bg-color);

  .app-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .main-content {
      flex: 1;
      height: 100%;
      overflow: hidden;
      background-color: var(--el-bg-color);
    }
  }
}
</style>
