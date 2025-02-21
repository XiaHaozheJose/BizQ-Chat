<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
  >
    <div class="location-wrapper" @click="openGoogleMaps">
      <div class="location-info">
        <el-icon><Location /></el-icon>
        <div class="details">
          <span class="name">{{ locationInfo.name }}</span>
          <span class="coordinates">{{ locationInfo.coordinates }}</span>
        </div>
      </div>
      <!-- Map placeholder - to be implemented -->
      <div class="map-placeholder">
        <el-image v-if="imageUrl" :src="imageUrl" fit="cover" loading="lazy">
          <template #placeholder>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
          <template #error>
            <div class="image-error">
              <el-icon><Warning /></el-icon>
              <span>{{ t("common.loadError") }}</span>
            </div>
          </template>
        </el-image>
        <el-icon v-else><MapLocation /></el-icon>
      </div>
    </div>
  </message-base>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MessageBase from "./MessageBase.vue";
import type { Message } from "@/types";
import {
  Location,
  MapLocation,
  Picture,
  Warning,
} from "@element-plus/icons-vue";
import { mapUtils } from "@/utils/map";
import { addImageSuffix } from "@/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
}>();

// Parse location string format: "{location}${lat},{lng}"
const locationInfo = computed(() => {
  const [name, coordinates] = props.message.content.split("$");
  return {
    name: name.replace(/[{}]/g, ""), // Remove curly braces
    coordinates: coordinates || "",
  };
});

// 添加图片URL计算属性
const imageUrl = computed(() => {
  if (!props.message.filePath) return "";
  return addImageSuffix(props.message.filePath, "medium");
});

// 添加打开 Google Maps 的方法
const openGoogleMaps = () => {
  mapUtils.openMapUrl(locationInfo.value.name, locationInfo.value.coordinates);
};
</script>

<style lang="scss" scoped>
.location-wrapper {
  min-width: 200px;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  cursor: pointer; // 添加指针样式
  transition: all 0.3s; // 添加过渡效果

  &:hover {
    background-color: var(--el-fill-color-light); // 添加悬停效果
    border-color: var(--el-border-color); // 加深边框颜色
  }

  .location-info {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;

    .el-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      margin-top: 2px;
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name {
        font-weight: 500;
      }

      .coordinates {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .map-placeholder {
    height: 120px;
    background-color: var(--el-fill-color-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    overflow: hidden;

    .el-icon {
      font-size: 32px;
    }

    .el-image {
      width: 100%;
      height: 100%;
    }

    .image-placeholder,
    .image-error {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--el-fill-color);
      color: var(--el-text-color-secondary);

      .el-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
    }

    .image-error {
      color: var(--el-color-danger);
    }
  }
}
</style>
