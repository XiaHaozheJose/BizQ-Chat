<template>
  <div class="side-nav">
    <!-- 用户头像 -->
    <div class="nav-header">
      <el-avatar
        :size="40"
        :src="userStore.currentUser?.headImg || userStore.currentUser?.logo"
        :icon="User"
        @click="handleProfileClick"
      />
    </div>

    <!-- 导航菜单 -->
    <div class="nav-menu">
      <div
        class="nav-item"
        :class="{ active: activeNav === 'chat' }"
        @click="handleNavClick('chat')"
      >
        <el-icon><ChatDotRound /></el-icon>
      </div>
      <div
        class="nav-item"
        :class="{ active: activeNav === 'contacts' }"
        @click="handleNavClick('contacts')"
      >
        <el-icon><User /></el-icon>
      </div>
    </div>

    <!-- 底部菜单 -->
    <div class="nav-footer">
      <div class="nav-item" @click="handleSettingsClick">
        <el-icon><Setting /></el-icon>
      </div>
    </div>

    <!-- 个人信息弹窗 -->
    <el-dialog
      v-model="showProfileDialog"
      :title="t('common.profile')"
      width="400px"
    >
      <div class="profile-dialog">
        <!-- TODO: 添加个人信息内容 -->
      </div>
    </el-dialog>

    <!-- 设置弹窗 -->
    <el-dialog
      v-model="showSettingsDialog"
      :title="t('common.settings')"
      width="400px"
    >
      <div class="settings-dialog">
        <div class="setting-item">
          <span class="label">{{ t("dialog.settings.language") }}</span>
          <el-select v-model="currentLanguage" @change="handleLanguageChange">
            <el-option
              v-for="lang in ['zh-CN', 'en-US']"
              :key="lang"
              :label="t(`dialog.settings.languages.${lang}`)"
              :value="lang"
            />
          </el-select>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { User, ChatDotRound, Setting } from "@element-plus/icons-vue";
import { useUserStore } from "@/store/user";

const emit = defineEmits<{
  (e: "nav-change", nav: string): void;
}>();

const props = defineProps<{
  activeNav: string;
}>();

const { t, locale } = useI18n();
const userStore = useUserStore();
const showProfileDialog = ref(false);
const showSettingsDialog = ref(false);
const currentLanguage = ref(locale.value);

const handleNavClick = (nav: string) => {
  emit("nav-change", nav);
};

const handleProfileClick = () => {
  showProfileDialog.value = true;
};

const handleSettingsClick = () => {
  showSettingsDialog.value = true;
};

const handleLanguageChange = (value: string) => {
  locale.value = value;
  localStorage.setItem("language", value);
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
    }

    &:hover {
      background-color: var(--el-fill-color-light);

      .el-icon {
        color: var(--el-text-color-primary);
      }
    }

    &.active {
      background-color: var(--el-color-primary-light-9);

      .el-icon {
        color: var(--el-color-primary);
      }
    }
  }
}

.settings-dialog {
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .label {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .el-select {
      width: 200px;
    }
  }
}
</style>
