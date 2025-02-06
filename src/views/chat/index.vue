<template>
  <div class="chat-container">
    <!-- 左侧会话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <el-avatar :src="currentUser?.avatar" :size="40">
          {{ currentUser?.name?.[0] }}
        </el-avatar>
        <el-dropdown trigger="click">
          <span class="user-name">{{ currentUser?.name }}</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <conversation-list
        :conversations="sortedConversations"
        :current-id="currentConversationId"
        @select="handleSelectConversation"
      />
    </div>
    
    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <template v-if="currentConversation">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <span class="conversation-name">
            {{ getConversationName(currentConversation) }}
          </span>
        </div>
        
        <!-- 消息列表 -->
        <message-list
          :messages="currentMessages"
          :loading="loadingMessages"
        />
        
        <!-- 消息输入框 -->
        <message-input @send="handleSendMessage" />
      </template>
      
      <div v-else class="chat-placeholder">
        <el-empty description="选择一个会话开始聊天" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import ConversationList from '@/components/chat/ConversationList.vue'
import MessageList from '@/components/chat/MessageList.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import type { Conversation } from '@/types'

const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()

// 计算属性
const currentUser = computed(() => userStore.currentUser)
const currentConversation = computed(() => chatStore.currentConversation)
const currentConversationId = computed(() => chatStore.currentConversationId)
const currentMessages = computed(() => chatStore.currentMessages)
const sortedConversations = computed(() => chatStore.sortedConversations)
const loadingMessages = computed(() => chatStore.loadingMessages)

// 方法
const handleSelectConversation = (conversationId: string) => {
  chatStore.setCurrentConversation(conversationId)
}

const handleSendMessage = (content: string) => {
  chatStore.sendMessage(content)
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const getConversationName = (conversation: Conversation) => {
  if (!currentUser.value) return ''
  
  // 如果是群聊
  if (conversation.isGrouped) {
    return conversation.name || '群聊'
  }
  
  // 如果是私聊,显示对方名称
  const otherUserId = conversation.users
    .split('#$')
    .find(id => id !== currentUser.value?.id)
  
  return otherUserId || ''
}

// 初始化
chatStore.initialize()
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: var(--bg-base);
  
  .chat-sidebar {
    width: 280px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border-base);
    background-color: var(--bg-lighter);
    
    .sidebar-header {
      display: flex;
      align-items: center;
      padding: var(--spacing-medium);
      border-bottom: 1px solid var(--border-base);
      
      .user-name {
        margin-left: var(--spacing-medium);
        font-size: 16px;
        color: var(--text-primary);
        cursor: pointer;
      }
    }
  }
  
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-lighter);
    
    .chat-header {
      padding: var(--spacing-medium);
      border-bottom: 1px solid var(--border-base);
      
      .conversation-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-primary);
      }
    }
    
    .chat-placeholder {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style> 