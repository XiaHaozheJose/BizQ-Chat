<template>
  <div class="chat-area">
    <!-- 聊天头部 -->
    <draggable-container class="chat-header" with-border height="64px">
      <div class="chat-title">
        <div class="profile no-drag" @click="handleUserClick">
          <span class="name">{{ otherUser?.name }}</span>
          <span v-if="otherUser?.isShop" class="shop-tag">{{
            t("common.shop")
          }}</span>
        </div>
      </div>
    </draggable-container>

    <!-- 消息列表 -->
    <div
      class="message-list"
      ref="messageListRef"
      @scroll="handleScroll"
      v-loading="loading"
    >
      <!-- 加载更多提示 -->
      <div
        v-if="hasMore && currentMessages.length > 0"
        class="load-more"
        :class="{ loading: loadingMore }"
      >
        <el-icon v-if="loadingMore"><Loading /></el-icon>
        <span v-else>{{ t("common.loadMore") }}</span>
      </div>

      <template v-if="!loading">
        <div
          v-for="message in currentMessages"
          :key="message.id"
          class="message-item"
        >
          <message-factory
            :message="message"
            :sender-avatar="
              message.senderId === currentUserId
                ? currentUserAvatar
                : otherUserAvatar
            "
            :is-shop="
              message.senderId === currentUserId ? false : otherUser?.isShop
            "
            :sender-name="
              message.senderId === currentUserId
                ? currentUser?.name
                : otherUser?.name
            "
            @quote="handleQuote"
          />
        </div>
      </template>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 引用消息预览 -->
      <div v-if="referenceMessage" class="reference-preview">
        <div class="reference-content">
          <span class="reference-sender">{{
            referenceMessage.senderName
          }}</span>
          <span class="reference-text">{{
            referenceMessage.message.content
          }}</span>
        </div>
        <el-button
          class="close-button"
          type="link"
          @click="cancelReference"
          :icon="Close"
        />
      </div>

      <chat-input
        @send="handleSend"
        :reference-message="referenceMessageForInput"
      >
        <template #tools>
          <el-button @click="router.push('/screenshot')">
            <el-icon><Crop /></el-icon>
          </el-button>
        </template>
      </chat-input>
    </div>

    <!-- 用户详情对话框 -->
    <user-detail-dialog
      v-if="showUserDetail"
      v-model="showUserDetail"
      :user-id="otherUser?.id || ''"
      :is-shop="otherUser?.isShop || false"
      :initial-data="userDetailData"
      @update:modelValue="handleDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useChatStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import type { Message } from "@/types";
import MessageFactory from "./messages/MessageFactory.vue";
import { Close, Loading, Crop } from "@element-plus/icons-vue";
import ChatInput from "./ChatInput.vue";
import DraggableContainer from "@/components/base/DraggableContainer.vue";
import { ChatMessage } from "@/types/chat";
import UserDetailDialog from "@/components/user/UserDetailDialog.vue";
import { getUserOrShopDetail } from "@/services/api/user";
import { BaseUser } from "@/types/user";

const props = defineProps<{
  conversationId: string;
}>();

const { t } = useI18n();
const chatStore = useChatStore();
const userStore = useUserStore();
const messageListRef = ref<HTMLElement>();
const router = useRouter();

// 计算属性
const currentUserId = computed(() => userStore.currentUser?.id || "");
const currentUser = computed(() => userStore.currentUser);
const currentUserAvatar = computed(() => {
  return userStore.currentUser?.headImg;
});
const currentMessages = computed(() => chatStore.currentMessages);

const otherUser = computed(() => {
  const conversation = chatStore.conversations.find(
    (c) => c.id === props.conversationId
  );
  if (!conversation) return null;
  const users = conversation.users.split("#$");
  if (users.length > 1) {
    const otherUserId = users[0] === currentUserId.value ? users[1] : users[0];
    return chatStore.users[otherUserId];
  } else {
    const otherUserId =
      conversation.senderId !== currentUserId.value
        ? conversation.senderId
        : conversation.receiveId;
    return chatStore.users[otherUserId];
  }
});

const otherUserAvatar = computed(() => {
  return otherUser.value?.avatar;
});

// 引用消息相关
interface ReferencePreview {
  message: Message;
  senderName: string;
}

const referenceMessage = ref<ReferencePreview | null>(null);
const referenceMessageForInput = computed(
  () => referenceMessage.value?.message
);

const handleQuote = (message: Message) => {
  const senderName =
    message.senderId === userStore.currentUser?.id
      ? t("chat.you")
      : t("chat.other");

  referenceMessage.value = {
    message,
    senderName,
  };
};

const cancelReference = () => {
  referenceMessage.value = null;
};

// 方法
const scrollToBottom = async (force = false) => {
  await nextTick();
  if (messageListRef.value) {
    // 只有在发送新消息或首次加载时才滚动到底部
    if (force || !loadingMore.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  }
};

const handleSend = (messages: ChatMessage[]) => {
  if (!messages.length) return;

  messages.forEach(async (msg) => {
    await chatStore.sendMessage({
      chatMessage: msg,
      conversationId: props.conversationId,
      referenceMessage: referenceMessage.value?.message,
    });
  });

  // 清除引用消息
  if (referenceMessage.value) {
    cancelReference();
  }
};

// 监听新消息
watch(currentMessages, () => {
  if (!loadingMore.value) {
    scrollToBottom();
  }
});

// 生命周期
onMounted(async () => {
  scrollToBottom(true);
});

// 添加loading状态
const loading = ref(true);

// 监听消息加载状态
watch(
  () => chatStore.loading,
  (newVal) => {
    loading.value = newVal;
  }
);

// 添加加载更多相关的状态
const loadingMore = ref(false);

// 计算是否有更多消息
const hasMore = computed(
  () => chatStore.hasMoreMessages[props.conversationId] || false
);

// 处理滚动事件
const handleScroll = async (e: Event) => {
  const el = e.target as HTMLElement;

  // 检查是否滚动到顶部
  if (el.scrollTop <= 50 && hasMore.value && !loadingMore.value) {
    loadingMore.value = true;

    // 记录当前消息数量
    const currentCount = currentMessages.value.length;

    // 记录第一个可见消息的元素
    const firstVisibleMessage =
      messageListRef.value?.querySelector(".message-item");
    const firstVisibleMessageTop =
      firstVisibleMessage?.getBoundingClientRect().top;

    try {
      // 加载更多消息
      await chatStore.loadMessages(props.conversationId, true);

      // 等待 DOM 更新
      await nextTick();

      // 检查是否真的加载了新消息
      if (currentMessages.value.length > currentCount) {
        if (firstVisibleMessage && firstVisibleMessageTop) {
          // 找到之前记录的第一条可见消息
          const newPosition = firstVisibleMessage.getBoundingClientRect().top;
          // 计算滚动偏移量
          const offset = newPosition - firstVisibleMessageTop;
          // 调整滚动位置
          el.scrollTop = el.scrollTop + offset;
        }
      } else {
        // 如果没有新消息，将 hasMore 设置为 false
        chatStore.setHasMoreMessages(props.conversationId, false);
      }
    } finally {
      loadingMore.value = false;
    }
  }
};

// 状态
const showUserDetail = ref(false);
// 添加用户信息状态
const userDetailData = ref<BaseUser | null>(null);
const loadingUserDetail = ref(false);

// 处理用户点击，获取用户信息
const handleUserClick = async () => {
  if (!otherUser.value?.id) return;

  loadingUserDetail.value = true;
  try {
    // 调用 API 获取用户信息
    const userData = await getUserOrShopDetail(
      otherUser.value.id,
      otherUser.value.isShop || false
    );
    userDetailData.value = userData;
    showUserDetail.value = true; // 数据获取成功后显示对话框
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    // 可以在这里添加错误提示，比如使用 Element Plus 的 Message
  } finally {
    loadingUserDetail.value = false;
  }
};

// 处理对话框关闭
const handleDialogClose = () => {
  showUserDetail.value = false;
  userDetailData.value = null; // 可选：清空数据
};
</script>

<style lang="scss" scoped>
.chat-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);

  .chat-header {
    background-color: var(--el-bg-color-overlay);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    z-index: 1;
    height: 64px;

    .chat-title {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.3s;

      .profile {
        &:hover {
          background-color: var(--el-fill-color-light);
        }
      }

      .name {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .shop-tag {
        padding: 2px 6px;
        font-size: 12px;
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        border-radius: 4px;
      }
    }
  }

  .message-list {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    background-color: #ffffff;

    .load-more {
      padding: 10px;
      text-align: center;
      color: var(--el-text-color-secondary);
      font-size: 14px;

      &.loading {
        .el-icon {
          animation: rotate 1s linear infinite;
        }
      }
    }
  }

  .input-area {
    .reference-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      margin-bottom: 8px;
      background-color: var(--el-color-primary-light-9);
      border-radius: 4px;

      .reference-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;

        .reference-sender {
          color: var(--el-color-primary);
        }

        .reference-text {
          color: var(--el-text-color-secondary);
        }
      }

      .close-button {
        padding: 2px;
      }
    }

    .el-textarea {
      margin-bottom: 12px;

      :deep(.el-textarea__inner) {
        resize: none;
        border-radius: 8px;
      }
    }

    .el-button {
      float: right;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
