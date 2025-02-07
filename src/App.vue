<template>
  <el-config-provider :locale="zhCn">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { chatDB } from "@/services/db";
import { useUserStore } from "@/store/user";

const router = useRouter();
const userStore = useUserStore();

onMounted(async () => {
  // 初始化数据库
  await chatDB.initialize();

  // 初始化用户状态
  userStore.initialize();

  // 检查登录状态
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    router.push("/login");
  }
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
