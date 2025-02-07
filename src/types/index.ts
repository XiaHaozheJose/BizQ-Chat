import { User, Business } from "./user";

// 用户类型枚举
export enum UserType {
  User = "user",
  Shop = "shop",
}

// 商家类型枚举
export enum BusinessType {
  Retailer = "Retailer",
  Manufacturer = "Manufacturer",
  Wholesaler = "Wholesaler",
}

// 访问权限类型
export enum AccessType {
  Public = "public",
  Private = "private",
  NoShowPrice = "noShowPrice",
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

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 导出所有类型
export type {
  Contact,
  ContactGroup,
  CreateContactParams,
  UpdateContactParams,
  CreateGroupParams,
  UpdateGroupParams,
  ContactListResponse,
  ContactGroupListResponse,
  ContactResponse,
  ContactGroupResponse,
} from "./contact";
export type {
  Message,
  Conversation,
  ConversationUser,
  UserStatus,
  MessageStatus,
} from "./chat";

export type { User, Business, IndustryContent } from "./user";
export type {
  ApiResponse,
  LoginParams,
  LoginResponse,
  UserInfo,
  ShopsListResponse,
  SwitchOperatorParams,
} from "./api";
