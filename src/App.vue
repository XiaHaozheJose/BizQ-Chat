<template>
  <el-config-provider :locale="zhCn">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
    <context-menu />
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { useUserStore } from "@/store/user";
import { useAudioStore } from "@/store/audio";
import ContextMenu from "@/components/common/ContextMenu.vue";
import SideNav from "@/components/base/SideNav.vue";

const router = useRouter();
const userStore = useUserStore();
const audioStore = useAudioStore();

onMounted(async () => {
  // 只初始化音频服务
  if (userStore.currentUser?.id) {
    await audioStore.initialize();
  }

  // 监听截图快捷键
  const cleanup = window.electronAPI.screenshot.onTrigger(() => {
    router.push("/screenshot");
  });

  // 组件卸载时清理监听器
  onUnmounted(() => {
    cleanup();
  });
});
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
