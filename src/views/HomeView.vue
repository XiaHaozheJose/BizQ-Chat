<template>
  <div class="home-container">
    <!-- 左侧导航 -->
    <side-nav :active-nav="activeNav" @nav-change="handleNavChange" />

    <!-- 中间列表区域 -->
    <div class="list-container">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchText"
          :placeholder="t('common.search')"
          :prefix-icon="IconSearch"
          clearable
        />
      </div>

      <!-- 列表内容 -->
      <div class="list-content">
        <!-- 聊天列表 -->
        <div v-if="activeNav === 'chat'" class="chat-list">
          <div
            v-for="chat in sortedChats"
            :key="chat.id"
            class="chat-item"
            :class="{ active: currentChat?.id === chat.id }"
            @click="selectChat(chat)"
          >
            <el-avatar
              :size="40"
              :src="
                getImageUrl(
                  getUserAvatar(chat.senderId),
                  'medium',
                  isShopUser(chat.senderId)
                )
              "
              :shape="isShopUser(chat.senderId) ? 'square' : 'circle'"
            >
              <img
                :src="
                  isShopUser(chat.senderId)
                    ? DEFAULT_SHOP_AVATAR
                    : DEFAULT_AVATAR
                "
              />
            </el-avatar>
            <div class="chat-info">
              <div class="chat-header">
                <span class="chat-name">{{ getUserName(chat.senderId) }}</span>
                <span class="chat-time">{{
                  chat.lastMessage?.timestamp
                    ? formatTime(chat.lastMessage.timestamp)
                    : ""
                }}</span>
              </div>
              <div class="chat-preview">
                <span class="last-message">{{
                  getLastMessagePreview(chat.lastMessage)
                }}</span>
                <el-badge
                  v-if="chat.unReadCount"
                  :value="chat.unReadCount"
                  class="unread-badge"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 联系人列表 -->
        <contact-list
          v-else-if="activeNav === 'contacts'"
          @select="handleContactSelect"
        />
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div v-if="activeNav === 'chat'" class="chat-area">
      <template v-if="currentChat">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <div class="chat-title">
            <span class="name">{{ getUserName(currentChat.senderId) }}</span>
            <span v-if="isShopUser(currentChat.senderId)" class="shop-tag">{{
              t("common.merchant")
            }}</span>
          </div>
          <el-icon class="more-icon" @click="showChatInfo = !showChatInfo"
            ><IconMore
          /></el-icon>
        </div>

        <!-- 消息列表 -->
        <div class="message-list" ref="messageList">
          <div
            v-for="message in currentMessages"
            :key="message.id"
            class="message-item"
            :class="{ 'message-mine': message.senderId === currentUser?.id }"
          >
            <el-avatar
              v-if="message.senderId !== currentUser?.id"
              :size="36"
              :src="
                getImageUrl(
                  getUserAvatar(message.senderId),
                  'medium',
                  isShopUser(message.senderId)
                )
              "
              :shape="isShopUser(message.senderId) ? 'square' : 'circle'"
            >
              <img
                :src="
                  isShopUser(message.senderId)
                    ? DEFAULT_SHOP_AVATAR
                    : DEFAULT_AVATAR
                "
              />
            </el-avatar>
            <div
              class="message-content"
              :class="getMessageTypeClass(message.type)"
            >
              <message-content :message="message" />
            </div>
            <el-avatar
              v-if="message.senderId === currentUser?.id"
              :size="36"
              :src="
                getImageUrl(
                  currentUser.headImg || currentUser.logo,
                  'medium',
                  currentUser.isShop
                )
              "
              :shape="currentUser.isShop ? 'square' : 'circle'"
            >
              <img
                :src="currentUser.isShop ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR"
              />
            </el-avatar>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="toolbar">
            <el-tooltip content="表情">
              <el-icon @click="showEmojiPicker = true"><IconEmoji /></el-icon>
            </el-tooltip>
            <el-tooltip content="图片">
              <el-icon @click="handleImageUpload"><IconPicture /></el-icon>
            </el-tooltip>
            <el-tooltip content="文件">
              <el-icon @click="handleFileUpload"><IconDocument /></el-icon>
            </el-tooltip>
          </div>
          <div class="input-box">
            <el-input
              v-model="messageText"
              type="textarea"
              :rows="3"
              placeholder="输入消息..."
              resize="none"
              @keydown.enter.prevent="sendMessage"
            />
          </div>
          <el-button type="primary" @click="sendMessage">{{
            t("common.send")
          }}</el-button>
        </div>
      </template>
      <div v-else class="no-chat">
        <el-empty :description="t('common.noChat')" />
      </div>
    </div>

    <!-- 右侧信息栏 -->
    <div v-if="showChatInfo" class="info-sidebar">
      <div class="info-header">
        <span class="title">{{ t("common.chatInfo") }}</span>
        <el-icon class="close-icon" @click="showChatInfo = false"
          ><IconClose
        /></el-icon>
      </div>
      <div class="info-content">
        <div class="basic-info">
          <el-avatar
            :size="80"
            :src="
              getImageUrl(
                getUserAvatar(currentChat?.senderId),
                'medium',
                isShopUser(currentChat?.senderId)
              )
            "
            :shape="isShopUser(currentChat?.senderId) ? 'square' : 'circle'"
          >
            <img
              :src="
                isShopUser(currentChat?.senderId)
                  ? DEFAULT_SHOP_AVATAR
                  : DEFAULT_AVATAR
              "
            />
          </el-avatar>
          <h3>{{ getUserName(currentChat?.senderId) }}</h3>
          <p v-if="isShopUser(currentChat?.senderId)" class="shop-tag">
            {{ t("common.merchant") }}
          </p>
        </div>
        <div class="action-list">
          <div class="action-item">
            <el-switch v-model="muteNotifications" />
            <span>{{ t("common.muteNotifications") }}</span>
          </div>
          <div class="action-item">
            <el-button type="danger" text @click="clearMessages">{{
              t("common.clearHistory")
            }}</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 表情选择器 -->
    <el-dialog
      v-model="showEmojiPicker"
      :title="t('common.emoji')"
      width="300px"
      :show-close="false"
      class="emoji-dialog"
    >
      <emoji-picker @select="insertEmoji" />
    </el-dialog>

    <!-- 文件上传 -->
    <input
      ref="fileInput"
      type="file"
      style="display: none"
      @change="onFileSelected"
      :accept="currentUploadType === 'image' ? 'image/*' : '*'"
    />

    <!-- 切换账号对话框 -->
    <el-dialog
      v-model="showSwitchAccountDialog"
      :title="t('dialog.switchAccount.title')"
      width="400px"
    >
      <div class="switch-account-dialog">
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
        <div class="shop-list">
          <p class="label">{{ t("dialog.switchAccount.selectShop") }}</p>
          <el-scrollbar height="300px">
            <div
              v-for="shop in userStore.shopsList"
              :key="shop.id"
              class="shop-item"
              @click="handleSwitchAccount(shop)"
            >
              <el-avatar
                :size="40"
                :src="getImageUrl(shop.logo, 'medium', true)"
                shape="square"
              >
                <img :src="DEFAULT_SHOP_AVATAR" />
              </el-avatar>
              <span class="name">{{ shop.name }}</span>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettingsDialog"
      :title="t('dialog.settings.title')"
      width="400px"
    >
      <div class="settings-dialog">
        <div class="setting-item">
          <span class="label">{{ t("dialog.settings.language") }}</span>
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  More as IconMore,
  Close as IconClose,
  Picture as IconPicture,
  Document as IconDocument,
  ChatDotRound as IconEmoji,
} from "@element-plus/icons-vue";
import { useUserStore } from "@/store/user";
import { useChatStore } from "@/store/chat";
import { useContactStore } from "@/store/contact";
import { chatDB } from "@/services/db";
import { formatTime } from "@/utils/time";
import MessageContent from "@/components/chat/MessageContent.vue";
import EmojiPicker from "@/components/chat/EmojiPicker.vue";
import {
  type Message,
  type Conversation,
  type Contact,
  MessageType,
} from "@/types";
import { type Business, UserType } from "@/types";
import { useI18n } from "vue-i18n";
import ContactList from "@/components/contact/ContactList.vue";
import SideNav from "@/components/layout/SideNav.vue";
import { Search as IconSearch } from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();
const chatStore = useChatStore();
const contactStore = useContactStore();
const { t, locale } = useI18n();

// 状态
const searchText = ref("");
const activeNav = ref("chat");
const messageText = ref("");
const showChatInfo = ref(false);
const muteNotifications = ref(false);
const showEmojiPicker = ref(false);
const messageList = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const currentUploadType = ref<"image" | "file">("image");
const showSwitchAccountDialog = ref(false);
const showSettingsDialog = ref(false);
const currentLanguage = ref(locale.value);

// 用户数据缓存
const userAvatars = ref<{ [key: string]: string }>({});
const userNames = ref<{ [key: string]: string }>({});
const userTypes = ref<{ [key: string]: boolean }>({});

// 添加默认头像常量
const DEFAULT_AVATAR =
  "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";
const DEFAULT_SHOP_AVATAR =
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

// 计算属性
const currentUser = computed(() => userStore.currentUser);
const currentChat = computed(() => chatStore.currentConversation);
const currentMessages = computed(() => chatStore.currentMessages);
const sortedChats = computed(() => chatStore.sortedConversations);
const filteredContacts = computed(() => {
  if (!searchText.value) return contactStore.sortedContacts;
  return contactStore.sortedContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      contact.remark?.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 加载用户数据
const loadUserData = async (userId: string) => {
  if (!userAvatars.value[userId]) {
    const user = await chatDB.getUser(userId);
    if (user) {
      userAvatars.value[userId] = user.logo || user.headImg || "";
      userNames.value[userId] = user.name;
      userTypes.value[userId] = user.isShop;
    }
  }
};

// 获取用户头像
const getUserAvatar = (userId?: string) =>
  userId ? userAvatars.value[userId] || "" : "";

// 获取用户名称
const getUserName = (userId?: string) =>
  userId ? userNames.value[userId] || "" : "";

// 判断是否商家
const isShopUser = (userId?: string) =>
  userId ? userTypes.value[userId] || false : false;

// 方法
const handleNavChange = (nav: string) => {
  activeNav.value = nav;
};

const selectChat = (chat: Conversation) => {
  chatStore.setCurrentConversation(chat);
  showChatInfo.value = false;
};

const handleContactSelect = async (contact: Contact) => {
  const conversation = await chatStore.getOrCreateConversation(contact.id);
  if (conversation) {
    selectChat(conversation);
    activeNav.value = "chat";
  }
};

const sendMessage = async () => {
  if (!messageText.value.trim() || !currentChat.value) return;

  try {
    await chatStore.sendMessage({
      content: messageText.value,
      type: "text",
      conversationId: currentChat.value.id,
    });
    messageText.value = "";
    scrollToBottom();
  } catch (error) {
    ElMessage.error("发送消息失败");
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
};

const getLastMessagePreview = (message?: Message) => {
  if (!message) return "";
  switch (message.type) {
    case MessageType.TEXT:
      return message.content;
    case MessageType.IMAGE:
      return "[图片]";
    case MessageType.PDF:
      return "[文件]";
    default:
      return "[消息]";
  }
};

const getMessageTypeClass = (type: MessageType) => {
  return {
    "message-text": type === MessageType.TEXT,
    "message-image": type === MessageType.IMAGE,
    "message-file": type === MessageType.PDF,
  };
};

const handleImageUpload = () => {
  currentUploadType.value = "image";
  fileInput.value?.click();
};

const handleFileUpload = () => {
  currentUploadType.value = "file";
  fileInput.value?.click();
};

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  try {
    if (currentUploadType.value === "image") {
      await chatStore.sendImage(file);
    } else {
      await chatStore.sendFile(file);
    }
  } catch (error) {
    ElMessage.error("文件上传失败");
  } finally {
    input.value = ""; // 清除选择的文件
  }
};

const insertEmoji = (emoji: string) => {
  messageText.value += emoji;
  showEmojiPicker.value = false;
};

const clearMessages = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有聊天记录吗？此操作不可恢复。",
      "警告",
      {
        type: "warning",
        confirmButtonText: "清空",
        confirmButtonClass: "el-button--danger",
      }
    );
    if (currentChat.value) {
      await chatStore.clearMessages(currentChat.value.id);
    }
  } catch {
    // 用户取消操作
  }
};

// 修改获取图片 URL 的函数
const getImageUrl = (
  url: string | undefined,
  size: "small" | "medium" | "origin" = "medium",
  isShop: boolean = false
) => {
  if (!url) {
    return isShop ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR;
  }
  return `${url}-${size}.jpeg`;
};

// 修改切换账号方法
const handleSwitchAccount = async (shop: Business) => {
  try {
    await userStore.switchAccount(UserType.Shop, shop.id);
    showSwitchAccountDialog.value = false;
    ElMessage.success(t("common.switchAccountSuccess"));
  } catch (error) {
    ElMessage.error(t("common.switchAccountFailed"));
  }
};

// 添加语言切换方法
const handleLanguageChange = (value: string) => {
  locale.value = value;
  localStorage.setItem("language", value);
};

// 生命周期
onMounted(async () => {
  await contactStore.initialize();
  scrollToBottom();

  // 加载当前会话中所有用户的数据
  if (currentChat.value) {
    await loadUserData(currentChat.value.senderId);
    await loadUserData(currentChat.value.receiveId);
  }

  // 监听会话变化，加载新用户数据
  watch(currentChat, async (newChat) => {
    if (newChat) {
      await loadUserData(newChat.senderId);
      await loadUserData(newChat.receiveId);
    }
  });

  // 监听消息列表变化，加载新用户数据
  watch(currentMessages, async (newMessages) => {
    for (const message of newMessages) {
      await loadUserData(message.senderId);
    }
  });

  // 监听搜索文本变化
  watch(searchText, (newValue) => {
    if (activeNav.value === "contacts") {
      contactStore.setSearchKeyword(newValue);
    }
  });
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins" as *;

.home-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: var(--el-bg-color);

  .list-container {
    width: 280px;
    border-right: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;

    .search-box {
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .list-content {
      flex: 1;
      overflow-y: auto;

      .chat-list {
        .chat-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.active {
            background-color: var(--el-color-primary-light-9);
          }

          .el-avatar {
            margin-right: 12px;
          }

          .chat-info {
            flex: 1;
            min-width: 0;

            .chat-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;

              .chat-name {
                font-weight: 500;
                @include text-ellipsis;
              }

              .chat-time {
                font-size: 12px;
                color: var(--el-text-color-secondary);
              }
            }

            .chat-preview {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .last-message {
                flex: 1;
                font-size: 13px;
                color: var(--el-text-color-secondary);
                @include text-ellipsis;
              }
            }
          }
        }
      }
    }
  }

  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--el-bg-color-page);

    .chat-header {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--el-border-color-light);

      .chat-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .name {
          font-size: 16px;
          font-weight: 500;
        }

        .shop-tag {
          padding: 2px 6px;
          font-size: 12px;
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
          border-radius: 4px;
        }
      }

      .more-icon {
        cursor: pointer;
        color: var(--el-text-color-secondary);
      }
    }

    .message-list {
      flex: 1;
      padding: 16px;
      overflow-y: auto;

      .message-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;

        &.message-mine {
          flex-direction: row-reverse;

          .message-content {
            background-color: var(--el-color-primary-light-9);
          }
        }

        .message-content {
          max-width: 60%;
          padding: 12px;
          background-color: var(--el-fill-color-light);
          border-radius: 8px;

          &.message-text {
            word-break: break-word;
          }

          &.message-image {
            padding: 4px;

            .el-image {
              max-width: 100%;
              border-radius: 4px;
            }
          }

          &.message-file {
            padding: 8px;
          }
        }
      }
    }

    .input-area {
      padding: 16px;
      border-top: 1px solid var(--el-border-color-light);

      .toolbar {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;

        .el-icon {
          font-size: 20px;
          color: var(--el-text-color-secondary);
          cursor: pointer;

          &:hover {
            color: var(--el-text-color-primary);
          }
        }
      }

      .input-box {
        margin-bottom: 12px;
      }

      .el-button {
        float: right;
      }
    }

    .no-chat {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .info-sidebar {
    width: 280px;
    border-left: 1px solid var(--el-border-color-light);
    background-color: var(--el-bg-color);

    .info-header {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--el-border-color-light);

      .title {
        font-size: 16px;
        font-weight: 500;
      }

      .close-icon {
        cursor: pointer;
        color: var(--el-text-color-secondary);
      }
    }

    .info-content {
      padding: 24px 16px;

      .basic-info {
        text-align: center;
        margin-bottom: 24px;

        .el-avatar {
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px;
          font-size: 18px;
        }

        .shop-tag {
          padding: 2px 6px;
          font-size: 12px;
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
          border-radius: 4px;
        }
      }

      .action-list {
        .action-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--el-border-color-light);

          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
  }
}

:deep(.emoji-dialog) {
  .el-dialog__body {
    padding: 0;
  }
}

.switch-account-dialog {
  .current-account,
  .shop-list {
    margin-bottom: 20px;

    .label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
    }
  }

  .account-info,
  .shop-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    .name {
      font-weight: 500;
    }
  }
}

.settings-dialog {
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .label {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .el-select {
      width: 200px;
    }
  }
}
</style>
