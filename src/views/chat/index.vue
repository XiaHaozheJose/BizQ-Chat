<template>
  <div class="chat-view">
    <!-- 列表区域 -->
    <div class="list-container">
      <!-- 搜索框 -->
      <draggable-container with-border height="64px">
        <el-input
          v-model="searchText"
          :placeholder="t('common.search')"
          :prefix-icon="IconSearch"
          clearable
          class="no-drag"
        />
      </draggable-container>

      <!-- 会话列表 -->
      <div class="list-content">
        <conversation-list @select="handleConversationSelect" />
      </div>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-container">
      <ChatArea
        v-show="chatStore.currentConversation"
        v-if="chatStore.currentConversation"
        :conversation-id="chatStore.currentConversation.id"
      />
      <div v-show="!chatStore.currentConversation" class="no-chat">
        <el-empty :description="t('chat.selectConversation')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useChatStore } from "@/store/chat";
import { type Conversation } from "@/types";
import { useI18n } from "vue-i18n";
import { Search as IconSearch } from "@element-plus/icons-vue";
import ConversationList from "@/components/chat/ConversationList.vue";
import ChatArea from "@/components/chat/ChatArea.vue";
import DraggableContainer from "@/components/base/DraggableContainer.vue";

const chatStore = useChatStore();
const { t } = useI18n();

// 状态
const searchText = ref("");

// 处理会话选择
const handleConversationSelect = async (conversation: Conversation) => {
  try {
    await chatStore.setCurrentConversation(conversation);
  } catch (error) {
    console.error("Failed to select conversation:", error);
    ElMessage.error(t("chat.loadConversationFailed"));
  }
};

// 生命周期
onMounted(async () => {
  // 初始化聊天
  await chatStore.initialize();
});
</script>

<style lang="scss" scoped>
.chat-view {
  width: 100%;
  height: 100%;
  display: flex;
  background-color: var(--el-bg-color);

  .list-container {
    width: 280px;
    border-right: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;

    .list-content {
      flex: 1;
      overflow-y: auto;
    }
  }

  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--el-bg-color-page);

    .no-chat {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
