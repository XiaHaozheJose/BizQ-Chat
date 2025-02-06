# 聊天应用实施方案 (Chat Application Implementation Plan)

## 1. 项目概述

基于现有iOS聊天应用的核心功能,使用Electron + Vue3 + TypeScript实现一个跨平台的桌面聊天应用。

### 1.1 技术栈

- 前端框架: Vue 3 + TypeScript
- 桌面端: Electron
- 状态管理: Pinia
- UI组件库: Element Plus
- 本地数据库: SQLite3 (electron-store)
- 云服务: Firebase Realtime Database
- 网络请求: Axios
- WebSocket: Socket.io-client
- 构建工具: Vite

### 1.2 API接口文档

#### 1.2.1 服务器API接口

```typescript
// 认证相关接口
interface AuthAPI {
  // 用户登录
  login: {
    url: '/operators-login',
    method: 'POST',
    params: {
      username: string;
      password: string;
    },
    response: {
      token: string;
      user: User;
    }
  };

  // 刷新Token
  refreshToken: {
    url: '/refresh-token',
    method: 'POST',
    params: {
      refreshToken: string;
    },
    response: {
      token: string;
    }
  };
}

// 通讯录相关接口
interface ContactAPI {
  // 获取联系人列表
  getContacts: {
    url: '/contacts',
    method: 'GET',
    params: {
      page?: number;
      limit?: number;
      search?: string;
    },
    response: {
      contacts: Contact[];
      total: number;
    }
  };

  // 添加联系人
  addContact: {
    url: '/contacts',
    method: 'POST',
    params: {
      friendId: string;
      remark?: string;
      groupIds?: string[];
    },
    response: {
      contact: Contact;
    }
  };

  // 更新联系人
  updateContact: {
    url: '/contacts/:id',
    method: 'PATCH',
    params: {
      remark?: string;
      note?: string;
      groupIds?: string[];
    },
    response: {
      contact: Contact;
    }
  };
}
```

#### 1.2.2 Firebase数据结构

```typescript
// Firebase路径配置
const firebasePaths = {
  conversations: '/BQConversation',
  users: '/BQConversationUser',
}

// 会话数据结构
interface BQConversation {
  creator: string;
  isGrouped: boolean;
  receiveId: string;
  senderId: string;
  users: string; // 格式: "userId1#$userId2"
  BQConversationMessage?: {
    [messageId: string]: {
      content: string;
      conversationId: string;
      deleteAt: number;
      id: string;
      realTimestamp: number;
      senderId: string;
      status: 'hasSent' | 'received' | 'read';
      timestamp: string;
      type: string;
      referenceMessageId?: string;
      referenceMessageContent?: string;
      referenceMessageSender?: string;
      referenceMessageType?: string;
    }
  }
}

// 用户数据结构
interface BQConversationUser {
  currentConnection: string;
  observeConversations: {
    [userId: string]: {
      BQConversation: {
        conversationId: string;
        unReadCount?: number;
      };
      BQConversationUser: {
        avatar: string;
        isGrouped: boolean;
        isShop: boolean;
        name: string;
      }
    }
  };
  observeStatus: {
    currentStatus: 'online' | 'offline';
  }
}

// Firebase操作接口
interface FirebaseOperations {
  // 会话操作
  listenToConversations(userId: string): void;
  getConversation(id: string): Promise<BQConversation>;
  createConversation(conversation: BQConversation): Promise<void>;
  updateConversation(id: string, data: Partial<BQConversation>): Promise<void>;

  // 消息操作
  listenToMessages(conversationId: string): void;
  sendMessage(conversationId: string, message: any): Promise<void>;
  updateMessageStatus(conversationId: string, messageId: string, status: string): Promise<void>;

  // 用户状态操作
  listenToUserStatus(userId: string): void;
  updateUserStatus(status: 'online' | 'offline'): Promise<void>;
}
```

### 1.3 数据库设计

#### 本地缓存数据库

```typescript
// 本地数据库表结构 (用于离线缓存)
interface LocalDatabase {
  // 会话缓存表
  conversations: {
    id: string;
    data: BQConversation;
    lastSyncTime: number;
  }[];

  // 消息缓存表
  messages: {
    conversationId: string;
    messageId: string;
    data: any;
    syncStatus: 'synced' | 'pending' | 'failed';
  }[];

  // 用户缓存表
  users: {
    id: string;
    data: BQConversationUser;
    lastSyncTime: number;
  }[];
}

// 数据库操作接口
interface DatabaseOperations {
  // 会话缓存操作
  cacheConversation(conversation: BQConversation): Promise<void>;
  getCachedConversation(id: string): Promise<BQConversation | null>;
  updateCachedConversation(id: string, data: Partial<BQConversation>): Promise<void>;
  
  // 消息缓存操作
  cacheMessage(message: any): Promise<void>;
  getCachedMessages(conversationId: string): Promise<any[]>;
  updateMessageSyncStatus(messageId: string, status: string): Promise<void>;
  
  // 用户缓存操作
  cacheUser(user: BQConversationUser): Promise<void>;
  getCachedUser(id: string): Promise<BQConversationUser | null>;
  
  // 清理操作
  cleanupOldCache(days: number): Promise<void>;
}
```

### 1.4 核心功能实现

#### 1.4.1 Firebase服务

```typescript
// services/firebase/chat.ts
export class ChatFirebaseService {
  private db: Database;
  
  constructor() {
    this.db = getDatabase();
    this.setupListeners();
  }
  
  // 设置Firebase监听器
  private setupListeners() {
    // 连接状态监听
    const connectedRef = ref(this.db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        this.handleReconnection();
      }
    });
  }
  
  // 监听会话列表
  listenToConversations(userId: string) {
    const conversationsRef = ref(this.db, firebasePaths.conversations);
    onValue(conversationsRef, (snapshot) => {
      const conversations = [];
      snapshot.forEach((child) => {
        const conv = child.val();
        if (conv.users.includes(userId)) {
          conversations.push({
            id: child.key,
            ...conv
          });
        }
      });
      chatStore.updateConversations(conversations);
    });
  }
  
  // 监听会话消息
  listenToMessages(conversationId: string) {
    const messagesRef = ref(
      this.db, 
      `${firebasePaths.conversations}/${conversationId}/BQConversationMessage`
    );
    onValue(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((child) => {
        messages.push({
          id: child.key,
          ...child.val()
        });
      });
      chatStore.updateMessages(conversationId, messages);
    });
  }
  
  // 发送消息
  async sendMessage(conversationId: string, message: any) {
    const messageRef = ref(
      this.db,
      `${firebasePaths.conversations}/${conversationId}/BQConversationMessage/${message.id}`
    );
    await set(messageRef, message);
  }
  
  // 更新消息状态
  async updateMessageStatus(conversationId: string, messageId: string, status: string) {
    const statusRef = ref(
      this.db,
      `${firebasePaths.conversations}/${conversationId}/BQConversationMessage/${messageId}/status`
    );
    await set(statusRef, status);
  }
  
  // 重连处理
  private async handleReconnection() {
    // 1. 更新在线状态
    await this.updateUserStatus('online');
    
    // 2. 同步未发送的消息
    await this.syncPendingMessages();
    
    // 3. 重新获取最新数据
    this.refreshData();
  }
}
```

#### 1.4.2 状态管理

```typescript
// store/chat.ts
export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: {} as Record<string, BQConversation>,
    messages: {} as Record<string, Record<string, any>>,
    syncStatus: {
      conversations: 'idle',
      messages: {} as Record<string, 'idle' | 'syncing' | 'error'>
    }
  }),
  
  actions: {
    // 处理Firebase实时更新
    updateConversations(conversations: BQConversation[]) {
      conversations.forEach(conv => {
        this.conversations[conv.id] = conv;
        // 缓存到本地数据库
        db.cacheConversation(conv);
      });
    },
    
    updateMessages(conversationId: string, messages: any[]) {
      if (!this.messages[conversationId]) {
        this.messages[conversationId] = {};
      }
      messages.forEach(msg => {
        this.messages[conversationId][msg.id] = msg;
        // 缓存到本地数据库
        db.cacheMessage(msg);
      });
    },
    
    // 发送消息
    async sendMessage(conversationId: string, content: string, type: string) {
      const message = {
        id: generateUUID(),
        conversationId,
        content,
        type,
        status: 'sending',
        timestamp: Date.now().toString(),
        senderId: currentUser.id,
        deleteAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7天后删除
      };
      
      // 1. 添加到本地状态
      if (!this.messages[conversationId]) {
        this.messages[conversationId] = {};
      }
      this.messages[conversationId][message.id] = message;
      
      // 2. 保存到本地缓存
      await db.cacheMessage({
        ...message,
        syncStatus: 'pending'
      });
      
      // 3. 发送到Firebase
      try {
        await firebase.sendMessage(conversationId, message);
        await db.updateMessageSyncStatus(message.id, 'synced');
      } catch (error) {
        message.status = 'failed';
        this.messages[conversationId][message.id] = message;
        await db.updateMessageSyncStatus(message.id, 'failed');
      }
    },
    
    // 重试发送失败的消息
    async retryFailedMessages() {
      const failedMessages = await db.getFailedMessages();
      for (const message of failedMessages) {
        await this.sendMessage(
          message.conversationId,
          message.content,
          message.type
        );
      }
    }
  }
});
```

### 1.5 UI设计指南

#### 1. 布局规范

```scss
// 颜色系统
$colors: {
  primary: #409EFF;
  success: #67C23A;
  warning: #E6A23C;
  danger: #F56C6C;
  info: #909399;
  
  // 中性色
  text-primary: #303133;
  text-regular: #606266;
  text-secondary: #909399;
  text-placeholder: #C0C4CC;
  
  // 边框颜色
  border-base: #DCDFE6;
  border-light: #E4E7ED;
  border-lighter: #EBEEF5;
  border-extra-light: #F2F6FC;
  
  // 背景色
  background-base: #F5F7FA;
  background-light: #FAFAFA;
  background-lighter: #FFFFFF;
}

// 间距系统
$spacing: {
  mini: 4px;
  small: 8px;
  medium: 16px;
  large: 24px;
  xlarge: 32px;
}

// 字体系统
$typography: {
  primary-font: 'Helvetica Neue', Arial, sans-serif;
  
  // 字号
  size-mini: 12px;
  size-small: 13px;
  size-base: 14px;
  size-medium: 16px;
  size-large: 18px;
  size-xlarge: 20px;
  
  // 行高
  line-height-compact: 1.3;
  line-height-normal: 1.5;
  line-height-loose: 1.7;
}

// 圆角
$border-radius: {
  small: 2px;
  base: 4px;
  medium: 8px;
  large: 16px;
  round: 20px;
}

// 阴影
$box-shadow: {
  base: 0 2px 4px rgba(0, 0, 0, 0.12);
  light: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  medium: 0 4px 16px rgba(0, 0, 0, 0.12);
  dark: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

#### 2. 组件规范

##### 2.1 消息气泡

```vue
<!-- 消息气泡组件 -->
<template>
  <div class="message-bubble" :class="[type, { 'is-mine': isMine }]">
    <div class="message-content">
      <slot></slot>
    </div>
    <div class="message-meta">
      <span class="message-time">{{ formatTime(timestamp) }}</span>
      <span class="message-status" v-if="isMine">{{ status }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.message-bubble {
  max-width: 70%;
  padding: $spacing-medium;
  margin: $spacing-small 0;
  border-radius: $border-radius-medium;
  
  &.is-mine {
    background-color: $colors-primary;
    color: white;
    margin-left: auto;
    
    .message-meta {
      text-align: right;
    }
  }
  
  &:not(.is-mine) {
    background-color: $colors-background-light;
    color: $colors-text-primary;
  }
  
  .message-content {
    word-break: break-word;
  }
  
  .message-meta {
    font-size: $typography-size-mini;
    color: $colors-text-secondary;
    margin-top: $spacing-mini;
  }
}
</style>
```

##### 2.2 输入框

```vue
<!-- 消息输入框组件 -->
<template>
  <div class="chat-input">
    <div class="toolbar">
      <button class="tool-btn" @click="toggleEmoji">
        <i class="icon-emoji"></i>
      </button>
      <button class="tool-btn" @click="uploadFile">
        <i class="icon-attachment"></i>
      </button>
    </div>
    
    <div class="input-area">
      <textarea
        v-model="content"
        @keydown.enter.prevent="sendMessage"
        placeholder="输入消息..."
        rows="1"
        :maxlength="2000"
      ></textarea>
    </div>
    
    <div class="action">
      <button class="send-btn" @click="sendMessage" :disabled="!content.trim()">
        发送
      </button>
    </div>
  </div>
</template>

<style lang="scss">
.chat-input {
  display: flex;
  align-items: flex-end;
  padding: $spacing-medium;
  border-top: 1px solid $colors-border-light;
  background: $colors-background-lighter;
  
  .toolbar {
    display: flex;
    gap: $spacing-small;
    padding-bottom: $spacing-small;
  }
  
  .tool-btn {
    padding: $spacing-mini;
    border-radius: $border-radius-base;
    color: $colors-text-secondary;
    
    &:hover {
      background: $colors-background-base;
    }
  }
  
  .input-area {
    flex: 1;
    margin: 0 $spacing-medium;
    
    textarea {
      width: 100%;
      padding: $spacing-small;
      border: 1px solid $colors-border-base;
      border-radius: $border-radius-base;
      resize: none;
      
      &:focus {
        border-color: $colors-primary;
        outline: none;
      }
    }
  }
  
  .send-btn {
    padding: $spacing-small $spacing-medium;
    border-radius: $border-radius-base;
    background: $colors-primary;
    color: white;
    
    &:disabled {
      background: $colors-text-placeholder;
      cursor: not-allowed;
    }
  }
}
</style>
```

#### 3. 响应式设计

```scss
// 断点定义
$breakpoints: {
  xs: 480px;   // 手机竖屏
  sm: 768px;   // 手机横屏/平板竖屏
  md: 1024px;  // 平板横屏/小屏电脑
  lg: 1200px;  // 中等屏幕
  xl: 1600px;  // 大屏幕
}

// 响应式混入
@mixin respond-to($breakpoint) {
  @media screen and (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}

// 布局示例
.chat-container {
  display: flex;
  height: 100vh;
  
  .sidebar {
    width: 300px;
    
    @include respond-to(xs) {
      width: 100%;
    }
    
    @include respond-to(sm) {
      width: 250px;
    }
  }
  
  .chat-main {
    flex: 1;
    display: none;
    
    @include respond-to(sm) {
      display: block;
    }
  }
}
```

#### 4. 动画效果

```scss
// 动画时间
$animation: {
  duration-fast: 0.15s;
  duration-normal: 0.3s;
  duration-slow: 0.45s;
  
  timing-function-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  timing-function-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

// 消息动画
.message-enter-active,
.message-leave-active {
  transition: all $animation-duration-normal $animation-timing-function-ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// 抽屉动画
.drawer-enter-active,
.drawer-leave-active {
  transition: transform $animation-duration-normal $animation-timing-function-ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}
```

#### 5. 主题定制

```typescript
// 主题配置
interface Theme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    background: string;
    text: string;
    border: string;
  };
  spacing: {
    unit: number;
    multiplier: number[];
  };
  typography: {
    fontSize: number;
    lineHeight: number;
  };
}

// 主题示例
const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#409EFF',
    background: '#FFFFFF',
    text: '#303133',
    border: '#DCDFE6',
  },
  spacing: {
    unit: 4,
    multiplier: [1, 2, 4, 6, 8],
  },
  typography: {
    fontSize: 14,
    lineHeight: 1.5,
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#409EFF',
    background: '#1F1F1F',
    text: '#FFFFFF',
    border: '#333333',
  },
  spacing: {
    unit: 4,
    multiplier: [1, 2, 4, 6, 8],
  },
  typography: {
    fontSize: 14,
    lineHeight: 1.5,
  },
};
```

### 1.4 核心功能

- 用户认证与授权
- 即时消息收发
- 会话管理
- 通讯录管理
- 消息同步
- 多种消息类型支持
- 群聊支持
- 消息状态管理
- 离线消息处理

## 2. 项目结构

```
chat-app/
├── electron/                 // Electron主进程
│   ├── main.ts              // 主进程入口
│   ├── preload.ts           // 预加载脚本
│   └── database/            // 数据库相关
│       ├── schema.ts        // 数据库表结构
│       ├── migrations/      // 数据库迁移
│       └── operations.ts    // 数据库操作
├── src/                     // 渲染进程(Vue应用)
│   ├── main.ts             // Vue入口
│   ├── App.vue             // 根组件
│   ├── router/             // 路由
│   ├── store/              // Pinia状态管理
│   │   ├── chat.ts         // 聊天相关状态
│   │   ├── contact.ts      // 联系人相关状态
│   │   └── user.ts         // 用户相关状态
│   ├── components/         // 组件
│   │   ├── chat/          // 聊天相关组件
│   │   │   ├── MessageList.vue
│   │   │   ├── MessageItem.vue
│   │   │   ├── ChatInput.vue
│   │   │   └── ChatHeader.vue
│   │   ├── contact/       // 联系人相关组件
│   │   │   ├── ContactList.vue
│   │   │   ├── ContactItem.vue
│   │   │   └── ContactDetail.vue
│   │   └── common/        // 公共组件
│   ├── views/             // 页面
│   │   ├── Chat.vue
│   │   ├── Contact.vue
│   │   └── Login.vue
│   ├── services/          // 服务层
│   │   ├── api/          // HTTP API
│   │   ├── firebase/     // Firebase服务
│   │   └── socket/       // WebSocket服务
│   ├── utils/            // 工具函数
│   └── types/            // TypeScript类型定义
```

## 3. 数据库设计

### 3.1 表结构

```typescript
// 会话表 (Conversations)
interface Conversation {
  id: string;              // 会话ID
  receiveId: string;       // 接收者ID
  userIds: string;         // 参与者ID列表
  isGrouped: boolean;      // 是否群聊
  timestamp: string;       // 最后更新时间
  unReadCount: number;     // 未读消息数
  isDiffusion: boolean;    // 是否群发消息
  isSpam: boolean;        // 是否垃圾消息
  creator: string;        // 创建者
  updater: string;        // 更新者
}

// 消息表 (Messages)
interface Message {
  id: string;              // 消息ID
  conversationId: string;  // 会话ID
  content: string;         // 消息内容
  filePath: string;        // 文件路径
  recorderTime: number;    // 语音时长
  status: MessageStatus;   // 消息状态
  type: MessageType;       // 消息类型
  sender: string;          // 发送者ID
  timestamp: string;       // 发送时间
  referenceMessageId?: string;    // 引用消息ID
  referenceMessageType?: string;  // 引用消息类型
  referenceMessageContent?: string; // 引用消息内容
  referenceMessageSender?: string;  // 引用消息发送者
}

// 用户表 (Users)
interface User {
  id: string;              // 用户ID
  name: string;           // 用户名
  avatar: string;         // 头像
  isShop: boolean;        // 是否商家
  isGrouped: boolean;     // 是否群组
  remark: string;         // 备注
  note: string;           // 笔记
}

// 联系人表 (Contacts)
interface Contact {
  id: string;             // 联系人ID
  name: string;           // 名称
  isShop: boolean;        // 是否商家
  remark: string;         // 备注
  note: string;           // 笔记
  friendID: string;       // 好友ID
  image: string;          // 头像
}
```

### 3.2 数据库操作接口

```typescript
interface DatabaseOperations {
  // 会话操作
  createConversation(conversation: Conversation): Promise<void>;
  getConversation(id: string): Promise<Conversation>;
  updateConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  getConversationList(): Promise<Conversation[]>;
  
  // 消息操作
  saveMessage(message: Message): Promise<void>;
  getMessage(id: string): Promise<Message>;
  updateMessageStatus(id: string, status: MessageStatus): Promise<void>;
  getMessagesByConversation(conversationId: string, limit: number, offset: number): Promise<Message[]>;
  deleteMessage(id: string): Promise<void>;
  
  // 用户操作
  saveUser(user: User): Promise<void>;
  getUser(id: string): Promise<User>;
  updateUser(user: User): Promise<void>;
  
  // 联系人操作
  saveContact(contact: Contact): Promise<void>;
  getContact(id: string): Promise<Contact>;
  updateContact(contact: Contact): Promise<void>;
  deleteContact(id: string): Promise<void>;
  getContactList(): Promise<Contact[]>;
}
```

## 4. 核心功能实现

### 4.1 消息管理

```typescript
// store/chat.ts
export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [] as Conversation[],
    currentConversation: null as Conversation | null,
    messages: [] as Message[],
    unreadCount: 0,
  }),
  
  actions: {
    // 加载本地会话列表
    async loadLocalConversations() {
      const conversations = await db.getConversationList();
      this.conversations = conversations.sort((a, b) => 
        Number(b.timestamp) - Number(a.timestamp)
      );
    },
    
    // 发送消息
    async sendMessage(content: string, type: MessageType) {
      const message = {
        id: generateUUID(),
        conversationId: this.currentConversation!.id,
        content,
        type,
        status: 'sending',
        sender: currentUser.id,
        timestamp: Date.now().toString(),
      };
      
      // 1. 保存到本地
      await db.saveMessage(message);
      
      // 2. 发送到Firebase
      try {
        await firebase.sendMessage(message);
        message.status = 'sent';
      } catch (error) {
        message.status = 'failed';
        // 添加到重试队列
        this.addToRetryQueue(message);
      }
      
      // 3. 更新本地状态
      await db.updateMessageStatus(message.id, message.status);
      this.messages.push(message);
    },
    
    // 接收消息
    async receiveMessage(message: Message) {
      // 1. 保存到本地
      await db.saveMessage(message);
      
      // 2. 更新未读计数
      if (this.currentConversation?.id !== message.conversationId) {
        this.updateUnreadCount(message.conversationId);
      }
      
      // 3. 更新会话列表
      this.updateConversationList(message);
      
      // 4. 如果是当前会话,添加到消息列表
      if (this.currentConversation?.id === message.conversationId) {
        this.messages.push(message);
      }
      
      // 5. 发送已收到确认
      await firebase.updateMessageStatus(message.id, 'received');
    },
  },
});
```

### 4.2 实时消息同步

```typescript
// services/firebase/chat.ts
export class ChatFirebaseService {
  private db: Database;
  private messageQueue: Message[] = [];
  
  constructor() {
    this.db = getDatabase();
    this.setupMessageListener();
    this.setupConnectionListener();
  }
  
  // 设置消息监听
  private setupMessageListener() {
    const messageRef = ref(this.db, `messages/${currentUser.id}`);
    onChildAdded(messageRef, (snapshot) => {
      const message = snapshot.val();
      chatStore.receiveMessage(message);
    });
  }
  
  // 设置连接状态监听
  private setupConnectionListener() {
    const connectedRef = ref(this.db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        this.handleReconnection();
      }
    });
  }
  
  // 重连后处理
  private async handleReconnection() {
    // 1. 同步离线期间的消息
    await this.syncOfflineMessages();
    
    // 2. 重试发送失败的消息
    await this.retryFailedMessages();
    
    // 3. 更新在线状态
    await this.updateOnlineStatus();
  }
  
  // 发送消息
  async sendMessage(message: Message) {
    const messageRef = ref(this.db, `messages/${message.conversationId}/${message.id}`);
    await set(messageRef, message);
  }
}
```

### 4.3 会话管理

```typescript
// services/conversation.ts
export class ConversationService {
  // 创建新会话
  async createConversation(targetUserId: string): Promise<Conversation> {
    const conversationId = this.generateConversationId(currentUser.id, targetUserId);
    
    // 1. 检查是否已存在
    let conversation = await db.getConversation(conversationId);
    if (conversation) {
      return conversation;
    }
    
    // 2. 创建新会话
    conversation = {
      id: conversationId,
      receiveId: targetUserId,
      userIds: [currentUser.id, targetUserId].join('#$'),
      isGrouped: false,
      timestamp: Date.now().toString(),
      unReadCount: 0,
      isDiffusion: false,
      isSpam: false,
      creator: currentUser.id,
      updater: currentUser.id,
    };
    
    // 3. 保存到本地和Firebase
    await Promise.all([
      db.createConversation(conversation),
      firebase.createConversation(conversation),
    ]);
    
    return conversation;
  }
  
  // 更新会话状态
  async updateConversationStatus(conversation: Conversation, isSpam: boolean) {
    conversation.isSpam = isSpam;
    
    // 1. 更新本地
    await db.updateConversation(conversation);
    
    // 2. 更新Firebase
    await firebase.updateConversationStatus(conversation);
  }
}
```

### 4.4 联系人管理

```typescript
// store/contact.ts
export const useContactStore = defineStore('contact', {
  state: () => ({
    contacts: [] as Contact[],
    groups: [] as Group[],
  }),
  
  actions: {
    // 加载联系人列表
    async loadContacts() {
      // 1. 先从本地加载
      const localContacts = await db.getContactList();
      this.contacts = localContacts;
      
      // 2. 从服务器同步
      try {
        const response = await api.getContacts();
        const serverContacts = response.data.contacts;
        
        // 3. 更新本地数据
        await this.syncContacts(serverContacts);
      } catch (error) {
        console.error('Failed to sync contacts:', error);
      }
    },
    
    // 同步联系人
    async syncContacts(serverContacts: Contact[]) {
      const operations = [];
      
      for (const contact of serverContacts) {
        const localContact = await db.getContact(contact.id);
        
        if (!localContact) {
          // 新增
          operations.push(db.saveContact(contact));
        } else if (this.isContactChanged(localContact, contact)) {
          // 更新
          operations.push(db.updateContact(contact));
        }
      }
      
      await Promise.all(operations);
      this.contacts = await db.getContactList();
    },
  },
});
```

## 5. 性能优化

### 5.1 消息加载优化

- 实现分页加载
- 使用虚拟滚动
- 图片懒加载
- 消息缓存策略

```typescript
// components/chat/MessageList.vue
export default defineComponent({
  setup() {
    const messageStore = useMessageStore();
    const virtualListRef = ref();
    
    // 虚拟列表配置
    const virtualListConfig = {
      itemHeight: 60,
      buffer: 5,
      pageMode: true,
    };
    
    // 加载更多消息
    const loadMoreMessages = async () => {
      if (messageStore.isLoading || messageStore.noMoreMessages) return;
      
      const lastMessage = messageStore.messages[0];
      await messageStore.loadMessages(lastMessage.timestamp);
    };
    
    // 监听滚动
    const onScroll = throttle(async (e: Event) => {
      const { scrollTop } = e.target as HTMLElement;
      if (scrollTop < 100) {
        await loadMoreMessages();
      }
    }, 200);
    
    return {
      virtualListRef,
      virtualListConfig,
      onScroll,
    };
  },
});
```

### 5.2 数据库优化

- 使用索引
- 批量操作
- 定期清理

```typescript
// database/operations.ts
export class DatabaseService {
  // 批量插入消息
  async batchInsertMessages(messages: Message[]) {
    const db = await this.getDatabase();
    
    await db.transaction(async (tx) => {
      for (const message of messages) {
        await tx.run(
          'INSERT INTO messages (id, conversationId, content, type, status, sender, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [message.id, message.conversationId, message.content, message.type, message.status, message.sender, message.timestamp]
        );
      }
    });
  }
  
  // 清理旧消息
  async cleanupOldMessages(daysToKeep: number) {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    await this.db.run(
      'DELETE FROM messages WHERE timestamp < ? AND status IN ("sent", "received", "read")',
      [cutoffDate.toString()]
    );
  }
}
```

### 5.3 网络优化

- 消息压缩
- 断线重连
- 消息队列
- 状态同步

```typescript
// services/socket/connection.ts
export class ConnectionManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  constructor() {
    this.setupConnectionHandlers();
  }
  
  private setupConnectionHandlers() {
    socket.on('disconnect', () => {
      this.handleDisconnect();
    });
    
    socket.on('connect', () => {
      this.handleReconnect();
    });
  }
  
  private async handleDisconnect() {
    // 1. 标记离线状态
    await this.markOffline();
    
    // 2. 启动重连
    this.startReconnection();
  }
  
  private async handleReconnect() {
    // 1. 同步离线消息
    await this.syncOfflineMessages();
    
    // 2. 更新在线状态
    await this.markOnline();
    
    // 3. 重置重连计数
    this.reconnectAttempts = 0;
  }
}
```

## 6. 安全性考虑

### 6.1 数据加密

```typescript
// utils/encryption.ts
export class Encryption {
  private readonly key: string;
  
  constructor() {
    this.key = process.env.ENCRYPTION_KEY!;
  }
  
  // 消息加密
  encrypt(message: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.key);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  // 消息解密
  decrypt(encrypted: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### 6.2 认证和授权

```typescript
// services/auth.ts
export class AuthService {
  // 登录
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await api.post('/operators-login', credentials);
    const { token, user } = response.data;
    
    // 保存token
    this.setToken(token);
    
    // 初始化Firebase认证
    await this.initializeFirebaseAuth(token);
    
    return user;
  }
  
  // 权限验证
  verifyPermission(action: string, resource: string): boolean {
    const userPermissions = this.getCurrentUserPermissions();
    return userPermissions.some(permission => 
      permission.action === action && permission.resource === resource
    );
  }
}
```

## 7. 部署和发布

### 7.1 构建配置

```typescript
// electron-builder.config.js
module.exports = {
  appId: 'com.chat.app',
  productName: 'Chat App',
  directories: {
    output: 'dist',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
  ],
  mac: {
    category: 'public.app-category.social-networking',
  },
  win: {
    target: ['nsis'],
  },
  linux: {
    target: ['AppImage'],
  },
};
```

### 7.2 自动更新

```typescript
// electron/updater.ts
export class AutoUpdater {
  constructor() {
    autoUpdater.on('update-available', this.handleUpdateAvailable);
    autoUpdater.on('update-downloaded', this.handleUpdateDownloaded);
  }
  
  async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }
  
  private handleUpdateAvailable() {
    // 通知用户有更新可用
  }
  
  private handleUpdateDownloaded() {
    // 提示用户重启应用
  }
}
```

## 8. 测试策略

### 8.1 单元测试

```typescript
// tests/unit/message.spec.ts
describe('Message Store', () => {
  let store: ReturnType<typeof useChatStore>;
  
  beforeEach(() => {
    store = useChatStore();
  });
  
  it('should add message to list', () => {
    const message = createTestMessage();
    store.addMessage(message);
    expect(store.messages).toContain(message);
  });
  
  it('should update message status', async () => {
    const message = createTestMessage();
    await store.updateMessageStatus(message.id, 'sent');
    const updated = store.messages.find(m => m.id === message.id);
    expect(updated?.status).toBe('sent');
  });
});
```

### 8.2 集成测试

```typescript
// tests/integration/chat.spec.ts
describe('Chat Integration', () => {
  it('should send and receive messages', async () => {
    // 1. 创建测试用户
    const [sender, receiver] = await createTestUsers();
    
    // 2. 创建会话
    const conversation = await createTestConversation(sender, receiver);
    
    // 3. 发送消息
    const message = await sendTestMessage(conversation);
    
    // 4. 验证接收
    await expectMessageReceived(receiver, message);
  });
});
```

## 9. 监控和日志

### 9.1 错误监控

```typescript
// services/monitoring.ts
export class ErrorMonitor {
  private readonly sentry: Sentry;
  
  constructor() {
    this.sentry = new Sentry({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    });
  }
  
  captureError(error: Error, context?: object) {
    this.sentry.captureException(error, {
      extra: context,
    });
  }
  
  captureMessage(message: string, level: string = 'info') {
    this.sentry.captureMessage(message, level);
  }
}
```

### 9.2 性能监控

```typescript
// services/performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  trackTiming(key: string, duration: number) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(duration);
  }
  
  getAverageTime(key: string): number {
    const times = this.metrics.get(key);
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

## 10. 实施计划

### Phase 1: 基础架构 (2周)
- 项目初始化
- 数据库设计和实现
- Firebase集成
- 基础UI组件

### Phase 2: 核心功能 (4周)
- 用户认证
- 消息收发
- 会话管理
- 实时同步

### Phase 3: 功能扩展 (3周)
- 通讯录管理
- 群聊功能
- 消息类型扩展
- 文件传输

### Phase 4: 优化和测试 (3周)
- 性能优化
- 自动化测试
- 错误处理
- 文档编写

### Phase 5: 部署和发布 (2周)
- 构建配置
- 自动更新
- 打包发布
- 监控系统

## 11. 注意事项

1. 数据安全
- 所有敏感数据需要加密存储
- 实现完整的权限控制
- 定期清理敏感数据

2. 性能考虑
- 实现消息分页加载
- 优化大量消息的渲染
- 合理使用缓存

3. 用户体验
- 提供离线支持
- 实现消息送达确认
- 支持消息重发

4. 可维护性
- 遵循TypeScript最佳实践
- 编写完整的文档
- 实现自动化测试

5. 扩展性
- 模块化设计
- 预留功能扩展接口
- 支持插件系统

## 12. 可能的风险

1. 技术风险
- Electron性能问题
- 数据同步冲突
- 网络连接不稳定

2. 业务风险
- 用户数据安全
- 消息送达可靠性
- 系统稳定性

3. 项目风险
- 开发周期延长
- 需求变更
- 资源不足

## 13. 后续规划

1. 功能扩展
- 语音/视频通话
- 端到端加密
- 多设备同步

2. 性能优化
- 消息压缩
- 智能缓存
- 后台同步

3. 用户体验
- 自定义主题
- 快捷回复
- 消息搜索

4. 运维支持
- 监控告警
- 日志分析
- 自动化部署 