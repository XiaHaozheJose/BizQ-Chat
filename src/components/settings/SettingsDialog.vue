<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('common.settings')"
    width="400px"
    @close="handleClose"
  >
    <div class="settings-dialog">
      <!-- 当前账户信息 -->
      <div class="account-info">
        <el-avatar
          :size="50"
          :src="
            getImageUrl(
              currentUser?.headImg || currentUser?.logo,
              'medium',
              currentUser?.isShop
            )
          "
          :shape="currentUser?.isShop ? 'square' : 'circle'"
        >
          <img
            :src="currentUser?.isShop ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR"
          />
        </el-avatar>
        <div class="user-info">
          <span class="name">{{ currentUser?.name }}</span>
          <span class="type">{{
            currentUser?.isShop ? t("common.merchant") : t("common.user")
          }}</span>
        </div>
      </div>

      <!-- 设置选项 -->
      <div class="settings-options">
        <!-- 切换账号 -->
        <div class="setting-item" @click="handleSwitchAccountClick">
          <div class="item-left">
            <el-icon><SwitchButton /></el-icon>
            <span>{{ t("common.switchAccount") }}</span>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>

        <!-- 语言设置 -->
        <div class="setting-item">
          <div class="item-left">
            <el-icon><Setting /></el-icon>
            <span>{{ t("common.language") }}</span>
          </div>
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

      <!-- 退出登录 -->
      <div class="logout-button">
        <el-button type="danger" @click="handleLogout">{{
          t("common.logout")
        }}</el-button>
      </div>
    </div>

    <!-- 切换账号对话框 -->
    <el-dialog
      v-model="showSwitchAccountDialog"
      :title="switchDialogTitle"
      width="400px"
      append-to-body
    >
      <div class="switch-account-dialog">
        <!-- 当前账号信息 -->
        <div class="current-account">
          <p class="label">{{ t("dialog.switchAccount.current") }}</p>
          <div class="account-info">
            <el-avatar
              :size="40"
              :src="
                getImageUrl(
                  currentUser?.headImg || currentUser?.logo,
                  'medium',
                  currentUser?.isShop
                )
              "
              :shape="currentUser?.isShop ? 'square' : 'circle'"
            >
              <img
                :src="
                  currentUser?.isShop ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR
                "
              />
            </el-avatar>
            <span class="name">{{ currentUser?.name }}</span>
          </div>
        </div>

        <!-- 可切换的账号列表 -->
        <div class="switchable-accounts">
          <p class="label">{{ switchDialogTitle }}</p>
          <el-scrollbar height="300px">
            <template v-if="isShopAccount">
              <!-- 显示店铺所有者信息 -->
              <div
                v-if="shopOwner"
                class="account-item"
                @click="handleSwitchAccount(UserType.User, shopOwner.id)"
              >
                <el-avatar
                  :size="40"
                  :src="getImageUrl(shopOwner.headImg, 'medium', false)"
                  shape="circle"
                >
                  <img :src="DEFAULT_AVATAR" />
                </el-avatar>
                <div class="account-info">
                  <span class="name">{{ shopOwner.name }}</span>
                  <span class="type">{{ t("common.user") }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <!-- 显示用户的店铺列表 -->
              <div
                v-for="shop in availableShops"
                :key="shop.id"
                class="account-item"
                @click="handleSwitchAccount(UserType.Shop, shop.id)"
              >
                <el-avatar
                  :size="40"
                  :src="getImageUrl(shop.logo, 'medium', true)"
                  shape="square"
                >
                  <img :src="DEFAULT_SHOP_AVATAR" />
                </el-avatar>
                <div class="account-info">
                  <span class="name">{{ shop.name }}</span>
                  <span class="type">{{ t("common.shop") }}</span>
                </div>
              </div>
            </template>
          </el-scrollbar>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/user";
import { ElMessage } from "element-plus";
import { Setting, SwitchButton, ArrowRight } from "@element-plus/icons-vue";
import { getImageUrl, DEFAULT_AVATAR, DEFAULT_SHOP_AVATAR } from "@/utils";
import { UserType, type Business, type User } from "@/types";
import { useRouter } from "vue-router";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const { t, locale } = useI18n();
const userStore = useUserStore();
const router = useRouter();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const currentLanguage = ref(locale.value);
const showSwitchAccountDialog = ref(false);
const currentUser = computed(() => userStore.currentUser);

// 判断当前是否为商家账号
const isShopAccount = computed(
  () => currentUser.value?.operatorType === UserType.Shop
);

// 获取店铺所有者信息
const shopOwner = computed(() => {
  if (!currentUser.value || !isShopAccount.value) return null;
  return (currentUser.value as Business).owner;
});

// 获取可用的店铺列表
const availableShops = computed(() => {
  if (!currentUser.value) return [];
  if (!isShopAccount.value) {
    const user = currentUser.value as User;
    // 优先使用 myshops，如果没有则使用 shopsList
    return user.myshops || userStore.shopsList;
  }
  return [];
});

// 切换账号对话框标题
const switchDialogTitle = computed(() => {
  return isShopAccount.value
    ? t("dialog.switchAccount.backToUser")
    : t("dialog.switchAccount.selectShop");
});

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false;
};

// 处理语言切换
const handleLanguageChange = (value: string) => {
  locale.value = value;
  localStorage.setItem("language", value);
};

// 处理切换账号点击
const handleSwitchAccountClick = () => {
  showSwitchAccountDialog.value = true;
};

// 处理切换账号
const handleSwitchAccount = async (type: UserType, id: string) => {
  try {
    // 先关闭所有对话框
    dialogVisible.value = false;
    showSwitchAccountDialog.value = false;

    // 等待对话框动画完成
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 执行切换
    await userStore.switchAccount(type, id);

    ElMessage.success(t("common.switchAccountSuccess"));
  } catch (error) {
    console.error("Failed to switch account:", error);
    ElMessage.error(t("common.switchAccountFailed"));
  }
};

// 处理退出登录
const handleLogout = async () => {
  try {
    await userStore.logout();
    dialogVisible.value = false;
    router.push("/login");
  } catch (error) {
    console.error("Failed to logout:", error);
    ElMessage.error(t("common.logoutFailed"));
  }
};
</script>

<style lang="scss" scoped>
.settings-dialog {
  .account-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name {
        font-size: 16px;
        font-weight: 500;
      }

      .type {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .settings-options {
    padding: 16px 0;

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-icon {
          font-size: 20px;
          color: var(--el-text-color-regular);
        }
      }

      .el-icon {
        color: var(--el-text-color-secondary);
      }

      .el-select {
        width: 120px;
      }
    }
  }

  .logout-button {
    padding: 16px;
    text-align: center;
    border-top: 1px solid var(--el-border-color-light);
  }
}

.switch-account-dialog {
  .current-account,
  .switchable-accounts {
    margin-bottom: 20px;

    .label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
    }
  }

  .account-info,
  .account-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    .account-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0;

      .name {
        font-weight: 500;
      }

      .type {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
