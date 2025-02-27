<template>
  <draggable-container
    class="side-nav"
    :class="{ expanded }"
    has-system-buttons
    padding="0"
  >
    <!-- 用户头像 -->
    <div class="nav-header no-drag">
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
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        custom
        v-slot="{ isActive, navigate }"
      >
        <div
          class="nav-item no-drag"
          :class="{ active: isActive }"
          @click="navigate"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span v-if="expanded" class="nav-text">{{ item.title }}</span>
        </div>
      </router-link>
    </div>

    <!-- 底部菜单 -->
    <div class="nav-footer">
      <div class="nav-item no-drag" @click="handleSettingsClick">
        <el-icon><Setting /></el-icon>
        <span v-if="expanded" class="nav-text">{{ t("common.settings") }}</span>
      </div>
    </div>

    <!-- 设置对话框 -->
    <settings-dialog v-model="showSettingsDialog" />
  </draggable-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useUserStore } from "@/store/user";
import { useI18n } from "vue-i18n";
import {
  ChatDotSquare,
  Setting,
  UserFilled,
  Stopwatch,
} from "@element-plus/icons-vue";
import { getImageUrl, DEFAULT_AVATAR, DEFAULT_SHOP_AVATAR } from "@/utils";
import SettingsDialog from "@/components/settings/SettingsDialog.vue";
import DraggableContainer from "@/components/base/DraggableContainer.vue";

const { t } = useI18n();
const userStore = useUserStore();
const showSettingsDialog = ref(false);
const expanded = ref(false);

// 导航配置
const navItems = computed(() => [
  {
    name: "chat",
    title: t("common.chat"),
    icon: ChatDotSquare,
    path: "/chat",
  },
  {
    name: "contacts",
    title: t("common.contacts"),
    icon: UserFilled,
    path: "/contacts",
  },
  {
    name: "circle",
    title: t("common.circle"),
    icon: Stopwatch,
    path: "/circle",
  },
]);

const handleProfileClick = () => {
  // TODO: 处理个人资料点击
};

const handleSettingsClick = () => {
  showSettingsDialog.value = true;
};
</script>

<style lang="scss" scoped>
.side-nav {
  width: 65px;
  height: 100%;
  background-color: var(--el-color-primary-light-8);
  border-right: 1px solid var(--el-color-primary-light-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: width 0.3s;

  &.expanded {
    width: 200px;

    .nav-item {
      justify-content: flex-start;
      padding: 0 20px;

      .nav-text {
        display: block;
        margin-left: 12px;
      }
    }
  }

  .nav-header {
    margin: 16px 0 24px;

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
    margin-bottom: 16px;
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

    .nav-text {
      display: none;
      font-size: 14px;
      color: var(--el-text-color-regular);
      transition: color 0.3s;
    }

    &:hover {
      background-color: var(--el-fill-color-light);

      .el-icon {
        color: var(--el-text-color-primary);
      }

      .nav-text {
        color: var(--el-text-color-primary);
      }
    }

    &.active {
      .el-icon {
        color: var(--el-color-primary);
        transform: scale(1.2);
      }

      .nav-text {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }
  }
}
</style>
