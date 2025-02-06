<template>
  <div class="sidebar">
    <div class="logo">
      <img src="@/assets/logo.png" alt="Logo">
    </div>
    
    <el-menu
      :default-active="route.name as string"
      class="menu"
      router
    >
      <el-menu-item index="chat">
        <el-icon><ChatDotRound /></el-icon>
        <span>聊天</span>
      </el-menu-item>
      
      <el-menu-item index="contact">
        <el-icon><UserFilled /></el-icon>
        <span>联系人</span>
      </el-menu-item>
    </el-menu>
    
    <div class="user">
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :src="userStore.avatar" :size="40">
            {{ userStore.name?.[0] }}
          </el-avatar>
          <span class="name">{{ userStore.name }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatDotRound, UserFilled } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-lighter);
  border-right: 1px solid var(--border-base);
  
  .logo {
    padding: var(--spacing-medium);
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid var(--border-base);
    
    img {
      height: 40px;
    }
  }
  
  .menu {
    flex: 1;
    border-right: none;
    
    :deep(.el-menu-item) {
      .el-icon {
        font-size: 20px;
      }
    }
  }
  
  .user {
    padding: var(--spacing-medium);
    border-top: 1px solid var(--border-base);
    
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-small);
      cursor: pointer;
      
      .name {
        color: var(--text-regular);
      }
    }
  }
}
</style> 