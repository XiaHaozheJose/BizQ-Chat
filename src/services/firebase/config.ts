import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 获取Realtime Database实例
const database = getDatabase(app);

// Firebase 数据库常量
export const FirebaseConstants = {
  // 数据表名
  TABLES: {
    CONVERSATION: "BQConversation",
    CONVERSATION_MESSAGE: "BQConversationMessage",
    CONVERSATION_USER: "BQConversationUser",
  },
  // 字段名
  FIELDS: {
    // 通用字段
    ID: "id",
    CREATOR: "creator",
    IS_GROUPED: "isGrouped",
    SENDER_ID: "senderId",
    RECEIVE_ID: "receiveId",
    USERS: "users",

    // 消息字段
    CONTENT: "content",
    TYPE: "type",
    STATUS: "status",
    TIMESTAMP: "timestamp",
    REAL_TIMESTAMP: "realTimestamp",
    DELETE_AT: "deleteAt",

    // 用户字段
    AVATAR: "avatar",
    NAME: "name",
    IS_SHOP: "isShop",

    // 观察者相关
    OBSERVE_CONVERSATIONS: "observeConversations",
    OBSERVE_STATUS: "observeStatus",
    CURRENT_STATUS: "currentStatus",
    CURRENT_CONNECTION: "currentConnection",
    DELETE_MESSAGES: "deleteMessages",
    UNREAD_COUNT: "unReadCount",
  },
  // 分隔符
  SEPARATOR: "#$",
  // 消息状态
  MESSAGE_STATUS: {
    UNSEND: "unSend",
    SENDING: "sending",
    HAS_SENT: "hasSent",
    RECEIVED: "received",
    IS_READ: "isRead",
  },
  // 消息类型
  MESSAGE_TYPE: {
    TEXT: "text",
    IMAGE: "image",
    AUDIO: "audio",
    LOCATION: "location",
    ORDER: "order",
    PRE_ORDER: "preOrder",
    PAYMENT: "payment",
    PRODUCT: "product",
    CARD: "card",
    CONTACT: "contact",
    SYSTEM: "system",
    PDF: "pdf",
    INITIALIZE_PAYMENT: "initializePayment",
    SHIPMENT: "shipment",
    RETURN: "return",
    OUT_OF_STOCK: "outOfStock",
    COUPON: "coupon",
    VOUCHER: "voucher",
  },
  // 用户状态
  USER_STATUS: {
    ONLINE: "online",
    OFFLINE: "offline",
    BUSY: "busy",
    OTHER: "other",
  },
};

export { app, database };
