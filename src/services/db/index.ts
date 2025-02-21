import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Message, Conversation } from "@/types";

interface ChatDBSchema extends DBSchema {
  conversation_users: {
    key: string;
    value: {
      id: string;
      name: string;
      avatar: string;
      status: string;
      lastSeen?: number;
      remark?: string;
    };
    indexes: { "by-name": string };
  };

  conversations: {
    key: string;
    value: Conversation;
    indexes: { "by-users": string };
  };

  messages: {
    key: string;
    value: Message;
    indexes: { "by-conversation": string };
  };

  contacts: {
    key: string;
    value: {
      id: string;
      name: string;
      friendID: string;
      ownerID: string;
      ownerType: string;
      friendType: string;
      isShop: boolean;
      image?: string;
      remark?: string;
      note?: string;
      groups?: string[];
      isBlocked?: boolean;
      employeeRemarks?: string[];
      allowedPrivatePublication?: number;
      allowedHimToAccessMyPrivatePublication?: number;
      allowedHimToAccessMyShop?: number;
      allowedShop?: number;
      inFollowing?: number;
      createdAt: string;
      updatedAt: string;
      forwardSelected?: boolean;
      isSelected?: boolean;
    };
    indexes: {
      "by-name": string;
      "by-friendID": string;
    };
  };
}

export class ChatDatabase {
  private static instances: { [userId: string]: ChatDatabase } = {};
  private db: IDBPDatabase<ChatDBSchema> | null = null;
  private readonly DB_VERSION = 1;
  private readonly DB_NAME: string;

  private constructor(private readonly userId: string) {
    this.DB_NAME = `chat_db_${userId}`;
  }

  public static getInstance(userId: string): ChatDatabase {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!this.instances[userId]) {
      this.instances[userId] = new ChatDatabase(userId);
    }
    return this.instances[userId];
  }

  // 清理实例方法
  public static clearInstance(userId: string): void {
    if (this.instances[userId]) {
      const instance = this.instances[userId];
      if (instance.db) {
        instance.db.close();
      }
      delete this.instances[userId];
    }
  }

  public async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<ChatDBSchema>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // 会话用户表
        if (!db.objectStoreNames.contains("conversation_users")) {
          const userStore = db.createObjectStore("conversation_users", {
            keyPath: "id",
          });
          userStore.createIndex("by-name", "name");
        }

        // 会话表
        if (!db.objectStoreNames.contains("conversations")) {
          const conversationStore = db.createObjectStore("conversations", {
            keyPath: "id",
          });
          conversationStore.createIndex("by-users", "users");
        }

        // 消息表
        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", {
            keyPath: "id",
          });
          messageStore.createIndex("by-conversation", "conversationId");
        }

        // 通讯录表
        if (!db.objectStoreNames.contains("contacts")) {
          const contactStore = db.createObjectStore("contacts", {
            keyPath: "id",
          });
          contactStore.createIndex("by-name", "name");
          contactStore.createIndex("by-friendID", "friendID");
        }
      },
    });
  }

  // 会话用户相关操作
  async saveUser(
    user: ChatDBSchema["conversation_users"]["value"]
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.put("conversation_users", user);
  }

  async getUser(
    id: string
  ): Promise<ChatDBSchema["conversation_users"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("conversation_users", id);
  }

  async getAllUsers(): Promise<ChatDBSchema["conversation_users"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("conversation_users");
  }

  // 会话相关操作
  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.put("conversations", conversation);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("conversations", id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("conversations");
  }

  async getConversationsByUsers(users: string): Promise<Conversation[]> {
    if (!this.db) throw new Error("Database not initialized");
    const index = this.db.transaction("conversations").store.index("by-users");
    return await index.getAll(users);
  }

  // 消息相关操作
  async saveMessage(message: Message): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.put("messages", message);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    if (!id) throw new Error("Message ID is required");
    return await this.db.get("messages", id);
  }

  async getMessagesByConversation(
    conversationId: string,
    limit?: number,
    beforeTimestamp?: string
  ): Promise<Message[]> {
    if (!this.db) throw new Error("Database not initialized");

    const tx = this.db.transaction("messages", "readonly");
    const index = tx.store.index("by-conversation");
    let cursor = await index.openCursor(conversationId);

    const messages: Message[] = [];
    let count = 0;

    while (cursor) {
      if (beforeTimestamp && cursor.value.timestamp >= beforeTimestamp) {
        cursor = await cursor.continue();
        continue;
      }

      messages.push(cursor.value);
      count++;

      if (limit && count >= limit) {
        break;
      }

      cursor = await cursor.continue();
    }
    return messages.sort(
      (a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)
    );
  }

  // 删除操作
  async deleteUser(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete("conversation_users", id);
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete("conversations", id);
  }

  async deleteMessage(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete("messages", id);
  }

  // 清理过期消息
  async cleanExpiredMessages(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    const tx = this.db.transaction("messages", "readwrite");
    const store = tx.store;
    const now = Date.now();

    let cursor = await store.openCursor();
    while (cursor) {
      if (cursor.value.deleteAt && cursor.value.deleteAt < now) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  }

  // 通讯录相关操作
  async saveContact(contact: ChatDBSchema["contacts"]["value"]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.put("contacts", contact);
  }

  async getContact(
    id: string
  ): Promise<ChatDBSchema["contacts"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("contacts", id);
  }

  async getAllContacts(): Promise<ChatDBSchema["contacts"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("contacts");
  }

  async getContactByFriendID(
    friendID: string
  ): Promise<ChatDBSchema["contacts"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const index = this.db.transaction("contacts").store.index("by-friendID");
    const contacts = await index.getAll(friendID);
    return contacts[0];
  }

  async searchContactsByName(
    name: string
  ): Promise<ChatDBSchema["contacts"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    const index = this.db.transaction("contacts").store.index("by-name");
    const contacts = await index.getAll();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(name.toLowerCase()) ||
        contact.remark?.toLowerCase().includes(name.toLowerCase())
    );
  }

  async deleteContact(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete("contacts", id);
  }

  // 清理数据库
  public async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 导出获取数据库实例的函数而不是单例
export const getChatDB = (userId: string) => ChatDatabase.getInstance(userId);
