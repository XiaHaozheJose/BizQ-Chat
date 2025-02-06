<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  if (!isLoggedIn) {
    router.push('/login')
  }
})
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