// 用户类型枚举

import { BusinessPublicStatus, ShopType, UserType } from ".";

export enum UserStatus {
  ok = "ok",
  normal = "normal",
}

// 预留权限类型
export interface Permission {
  code: string;
  name: string;
  actions: string[];
}

// 预留角色类型
export interface Role {
  code: string;
  name: string;
  permissions: Permission[];
}

// 基础用户信息
export interface BaseUser {
  id: string;
  name: string;
  avatar: string;
  headImg?: string;
  subDomain?: string;
  logo?: string;
  isShop: boolean;
  operatorType: UserType;
  publicStatus?: BusinessPublicStatus;
  email?: string;
  phone: string;
  areaCode: string;
  countryId?: string;
  provinceId?: string;
  remark?: string;
  note?: string;
  followedCatIds?: string[];
  status?: UserStatus;

  // 预留权限相关字段
  roles?: Role[]; // 角色列表
  permissions?: Permission[]; // 权限列表
}

// 普通用户
export interface User extends BaseUser {
  operatorType: UserType;
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
  type: ShopType;
  industries?: string[];
  industriesDetail?: IndustryContent[];
  city?: string;
  street?: string;
  zipcode?: string;
  subCategory?: string;
  description?: string;
  address?: string;
  website?: string;
  email?: string;
  socialMedia?: {
    [key: string]: string;
  };
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  tags?: string[];
  coverImage?: string;
  pictures?: string[];
  location?: {
    lat: number;
    long: number;
  };
  owner?: User;
  country?: Area;
  province?: Area;
  onlyPayManually?: boolean;
  allowSocial?: boolean;
  shopScore?: number;
  transportScore?: number;
  score?: number;
  subDomain?: string;
}

export interface Area {
  id: string;
  name: string;
  isDeleted: boolean;
  type: string;
  areaCode: string;
}

// 行业内容
export interface IndustryContent {
  id: string;
  name: string;
  currentName?: string;
}
