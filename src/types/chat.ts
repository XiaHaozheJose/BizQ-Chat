// 消息类型
export interface Message {
  id: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;
  realTimestamp: number;
  deleteAt: number;
  senderId: string;
  conversationId: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
}

// 会话类型
export interface Conversation {
  id: string;
  creator: string;
  isGrouped: boolean;
  senderId: string;
  receiveId: string;
  users: string;
  lastMessage?: Message;
  unReadCount?: number;
  remark?: string;
}

// 会话用户类型
export interface ConversationUser {
  id: string;
  name: string;
  avatar: string;
  status: string;
  lastSeen?: number;
  remark?: string;
}

// 在线状态类型
export enum UserStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  BUSY = "busy",
  OTHER = "other",
}

// 消息状态类型
export enum MessageStatus {
  UNSEND = "unSend",
  SENDING = "sending",
  HAS_SENT = "hasSent",
  RECEIVED = "received",
  IS_READ = "isRead",
}

// 消息类型枚举
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  AUDIO = "audio",
  LOCATION = "location",
  ORDER = "order",
  PRE_ORDER = "preOrder",
  PAYMENT = "payment",
  PRODUCT = "product",
  CARD = "card",
  CONTACT = "contact",
  SYSTEM = "system",
  PDF = "pdf",
  INITIALIZE_PAYMENT = "initializePayment",
  SHIPMENT = "shipment",
  RETURN = "return",
  OUT_OF_STOCK = "outOfStock",
  COUPON = "coupon",
  VOUCHER = "voucher",
}
