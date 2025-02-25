import type { Product } from "./product";
import { ProductMessageApplyStatus } from "./product";

export interface ChatMessage {
  content: string;
  type: MessageType;
  fileName?: string;
  fileSize?: number;
  recorderTime?: number;
}

// 消息类型
export interface Message extends ChatMessage {
  id: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;
  realTimestamp: number;
  deleteAt?: number;
  senderId: string;
  conversationId: string;

  // 文件路径
  filePath?: string;

  // 语音转文字
  voiceText?: string;

  // 引用消息字段
  referenceMessageId?: string;
  referenceMessageType?: MessageType;
  referenceMessageContent?: string;
  referenceMessageSender?: string;
  referenceMessageSenderId?: string;
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
  isPinned?: boolean;
}

// 会话用户类型
export interface ConversationUser {
  id: string;
  name: string;
  avatar: string;
  remark?: string;
  isShop: boolean;
}

// 在线状态类型
export const enum UserStatus {
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
export const enum MessageType {
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

export interface ProductMessageContent {
  shopId: string;
  productsIds: string[];
  productList?: Product[];
  applyStatus?: ProductMessageApplyStatus;
}

export interface ShipmentMessageContent {
  number: string;
  creatorId: string;
  orderNumbers: string[];
  id: string;
  quantity: number;
  timeStamp: string;
  status: string;
  type: "shipment" | "return" | "outOfStock";
  remark?: string;
}
