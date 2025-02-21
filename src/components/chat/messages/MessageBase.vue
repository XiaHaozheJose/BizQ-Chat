<template>
  <div class="message-wrapper" :class="{ 'message-mine': isMine }">
    <div class="message-container">
      <!-- 对方头像 -->
      <el-avatar
        v-if="!isMine"
        class="avatar"
        :size="36"
        :src="avatarUrl"
        :shape="isShop ? 'square' : 'circle'"
      />
      <!-- 对方名称 -->
      <div class="message-content">
        <div v-if="!isMine" class="sender-name">{{ senderName }}</div>
        <!-- 引用消息 -->
        <div
          v-if="message.referenceMessageId"
          class="reference-message"
          @click="scrollToReference"
        >
          <div class="reference-sender">
            {{ message.referenceMessageSender }}
          </div>
          <div class="reference-content">
            <span v-if="message.referenceMessageType === 'text'">{{
              message.referenceMessageContent
            }}</span>
            <span v-else-if="message.referenceMessageType === 'image'">{{
              t("chat.imageMessage")
            }}</span>
            <span v-else-if="message.referenceMessageType === 'location'">{{
              t("chat.locationMessage")
            }}</span>
            <span v-else-if="message.referenceMessageType === 'contact'">{{
              t("chat.contactMessage")
            }}</span>
            <span v-else>{{ message.referenceMessageContent }}</span>
          </div>
        </div>
        <!-- 消息气泡 -->
        <div class="message-bubble" @contextmenu.prevent="handleContextMenu">
          <div class="content-wrapper">
            <slot></slot>
          </div>
        </div>
        <div class="message-info">
          <span class="time">{{ formattedTime }}</span>
          <span v-if="isMine" class="status" :class="message.status">
            <el-icon v-if="message.status === 'sending'"><Loading /></el-icon>
            <el-icon v-else-if="message.status === 'hasSent'"
              ><Check
            /></el-icon>
            <el-icon
              v-else-if="
                message.status === 'isRead' || message.status === 'received'
              "
              ><Check
            /></el-icon>
          </span>
          <el-button
            v-if="canUndo"
            link
            size="small"
            class="undo-button"
            @click="handleUndo"
          >
            {{ t("chat.undo") }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useUserStore } from "@/store/user";
import { useContextMenuStore } from "@/store/contextMenu";
import { formatTime } from "@/utils/time";
import { getImageUrl } from "@/utils";
import type { Message } from "@/types";
import { Loading, Check } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import { useChatStore } from "@/store/chat";
import { ElMessage } from "element-plus";

const { t } = useI18n();
const contextMenuStore = useContextMenuStore();
const chatStore = useChatStore();

const emit = defineEmits<{
  (e: "quote", message: Message): void;
  (e: "delete", message: Message): void;
}>();

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

const userStore = useUserStore();

const isMine = computed(
  () => props.message.senderId === userStore.currentUser?.id
);

const avatarUrl = computed(() =>
  getImageUrl(props.senderAvatar || "", "small", props.isShop)
);

const formattedTime = computed(() => formatTime(props.message.timestamp));

// 检查是否可以撤回消息
const canUndo = computed(() => {
  if (!isMine.value) return false;
  const messageTime = parseInt(props.message.timestamp);
  const now = Date.now();
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  return now - messageTime <= twoHoursInMs;
});

// 处理右键菜单
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  contextMenuStore.show(e.clientX, e.clientY, props.message);
};

// 处理删除消息
const handleDelete = async () => {
  try {
    await chatStore.deleteMessage(props.message);
    ElMessage.success(t("common.deleteSuccess"));
  } catch (error) {
    console.error("Failed to delete message:", error);
    ElMessage.error(t("common.deleteFailed"));
  }
};

// 处理撤回消息
const handleUndo = async () => {
  try {
    await chatStore.undoMessage(props.message);
    ElMessage.success(t("chat.undoSuccess"));
  } catch (error) {
    console.error("Failed to undo message:", error);
    ElMessage.error(t("chat.undoFailed"));
  }
};

// 存储事件处理函数的引用
const handleQuoteEvent = ((e: CustomEvent<Message>) => {
  if (e.detail.id === props.message.id) {
    emit("quote", props.message);
  }
}) as EventListener;

const handleDeleteEvent = ((e: CustomEvent<Message>) => {
  if (e.detail.id === props.message.id) {
    handleDelete();
  }
}) as EventListener;

// 添加事件监听
onMounted(() => {
  window.addEventListener("message-quote", handleQuoteEvent);
  window.addEventListener("message-delete", handleDeleteEvent);
});

onUnmounted(() => {
  window.removeEventListener("message-quote", handleQuoteEvent);
  window.removeEventListener("message-delete", handleDeleteEvent);
});

// 滚动到引用的消息
const scrollToReference = () => {
  if (props.message.referenceMessageId) {
    const element = document.getElementById(props.message.referenceMessageId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight");
      setTimeout(() => {
        element.classList.remove("highlight");
      }, 2000);
    }
  }
};
</script>

<style lang="scss" scoped>
.message-wrapper {
  margin-bottom: 16px;
  position: relative;

  .message-container {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 0 8px;
  }

  .message-bubble {
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    background-color: #f9f9f9; // 对方消息的背景色

    &:hover {
      background-color: #f0f0f0;
    }

    .content-wrapper {
      word-break: break-word;
    }
  }

  &.message-mine {
    .message-container {
      flex-direction: row-reverse;
    }

    .message-content {
      align-items: flex-end;

      .reference-message {
        text-align: right;
      }

      .message-info {
        justify-content: flex-end;
      }
    }

    .message-bubble {
      background-color: #ffffff; // 自己发送的消息背景色
      border: 1px solid #e4e4e4; // 自己发送的消息边框

      &:hover {
        background-color: #fafafa;
      }
    }
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 60%;

    .sender-name {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 2px;
    }

    .reference-message {
      padding: 8px;
      margin-bottom: 4px;
      background-color: var(--el-fill-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;

      &:hover {
        background-color: var(--el-fill-color-dark);
      }

      .reference-sender {
        color: var(--el-color-primary);
        margin-bottom: 2px;
      }

      .reference-content {
        color: var(--el-text-color-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .message-info {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 4px;

    .time {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .status {
      font-size: 12px;
      color: var(--el-text-color-secondary);

      &.sending {
        color: var(--el-color-info);
      }

      &.hasSent {
        color: var(--el-color-success);
      }

      &.isRead {
        color: var(--el-color-primary);
      }
    }

    .undo-button {
      font-size: 12px;
      padding: 0 4px;
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  &:not(.message-mine) {
    .message-bubble {
      border-top-left-radius: 4px;
    }
  }

  // 高亮动画
  .highlight {
    animation: highlight 2s;
  }

  @keyframes highlight {
    0% {
      background-color: var(--el-color-primary-light-8);
    }
    100% {
      background-color: transparent;
    }
  }
}
</style>
