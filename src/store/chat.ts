import { defineStore } from "pinia";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { database } from "@/services/firebase";
import { getChatDB, ChatDatabase } from "@/services/db";
import { useUserStore } from "./user";
import type { Message, Conversation, ConversationUser } from "@/types";
import { MessageType, MessageStatus } from "@/types";
import {
  ref as dbRef,
  onValue,
  off,
  push,
  set,
  get,
  onDisconnect,
  type DatabaseReference,
  update,
  remove,
} from "firebase/database";
import { FirebaseConstants } from "@/services/firebase/config";
import { ElMessage } from "element-plus";
import { v4 as uuidv4 } from "uuid";
import { generalFileService, audioFileService } from "@/services/file";
import { ChatMessage } from "@/types/chat";

export const useChatStore = defineStore("chat", () => {
  // 状态
  const conversations = ref<Conversation[]>([]);
  const currentConversation = ref<Conversation | null>(null);
  const messages = ref<{ [key: string]: Message[] }>({});
  const users = ref<{ [key: string]: ConversationUser }>({});
  const loading = ref(false);
  const initialized = ref(false);
  const conversationRefs = ref<{ [key: string]: DatabaseReference }>({});

  // 添加分页相关状态
  const pageSize = 20;
  const hasMoreMessages = ref<{ [key: string]: boolean }>({});
  const oldestMessageTimestamp = ref<{ [key: string]: string }>({});

  const userStore = useUserStore();
  const chatDB = computed(() => {
    if (!userStore.currentUser?.id) {
      throw new Error("User not logged in");
    }
    return getChatDB(userStore.currentUser.id);
  });

  // 计算属性
  const currentMessages = computed(() => {
    if (!currentConversation.value) return [];
    return messages.value[currentConversation.value.id] || [];
  });

  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      // 首先按置顶状态排序
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // 然后按最后消息时间排序
      const aTime = a.lastMessage?.timestamp
        ? parseInt(a.lastMessage.timestamp)
        : 0;
      const bTime = b.lastMessage?.timestamp
        ? parseInt(b.lastMessage.timestamp)
        : 0;
      return bTime - aTime;
    });
  });

  // 方法
  const initialize = async () => {
    if (!userStore.currentUser?.id) {
      console.warn("Skipping chat store initialization - no user logged in");
      return;
    }

    if (initialized.value) {
      console.warn("Chat store already initialized");
      return;
    }

    try {
      loading.value = true;
      console.log(
        "[Chat] Initializing chat store for user:",
        userStore.currentUser.id
      );

      // 初始化数据库
      await chatDB.value.initialize();

      // 1. 从本地数据库加载会话
      const localConversations = await chatDB.value.getAllConversations();
      if (localConversations.length > 0) {
        console.log(
          "[Chat] Loaded local conversations:",
          localConversations.length
        );
        conversations.value = localConversations;
      }

      // 2. 监听用户的会话列表
      setupConversationListeners();

      // 3. 设置用户在线状态
      setupUserPresence();

      // 4. 设置消息更新事件监听
      setupMessageUpdateListener();

      initialized.value = true;
      console.log("[Chat] Chat store initialized");
    } catch (error) {
      console.error("[Chat] Failed to initialize chat store:", error);
      ElMessage.error("初始化聊天失败");
    } finally {
      loading.value = false;
    }
  };

  const setupConversationListeners = () => {
    if (!userStore.currentUser?.id) return;

    // 移除所有现有的监听器
    Object.values(conversationRefs.value).forEach((ref) => {
      off(ref);
    });
    conversationRefs.value = {};

    // 监听删除消息列表变化
    const deleteMessagesRef = dbRef(
      database,
      `${FirebaseConstants.TABLES.CONVERSATION_USER}/${userStore.currentUser.id}/${FirebaseConstants.FIELDS.DELETE_MESSAGES}`
    );

    // 添加删除消息监听
    onValue(deleteMessagesRef, async (snapshot) => {
      const deleteList = snapshot.val() || {};

      // 遍历需要删除的消息
      for (const [messageId, conversationId] of Object.entries(deleteList)) {
        try {
          // 获取消息
          const message = await chatDB.value.getMessage(messageId);
          if (message && message.conversationId === conversationId) {
            // 删除消息
            await deleteMessage(message);
          }
        } catch (error) {
          console.error("Failed to handle deleted message:", error);
        }
      }
    });

    // 只监听用户的会话列表
    const userConversationsRef = dbRef(
      database,
      `${FirebaseConstants.TABLES.CONVERSATION_USER}/${userStore.currentUser.id}/${FirebaseConstants.FIELDS.OBSERVE_CONVERSATIONS}`
    );

    onValue(userConversationsRef, async (snapshot) => {
      if (!initialized.value) return;

      const data = snapshot.val();
      if (!data) return;

      // 记录需要更新的会话ID和对应的未读计数
      const conversationsToUpdate = new Map<
        string,
        { otherUserId: string; unReadCount: number; isPinned: boolean }
      >();

      // 遍历所有观察的会话
      for (const [otherUserId, observeData] of Object.entries(data)) {
        const observeInfo = observeData as any;

        // 保存对方用户信息
        if (observeInfo.BQConversationUser) {
          const userInfo: ConversationUser = {
            id: otherUserId,
            name: observeInfo.BQConversationUser.name || "",
            avatar: observeInfo.BQConversationUser.avatar || "",
            status: "offline",
            isShop: observeInfo.BQConversationUser.isShop || false,
          };
          users.value[otherUserId] = userInfo;
        }
        // 获取会话信息
        const conversationId = observeInfo.BQConversation?.conversationId;
        if (!conversationId) continue;

        // 记录需要更新的会话
        conversationsToUpdate.set(conversationId, {
          otherUserId,
          unReadCount: observeInfo.BQConversation?.unReadCount || 0,
          isPinned: observeInfo.BQConversation?.isPinned || false, // 置顶状态 目前没有
        });
      }

      // 一次性获取所有需要更新的会话数据
      const updatePromises = Array.from(conversationsToUpdate.entries()).map(
        async ([conversationId, { otherUserId, unReadCount, isPinned }]) => {
          const conversationRef = dbRef(
            database,
            `${FirebaseConstants.TABLES.CONVERSATION}/${conversationId}`
          );

          const convSnapshot = await get(conversationRef);
          const conversation = convSnapshot.val();

          if (!conversation) {
            // 如果会话不存在，从列表中移除
            conversations.value = conversations.value.filter(
              (c) => c.id !== conversationId
            );
            return;
          }

          // 构造会话数据
          const senderId =
            conversation.senderId ?? userStore.currentUser?.id ?? "";
          const receiveId = conversation.receiveId ?? otherUserId ?? "";
          const users = conversation.users ?? `${senderId}#$${receiveId}`;
          const conversationData: Conversation = {
            id: conversationId,
            creator: conversation.creator || "",
            isGrouped: conversation.isGrouped || false,
            senderId: senderId,
            receiveId: receiveId,
            users: users,
            unReadCount: unReadCount,
            remark: conversation.remark,
            isPinned: isPinned,
          };

          // 获取最后一条消息
          if (conversation.BQConversationMessage) {
            const messages = Object.entries(conversation.BQConversationMessage);
            const lastMessage = messages.reduce((latest: any, current: any) => {
              const [, msg] = current;
              if (
                !latest ||
                parseInt(msg.timestamp) > parseInt(latest.timestamp)
              ) {
                return msg;
              }
              return latest;
            }, null);

            if (lastMessage) {
              // 检查是否需要更新消息状态
              const isNewMessage = !(await chatDB.value.getMessage(
                lastMessage.id
              ));
              const shouldUpdateStatus =
                lastMessage.senderId !== userStore.currentUser?.id &&
                lastMessage.status === MessageStatus.HAS_SENT;

              if (shouldUpdateStatus) {
                // 如果当前正在查看这个会话,设置为已读
                if (currentConversation.value?.id === conversationId) {
                  lastMessage.status = MessageStatus.IS_READ;
                  await updateMessageStatus(lastMessage, MessageStatus.IS_READ);
                } else {
                  // 否则设置为已接收
                  lastMessage.status = MessageStatus.RECEIVED;
                  await updateMessageStatus(
                    lastMessage,
                    MessageStatus.RECEIVED
                  );
                }
              }

              // 更新会话的最后一条消息
              conversationData.lastMessage = {
                id: lastMessage.id,
                content: lastMessage.content,
                type: lastMessage.type,
                status: lastMessage.status,
                timestamp: lastMessage.timestamp,
                realTimestamp: lastMessage.realTimestamp,
                deleteAt: lastMessage.deleteAt,
                recorderTime: lastMessage.recorderTime,
                senderId: lastMessage.senderId,
                conversationId: lastMessage.conversationId,
                filePath: lastMessage.filePath,
                fileName: lastMessage.fileName,
                fileSize: lastMessage.fileSize,
                referenceMessageId: lastMessage.referenceMessageId,
                referenceMessageType: lastMessage.referenceMessageType,
                referenceMessageContent: lastMessage.referenceMessageContent,
                referenceMessageSender: lastMessage.referenceMessageSender,
              };
              // 如果是新消息且需要保存到本地
              if (isNewMessage) {
                await chatDB.value.saveMessage(conversationData.lastMessage);
              }
            }
          }

          // 更新会话列表
          const index = conversations.value.findIndex(
            (c) => c.id === conversationId
          );
          if (index === -1) {
            conversations.value = [...conversations.value, conversationData];
          } else {
            const newConversations = [...conversations.value];
            newConversations[index] = conversationData;
            conversations.value = newConversations;
          }

          // 保存到本地数据库
          await chatDB.value.saveConversation(conversationData);
        }
      );

      // 等待所有更新完成
      await Promise.all(updatePromises);

      // 移除不再存在的会话
      const activeConversationIds = new Set(conversationsToUpdate.keys());
      conversations.value = conversations.value.filter((c) =>
        activeConversationIds.has(c.id)
      );
    });
  };

  // 设置用户在线状态
  const setupUserPresence = () => {
    if (!userStore.currentUser) return;

    // 直接指向 OBSERVE_STATUS 节点（无需 push 生成子节点）
    const userStatusRef = dbRef(
      database,
      `${FirebaseConstants.TABLES.CONVERSATION_USER}/${userStore.currentUser.id}/${FirebaseConstants.FIELDS.OBSERVE_STATUS}`
    );

    const connectedRef = dbRef(database, ".info/connected");

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // 直接设置 OBSERVE_STATUS 的值
        set(userStatusRef, {
          currentStatus: "online",
          lastSeen: Date.now(),
        });

        // 断开时更新为 offline
        onDisconnect(userStatusRef).update({
          currentStatus: "offline",
          lastSeen: Date.now(),
        });
      }
    });
  };

  // 修改 loadMessages 函数中处理消息的部分
  const loadMessages = async (conversationId: string, loadMore = false) => {
    try {
      loading.value = true;
      const messageMap = new Map<string, Message>();

      // 如果不是加载更多且已有消息,则直接返回
      if (!loadMore && messages.value[conversationId]) return;

      // 获取最早消息的时间戳作为分页标记
      const lastTimestamp = loadMore
        ? oldestMessageTimestamp.value[conversationId]
        : undefined;

      // 1. 从本地加载消息
      const localMessages = await chatDB.value.getMessagesByConversation(
        conversationId,
        pageSize,
        lastTimestamp
      );
      console.log("localMessages", localMessages);

      // 只有在实际获取到新消息时才更新 hasMoreMessages
      if (localMessages.length > 0) {
        hasMoreMessages.value[conversationId] =
          localMessages.length === pageSize;

        // 如果有消息,更新最早消息的时间戳
        const oldestMessage = localMessages[localMessages.length - 1];
        oldestMessageTimestamp.value[conversationId] = oldestMessage.timestamp;
      } else {
        // 如果没有获取到新消息，设置 hasMoreMessages 为 false
        hasMoreMessages.value[conversationId] = false;
      }

      // 将本地消息添加到 Map
      localMessages.forEach((msg) => {
        messageMap.set(msg.id, msg);
      });

      // 如果是加载更多,合并现有消息
      if (loadMore && messages.value[conversationId]) {
        messages.value[conversationId].forEach((msg) => {
          messageMap.set(msg.id, msg);
        });
      }

      // 更新消息列表
      messages.value[conversationId] = Array.from(messageMap.values()).sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
      );

      // 2. 设置 Firebase 监听 (只在首次加载时设置)
      if (!loadMore) {
        const messagesRef = dbRef(
          database,
          `${FirebaseConstants.TABLES.CONVERSATION}/${conversationId}/${FirebaseConstants.TABLES.CONVERSATION_MESSAGE}`
        );

        onValue(messagesRef, async (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          let hasChanges = false;
          const currentMessageMap = new Map(
            messages.value[conversationId]?.map((msg) => [msg.id, msg]) || []
          );

          for (const [messageId, rawMessage] of Object.entries(data)) {
            const msg = rawMessage as any;
            const existingMessage = currentMessageMap.get(messageId);

            if (existingMessage) {
              // 检查消息状态是否需要更新
              if (existingMessage.status !== msg.status) {
                const updatedMessage = {
                  ...existingMessage,
                  status: msg.status,
                };
                currentMessageMap.set(messageId, updatedMessage);
                await chatDB.value.saveMessage(updatedMessage);
                hasChanges = true;
              }
            } else {
              // 只处理新的消息(时间戳大于已加载的最新消息)
              const latestMessage = messages.value[conversationId]?.[0];
              if (
                !latestMessage ||
                parseInt(msg.timestamp) > parseInt(latestMessage.timestamp)
              ) {
                const newMessage: Message = {
                  id: messageId,
                  content: msg.content || "",
                  type: msg.type as MessageType,
                  status: msg.status as MessageStatus,
                  timestamp: msg.timestamp || "",
                  realTimestamp: msg.realTimestamp || 0,
                  deleteAt: msg.deleteAt || 0,
                  senderId: msg.senderId || "",
                  conversationId: msg.conversationId || "",
                  recorderTime: msg.recorderTime,
                  filePath: msg.filePath,
                  fileName: msg.fileName,
                  fileSize: msg.fileSize,
                  referenceMessageId: msg.referenceMessageId,
                  referenceMessageType: msg.referenceMessageType,
                  referenceMessageContent: msg.referenceMessageContent,
                  referenceMessageSender: msg.referenceMessageSender,
                  referenceMessageSenderId: msg.referenceMessageSenderId,
                };

                currentMessageMap.set(messageId, newMessage);
                await chatDB.value.saveMessage(newMessage);
                hasChanges = true;
              }
            }
          }

          // 只有在有变化时才更新消息列表
          if (hasChanges) {
            messages.value[conversationId] = Array.from(
              currentMessageMap.values()
            ).sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
          }
        });
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      ElMessage.error("加载消息失败");
    } finally {
      loading.value = false;
    }
  };

  const setCurrentConversation = async (conversation: Conversation) => {
    try {
      // 设置当前会话
      currentConversation.value = conversation;

      // 加载消息
      await loadMessages(conversation.id);

      // 更新CURRENT_CONNECTION
      const users = conversation.users.split("#$");
      const otherUserId =
        users.length > 1
          ? users.filter((user) => user !== userStore.currentUser?.id)[0]
          : conversation.senderId === userStore.currentUser?.id
            ? conversation.receiveId
            : conversation.senderId;
      await updateCurrentConnection(otherUserId);

      // 更新未读消息状态
      await updateUnreadMessages(conversation.id);

      // 重置未读计数
      if (conversation.unReadCount) {
        // 创建一个干净的会话对象副本
        const conversationToSave: Conversation = {
          id: conversation.id,
          creator: conversation.creator,
          isGrouped: conversation.isGrouped,
          senderId: conversation.senderId,
          receiveId: conversation.receiveId,
          users: conversation.users,
          unReadCount: 0,
          remark: conversation.remark,
          isPinned: conversation.isPinned,
        };

        // 如果有最后一条消息，创建一个干净的副本
        if (conversation.lastMessage) {
          conversationToSave.lastMessage = {
            id: conversation.lastMessage.id,
            content: conversation.lastMessage.content,
            type: conversation.lastMessage.type,
            status: conversation.lastMessage.status,
            timestamp: conversation.lastMessage.timestamp,
            realTimestamp: conversation.lastMessage.realTimestamp,
            deleteAt: conversation.lastMessage.deleteAt,
            senderId: conversation.lastMessage.senderId,
            conversationId: conversation.lastMessage.conversationId,
            recorderTime: conversation.lastMessage.recorderTime,
            filePath: conversation.lastMessage.filePath,
            fileName: conversation.lastMessage.fileName,
            fileSize: conversation.lastMessage.fileSize,
          };
        }

        // 更新本地未读计数
        await chatDB.value.saveConversation(conversationToSave);
        // 更新内存中的会话列表
        const index = conversations.value.findIndex(
          (c) => c.id === conversation.id
        );
        if (index !== -1) {
          const newConversations = [...conversations.value];
          newConversations[index] = conversationToSave;
          conversations.value = newConversations;
        }

        // 更新Firebase中的未读计数
        if (otherUserId) {
          const unreadCountRef = dbRef(
            database,
            `${FirebaseConstants.TABLES.CONVERSATION_USER}/${userStore.currentUser?.id}/${FirebaseConstants.FIELDS.OBSERVE_CONVERSATIONS}/${otherUserId}/${FirebaseConstants.TABLES.CONVERSATION}/${FirebaseConstants.FIELDS.UNREAD_COUNT}`
          );
          await set(unreadCountRef, 0);
        }
      }

      // 更新会话中所有未读消息的状态为已读
      const messagesRef = dbRef(
        database,
        `${FirebaseConstants.TABLES.CONVERSATION}/${conversation.id}/${FirebaseConstants.TABLES.CONVERSATION_MESSAGE}`
      );
      const snapshot = await get(messagesRef);
      const messages = snapshot.val();

      if (messages) {
        const updatePromises = Object.entries(messages)
          .filter(
            ([, msg]: [string, any]) =>
              msg.senderId !== userStore.currentUser?.id &&
              (msg.status === MessageStatus.HAS_SENT ||
                msg.status === MessageStatus.RECEIVED)
          )
          .map(async ([messageId, msg]: [string, any]) => {
            const statusRef = dbRef(
              database,
              `${FirebaseConstants.TABLES.CONVERSATION}/${conversation.id}/${FirebaseConstants.TABLES.CONVERSATION_MESSAGE}/${messageId}/status`
            );
            await set(statusRef, MessageStatus.IS_READ);

            // 同时更新本地消息状态
            const localMessage = await chatDB.value.getMessage(messageId);
            if (localMessage) {
              const messageToSave = {
                ...localMessage,
                status: MessageStatus.IS_READ,
              };
              await chatDB.value.saveMessage(messageToSave);
            }
          });

        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error("Failed to set current conversation:", error);
      throw error;
    }
  };

  interface SendMessageParams {
    chatMessage: ChatMessage;
    conversationId: string;
    referenceMessage?: Message;
  }

  const sendMessage = async ({
    chatMessage,
    conversationId,
    referenceMessage,
  }: SendMessageParams) => {
    if (!userStore.currentUser) throw new Error("User not logged in");

    const conversation = conversations.value.find(
      (c) => c.id === conversationId
    );
    if (!conversation) throw new Error("Conversation not found");

    const messageId = uuidv4().toUpperCase();
    const timestamp = Date.now();
    const message: Message = {
      id: messageId,
      conversationId,
      ...chatMessage,
      senderId: userStore.currentUser.id,
      timestamp: timestamp.toString(),
      realTimestamp: timestamp,
      status: MessageStatus.SENDING,
    };

    // 如果有引用消息,添加引用消息相关字段
    if (referenceMessage) {
      message.referenceMessageId = referenceMessage.id;
      message.referenceMessageType = referenceMessage.type;
      message.referenceMessageContent = referenceMessage.content;
      message.referenceMessageSender = referenceMessage.referenceMessageSender;
      message.referenceMessageSenderId =
        referenceMessage.referenceMessageSenderId;
    }

    // 保存消息到本地数据库
    await chatDB.value.saveMessage(message);

    // 更新会话的最后一条消息
    const conversationToSave = {
      ...conversation,
      lastMessage: message,
    };
    await chatDB.value.saveConversation(conversationToSave);

    // 更新内存中的会话列表
    const index = conversations.value.findIndex(
      (c) => c.id === conversation.id
    );
    if (index !== -1) {
      const newConversations = [...conversations.value];
      newConversations[index] = conversationToSave;
      conversations.value = newConversations;
    }

    // 获取对方用户ID
    const users = conversation.users.split("#$");
    const otherUserId = users.find((id) => id !== userStore.currentUser?.id);
    if (!otherUserId) throw new Error("Recipient not found");

    // 构建更新数据
    const updates: { [key: string]: any } = {};

    // 1. 更新消息
    updates[
      `${FirebaseConstants.TABLES.CONVERSATION}/${conversationId}/${FirebaseConstants.TABLES.CONVERSATION_MESSAGE}/${messageId}`
    ] = {
      ...message,
      status: MessageStatus.HAS_SENT,
    };

    // 2. 更新会话时间戳
    updates[
      `${FirebaseConstants.TABLES.CONVERSATION}/${conversationId}/timestamp`
    ] = timestamp;

    // 3. 更新对方的未读消息计数
    const unreadCountPath = `${FirebaseConstants.TABLES.CONVERSATION_USER}/${otherUserId}/${FirebaseConstants.FIELDS.OBSERVE_CONVERSATIONS}/${userStore.currentUser.id}/${FirebaseConstants.TABLES.CONVERSATION}/${FirebaseConstants.FIELDS.UNREAD_COUNT}`;

    // 获取当前未读数
    const unreadCountRef = dbRef(database, unreadCountPath);
    const unreadCountSnap = await get(unreadCountRef);
    const currentUnreadCount = unreadCountSnap.exists()
      ? unreadCountSnap.val()
      : 0;

    updates[unreadCountPath] = currentUnreadCount + 1;

    // 一次性更新所有数据
    await update(dbRef(database), updates);

    return message;
  };

  const clearMessages = async (conversationId: string) => {
    try {
      // 1. 清除 Firebase 中的消息
      const messagesRef = dbRef(
        database,
        `${FirebaseConstants.TABLES.CONVERSATION}/${conversationId}/${FirebaseConstants.TABLES.CONVERSATION_MESSAGE}`
      );
      await set(messagesRef, null);

      // 2. 清除本地数据库中的消息
      const localMessages =
        await chatDB.value.getMessagesByConversation(conversationId);
      await Promise.all(
        localMessages.map((message) => chatDB.value.deleteMessage(message.id))
      );

      // 3. 清除内存中的消息
      messages.value[conversationId] = [];
    } catch (error) {
      console.error("Failed to clear messages:", error);
      throw error;
    }
  };

  const cleanup = async () => {
    try {
      // 清除CURRENT_CONNECTION
      await updateCurrentConnection(null);

      // 清理内存中的数据
      conversations.value = [];
      currentConversation.value = null;
      messages.value = {};
      users.value = {};
      initialized.value = false;

      // 关闭数据库连接
      // 注意:这里只是关闭连接,不删除数据,以便将来可以重新加载
      if (userStore.currentUser?.id) {
        ChatDatabase.clearInstance(userStore.currentUser.id);
      }

      // 移除所有 Firebase 监听
      if (userStore.currentUser?.id) {
        const userConversationsRef = dbRef(
          database,
          `${FirebaseConstants.TABLES.CONVERSATION_USER}/${userStore.currentUser.id}/${FirebaseConstants.FIELDS.OBSERVE_CONVERSATIONS}`
        );
        off(userConversationsRef);
        // 强制设置为离线状态
        await set(userConversationsRef, {
          currentStatus: "offline",
          lastSeen: Date.now(),
        });
      }

      // 移除所有会话的监听
      Object.values(conversationRefs.value).forEach((ref) => {
        off(ref);
      });
      conversationRefs.value = {};
    } catch (error) {
      console.error("Failed to cleanup:", error);
    }
  };

  // 更新消息状态到Firebase
  const updateMessageStatus = async (
    message: Message,
    newStatus: MessageStatus
  ) => {
    if (!userStore.currentUser?.id) return;

    const statusRef = dbRef(
      database,
      `${FirebaseConstants.TABLES.CONVERSATION}/${message.conversationId}/${FirebaseConstants.TABLES.CONVERSATION_MESSAGE}/${message.id}/status`
    );

    await set(statusRef, newStatus);
  };

  // 更新当前连接状态
  const updateCurrentConnection = async (userId: string | null) => {
    if (!userStore.currentUser?.id) return;

    const connectionRef = dbRef(
      database,
      `${FirebaseConstants.TABLES.CONVERSATION_USER}/${userStore.currentUser.id}/${FirebaseConstants.FIELDS.CURRENT_CONNECTION}`
    );

    await set(connectionRef, userId);
  };

  // 更新未读消息状态
  const updateUnreadMessages = async (conversationId: string) => {
    if (!userStore.currentUser?.id) return;

    const messagesList = messages.value[conversationId] || [];
    const updatePromises = messagesList
      .filter(
        (msg) =>
          msg.senderId !== userStore.currentUser?.id &&
          (msg.status === MessageStatus.HAS_SENT ||
            msg.status === MessageStatus.RECEIVED)
      )
      .map(async (msg) => {
        // 创建一个新的消息对象，而不是直接修改原对象
        const messageToSave: Message = {
          id: msg.id,
          content: msg.content,
          type: msg.type,
          status: MessageStatus.IS_READ,
          timestamp: msg.timestamp,
          realTimestamp: msg.realTimestamp,
          deleteAt: msg.deleteAt,
          senderId: msg.senderId,
          conversationId: msg.conversationId,
          recorderTime: msg.recorderTime,
          filePath: msg.filePath,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
        };

        // 更新本地消息状态
        await chatDB.value.saveMessage(messageToSave);

        // 更新内存中的消息状态
        msg.status = MessageStatus.IS_READ;

        // 同步到Firebase
        await updateMessageStatus(messageToSave, MessageStatus.IS_READ);
      });

    await Promise.all(updatePromises);
  };

  const setHasMoreMessages = (conversationId: string, value: boolean) => {
    hasMoreMessages.value[conversationId] = value;
  };

  const deleteMessage = async (message: Message) => {
    try {
      // Delete from local database
      await chatDB.value.deleteMessage(message.id);

      // Clean up local files based on message type
      if (message.type === MessageType.AUDIO) {
        const fileName = message.content.split("/").pop();
        if (fileName) {
          await audioFileService.clearFile(fileName);
        }
      } else if (
        message.type === MessageType.IMAGE ||
        message.type === MessageType.PDF
      ) {
        const fileName = message.content.split("/").pop();
        if (fileName) {
          await generalFileService.clearFile(fileName);
        }
      }

      // Remove message from messages list
      if (messages.value[message.conversationId]) {
        messages.value[message.conversationId] = messages.value[
          message.conversationId
        ].filter((m) => m.id !== message.id);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      throw error;
    }
  };

  //撤回消息
  const undoMessage = async (message: Message) => {
    try {
      // 检查是否是自己发送的消息
      if (message.senderId !== userStore.currentUser?.id) {
        throw new Error("Can only undo your own messages");
      }

      // 检查是否在2小时内
      const messageTime = parseInt(message.timestamp);
      const now = Date.now();
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      if (now - messageTime > twoHoursInMs) {
        throw new Error("Can only undo messages within 2 hours");
      }

      // 从本地数据库中删除消息
      await deleteMessage(message);

      // 从Firebase中删除消息
      const messageRef = dbRef(
        database,
        `${FirebaseConstants.TABLES.CONVERSATION}/${message.conversationId}/${FirebaseConstants.TABLES.CONVERSATION_MESSAGE}/${message.id}`
      );
      await remove(messageRef);

      // 获取对方用户ID
      const conversation = conversations.value.find(
        (c) => c.id === message.conversationId
      );
      if (!conversation) throw new Error("Conversation not found");

      let otherUserId =
        conversation.receiveId !== userStore.currentUser?.id
          ? conversation.receiveId
          : conversation.senderId;
      const users = conversation.users.split("#$");
      if (users.length > 1) {
        const otherUserId = users.find(
          (id) => id !== userStore.currentUser?.id
        );
        if (!otherUserId || otherUserId.length === 0)
          throw new Error("Recipient not found");
      }

      // 获取对方的deleteMessage列表
      const deleteMessageRef = dbRef(
        database,
        `${FirebaseConstants.TABLES.CONVERSATION_USER}/${otherUserId}/${FirebaseConstants.FIELDS.DELETE_MESSAGES}`
      );

      const snapshot = await get(deleteMessageRef);
      const currentDeleteList = snapshot.val() || {};

      // 添加消息到对方的删除列表
      currentDeleteList[message.id] = message.conversationId;

      // 更新对方的删除列表
      await set(deleteMessageRef, currentDeleteList);
    } catch (error) {
      console.error("Failed to undo message:", error);
      throw error;
    }
  };

  // 更新消息
  const updateMessage = async (
    messageId: string,
    updates: Partial<Message>
  ) => {
    // 找到消息所在的会话
    const conversation = conversations.value.find(
      (conv) =>
        conv.lastMessage?.id === messageId ||
        messages.value[conv.id]?.some((msg) => msg.id === messageId)
    );

    if (!conversation) return;

    // 更新内存中的消息
    if (messages.value[conversation.id]) {
      const messageIndex = messages.value[conversation.id].findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex !== -1) {
        const updatedMessage = {
          ...messages.value[conversation.id][messageIndex],
          ...updates,
        };
        messages.value[conversation.id][messageIndex] = updatedMessage;

        // 如果是最后一条消息,也更新会话的最后一条消息
        if (conversation.lastMessage?.id === messageId) {
          conversation.lastMessage = updatedMessage;
        }

        // 保存到本地数据库
        await chatDB.value.saveMessage(updatedMessage);
      }
    }
  };

  // 设置消息更新事件监听
  const setupMessageUpdateListener = () => {
    window.addEventListener("message-update", ((event: CustomEvent) => {
      const { messageId, updates } = event.detail;
      updateMessage(messageId, updates);
    }) as EventListener);
  };

  // 在 store 初始化时设置监听器
  onMounted(() => {
    setupMessageUpdateListener();
  });

  onUnmounted(() => {
    window.removeEventListener("message-update", ((event: CustomEvent) => {
      const { messageId, updates } = event.detail;
      updateMessage(messageId, updates);
    }) as EventListener);
  });

  return {
    conversations,
    currentConversation,
    messages,
    users,
    loading,
    initialized,
    currentMessages,
    sortedConversations,
    initialize,
    loadMessages,
    setCurrentConversation,
    sendMessage,
    clearMessages,
    cleanup,
    hasMoreMessages,
    setHasMoreMessages,
    deleteMessage,
    undoMessage,
  };
});
