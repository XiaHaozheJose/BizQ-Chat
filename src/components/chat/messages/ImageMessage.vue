<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
  >
    <div class="image-wrapper">
      <el-image
        :src="getImageUrl(message.content, 'medium', isShop)"
        :preview-src-list="[getImageUrl(message.content, 'origin', isShop)]"
        fit="cover"
        loading="lazy"
        :initial-index="0"
        preview-teleported
      >
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
    </div>
  </message-base>
</template>

<script setup lang="ts">
import MessageBase from "./MessageBase.vue";
import type { Message } from "@/types";
import { getImageUrl } from "@/utils";
import { Picture, Warning } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
}>();
</script>

<style lang="scss" scoped>
.image-wrapper {
  max-width: 240px;
  max-height: 320px;
  border-radius: 4px;
  overflow: hidden;

  .el-image {
    width: 100%;
    height: 100%;
    min-width: 120px;
    min-height: 120px;
    cursor: pointer;
  }

  .image-placeholder,
  .image-error {
    width: 100%;
    height: 120px;
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
</style>
