<template>
  <div class="side-nav">
    <!-- 用户头像 -->
    <div class="nav-header">
      <el-avatar
        :size="40"
        :src="
          getImageUrl(
            userStore.currentUser?.headImg || userStore.currentUser?.logo,
            'medium',
            userStore.currentUser?.isShop
          )
        "
        :shape="userStore.currentUser?.isShop ? 'square' : 'circle'"
        @click="handleProfileClick"
      >
        <img
          :src="
            userStore.currentUser?.isShop ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR
          "
        />
      </el-avatar>
    </div>

    <!-- 导航菜单 -->
    <div class="nav-menu">
      <div
        class="nav-item"
        :class="{ active: activeNav === 'chat' }"
        @click="handleNavClick('chat')"
      >
        <el-icon><ChatRound /></el-icon>
      </div>
      <div
        class="nav-item"
        :class="{ active: activeNav === 'contacts' }"
        @click="handleNavClick('contacts')"
      >
        <el-icon><UserFilled /></el-icon>
      </div>
    </div>

    <!-- 底部菜单 -->
    <div class="nav-footer">
      <div class="nav-item" @click="handleSettingsClick">
        <el-icon><Setting /></el-icon>
      </div>
    </div>

    <!-- 设置对话框 -->
    <settings-dialog v-model="showSettingsDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "@/store/user";
import {
  ChatDotRound,
  ChatRound,
  Setting,
  UserFilled,
} from "@element-plus/icons-vue";
import { getImageUrl, DEFAULT_AVATAR, DEFAULT_SHOP_AVATAR } from "@/utils";
import SettingsDialog from "@/components/settings/SettingsDialog.vue";

const emit = defineEmits<{
  (e: "nav-change", nav: string): void;
}>();

const props = defineProps<{
  activeNav: string;
}>();

const userStore = useUserStore();
const showSettingsDialog = ref(false);

const handleNavClick = (nav: string) => {
  emit("nav-change", nav);
};

const handleProfileClick = () => {
  // TODO: 处理个人资料点击
};

const handleSettingsClick = () => {
  showSettingsDialog.value = true;
};
</script>

<style lang="scss" scoped>
.side-nav {
  width: 60px;
  height: 100%;
  background-color: var(--el-bg-color-overlay);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;

  .nav-header {
    margin-bottom: 24px;

    .el-avatar {
      cursor: pointer;
      border: 1px solid transparent;
      transition: border-color 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .nav-menu {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .nav-footer {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .nav-item {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;

    .el-icon {
      font-size: 24px;
      color: var(--el-text-color-secondary);
      transition: color 0.3s;
    }

    &:hover {
      background-color: var(--el-fill-color-light-9);

      .el-icon {
        color: var(--el-text-color-primary);
      }
    }

    &.active {
      .el-icon {
        color: var(--el-color-primary);
        transform: scale(1.2);
      }
    }
  }
}
</style>
