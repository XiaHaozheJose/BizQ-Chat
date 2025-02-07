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

// 基础用户信息
export interface BaseUser {
  id: string;
  name: string;
  avatar: string;
  headImg?: string;
  logo?: string;
  isShop: boolean;
  operatorType: UserType;
  publicStatus?: AccessType;
  email?: string;
  phone: string;
  areaCode: string;
  countryId?: string;
  provinceId?: string;
  remark?: string;
  note?: string;
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
  gallery?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

// 行业内容
export interface IndustryContent {
  id: string;
  name: string;
  currentName?: string;
}
