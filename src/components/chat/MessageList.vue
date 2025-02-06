<template>
  <div class="message-list">
    <el-scrollbar ref="scrollbarRef" view-class="message-list-view">
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="3" animated />
      </div>
      
      <template v-else>
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ 'is-self': message.senderId === currentUser?.id }"
        >
          <div class="message-time" v-if="shouldShowTime(message)">
            {{ formatTime(message.timestamp) }}
          </div>
          
          <div class="message-content">
            <el-avatar
              :size="36"
              class="avatar"
              :class="{ 'is-self': message.senderId === currentUser?.id }"
            >
              {{ message.senderId[0] }}
            </el-avatar>
            
            <message-bubble
              :message="message"
              :is-self="message.senderId === currentUser?.id"
            />
          </div>
        </div>
      </template>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { formatTime } from '@/utils'
import type { Message } from '@/types'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  messages: Message[]
  loading?: boolean
}>()

const userStore = useUserStore()
const currentUser = computed(() => userStore.currentUser)

const scrollbarRef = ref()
const lastMessageId = ref('')

// 监听消息变化,自动滚动到底部
watch(
  () => props.messages,
  async (messages) => {
    if (!messages.length) return
    
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.id === lastMessageId.value) return
    
    lastMessageId.value = lastMessage.id
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)

// 滚动到底部
const scrollToBottom = () => {
  const scrollbar = scrollbarRef.value
  if (!scrollbar) return
  
  const { wrap } = scrollbar
  wrap.scrollTop = wrap.scrollHeight
}

// 判断是否显示时间
const shouldShowTime = (message: Message) => {
  const index = props.messages.findIndex(m => m.id === message.id)
  if (index === 0) return true
  
  const prevMessage = props.messages[index - 1]
  const timeDiff = Number(message.timestamp) - Number(prevMessage.timestamp)
  
  // 超过5分钟显示时间
  return timeDiff > 5 * 60 * 1000
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.message-list {
  flex: 1;
  overflow: hidden;
  padding: var(--spacing-medium);
  
  .message-list-view {
    min-height: 100%;
  }
  
  .loading-wrapper {
    padding: var(--spacing-medium);
  }
  
  .message-item {
    margin-bottom: var(--spacing-medium);
    
    .message-time {
      text-align: center;
      margin: var(--spacing-medium) 0;
      color: var(--text-secondary);
      font-size: 12px;
    }
    
    .message-content {
      display: flex;
      align-items: flex-start;
      
      &.is-self {
        flex-direction: row-reverse;
        
        .avatar {
          margin-left: var(--spacing-medium);
          margin-right: 0;
        }
      }
      
      .avatar {
        flex-shrink: 0;
        margin-right: var(--spacing-medium);
      }
    }
  }
}
</style> 