import { openDB, DBSchema, IDBPDatabase } from "idb";

interface ChatDBSchema extends DBSchema {
  conversation_users: {
    key: string;
    value: {
      id: string;
      name: string;
      isShop: boolean;
      isGrouped: boolean;
      headImg?: string;
      logo?: string;
      avatar?: string;
    };
    indexes: { "by-name": string };
  };

  conversations: {
    key: string;
    value: {
      id: string;
      isGrouped: boolean;
      receiveId: string;
      diffusionAlia: string;
      timestamp: string;
      unReadCount: number;
      isDiffusion: boolean;
      isSpam: boolean;
      creator: string;
      updater: string;
      users: string;
    };
    indexes: { "by-users": string };
  };

  messages: {
    key: string;
    value: {
      id: string;
      conversationId: string;
      content: string;
      filePath: string;
      recorderTime: number;
      status: string;
      type: string;
      senderId: string;
      referenceId: string;
      referenceType: string;
      referenceSender: string;
      referenceSenderId: string;
      referenceContent: string;
      timestamp: string;
      realTimestamp: number;
      deleteAt: number;
    };
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

class ChatDatabase {
  private static instance: ChatDatabase;
  private db: IDBPDatabase<ChatDBSchema> | null = null;
  private readonly DB_NAME = "chat_db";
  private readonly DB_VERSION = 1;

  private constructor() {}

  public static getInstance(): ChatDatabase {
    if (!ChatDatabase.instance) {
      ChatDatabase.instance = new ChatDatabase();
    }
    return ChatDatabase.instance;
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
  async saveConversation(
    conversation: ChatDBSchema["conversations"]["value"]
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.put("conversations", conversation);
  }

  async getConversation(
    id: string
  ): Promise<ChatDBSchema["conversations"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("conversations", id);
  }

  async getConversationsByUsers(
    users: string
  ): Promise<ChatDBSchema["conversations"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    const index = this.db.transaction("conversations").store.index("by-users");
    return await index.getAll(users);
  }

  // 消息相关操作
  async saveMessage(message: ChatDBSchema["messages"]["value"]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.put("messages", message);
  }

  async getMessage(
    id: string
  ): Promise<ChatDBSchema["messages"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("messages", id);
  }

  async getMessagesByConversation(
    conversationId: string
  ): Promise<ChatDBSchema["messages"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    const index = this.db
      .transaction("messages")
      .store.index("by-conversation");
    return await index.getAll(conversationId);
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
}

export const chatDB = ChatDatabase.getInstance();
