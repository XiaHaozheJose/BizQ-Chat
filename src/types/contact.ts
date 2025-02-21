import { UserType, User, Business } from "./index";

export interface Contact {
  friend: User | Business;
  ownerType: UserType;
  ownerId: string;
  friendType: UserType;
  friendId: string;
  employeeIdsBlockThisContact: string[];
  employeeIdsDeleteThisContact: string[];
  isBlocked: boolean;
  handlerType: UserType;
  handlerId: string;
  isDeleted: boolean;
  employeeRemarks: string[];
  createdAt: string;
  updatedAt: string;
  note: string;
  remark: string;
  findInContact: number;
  groups: ContactGroup[];
  allowedPrivatePublication: number;
  allowedHimToAccessMyPrivatePublication: number;
  allowedShop: number;
  allowedHimToAccessMyShop: number;
  inFollowing: number;
  id: string;
}

// 联系人分组类型
export interface ContactGroup {
  id: string;
  name: string;
  image: string;
  isDefault: boolean;
  ownerId: string;
  ownerType: UserType;
  createdAt: string;
  updatedAt: string;
}

// 创建联系人请求参数
export interface CreateContactParams {
  friendId: string;
  remark?: string;
  groupIds?: string[];
  isBlocked?: boolean;
  allowedPrivatePublication?: number;
  allowedHimToAccessMyPrivatePublication?: number;
  allowedHimToAccessMyShop?: number;
  allowedShop?: number;
}

// 更新联系人请求参数
export interface UpdateContactParams {
  remark?: string;
  note?: string;
  groupIds?: string[];
  isBlocked?: boolean;
  employeeRemarks?: string[];
  allowedPrivatePublication?: number;
  allowedHimToAccessMyPrivatePublication?: number;
  allowedHimToAccessMyShop?: number;
  allowedShop?: number;
}

// 创建分组请求参数
export interface CreateGroupParams {
  name: string;
}

// 更新分组请求参数
export interface UpdateGroupParams {
  name: string;
  image?: string;
}

// 联系人列表响应
export interface ContactListResponse {
  contacts: Contact[];
  count: number;
  currentPageHasMoreData: boolean;
}

// 联系人分组列表响应
export interface ContactGroupListResponse {
  contactGroups: ContactGroup[];
  count: number;
}

// 联系人响应
export interface ContactResponse {
  contact: Contact;
}

// 联系人分组响应
export interface ContactGroupResponse {
  contactGroup: ContactGroup;
}
