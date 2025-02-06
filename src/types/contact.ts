import { UserType, User, Business } from './index'

// 联系人类型
export interface Contact {
  id: string
  name: string
  email: string
  avatar?: string
  remark?: string
  note?: string
  groups?: string[]
  isBlocked?: boolean
  ownerID: string
  ownerType: UserType
  friendType: UserType
  employeeRemarks?: string[]
  isShop: boolean
  friend?: User | Business
  allowedPrivatePublication?: number
  allowedHimToAccessMyPrivatePublication?: number
  allowedHimToAccessMyShop?: number
  allowedShop?: number
  inFollowing?: number
  createdAt: string
  updatedAt: string
}

// 联系人分组类型
export interface ContactGroup {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

// 创建联系人请求参数
export interface CreateContactParams {
  friendId: string
  remark?: string
  groupIds?: string[]
  isBlocked?: boolean
  allowedPrivatePublication?: number
  allowedHimToAccessMyPrivatePublication?: number
  allowedHimToAccessMyShop?: number
  allowedShop?: number
}

// 更新联系人请求参数
export interface UpdateContactParams {
  remark?: string
  note?: string
  groupIds?: string[]
  avatar?: string
  isBlocked?: boolean
  employeeRemarks?: string[]
  allowedPrivatePublication?: number
  allowedHimToAccessMyPrivatePublication?: number
  allowedHimToAccessMyShop?: number
  allowedShop?: number
}

// 创建分组请求参数
export interface CreateGroupParams {
  name: string
}

// 更新分组请求参数
export interface UpdateGroupParams {
  name: string
}

// 联系人列表响应
export interface ContactListResponse {
  contacts: Contact[]
  total: number
}

// 联系人分组列表响应
export interface ContactGroupListResponse {
  groups: ContactGroup[]
}

// 联系人响应
export interface ContactResponse {
  contact: Contact
}

// 联系人分组响应
export interface ContactGroupResponse {
  group: ContactGroup
} 