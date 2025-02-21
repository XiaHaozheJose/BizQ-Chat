<template>
  <div class="chat-input-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="left-tools">
        <el-tooltip :content="t('common.emoji')" placement="top">
          <div class="tool-item" @click="handleEmojiClick">
            <el-icon><Face /></el-icon>
          </div>
        </el-tooltip>
        <el-tooltip :content="t('common.file')" placement="top">
          <div class="tool-item" @click="handleFileClick">
            <el-icon><Folder /></el-icon>
          </div>
        </el-tooltip>
        <el-tooltip content="截图" placement="top">
          <div class="tool-item" @click="handleScreenshotClick">
            <el-icon><Screenshot /></el-icon>
          </div>
        </el-tooltip>
        <el-tooltip :content="t('chat.message')" placement="top">
          <div class="tool-item" @click="handleHistoryClick">
            <el-icon><ChatDotRound /></el-icon>
          </div>
        </el-tooltip>
      </div>
      <div class="right-tools">
        <el-tooltip :content="t('common.voice')" placement="top">
          <div class="tool-item" @click="handleVoiceClick">
            <el-icon><Phone /></el-icon>
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- 输入区域 -->
    <div
      class="input-area"
      contenteditable="true"
      ref="inputRef"
      @paste="handlePaste"
      @keydown.enter.prevent="handleEnter"
      @input="handleInput"
    ></div>

    <!-- 预览区域 - 当有图片时显示 -->
    <div v-if="pastedImages.length > 0" class="preview-area">
      <div
        v-for="(image, index) in pastedImages"
        :key="index"
        class="image-preview"
        :class="{ 'is-uploading': image.status === 'uploading' }"
      >
        <el-image
          :src="image.url"
          fit="cover"
          :preview-src-list="[image.url]"
          :initial-index="0"
          preview-teleported
          hide-on-click-modal
        >
          <template #error>
            <div class="image-error">
              <el-icon><Warning /></el-icon>
            </div>
          </template>
        </el-image>

        <!-- 上传状态遮罩 -->
        <div v-if="image.status !== 'success'" class="image-overlay">
          <!-- 上传中状态 -->
          <template v-if="image.status === 'uploading'">
            <el-progress
              type="circle"
              :percentage="image.progress"
              :width="40"
              :stroke-width="4"
              status="success"
            />
          </template>

          <!-- 上传失败状态 -->
          <template v-if="image.status === 'error'">
            <div class="upload-error">
              <el-icon class="error-icon"><Warning /></el-icon>
              <el-button
                size="small"
                type="primary"
                @click="retryUpload(index)"
              >
                {{ t("common.retry") }}
              </el-button>
            </div>
          </template>
        </div>

        <!-- 删除按钮 -->
        <div class="image-remove" @click="removeImage(index)">
          <el-icon><Close /></el-icon>
        </div>
      </div>
    </div>

    <!-- 文件选择input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".pdf,image/*"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- 文件预览弹窗 -->
    <FilePreviewDialog
      v-model="showFilePreview"
      :files="selectedFiles"
      :title="t('chat.sendTo')"
      :confirm-button-text="`${t('chat.send')}(${selectedFiles.length})`"
      :recipient="currentRecipient"
      @delete="removeFile"
      @cancel="cancelFilePreview"
      @confirm="handleFileUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useChatStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import type { ConversationUser } from "@/types";
import {
  User as Face,
  Folder,
  Picture as Screenshot,
  ChatDotRound,
  Phone,
  Warning,
  Close,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { MessageType } from "@/types/chat";
import type { ChatMessage, Message } from "@/types/chat";
import api from "@/services/api/auth";
import type { AxiosProgressEvent } from "axios";
import { uploadFiles, uploadSingleFile } from "@/services/api/upload";
import FilePreviewDialog from "@/components/common/FilePreviewDialog.vue";

const { t } = useI18n();

const chatStore = useChatStore();
const userStore = useUserStore();

// Get current recipient
const currentRecipient = computed<ConversationUser | undefined>(() => {
  const conversation = chatStore.currentConversation;
  if (!conversation) return undefined;

  const currentUserId = userStore.currentUser?.id;
  if (!currentUserId) return undefined;

  // Get the other user from the conversation
  const otherUserId =
    conversation.senderId === currentUserId
      ? conversation.receiveId
      : conversation.senderId;

  return chatStore.users[otherUserId];
});

// Props定义
interface Props {
  referenceMessage?: Message;
}
const props = defineProps<Props>();

// 输入框引用
const inputRef = ref<HTMLDivElement>();
// 粘贴的图片列表
interface PastedImage {
  url: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  uploadedUrl?: string;
  error?: string;
}
const pastedImages = ref<PastedImage[]>([]);
// 输入的文本内容
const textContent = ref("");

// 是否可以发送
const canSend = computed(() => {
  return textContent.value.trim().length > 0 || pastedImages.value.length > 0;
});

// 处理粘贴事件
const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault();

  // 处理粘贴的文本
  const text = e.clipboardData?.getData("text/plain");
  if (text) {
    document.execCommand("insertText", false, text);
  }

  // 处理粘贴的图片
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          pastedImages.value.push({
            url,
            file,
            status: "pending",
            progress: 0,
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }
};

// 处理回车事件
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) {
    // Shift + Enter 换行
    document.execCommand("insertLineBreak");
    return;
  }
  handleSend();
};

// 处理输入事件
const handleInput = () => {
  textContent.value = inputRef.value?.innerText || "";
};

// 移除图片
const removeImage = (index: number) => {
  pastedImages.value.splice(index, 1);
};

// 清空输入
const clearInput = () => {
  if (inputRef.value) {
    inputRef.value.innerHTML = "";
  }
  textContent.value = "";
  pastedImages.value = [];
};

// 上传单个图片
const uploadImage = async (image: PastedImage): Promise<string> => {
  try {
    image.status = "uploading";
    image.progress = 0;

    const formData = new FormData();
    formData.append("files", image.file);

    const response = await api.post("/files/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      baseURL: "http://dev.bizq.com/file/api/v1",
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          image.progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
        }
      },
    });

    const urls = response.data;
    if (urls && urls.length > 0) {
      image.status = "success";
      image.progress = 100;
      image.uploadedUrl = urls[0];
      return urls[0];
    }
    throw new Error("Upload failed: No URL returned");
  } catch (error) {
    image.status = "error";
    image.error = error instanceof Error ? error.message : "Upload failed";
    throw error;
  }
};

// 重试上传图片
const retryUpload = async (index: number) => {
  const image = pastedImages.value[index];
  if (!image) return;

  try {
    await uploadImage(image);
  } catch (error) {
    console.error("Retry upload failed:", error);
  }
};

// 发送消息
const handleSend = async () => {
  if (!canSend.value) return;

  const messages: ChatMessage[] = [];
  const failedUploads: number[] = [];

  try {
    // 上传所有待上传的图片
    if (pastedImages.value.length > 0) {
      for (let i = 0; i < pastedImages.value.length; i++) {
        const image = pastedImages.value[i];
        if (image.status !== "success") {
          try {
            const url = await uploadImage(image);
            messages.push({
              type: MessageType.IMAGE,
              content: url,
            });
          } catch (error) {
            failedUploads.push(i);
          }
        } else {
          messages.push({
            type: MessageType.IMAGE,
            content: image.uploadedUrl!,
          });
        }
      }
    }

    // 如果有上传失败的图片，显示错误信息并中断发送
    if (failedUploads.length > 0) {
      ElMessage.error(t("error.uploadFile"));
      return;
    }

    // 如果有文本，发送文本消息
    if (textContent.value.trim()) {
      messages.push({
        type: MessageType.TEXT,
        content: textContent.value.trim(),
      });
    }

    // 触发发送事件
    if (messages.length > 0) {
      emit("send", messages);
      // 清空输入
      clearInput();
    }
  } catch (error) {
    console.error("Failed to send messages:", error);
    ElMessage.error(t("error.sendMessage"));
  }
};

// 工具栏点击事件
const handleEmojiClick = () => {
  // TODO: 实现表情选择
  ElMessage.info("表情功能开发中");
};

// 文件选择相关
const fileInputRef = ref<HTMLInputElement>();
const showFilePreview = ref(false);
interface SelectedFile {
  file: File;
  name: string;
  size: number;
  type: "pdf" | "image";
}
const selectedFiles = ref<SelectedFile[]>([]);

// 处理文件选择
const handleFileClick = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;

  const files = Array.from(input.files);
  selectedFiles.value = files.map((file) => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type.startsWith("image/") ? "image" : "pdf",
  }));

  showFilePreview.value = true;
  input.value = ""; // 清空input以允许重复选择相同文件
};

// 移除文件
const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
  if (selectedFiles.value.length === 0) {
    showFilePreview.value = false;
  }
};

// 取消文件预览
const cancelFilePreview = () => {
  selectedFiles.value = [];
  showFilePreview.value = false;
};

// 处理文件上传和发送
const handleFileUpload = async () => {
  if (!selectedFiles.value.length) return;

  try {
    // 将文件按类型分组
    const imageFiles = selectedFiles.value
      .filter((f) => f.type === "image")
      .map((f) => f.file);
    const pdfFiles = selectedFiles.value
      .filter((f) => f.type === "pdf")
      .map((f) => f.file);

    const messages = [];

    // 上传图片文件（如果有）
    if (imageFiles.length > 0) {
      const imageUrls = await uploadFiles(imageFiles);
      messages.push(
        ...imageUrls.map((url: string) => ({
          type: MessageType.IMAGE,
          content: url,
        }))
      );
    }

    // 上传 PDF 文件（如果有）
    if (pdfFiles.length > 0) {
      for (const pdfFile of pdfFiles) {
        try {
          const url = await uploadSingleFile(pdfFile);
          messages.push({
            type: MessageType.PDF,
            content: url,
            fileName: pdfFile.name,
            fileSize: pdfFile.size,
          });
        } catch (error) {
          console.error("Failed to upload PDF file:", error);
          ElMessage.error(t("error.uploadFile"));
        }
      }
    }
    console.log("messages", messages);
    // 如果有成功上传的文件，发送消息
    if (messages.length > 0) {
      emit("send", messages);
      showFilePreview.value = false;
      selectedFiles.value = [];
    }
  } catch (error) {
    console.error("Failed to upload files:", error);
    ElMessage.error(t("error.uploadFile"));
  }
};

const handleScreenshotClick = () => {
  // TODO: 实现截图
  ElMessage.info("截图功能开发中");
};

const handleHistoryClick = () => {
  // TODO: 实现历史消息
  ElMessage.info("历史消息功能开发中");
};

const handleVoiceClick = () => {
  // TODO: 实现语音通话
  ElMessage.info("语音通话功能开发中");
};

// 定义组件事件
const emit = defineEmits<{
  (e: "send", messages: ChatMessage[]): void;
}>();
</script>

<style lang="scss" scoped>
.chat-input-container {
  border: 0.5px solid var(--el-border-color);
  background: var(--el-bg-color);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    // border-bottom: 0.5px solid var(--el-border-color-light);

    .left-tools,
    .right-tools {
      display: flex;
      gap: 8px;
    }

    .tool-item {
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        background: var(--el-fill-color-light);
      }

      .el-icon {
        font-size: 20px;
        color: var(--el-text-color-regular);
      }
    }
  }

  .input-area {
    min-height: 100px;
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
    outline: none;
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-primary);

    &:empty:before {
      content: attr(placeholder);
      color: var(--el-text-color-placeholder);
    }
  }

  .preview-area {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    border-top: 0.5px solid var(--el-border-color-light);

    .image-preview {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 4px;
      overflow: hidden;
      border: 0.5px solid var(--el-border-color);

      .el-image {
        width: 100%;
        height: 100%;
      }

      .image-remove {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        .el-icon {
          font-size: 14px;
          color: white;
        }
      }

      .image-error {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color);
        color: var(--el-color-danger);
      }

      &.is-uploading {
        .el-image {
          opacity: 0.6;
        }
      }

      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
        pointer-events: none;

        &:has(.upload-error) {
          pointer-events: auto;
        }

        .upload-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;

          .error-icon {
            font-size: 20px;
            color: var(--el-color-danger);
          }
        }
      }
    }
  }

  .file-preview-dialog {
    :deep(.el-dialog__body) {
      padding: 20px;
    }

    .file-list {
      max-height: 300px;
      overflow-y: auto;

      .file-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-bottom: 1px solid var(--el-border-color-light);

        &:last-child {
          border-bottom: none;
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

          .file-size {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .delete-button {
          color: var(--el-text-color-secondary);

          &:hover {
            color: var(--el-color-danger);
          }
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }
  }
}
</style>
