<template>
  <div class="conversation-list">
    <el-scrollbar>
      <div
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ active: conversation.id === currentId }"
        @click="$emit('select', conversation.id)"
      >
        <el-avatar :size="40" class="avatar">
          {{ getConversationAvatar(conversation) }}
        </el-avatar>
        
        <div class="conversation-info">
          <div class="name-time">
            <span class="name">{{ getConversationName(conversation) }}</span>
            <span class="time">{{ getLastMessageTime(conversation) }}</span>
          </div>
          
          <div class="message-badge">
            <span class="last-message">{{ getLastMessage(conversation) }}</span>
            <el-badge
              v-if="conversation.unreadCount"
              :value="conversation.unreadCount"
              :max="99"
              class="unread-badge"
            />
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useChatStore } from '@/store/chat'
import { formatTime } from '@/utils'
import type { Conversation } from '@/types'

defineProps<{
  conversations: Conversation[]
  currentId: string | null
}>()

defineEmits<{
  (e: 'select', id: string): void
}>()

const userStore = useUserStore()
const chatStore = useChatStore()

const currentUser = computed(() => userStore.currentUser)

// 获取会话头像
const getConversationAvatar = (conversation: Conversation) => {
  if (conversation.isGrouped) {
    return '群'
  }
  
  const otherUserId = conversation.users
    .split('#$')
    .find(id => id !== currentUser.value?.id)
  
  return otherUserId?.[0] || '?'
}

// 获取会话名称
const getConversationName = (conversation: Conversation) => {
  if (conversation.isGrouped) {
    return conversation.name || '群聊'
  }
  
  const otherUserId = conversation.users
    .split('#$')
    .find(id => id !== currentUser.value?.id)
  
  return otherUserId || ''
}

// 获取最后一条消息时间
const getLastMessageTime = (conversation: Conversation) => {
  const messages = chatStore.messages[conversation.id]
  if (!messages) return ''
  
  const lastMessage = Object.values(messages).sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  )[0]
  
  return lastMessage ? formatTime(lastMessage.timestamp) : ''
}

// 获取最后一条消息内容
const getLastMessage = (conversation: Conversation) => {
  const messages = chatStore.messages[conversation.id]
  if (!messages) return ''
  
  const lastMessage = Object.values(messages).sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  )[0]
  
  if (!lastMessage) return ''
  
  switch (lastMessage.type) {
    case 'text':
      return lastMessage.content
    case 'image':
      return '[图片]'
    case 'voice':
      return '[语音]'
    case 'video':
      return '[视频]'
    case 'file':
      return '[文件]'
    case 'location':
      return '[位置]'
    default:
      return '[未知消息]'
  }
}
</script>

<style lang="scss" scoped>
.conversation-list {
  flex: 1;
  overflow: hidden;
  
  .conversation-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-medium);
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--bg-base);
    }
    
    &.active {
      background-color: var(--bg-base);
    }
    
    .avatar {
      flex-shrink: 0;
    }
    
    .conversation-info {
      flex: 1;
      margin-left: var(--spacing-medium);
      min-width: 0;
      
      .name-time {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        
        .name {
          font-weight: 500;
          color: var(--text-primary);
          @include text-ellipsis;
        }
        
        .time {
          flex-shrink: 0;
          margin-left: var(--spacing-small);
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
      
      .message-badge {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .last-message {
          color: var(--text-regular);
          font-size: 13px;
          @include text-ellipsis;
        }
        
        .unread-badge {
          flex-shrink: 0;
          margin-left: var(--spacing-small);
        }
      }
    }
  }
}

@mixin text-ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style> 