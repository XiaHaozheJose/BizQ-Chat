<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('user.detail')"
    width="500px"
    destroy-on-close
    @open="loadUserInfo"
  >
    <div v-loading="loading" class="user-detail">
      <!-- 头像和基本信息 -->
      <div class="user-header">
        <el-avatar
          :size="64"
          :src="getImageUrl(userInfo?.headImg || userInfo?.logo)"
          :shape="userInfo?.isShop ? 'square' : 'circle'"
        />
        <div class="user-info">
          <div class="name">{{ userInfo?.name }}</div>
          <div class="type">
            <el-tag size="small" :type="userInfo?.isShop ? 'success' : 'info'">
              {{ userInfo?.isShop ? t("common.shop") : t("common.user") }}
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
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { BaseUser, Business } from "@/types/user";
import { getUserOrShopDetail } from "@/services/api/user";
import { getImageUrl } from "@/utils";

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  userId: string;
  isShop: boolean;
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

const isShop = computed(() => userInfo.value?.isShop);
const shopInfo = computed(() =>
  isShop.value ? (userInfo.value as Business) : null
);

// 加载用户信息
const loadUserInfo = async () => {
  loading.value = true;
  try {
    const data = await getUserOrShopDetail(props.userId, props.isShop);
    userInfo.value = data;
  } catch (error) {
    console.error("Failed to load user info:", error);
  } finally {
    loading.value = false;
  }
};

// 访问店铺网站
const visitShop = () => {
  if (shopInfo.value?.subDomain) {
    const url = `https://${shopInfo.value.subDomain}.bizq.com`;
    window.electronAPI?.navigation.navigate(url);
  }
};
</script>
