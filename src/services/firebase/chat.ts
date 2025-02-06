import { ref, onValue, set, get, query, orderByChild, equalTo } from 'firebase/database'
import { database } from './config'
import type { Message, Conversation } from '@/types'
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'

const firebasePaths = {
  conversations: 'BQConversation',
  users: 'BQConversationUser',
}

export class ChatFirebaseService {
  private chatStore = useChatStore()
  private userStore = useUserStore()
  
  // 监听会话列表
  listenToConversations() {
    const userId = this.userStore.currentUser?.id
    if (!userId) return
    
    const conversationsRef = ref(database, firebasePaths.conversations)
    onValue(conversationsRef, (snapshot) => {
      const conversations: Conversation[] = []
      
      snapshot.forEach((child) => {
        const conv = child.val()
        if (conv.users.includes(userId)) {
          conversations.push({
            id: child.key!,
            ...conv,
          })
        }
      })
      
      this.chatStore.updateConversations(conversations)
    })
  }
  
  // 监听会话消息
  listenToMessages(conversationId: string) {
    const messagesRef = ref(
      database,
      `${firebasePaths.conversations}/${conversationId}/BQConversationMessage`
    )
    
    onValue(messagesRef, (snapshot) => {
      const messages: Message[] = []
      
      snapshot.forEach((child) => {
        messages.push({
          id: child.key!,
          ...child.val(),
        })
      })
      
      this.chatStore.updateMessages(conversationId, messages)
    })
  }
  
  // 发送消息
  async sendMessage(message: Message) {
    const messageRef = ref(
      database,
      `${firebasePaths.conversations}/${message.conversationId}/BQConversationMessage/${message.id}`
    )
    
    await set(messageRef, message)
  }
  
  // 更新消息状态
  async updateMessageStatus(conversationId: string, messageId: string, status: string) {
    const statusRef = ref(
      database,
      `${firebasePaths.conversations}/${conversationId}/BQConversationMessage/${messageId}/status`
    )
    
    await set(statusRef, status)
  }
  
  // 创建新会话
  async createConversation(conversation: Conversation) {
    const conversationRef = ref(
      database,
      `${firebasePaths.conversations}/${conversation.id}`
    )
    
    await set(conversationRef, conversation)
  }
  
  // 获取用户在线状态
  async getUserStatus(userId: string) {
    const statusRef = ref(
      database,
      `${firebasePaths.users}/${userId}/observeStatus/currentStatus`
    )
    
    const snapshot = await get(statusRef)
    return snapshot.val() || 'offline'
  }
  
  // 更新用户在线状态
  async updateUserStatus(status: 'online' | 'offline') {
    const userId = this.userStore.currentUser?.id
    if (!userId) return
    
    const statusRef = ref(
      database,
      `${firebasePaths.users}/${userId}/observeStatus/currentStatus`
    )
    
    await set(statusRef, status)
  }
  
  // 获取会话未读消息数
  async getUnreadCount(conversationId: string) {
    const messagesRef = ref(
      database,
      `${firebasePaths.conversations}/${conversationId}/BQConversationMessage`
    )
    
    const unreadQuery = query(
      messagesRef,
      orderByChild('status'),
      equalTo('received')
    )
    
    const snapshot = await get(unreadQuery)
    return snapshot.size
  }
} 