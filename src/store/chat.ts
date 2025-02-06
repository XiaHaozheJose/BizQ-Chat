import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, Conversation } from '@/types'
import { ChatFirebaseService } from '@/services/firebase/chat'
import { useUserStore } from './user'
import { generateUUID } from '@/utils'

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore()
  const firebase = new ChatFirebaseService()
  
  // 状态
  const conversations = ref<Record<string, Conversation>>({})
  const messages = ref<Record<string, Record<string, Message>>>({})
  const currentConversationId = ref<string | null>(null)
  const loadingMessages = ref(false)
  
  // 计算属性
  const currentConversation = computed(() => 
    currentConversationId.value ? conversations.value[currentConversationId.value] : null
  )
  
  const currentMessages = computed(() => {
    if (!currentConversationId.value) return []
    
    const conversationMessages = messages.value[currentConversationId.value] || {}
    return Object.values(conversationMessages).sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    )
  })
  
  const sortedConversations = computed(() => 
    Object.values(conversations.value).sort(
      (a, b) => {
        const aLastMessage = messages.value[a.id]?.[Object.keys(messages.value[a.id] || {}).pop() || '']
        const bLastMessage = messages.value[b.id]?.[Object.keys(messages.value[b.id] || {}).pop() || '']
        
        if (!aLastMessage) return 1
        if (!bLastMessage) return -1
        
        return Number(bLastMessage.timestamp) - Number(aLastMessage.timestamp)
      }
    )
  )
  
  // 方法
  const updateConversations = (newConversations: Conversation[]) => {
    newConversations.forEach(conv => {
      conversations.value[conv.id] = conv
    })
  }
  
  const updateMessages = (conversationId: string, newMessages: Message[]) => {
    if (!messages.value[conversationId]) {
      messages.value[conversationId] = {}
    }
    
    newMessages.forEach(msg => {
      messages.value[conversationId][msg.id] = msg
    })
  }
  
  const setCurrentConversation = (conversationId: string | null) => {
    currentConversationId.value = conversationId
    
    if (conversationId) {
      firebase.listenToMessages(conversationId)
    }
  }
  
  const sendMessage = async (content: string, type: string = 'text') => {
    if (!currentConversationId.value || !userStore.currentUser) return
    
    const message: Message = {
      id: generateUUID(),
      conversationId: currentConversationId.value,
      content,
      type,
      status: 'sending',
      senderId: userStore.currentUser.id,
      timestamp: Date.now().toString(),
      deleteAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7天后删除
    }
    
    // 更新本地状态
    if (!messages.value[message.conversationId]) {
      messages.value[message.conversationId] = {}
    }
    messages.value[message.conversationId][message.id] = message
    
    try {
      // 发送到Firebase
      await firebase.sendMessage(message)
      message.status = 'sent'
    } catch (error) {
      console.error('Failed to send message:', error)
      message.status = 'failed'
    }
    
    // 更新消息状态
    messages.value[message.conversationId][message.id] = message
  }
  
  const createConversation = async (targetUserId: string): Promise<Conversation> => {
    if (!userStore.currentUser) throw new Error('User not logged in')
    
    const conversation: Conversation = {
      id: generateUUID(),
      creator: userStore.currentUser.id,
      isGrouped: false,
      receiveId: targetUserId,
      senderId: userStore.currentUser.id,
      users: `${userStore.currentUser.id}#$${targetUserId}`,
    }
    
    await firebase.createConversation(conversation)
    conversations.value[conversation.id] = conversation
    
    return conversation
  }
  
  // 初始化
  const initialize = () => {
    firebase.listenToConversations()
  }
  
  return {
    conversations,
    messages,
    currentConversationId,
    currentConversation,
    currentMessages,
    sortedConversations,
    loadingMessages,
    updateConversations,
    updateMessages,
    setCurrentConversation,
    sendMessage,
    createConversation,
    initialize,
  }
}) 