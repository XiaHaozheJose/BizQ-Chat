import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { chatService } from "@/services/firebase/chat";
import { chatDB } from "@/services/db";
import { useUserStore } from "./user";
import type { Message, Conversation } from "@/types/chat";

export const useChatStore = defineStore("chat", () => {
  const userStore = useUserStore();
  const currentConversationId = ref<string | null>(null);
  const conversations = ref<Conversation[]>([]);
  const messages = ref<{ [key: string]: Message[] }>({});
  const loading = ref(false);

  // 计算属性
  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentConversationId.value)
  );

  const currentMessages = computed(
    () => messages.value[currentConversationId.value || ""] || []
  );

  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      const timeA = a.lastMessage?.realTimestamp || 0;
      const timeB = b.lastMessage?.realTimestamp || 0;
      return timeB - timeA;
    });
  });

  // 初始化
  const initialize = async () => {
    if (!userStore.currentUser?.id) return;

    chatService.setCurrentUserId(userStore.currentUser.id);
    chatService.observeConversations(handleConversationsUpdate);
    chatService.observeDeleteMessages(handleMessagesDelete);
    await chatService.updateUserStatus("online");
  };

  // 会话更新处理
  const handleConversationsUpdate = async (data: any) => {
    const conversationsList: Conversation[] = [];
    for (const [userId, userConversations] of Object.entries(data)) {
      const conversation = (userConversations as any).conversation;
      if (conversation) {
        conversationsList.push({
          ...conversation,
          unReadCount: (userConversations as any).unReadCount || 0,
        });
        // 保存到本地数据库
        await chatDB.saveConversation(conversation);
      }
    }
    conversations.value = conversationsList;
  };

  // 消息删除处理
  const handleMessagesDelete = async (data: any) => {
    for (const [conversationId, messageIds] of Object.entries(data)) {
      if (Array.isArray(messageIds)) {
        for (const messageId of messageIds) {
          await chatDB.deleteMessage(messageId);
          if (messages.value[conversationId]) {
            messages.value[conversationId] = messages.value[
              conversationId
            ].filter((m) => m.id !== messageId);
          }
        }
      }
    }
  };

  // 设置当前会话
  const setCurrentConversation = async (conversation: Conversation) => {
    currentConversationId.value = conversation.id;
    // 加载消息
    const storedMessages = await chatDB.getMessagesByConversation(
      conversation.id
    );
    messages.value[conversation.id] = storedMessages;
    // 更新未读数
    if (conversation.unReadCount > 0) {
      await chatService.updateConversationUnreadCount(
        conversation.id,
        conversation.receiveId
      );
    }
  };

  // 发送消息
  const sendMessage = async (params: {
    content: string;
    type: string;
    conversationId: string;
  }) => {
    if (!userStore.currentUser?.id) return;

    await chatService.sendMessage(params.conversationId, {
      content: params.content,
      type: params.type,
      senderId: userStore.currentUser.id,
    });
  };

  // 发送图片
  const sendImage = async (file: File) => {
    if (!currentConversationId.value || !userStore.currentUser?.id) return;

    loading.value = true;
    try {
      // TODO: 实现图片上传
      const imageUrl = "";
      await sendMessage({
        content: imageUrl,
        type: "image",
        conversationId: currentConversationId.value,
      });
    } finally {
      loading.value = false;
    }
  };

  // 发送文件
  const sendFile = async (file: File) => {
    if (!currentConversationId.value || !userStore.currentUser?.id) return;

    loading.value = true;
    try {
      // TODO: 实现文件上传
      const fileUrl = "";
      await sendMessage({
        content: fileUrl,
        type: "file",
        conversationId: currentConversationId.value,
      });
    } finally {
      loading.value = false;
    }
  };

  // 创建或获取会话
  const getOrCreateConversation = async (userId: string) => {
    if (!userStore.currentUser?.id) return null;

    // 先查找现有会话
    const existingConversation = conversations.value.find(
      (c) =>
        c.users.includes(userId) && c.users.includes(userStore.currentUser!.id)
    );

    if (existingConversation) {
      return existingConversation;
    }

    // 创建新会话
    const conversationId = await chatService.createConversation(userId);
    if (!conversationId) return null;

    // 等待会话创建完成
    return new Promise<Conversation | null>((resolve) => {
      const unsubscribe = chatService.observeConversations((data) => {
        const newConversation = Object.values(data).find(
          (c: any) => c.conversation?.id === conversationId
        );
        if (newConversation) {
          unsubscribe();
          resolve(newConversation.conversation);
        }
      });

      // 5秒后超时
      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  };

  // 清空消息
  const clearMessages = async (conversationId: string) => {
    if (!messages.value[conversationId]) return;

    for (const message of messages.value[conversationId]) {
      await chatDB.deleteMessage(message.id);
    }
    messages.value[conversationId] = [];
  };

  // 清理
  const cleanup = () => {
    chatService.cleanup();
    currentConversationId.value = null;
    conversations.value = [];
    messages.value = {};
  };

  return {
    currentConversation,
    currentMessages,
    sortedConversations,
    loading,
    initialize,
    setCurrentConversation,
    sendMessage,
    sendImage,
    sendFile,
    getOrCreateConversation,
    clearMessages,
    cleanup,
  };
});
