<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('user.detail')"
    width="500px"
    destroy-on-close
  >
    <div v-loading="loading" class="user-detail">
      <!-- 头像和基本信息 -->
      <div class="user-header">
        <el-avatar
          :size="64"
          :src="getImageUrl(userInfo?.headImg || userInfo?.logo)"
          :shape="isShop ? 'square' : 'circle'"
        />
        <div class="user-info">
          <div class="name">{{ userInfo?.name }}</div>
          <div class="type">
            <el-tag size="small" :type="isShop ? 'success' : 'info'">
              {{ isShop ? t("common.shop") : t("common.user") }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="info-list">
        <div class="info-item" v-if="userInfo?.phone">
          <span class="label">{{ t("user.phone") }}</span>
          <span class="value"
            >+{{ userInfo.areaCode }} {{ userInfo.phone }}</span
          >
        </div>
        <div class="info-item" v-if="userInfo?.email">
          <span class="label">{{ t("user.email") }}</span>
          <span class="value">{{ userInfo.email }}</span>
        </div>
        <template v-if="isShop">
          <div class="info-item" v-if="shopInfo?.type">
            <span class="label">{{ t("user.businessType") }}</span>
            <span class="value">{{ shopInfo?.type }}</span>
          </div>
          <div class="info-item" v-if="shopInfo?.address">
            <span class="label">{{ t("user.address") }}</span>
            <span class="value">{{ shopInfo?.address }}</span>
          </div>
          <div class="info-item" v-if="shopInfo?.description">
            <span class="label">{{ t("user.description") }}</span>
            <span class="value">{{ shopInfo?.description }}</span>
          </div>
        </template>
      </div>

      <!-- 店铺访问按钮 -->
      <div v-if="isShop && shopInfo?.subDomain" class="actions">
        <el-button type="primary" @click="visitShop">
          {{ t("user.visitShop") }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { BaseUser, Business } from "@/types/user";
import { getImageUrl } from "@/utils";

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  userId: string;
  isShop: boolean;
  initialData?: BaseUser | null; // 新增：接受初始数据
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const loading = ref(false);
const userInfo = ref<BaseUser | null>(null);

const isShop = computed(() => props.isShop);
const shopInfo = computed(() =>
  isShop.value ? (userInfo.value as Business) : null
);

// 监听初始数据并初始化
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      userInfo.value = newData;
    }
  },
  { immediate: true }
);

// 访问店铺网站
const visitShop = () => {
  if (shopInfo.value?.subDomain) {
    const url = `https://${shopInfo.value.subDomain}.${import.meta.env.VITE_APP_DOMAIN}`;
    window.electronAPI?.navigation.navigate(url);
  }
};
</script>

<style lang="scss" scoped>
.user-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .el-avatar {
    border: 1px solid #ccc; /* 替换原来的红色边框，改为更自然的灰色 */
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .name {
      font-size: 18px;
      font-weight: 500;
    }

    .type {
      .el-tag {
        font-size: 12px;
      }
    }
  }
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
    }
  }
}

.actions {
  margin-top: 16px;
  text-align: right;

  .el-button {
    padding: 10px 20px;
  }
}
</style>
