// 用户类型枚举
export enum UserType {
  User = 'user',
  Shop = 'shop'
}

// 商家类型枚举
export enum BusinessType {
  Retailer = 'Retailer',
  Manufacturer = 'Manufacturer', 
  Wholesaler = 'Wholesaler',
  Shop = 'shop'
}

// 访问权限类型
export enum AccessType {
  Public = 'public',
  Private = 'private'
}

// 基础用户信息
export interface BaseUser {
  id: string;
  name: string;
  headImg?: string;
  logo?: string;
  isShop: boolean;
  operatorType: UserType;
  publicStatus?: AccessType;
  email?: string;
  phone?: string;
  areaCode?: string;
  countryId?: string;
  provinceId?: string;
  remark?: string;
  note?: string;
  groups?: ContactGroup[];
  isGrouped: boolean;
}

// 普通用户
export interface User extends BaseUser {
  operatorType: UserType.User;
  shops?: Business[];
  myshops?: Business[];
  mood?: string;
  description?: string;
  allowSocial?: boolean;
  emailVerified?: boolean;
  passwordCreated?: boolean;
}

// 商家用户
export interface Business extends BaseUser {
  operatorType: UserType.Shop;
  type: BusinessType;
  industries?: string[];
  industriesDetail?: IndustryContent[];
  city?: string;
  street?: string;
  zipcode?: string;
  subCategory?: string;
}

// 行业内容
export interface IndustryContent {
  id: string;
  name: string;
  currentName?: string;
}

// 联系人分组
export interface ContactGroup {
  id: string;
  name: string;
  contacts?: string[];
}

// 消息相关类型
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  senderId: string;
  timestamp: string;
  deleteAt: number;
  referenceMessageId?: string;
  referenceMessageContent?: string;
  referenceMessageSender?: string;
  referenceMessageType?: string;
}

export type MessageType = 
  | 'text'
  | 'image'
  | 'voice'
  | 'video'
  | 'file'
  | 'location'
  | 'card'
  | 'order'
  | 'preOrder'
  | 'initializePayment';

export type MessageStatus = 
  | 'sending'
  | 'sent'
  | 'received'
  | 'read'
  | 'failed';

// 会话相关类型
export interface Conversation {
  id: string;
  creator: string;
  isGrouped: boolean;
  receiveId: string;
  senderId: string;
  users: string;
  lastMessage?: Message;
  unreadCount?: number;
}

// 联系人相关类型
export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  isShop: boolean;
  isGrouped: boolean;
  remark?: string;
  note?: string;
}

// 通用响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User | Business;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 导出所有类型
export * from './contact' 