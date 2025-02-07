<template>
  <div class="message-content">
    <template v-if="message.type === MessageType.TEXT">
      {{ message.content }}
    </template>

    <template v-else-if="message.type === MessageType.IMAGE">
      <el-image
        :src="getImageUrl(message.content)"
        :preview-src-list="[getImageUrl(message.content, 'origin')]"
        fit="cover"
        loading="lazy"
      >
        <template #error>
          <div class="image-error">
            <el-icon><Picture /></el-icon>
            <span>图片加载失败</span>
          </div>
        </template>
      </el-image>
    </template>

    <template v-else-if="message.type === MessageType.PDF">
      <div class="file-message" @click="downloadFile">
        <el-icon><Document /></el-icon>
        <div class="file-info">
          <span class="file-name">{{ getFileName(message.content) }}</span>
          <span class="file-size" v-if="message.fileSize">{{
            getFileSize(message.fileSize.toString())
          }}</span>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="unsupported-message">
        <el-icon><Warning /></el-icon>
        <span>不支持的消息类型</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Picture, Document, Warning } from "@element-plus/icons-vue";
import { MessageType } from "@/types/chat";
import type { Message } from "@/types/chat";

const props = defineProps<{
  message: Message;
}>();

const getFileName = (url: string) => {
  try {
    return decodeURIComponent(url.split("/").pop() || "未知文件");
  } catch {
    return "未知文件";
  }
};

const getFileSize = (size: string) => {
  const num = parseInt(size);
  if (isNaN(num)) return "";

  if (num < 1024) return num + "B";
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + "KB";
  if (num < 1024 * 1024 * 1024) return (num / (1024 * 1024)).toFixed(1) + "MB";
  return (num / (1024 * 1024 * 1024)).toFixed(1) + "GB";
};

const downloadFile = () => {
  if (!props.message.content) return;
  window.open(props.message.content, "_blank");
};

const getImageUrl = (
  url: string | undefined,
  size: "small" | "medium" | "origin" = "medium"
) => {
  if (!url) return "";
  return `${url}-${size}.jpeg`;
};
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as mixins;

.message-content {
  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    color: var(--el-text-color-secondary);

    .el-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
  }

  .file-message {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color);
    }

    .el-icon {
      font-size: 24px;
      color: var(--el-text-color-secondary);
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;

      .file-name {
        font-size: 14px;
        color: var(--el-text-color-primary);
        @include mixins.text-ellipsis;
      }

      .file-size {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .unsupported-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    color: var(--el-text-color-secondary);

    .el-icon {
      font-size: 16px;
    }
  }
}
</style>
