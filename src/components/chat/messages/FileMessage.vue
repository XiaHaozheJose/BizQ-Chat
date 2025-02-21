<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
  >
    <div class="file-message" @click="handleClick">
      <!-- 文件图标 -->
      <div class="file-icon">
        <el-icon><component :is="fileIcon" /></el-icon>
      </div>

      <!-- 文件信息 -->
      <div class="file-info">
        <div class="file-name">{{ message.fileName || initialFileName }}</div>
        <div class="file-meta" v-if="message.fileSize || fileExtension">
          <span v-if="message.fileSize">{{ formattedFileSize }}</span>
          <span v-if="fileExtension" class="file-type">{{
            fileExtension.toUpperCase()
          }}</span>
        </div>
        <!-- 错误信息 -->
        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
          <el-button type="primary" link @click.stop="handleRetry">
            重试
          </el-button>
        </div>
      </div>

      <!-- 下载状态 -->
      <div class="download-status" v-if="progress > 0 && progress < 100">
        <el-progress
          type="circle"
          :percentage="Math.round(progress)"
          :width="36"
        ></el-progress>
      </div>
    </div>
  </message-base>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Document,
  Picture,
  VideoCamera,
  Folder,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Message } from "@/types";
import MessageBase from "./MessageBase.vue";
import { generalFileService } from "@/services/file";
import { formatFileSize } from "@/utils/format";

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
}>();

const progress = ref(0);
const errorMessage = ref("");
const fileUrl = ref("");
const mimeType = ref("");

// Get initial file name from URL if not provided
const initialFileName = computed(() => {
  if (props.message.fileName) {
    return props.message.fileName;
  }
  try {
    const url = new URL(props.message.content);
    const pathSegments = url.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    return decodeURIComponent(lastSegment.split("?")[0]);
  } catch (error) {
    console.error("Failed to parse URL:", error);
    return "文件";
  }
});

const fileExtension = computed(() => {
  const fileName = props.message.fileName || initialFileName.value;
  return fileName.split(".").pop()?.toLowerCase() || "";
});

const formattedFileSize = computed(() => {
  return props.message.fileSize ? formatFileSize(props.message.fileSize) : "";
});

// 根据文件类型获取图标
const fileIcon = computed(() => {
  const fileName = props.message.fileName?.toLowerCase() || "";
  const type = props.message.type;

  // PDF文件
  if (type === "pdf" || fileName.endsWith(".pdf")) {
    return Document;
  }

  // 图片文件
  if (
    fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ||
    props.message.content?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)
  ) {
    return Picture;
  }

  // 视频文件
  if (fileName.match(/\.(mp4|webm|ogg|mov)$/)) {
    return VideoCamera;
  }

  // 其他文件使用默认图标
  return Folder;
});

const handleClick = async () => {
  if (errorMessage.value) {
    handleRetry();
    return;
  }

  if (progress.value > 0 && progress.value < 100) {
    return; // Download in progress
  }

  try {
    progress.value = 0;
    errorMessage.value = "";

    const result = await generalFileService.downloadAndSave(
      props.message.content,
      initialFileName.value,
      (p) => {
        progress.value = p;
      }
    );

    // Update message with file metadata
    props.message.fileName = result.fileName;
    props.message.fileSize = result.fileSize;
    mimeType.value = result.mimeType;
    fileUrl.value = result.url;

    // Open file based on MIME type
    const link = document.createElement("a");
    link.href = result.url;

    // For files that can be displayed in browser
    if (
      result.mimeType.startsWith("image/") ||
      result.mimeType.startsWith("text/") ||
      result.mimeType === "application/pdf"
    ) {
      link.target = "_blank";
    } else {
      // For files that need to be downloaded
      link.download = result.fileName;
    }

    link.click();
  } catch (error) {
    console.error("Failed to download file:", error);
    errorMessage.value = "下载失败，请重试";
    ElMessage.error("文件下载失败");
  }
};

const handleRetry = () => {
  errorMessage.value = "";
  handleClick();
};
</script>

<style lang="scss" scoped>
.file-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  cursor: pointer;
  min-width: 260px;
  max-width: 300px;

  &:hover {
    background: var(--el-fill-color-light);
  }

  .file-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-primary-light-9);
    border-radius: 4px;

    .el-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .file-info {
    flex: 1;
    min-width: 0;

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .file-type {
      background: var(--el-fill-color-light);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .error-message {
      font-size: 12px;
      color: var(--el-color-danger);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .download-status {
    margin-left: 12px;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
