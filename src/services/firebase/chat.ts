import {
  ref,
  onValue,
  off,
  query,
  limitToLast,
  set,
  remove,
  get,
  push,
  DatabaseReference,
} from "firebase/database";
import { database } from "./index";
import { FirebaseConstants } from "./config";
import type { Message, Conversation, ConversationUser } from "@/types/chat";

const {
  TABLES: { CONVERSATION, CONVERSATION_MESSAGE, CONVERSATION_USER },
  FIELDS,
  MESSAGE_STATUS,
  MESSAGE_TYPE,
  USER_STATUS,
  SEPARATOR,
} = FirebaseConstants;

export class ChatService {
  private static instance: ChatService;
  private currentUserId: string | null = null;
  private conversationObservers: { [key: string]: () => void } = {};
  private deleteMessageObserver: (() => void) | null = null;
  private lastUpdateTimestamp: number = 0;
  private readonly minimumUpdateInterval: number = 500; // 500ms
  private readonly pageSize: number = 20;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // 设置当前用户ID
  public setCurrentUserId(userId: string) {
    this.currentUserId = userId;
  }

  // 监听会话列表变化
  public observeConversations(callback: (data: any) => void) {
    if (!this.currentUserId) return;

    const userConversationsRef = ref(
      database,
      `${CONVERSATION_USER}/${this.currentUserId}/${FIELDS.OBSERVE_CONVERSATIONS}`
    );

    const observer = onValue(userConversationsRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });

    // 保存清理函数
    this.conversationObservers[this.currentUserId] = () =>
      off(userConversationsRef);
  }

  // 监听消息删除
  public observeDeleteMessages(callback: (data: any) => void) {
    if (!this.currentUserId) return;

    const deleteMessagesRef = ref(
      database,
      `${CONVERSATION_USER}/${this.currentUserId}/${FIELDS.DELETE_MESSAGES}`
    );

    const observer = onValue(deleteMessagesRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });

    this.deleteMessageObserver = () => off(deleteMessagesRef);
  }

  // 更新用户状态
  public async updateUserStatus(status: keyof typeof USER_STATUS) {
    if (!this.currentUserId) return;

    const statusRef = ref(
      database,
      `${CONVERSATION_USER}/${this.currentUserId}/${FIELDS.OBSERVE_STATUS}/${FIELDS.CURRENT_STATUS}`
    );

    await set(statusRef, status);
  }

  // 更新用户连接状态
  public async updateUserConnection(destinationId: string) {
    if (!this.currentUserId) return;

    const connectionRef = ref(
      database,
      `${CONVERSATION_USER}/${this.currentUserId}/${FIELDS.CURRENT_CONNECTION}`
    );

    await set(connectionRef, destinationId);
  }

  // 发送消息
  public async sendMessage(
    conversationId: string,
    message: {
      content: string;
      type: keyof typeof MESSAGE_TYPE;
      senderId: string;
    }
  ) {
    const messageRef = ref(
      database,
      `${CONVERSATION}/${conversationId}/${CONVERSATION_MESSAGE}`
    );
    const newMessageRef = push(messageRef);

    const timestamp = Date.now();
    await set(newMessageRef, {
      ...message,
      id: newMessageRef.key,
      status: MESSAGE_STATUS.SENDING,
      timestamp: timestamp.toString(),
      realTimestamp: timestamp,
      deleteAt: timestamp + 24 * 60 * 60 * 1000, // 24小时后删除
    });
  }

  // 删除消息
  public async deleteMessage(conversationId: string, messageId: string) {
    if (!this.currentUserId) return;

    const messageRef = ref(
      database,
      `${CONVERSATION}/${conversationId}/${CONVERSATION_MESSAGE}/${messageId}`
    );
    await remove(messageRef);
  }

  // 创建新会话
  public async createConversation(
    receiverId: string,
    isGrouped: boolean = false
  ) {
    if (!this.currentUserId) return null;

    const users = [this.currentUserId, receiverId].sort().join(SEPARATOR);
    const conversationRef = ref(database, `${CONVERSATION}`);
    const newConversationRef = push(conversationRef);

    await set(newConversationRef, {
      id: newConversationRef.key,
      creator: this.currentUserId,
      isGrouped,
      senderId: this.currentUserId,
      receiveId: receiverId,
      users,
    });

    return newConversationRef.key;
  }

  // 更新会话未读数
  public async updateConversationUnreadCount(
    conversationId: string,
    receiverId: string
  ) {
    if (!this.currentUserId) return;

    const unreadRef = ref(
      database,
      `${CONVERSATION_USER}/${this.currentUserId}/${FIELDS.OBSERVE_CONVERSATIONS}/${receiverId}/${CONVERSATION}`
    );

    await set(unreadRef, {
      conversationId,
      unReadCount: 0,
    });
  }

  // 清理所有监听器
  public cleanup() {
    // 清理会话监听器
    Object.values(this.conversationObservers).forEach((cleanup) => cleanup());
    this.conversationObservers = {};

    // 清理删除消息监听器
    if (this.deleteMessageObserver) {
      this.deleteMessageObserver();
      this.deleteMessageObserver = null;
    }
  }
}

// 导出单例实例
export const chatService = ChatService.getInstance();
