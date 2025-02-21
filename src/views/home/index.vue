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
          <conversation-list @select="handleConversationSelect" />
        </div>

        <!-- 联系人列表 -->
        <contact-list
          v-else-if="activeNav === 'contacts'"
          @select="handleContactSelect"
          @select-group="handleGroupSelect"
        />
      </div>
    </div>

    <!-- 右侧详情区域 -->
    <div class="detail-container">
      <div v-show="activeNav === 'contacts'">
        <ContactDetail
          v-if="detailType === 'contact' && selectedContact"
          :contact="selectedContact"
          @update="handleContactUpdate"
        />
        <GroupDetail
          v-if="detailType === 'group' && currentGroup"
          :group="currentGroup"
          @update="handleGroupUpdate"
        />
      </div>
      <ChatArea
        v-show="activeNav === 'chat'"
        v-if="chatStore.currentConversation"
        :conversation-id="chatStore.currentConversation.id"
      />
      <div
        v-show="activeNav === 'chat' && !chatStore.currentConversation"
        class="no-chat"
      >
        <el-empty :description="t('chat.selectConversation')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { ElMessage } from "element-plus";
import { useContactStore } from "@/store/contact";
import { useChatStore } from "@/store/chat";
import { type Contact, type ContactGroup } from "@/types";
import { type Conversation } from "@/types";
import { useI18n } from "vue-i18n";
import ContactList from "@/components/contact/ContactList.vue";
import ContactDetail from "@/components/contact/ContactDetail.vue";
import SideNav from "@/components/layout/SideNav.vue";
import { Search as IconSearch } from "@element-plus/icons-vue";
import ConversationList from "@/components/chat/ConversationList.vue";
import { useRoute } from "vue-router";
import GroupDetail from "@/components/contact/GroupDetail.vue";
import ChatArea from "@/components/chat/ChatArea.vue";

const contactStore = useContactStore();
const chatStore = useChatStore();
const { t } = useI18n();
const route = useRoute();

// 状态
const searchText = ref("");
const activeNav = ref("chat");
const messageList = ref<HTMLElement>();
const selectedContact = ref<Contact | null>(null);
const detailType = ref<"contact" | "group" | null>(null);
const currentGroup = ref<ContactGroup | null>(null);

// 方法
const handleNavChange = (nav: string) => {
  activeNav.value = nav;
};

const handleContactSelect = async (contact: Contact) => {
  detailType.value = "contact";
  selectedContact.value = contact;
};

const handleGroupSelect = (group: ContactGroup) => {
  detailType.value = "group";
  currentGroup.value = group;
  selectedContact.value = null;
};

const handleContactUpdate = () => {
  // 刷新联系人列表
  contactStore.loadContacts();
};

const handleGroupUpdate = () => {
  // Refresh groups list
  contactStore.loadGroups();
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
};

// 添加处理会话选择的方法
const handleConversationSelect = async (conversation: Conversation) => {
  try {
    // 设置当前会话
    await chatStore.setCurrentConversation(conversation);

    // 确保导航在chat页面
    activeNav.value = "chat";

    // 清除联系人选择状态
    selectedContact.value = null;
    currentGroup.value = null;
    detailType.value = null;
  } catch (error) {
    console.error("Failed to select conversation:", error);
    ElMessage.error(t("chat.loadConversationFailed"));
  }
};

// Watch route changes to handle group detail
watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName === "groupDetail") {
      detailType.value = "group";
      selectedContact.value = null;
    }
  }
);

// 生命周期
onMounted(async () => {
  // 初始化聊天和联系人
  await Promise.all([chatStore.initialize(), contactStore.initialize()]);

  scrollToBottom();

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

  .detail-container {
    flex: 1;
    border-left: 1px solid var(--el-border-color-light);
    background-color: var(--el-bg-color);
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
</style>
