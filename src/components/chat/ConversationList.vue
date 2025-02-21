<template>
  <div class="conversation-list">
    <!-- 会话列表 -->
    <div class="conversations-container">
      <!-- 置顶会话 -->
      <div
        v-if="pinnedConversations.length > 0"
        class="conversations-section pinned-section"
      >
        <div class="section-header">
          <span class="section-title">{{ t("chat.pinned") }}</span>
          <span class="section-count">{{ pinnedConversations.length }}</span>
        </div>
        <div class="conversation-items">
          <conversation-item
            v-for="conversation in pinnedConversations"
            :key="conversation.id"
            :conversation="conversation"
            :selected="currentConversation?.id === conversation.id"
            @click="selectConversation(conversation)"
          />
        </div>
      </div>

      <!-- 普通会话 -->
      <div class="conversations-section">
        <div class="conversation-items">
          <conversation-item
            v-for="conversation in normalConversations"
            :key="conversation.id"
            :conversation="conversation"
            :selected="currentConversation?.id === conversation.id"
            @click="selectConversation(conversation)"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && conversations.length === 0" class="empty-state">
        <el-empty :description="t('chat.noConversations')" />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useChatStore } from "@/store/chat";
import type { Conversation } from "@/types";
import ConversationItem from "@/components/chat/ConversationItem.vue";

const emit = defineEmits<{
  (e: "select", conversation: Conversation): void;
}>();

const { t } = useI18n();
const chatStore = useChatStore();

// 计算属性
const loading = computed(() => chatStore.loading);
const conversations = computed(() => chatStore.sortedConversations);
const currentConversation = computed(() => chatStore.currentConversation);

// 置顶会话
const pinnedConversations = computed(() =>
  conversations.value.filter((conv) => conv.isPinned)
);

// 普通会话
const normalConversations = computed(() =>
  conversations.value.filter((conv) => !conv.isPinned)
);

// 方法
const selectConversation = (conversation: Conversation) => {
  emit("select", conversation);
};
</script>

<style lang="scss" scoped>
.conversation-list {
  height: 100%;
  background-color: var(--el-bg-color);
  overflow-y: auto;

  .conversations-container {
    .conversations-section {
      &.pinned-section {
        margin-bottom: 16px;
        border-bottom: 1px solid var(--el-border-color-light);
      }

      .section-header {
        display: flex;
        align-items: center;
        padding: 4px 16px;
        background-color: var(--el-fill-color-light);

        .section-title {
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }

        .section-count {
          margin-left: 4px;
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }
      }

      .conversation-items {
        .conversation-item {
          border-radius: 0;
          margin: 0;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.selected {
            background-color: var(--el-color-primary-light-9);
          }
        }
      }
    }
  }

  .empty-state {
    padding: 40px 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .loading-state {
    padding: 16px;
  }
}
</style>
