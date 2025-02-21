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

export type { Message, Conversation, ConversationUser } from "./chat";

export { UserStatus, MessageStatus, MessageType } from "./chat";

export type {
  ApiResponse,
  LoginParams,
  LoginResponse,
  UserInfo,
  ShopsListResponse,
  SwitchOperatorParams,
} from "./api";

export type { User, Business, IndustryContent } from "./user";
